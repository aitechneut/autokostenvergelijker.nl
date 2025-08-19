/**
 * RDW API Integration
 * Nederlandse RDW Open Data API voor voertuiggegevens lookup
 * Gratis API, geen key nodig
 */

class RDWApi {
    constructor() {
        this.baseUrl = 'https://opendata.rdw.nl';
        this.rateLimitDelay = 100; // 100ms tussen requests
        this.lastRequestTime = 0;
        this.cache = new Map(); // Cache voor voertuiggegevens
    }

    /**
     * Hoofdfunctie: Haal voertuiggegevens op via kenteken (VERNIEUWDE VERSIE)
     * Deze versie haalt ZOWEL de vaste datasets ALS de dynamische API-links op.
     * @param {string} kenteken - Nederlands kenteken
     * @returns {Promise<Object>} Voertuiggegevens of null bij fout
     */
    async getVehicleData(kenteken) {
        if (!kenteken || kenteken.length < 6) {
            throw new Error('Kenteken is te kort of ongeldig');
        }
        const normalizedKenteken = this.normalizeKenteken(kenteken);
        
        if (this.cache.has(normalizedKenteken)) {
            console.log('🎯 RDW data uit cache:', normalizedKenteken);
            return this.cache.get(normalizedKenteken);
        }
        await this.respectRateLimit();
        try {
            console.log('🔍 Stap 1: RDW basisgegevens ophalen voor:', normalizedKenteken);
            
            // STAP 1: Haal eerst de basisgegevens op.
            const basicData = await this.fetchBasicVehicleData(normalizedKenteken);
            if (!basicData) {
                console.log('❌ Geen basisgegevens gevonden voor kenteken.');
                return null;
            }
            console.log('🔍 Stap 2: Alle aanvullende API-links zoeken en aanroepen...');
            // STAP 2: Bouw een lijst van alle API-aanroepen.
            const apiPromises = [
                // Voeg de vaste, belangrijke datasets toe die we altijd willen hebben.
                this.fetchFuelData(normalizedKenteken),
                this.fetchConsumptionData(normalizedKenteken),
                this.fetchRecallData(normalizedKenteken)
            ];
            // Zoek en voeg nu de DYNAMISCHE links uit de basisdata toe.
            for (const key in basicData) {
                if (key.startsWith('api_') && typeof basicData[key] === 'string' && basicData[key].startsWith('https://')) {
                    const subApiUrl = `${basicData[key]}?kenteken=${normalizedKenteken}`;
                    console.log(`   -> Dynamische link gevonden voor: ${key.replace('api_gekentekende_voertuigen_', '')}`);
                    apiPromises.push(fetch(subApiUrl).then(res => res.json()));
                }
            }
            
            // STAP 3: Voer alle API-aanroepen tegelijk uit.
            const allResults = await Promise.allSettled(apiPromises);
            // STAP 4: Combineer alle succesvolle resultaten.
            let gecombineerdeData = { ...basicData };
            
            allResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const data = Array.isArray(result.value) ? result.value[0] : result.value;
                    if (data) {
                        delete data.kenteken;
                        Object.assign(gecombineerdeData, data);
                    }
                }
            });
            
            // STAP 5: Roep de bestaande combineer-functie aan voor de finale verwerking.
            const finalVehicleData = this.combineVehicleData(gecombineerdeData, gecombineerdeData, gecombineerdeData, gecombineerdeData.recalls, normalizedKenteken);
            // Cache het finale resultaat.
            if (finalVehicleData) {
                this.cache.set(normalizedKenteken, finalVehicleData);
                setTimeout(() => this.cache.delete(normalizedKenteken), 5 * 60 * 1000);
            }
            return finalVehicleData;
        } catch (error) {
            console.error('❌ RDW API fout:', error);
            throw new Error(`RDW lookup gefaald: ${error.message}`);
        }
    }

    /**
     * Normaliseer kenteken naar RDW format
     */
    normalizeKenteken(kenteken) {
        return kenteken
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') // Alleen letters en cijfers
            .replace(/(.{2})(.{2})(.{2})/, '$1$2$3'); // Geen streepjes voor API
    }

    /**
     * Format kenteken voor weergave (met streepjes)
     */
    formatKenteken(kenteken) {
        const normalized = this.normalizeKenteken(kenteken);
        if (normalized.length === 6) {
            return `${normalized.substr(0,2)}-${normalized.substr(2,2)}-${normalized.substr(4,2)}`;
        }
        return normalized;
    }

    /**
     * Rate limiting - respecteer RDW API limits
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Basis voertuiggegevens (merk, model, jaar, etc.)
     */
    async fetchBasicVehicleData(kenteken) {
        const url = `${this.baseUrl}/resource/m9d7-ebf2.json?kenteken=${kenteken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`RDW API error: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.length > 0 ? data[0] : null;
        
        // TESLA DEBUG: Log raw API response for debugging
        if (kenteken.toLowerCase().includes('k693bs') || (result && result.merk && result.merk.toLowerCase().includes('tesla'))) {
            console.log('🔥 TESLA DEBUG - Raw RDW API response for:', kenteken);
            console.log('Raw data:', JSON.stringify(result, null, 2));
            console.log('brandstof_omschrijving:', result?.brandstof_omschrijving);
            console.log('merk:', result?.merk);
            console.log('handelsbenaming:', result?.handelsbenaming);
        }
        
        return result;
    }

    /**
     * Brandstofgegevens (verbruik, CO2, etc.)
     */
    async fetchFuelData(kenteken) {
        const url = `${this.baseUrl}/resource/8ys7-d773.json?kenteken=${kenteken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return null; // Niet kritiek, kan missen
        }
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    }

    /**
     * NEDC Brandstofverbruik data (aparte dataset met NEDC cijfers)
     * Dataset: dqbz-ecw7 - specifiek voor NEDC brandstofverbruik
     */
    async fetchConsumptionData(kenteken) {
        try {
            const url = `${this.baseUrl}/resource/dqbz-ecw7.json?kenteken=${kenteken}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log('🔥 NEDC consumption data niet beschikbaar voor:', kenteken);
                return null; // Niet kritiek, NEDC data is niet voor alle auto's beschikbaar
            }
            
            const data = await response.json();
            console.log('📊 NEDC consumption data gevonden voor:', kenteken, data.length, 'records');
            return data.length > 0 ? data[0] : null; // Neem eerste record
            
        } catch (error) {
            console.log('⚠️ NEDC API call gefaald:', error.message);
            return null; // Niet kritiek
        }
    }

    /**
     * Recall informatie (optioneel)
     */
    async fetchRecallData(kenteken) {
        try {
            const url = `${this.baseUrl}/resource/t3br-gjjw.json?kenteken=${kenteken}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                return null;
            }
            
            const data = await response.json();
            return data || [];
        } catch (error) {
            return null; // Niet kritiek
        }
    }

    /**
     * Combineer alle API responses tot één bruikbaar object
     */
    combineVehicleData(basicData, fuelData, consumptionData, recallData, kenteken) {
        if (!basicData) {
            return null; // Geen basis data = geen auto gevonden
        }
        
        // TESLA DEBUG: Log ALL incoming data for Tesla debugging
        const merk = basicData.merk?.toLowerCase() || '';
        if (merk.includes('tesla') || kenteken.toLowerCase().includes('k693bs')) {
            console.log('🔥 TESLA DEBUG - combineVehicleData called with:');
            console.log('kenteken:', kenteken);
            console.log('basicData merk:', basicData.merk);
            console.log('basicData brandstof_omschrijving:', basicData.brandstof_omschrijving);
            console.log('basicData (first 10 keys):', Object.keys(basicData).slice(0, 10));
            console.log('fuelData keys:', fuelData ? Object.keys(fuelData).slice(0, 5) : 'null');
            console.log('consumptionData keys:', consumptionData ? Object.keys(consumptionData).slice(0, 5) : 'null');
        }

        // Nederlandse youngtimer check (15-30 jaar oud)
        const currentYear = new Date().getFullYear();
        const vehicleYear = parseInt(basicData.datum_eerste_toelating?.substr(0, 4) || 0);
        const vehicleAge = currentYear - vehicleYear;
        const isYoungtimer = vehicleAge >= 15 && vehicleAge <= 30;

        return {
            // Basis informatie
            kenteken: this.formatKenteken(kenteken),
            kentekenRaw: kenteken,
            
            // Voertuig details
            merk: basicData.merk || 'Onbekend',
            handelsbenaming: basicData.handelsbenaming || '',
            type: basicData.type_voertuig || '',
            variant: basicData.variant || '',
            uitvoering: basicData.uitvoering || '',
            
            // Datums en leeftijd
            datumEersteToelating: basicData.datum_eerste_toelating || '',
            bouwjaar: vehicleYear || 0,
            leeftijd: vehicleAge,
            isYoungtimer: isYoungtimer,
            
            // Technische specs
            massa: parseInt(basicData.massa_ledig_voertuig) || 0,
            gewicht: parseInt(basicData.massa_ledig_voertuig) || 0,
            maximumMassa: parseInt(basicData.toegestane_maximum_massa_voertuig) || 0,
            aantalZitplaatsen: parseInt(basicData.aantal_zitplaatsen) || 0,
            aantalDeuren: parseInt(basicData.aantal_deuren) || 0,
            
            // Brandstof en milieu - CHAT #11: Enhanced Tesla Detection
            brandstof: this.enhancedBrandstofDetection(basicData),
            isElektrisch: this.enhancedElektrischDetection(basicData),
            
            // TESLA DEBUG: Log detection results
            ...(merk.includes('tesla') || kenteken.toLowerCase().includes('k693bs') ? 
                console.log('🔥 TESLA DEBUG - Detection results: brandstof =', this.enhancedBrandstofDetection(basicData), ', isElektrisch =', this.enhancedElektrischDetection(basicData)) || {} : {}),
            
            // Brandstofgegevens (combinatie van fuelData en consumptionData - NEDC heeft prioriteit)
            verbruikStad: this.getBestConsumptionValue(fuelData?.brandstofverbruik_stad, consumptionData?.brandstofverbruik_stad),
            verbruikSnelweg: this.getBestConsumptionValue(fuelData?.brandstofverbruik_buiten, consumptionData?.brandstofverbruik_buiten),
            verbruikGemengd: this.getBestConsumptionValue(fuelData?.brandstofverbruik_gecombineerd, consumptionData?.brandstofverbruik_gecombineerd),
            co2Uitstoot: this.getBestConsumptionValue(fuelData?.co2_uitstoot_gecombineerd, consumptionData?.co2_uitstoot_gecombineerd, true),
            
            // Extra NEDC specifieke velden (als beschikbaar) - CHAT #11: Fixed field names
            brandstofverbruik_nedc: consumptionData?.brandstofverbruik_gecombineerd ? parseFloat(consumptionData.brandstofverbruik_gecombineerd) : null,
            brandstofverbruik_wltp: fuelData?.brandstofverbruik_gecombineerd ? parseFloat(fuelData.brandstofverbruik_gecombineerd) : null,
            co2_nedc: consumptionData?.co2_uitstoot_gecombineerd ? parseInt(consumptionData.co2_uitstoot_gecombineerd) : null,
            hasNedcData: !!consumptionData,
            
            // Fiscale informatie
            catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : null,
            bpm: basicData.bpm ? parseInt(basicData.bpm) : 0,
            
            // Nederlandse belasting regels 2025 - CHAT #13: Fixed bijtelling calculation
            ...(() => {
                const bijtellingsInfo = this.calculateBijtellingspercentage({
                    kenteken: this.formatKenteken(kenteken),
                    bouwjaar: vehicleYear,
                    catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : 0,
                    brandstof: this.enhancedBrandstofDetection(basicData)
                });
                return {
                    bijtellingspercentage: bijtellingsInfo.percentage,
                    bijtellingsType: bijtellingsInfo.type,
                    bijtellingsRegel: bijtellingsInfo.regel,
                    bijtellingsBaseType: bijtellingsInfo.basis
                };
            })(),
            mrb: this.calculateMRB(basicData),
            
            // Extra informatie
            hasRecalls: recallData && recallData.length > 0,
            recalls: recallData || [],
            
            // API metadata
            dataQuality: this.assessDataQuality(basicData, fuelData, consumptionData),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Bepaal beste brandstofverbruik waarde (NEDC heeft prioriteit)
     * NEDC wordt gebruikt voor Nederlandse fiscaliteit als beschikbaar
     */
    getBestConsumptionValue(fuelValue, nedcValue, isInteger = false) {
        // Converteer naar juiste type
        const parseValue = (val) => {
            if (!val || val === '' || val === '0') return null;
            return isInteger ? parseInt(val) : parseFloat(val);
        };
        
        const nedcParsed = parseValue(nedcValue);
        const fuelParsed = parseValue(fuelValue);
        
        // NEDC heeft prioriteit (Nederlandse fiscaliteit)
        if (nedcParsed !== null && nedcParsed > 0) {
            console.log('🎯 Gebruik NEDC waarde:', nedcParsed, 'i.p.v. fuel waarde:', fuelParsed);
            return nedcParsed;
        }
        
        // Fallback naar reguliere fuel data
        return fuelParsed;
    }

    /**
     * Bepaal bijtellingspercentage volgens Nederlandse regels 2025
     */
    getBijtellingspercentage(basicData, isYoungtimer) {
        if (isYoungtimer) {
            return 35; // Youngtimers: 35% over dagwaarde
        }

        const isElektrisch = this.isElektrischVoertuig(basicData.brandstof_omschrijving);
        const catalogusprijs = parseInt(basicData.catalogusprijs) || 0;
        
        // Pre-2017 auto's behouden 25% (vereenvoudigd - zou datum check nodig hebben)
        const bouwjaar = parseInt(basicData.datum_eerste_toelating?.substr(0, 4) || 0);
        if (bouwjaar < 2017) {
            return 25; // Grootvaderregeling
        }

        if (isElektrisch) {
            // Elektrische auto's: 17% tot €30.000, daarna 22%
            return catalogusprijs <= 30000 ? 17 : 22;
        }

        // Alle andere auto's: 22%
        return 22;
    }

    /**
     * Bereken MRB (Motorrijtuigenbelasting)
     */
    calculateMRB(basicData) {
        const massa = parseInt(basicData.massa_ledig_voertuig) || 0;
        const isElektrisch = this.isElektrischVoertuig(basicData.brandstof_omschrijving);
        
        if (massa === 0) return 0;
        
        // Basis MRB berekening (vereenvoudigd)
        let baseMRB = Math.round((massa / 100) * 8); // €8 per 100kg per maand (ongeveer)
        
        // Elektrische auto's: 25% korting in 2025
        if (isElektrisch) {
            baseMRB = Math.round(baseMRB * 0.75);
        }
        
        return baseMRB;
    }

    /**
     * Check of voertuig elektrisch is
     */
    isElektrischVoertuig(brandstofOmschrijving) {
        if (!brandstofOmschrijving) return false;
        
        const brandstof = brandstofOmschrijving.toLowerCase();
        return brandstof.includes('elektriciteit') || 
               brandstof.includes('elektrisch') ||
               brandstof.includes('waterstof'); // Waterstof telt ook als elektrisch voor bijtelling
    }

    /**
     * Normaliseer brandstoftype - CHAT #11 FIX: Enhanced Tesla/Electric Detection
     * Verbeterde mapping voor betere RDW data parsing + Tesla specifieke fixes
     */
    normalizeBrandstofType(brandstofOmschrijving) {
        if (!brandstofOmschrijving) return 'Onbekend';
        
        const brandstof = brandstofOmschrijving.toLowerCase().trim();
        
        // CHAT #11: TESLA SPECIFIC FIXES
        // RDW registreert Tesla's soms met rare brandstof omschrijvingen
        if (brandstof === '' || brandstof === 'onbekend' || brandstof === 'unknown') {
            // Voor lege/onbekende brandstof: check merk voor Tesla's
            return 'Onbekend'; // Dit wordt later in isElektrischVoertuig() gefixed voor Tesla's
        }
        
        // Exact matches eerst (RDW gebruikt specifieke termen)
        if (brandstof === 'benzine' || brandstof === 'euro 95 benzine' || brandstof === 'super benzine') return 'Benzine';
        if (brandstof === 'diesel' || brandstof === 'gasolie') return 'Diesel';
        if (brandstof === 'elektriciteit' || brandstof === 'elektrisch' || brandstof === 'electric') return 'Elektrisch';
        if (brandstof === 'waterstof' || brandstof === 'hydrogen') return 'Waterstof';
        if (brandstof === 'lpg' || brandstof === 'autogas') return 'LPG';
        if (brandstof === 'cng' || brandstof === 'aardgas') return 'CNG';
        
        // Partial matches voor hybrides en varianten
        if (brandstof.includes('hybride') || brandstof.includes('hybrid')) {
            if (brandstof.includes('plug')) return 'Plug-in Hybride';
            return 'Hybride';
        }
        
        // Benzine varianten
        if (brandstof.includes('benzine') || brandstof.includes('euro 95') || brandstof.includes('super')) return 'Benzine';
        
        // Diesel varianten  
        if (brandstof.includes('diesel') || brandstof.includes('gasolie') || brandstof.includes('tdi')) return 'Diesel';
        
        // Elektrische varianten - ENHANCED for Tesla
        if (brandstof.includes('elektr') || brandstof.includes('ev') || brandstof.includes('battery') || 
            brandstof.includes('accu') || brandstof.includes('stroom')) return 'Elektrisch';
        
        // Alternatieve brandstoffen
        if (brandstof.includes('lpg') || brandstof.includes('autogas') || brandstof.includes('gas')) return 'LPG';
        if (brandstof.includes('cng') || brandstof.includes('aardgas') || brandstof.includes('methaan')) return 'CNG';
        if (brandstof.includes('waterstof') || brandstof.includes('hydrogen') || brandstof.includes('h2')) return 'Waterstof';
        
        // Log onbekende brandstoftypes voor debugging
        console.warn('🔥 Onbekend brandstoftype gevonden:', brandstofOmschrijving);
        
        // Fallback naar 'Onbekend' voor debug purposes
        return 'Onbekend';
    }

    /**
     * CHAT #11: Enhanced brandstof detection voor Tesla's
     * Gebruikt merk informatie als fallback voor onbekende brandstoftypes
     */
    enhancedBrandstofDetection(basicData) {
        // TESLA DEBUG: Log detection process
        const merk = basicData.merk?.toLowerCase() || '';
        if (merk.includes('tesla')) {
            console.log('🔥 TESLA DEBUG - Enhanced brandstof detection for:', basicData.merk);
            console.log('brandstof_omschrijving input:', basicData.brandstof_omschrijving);
        }
        
        // Eerst normale brandstof mapping proberen
        const normalizedBrandstof = this.normalizeBrandstofType(basicData.brandstof_omschrijving);
        
        if (merk.includes('tesla')) {
            console.log('🔥 TESLA DEBUG - Normalized brandstof result:', normalizedBrandstof);
        }
        
        // Als brandstof onbekend is, check het merk
        if (normalizedBrandstof === 'Onbekend') {
            // Tesla's zijn altijd elektrisch
            if (merk.includes('tesla')) {
                console.log('🔋 Tesla gedetecteerd als elektrisch o.b.v. merk:', basicData.merk);
                return 'Elektrisch';
            }
            
            // Andere bekende elektrische merken
            if (merk.includes('nissan') && basicData.handelsbenaming?.toLowerCase().includes('leaf')) {
                return 'Elektrisch';
            }
            if (merk.includes('bmw') && basicData.handelsbenaming?.toLowerCase().includes('i3')) {
                return 'Elektrisch';
            }
            if (merk.includes('volkswagen') && basicData.handelsbenaming?.toLowerCase().includes('id.')) {
                return 'Elektrisch';
            }
            if (merk.includes('audi') && basicData.handelsbenaming?.toLowerCase().includes('e-tron')) {
                return 'Elektrisch';
            }
        }
        
        // TESLA DEBUG: Als Tesla NIET als Onbekend wordt gedetecteerd, dan is er iets anders aan de hand
        if (merk.includes('tesla') && normalizedBrandstof !== 'Onbekend') {
            console.log('🚨 TESLA DEBUG - Tesla heeft bekende brandstof type:', normalizedBrandstof);
            console.log('🚨 Possible normalizeBrandstofType() not detecting correctly');
            // Force Tesla to electric regardless
            return 'Elektrisch';
        }
        
        return normalizedBrandstof;
    }

    /**
     * CHAT #13: Enhanced brandstof detection - voor juiste bijtelling berekening
     * Prioriteert merk-specifieke logica voor Tesla en andere elektrische auto's
     */
    enhancedBrandstofDetection(basicData) {
        const merk = basicData.merk?.toLowerCase() || '';
        const model = basicData.handelsbenaming?.toLowerCase() || '';
        
        // Tesla's zijn altijd elektrisch, ongeacht RDW brandstof omschrijving
        if (merk.includes('tesla')) {
            console.log('⚡ Tesla gedetecteerd - force brandstof naar Elektrisch');
            return 'Elektrisch';
        }
        
        // Andere bekende elektrische modellen
        if ((merk.includes('nissan') && model.includes('leaf')) ||
            (merk.includes('bmw') && (model.includes('i3') || model.includes('ix'))) ||
            (merk.includes('volkswagen') && model.includes('id.')) ||
            (merk.includes('audi') && model.includes('e-tron')) ||
            (merk.includes('mercedes') && model.includes('eqc')) ||
            (merk.includes('hyundai') && model.includes('ioniq')) ||
            (merk.includes('kia') && model.includes('e-niro'))) {
            console.log('⚡ Bekende elektrische auto gedetecteerd o.b.v. merk+model');
            return 'Elektrisch';
        }
        
        // Gebruik normale brandstof detectie
        return this.normalizeBrandstofType(basicData.brandstof_omschrijving);
    }

    /**
     * CHAT #11: Enhanced elektrisch detection voor Tesla's
     * Gebruikt merk informatie als fallback
     */
    enhancedElektrischDetection(basicData) {
        // TESLA DEBUG: Log electric detection process
        const merk = basicData.merk?.toLowerCase() || '';
        if (merk.includes('tesla')) {
            console.log('🔥 TESLA DEBUG - Enhanced elektrisch detection for:', basicData.merk);
            console.log('brandstof_omschrijving input:', basicData.brandstof_omschrijving);
        }
        
        // Eerst normale elektrisch check
        const normalCheck = this.isElektrischVoertuig(basicData.brandstof_omschrijving);
        
        if (merk.includes('tesla')) {
            console.log('🔥 TESLA DEBUG - Normal electric check result:', normalCheck);
        }
        
        if (normalCheck) return true;
        
        // Fallback: check merk voor bekende elektrische auto's
        const model = basicData.handelsbenaming?.toLowerCase() || '';
        
        // Tesla's zijn altijd elektrisch
        if (merk.includes('tesla')) {
            console.log('⚡ Tesla gedetecteerd als elektrisch o.b.v. merk');
            return true;
        }
        
        // Andere bekende elektrische modellen
        if ((merk.includes('nissan') && model.includes('leaf')) ||
            (merk.includes('bmw') && model.includes('i3')) ||
            (merk.includes('volkswagen') && model.includes('id.')) ||
            (merk.includes('audi') && model.includes('e-tron'))) {
            return true;
        }
        
        return false;
    }

    /**
     * CHAT #13: Nederlandse Bijtelling Regels 2025
     * Bereken correct bijtellingspercentage o.b.v. brandstof, jaar en catalogusprijs
     */
    calculateBijtellingspercentage(vehicleData) {
        const bouwjaar = vehicleData.bouwjaar || new Date().getFullYear();
        const huidigJaar = new Date().getFullYear(); // 2025
        const leeftijd = huidigJaar - bouwjaar;
        const catalogusprijs = vehicleData.catalogusprijs || 0;
        const brandstof = vehicleData.brandstof || 'Benzine';
        
        console.log(`💰 Bijtelling berekening voor ${vehicleData.kenteken}:`, {
            bouwjaar, leeftijd, catalogusprijs, brandstof
        });
        
        // 1. YOUNGTIMER CHECK (15-30 jaar)
        if (leeftijd >= 15 && leeftijd <= 30) {
            console.log('🏛️ Youngtimer regeling: 35% over dagwaarde');
            return {
                percentage: 35,
                type: 'youngtimer',
                basis: 'dagwaarde',
                regel: '35% over dagwaarde (15-30 jaar oud)',
                isYoungtimer: true
            };
        }
        
        // 2. PRE-2017 CHECK 
        if (bouwjaar < 2017) {
            console.log('📅 Pre-2017 regeling: 25% behouden tarief');
            return {
                percentage: 25,
                type: 'pre-2017',
                basis: 'catalogusprijs', 
                regel: '25% behouden tarief (voor 2017)',
                isYoungtimer: false
            };
        }
        
        // 3. ELEKTRISCH & WATERSTOF CHECK (2025 regels)
        if (brandstof === 'Elektrisch' || brandstof === 'Waterstof') {
            if (catalogusprijs <= 30000) {
                console.log('⚡ Elektrisch laag: 17% tot €30.000');
                return {
                    percentage: 17,
                    type: 'elektrisch-laag',
                    basis: 'catalogusprijs',
                    regel: '17% elektrisch/waterstof tot €30.000',
                    isYoungtimer: false
                };
            } else {
                console.log('⚡ Elektrisch hoog: 22% boven €30.000');
                return {
                    percentage: 22,
                    type: 'elektrisch-hoog', 
                    basis: 'catalogusprijs',
                    regel: '22% elektrisch/waterstof boven €30.000',
                    isYoungtimer: false
                };
            }
        }
        
        // 4. ALLE ANDERE BRANDSTOFTYPES (2025 standaard)
        console.log('🚗 Standaard regeling: 22% voor benzine/diesel/hybride');
        return {
            percentage: 22,
            type: 'standaard',
            basis: 'catalogusprijs',
            regel: '22% standaard (benzine/diesel/hybride/LPG/CNG)',
            isYoungtimer: false
        };
    }

    /**
     * Beoordeel kwaliteit van opgevraagde data
     */
    assessDataQuality(basicData, fuelData, consumptionData) {
        let score = 0;
        let maxScore = 0;
        
        // Basis informatie (verplicht)
        maxScore += 3;
        if (basicData?.merk) score++;
        if (basicData?.datum_eerste_toelating) score++;
        if (basicData?.massa_ledig_voertuig) score++;
        
        // Fiscale informatie (belangrijk)
        maxScore += 2;
        if (basicData?.catalogusprijs) score++;
        if (basicData?.brandstof_omschrijving) score++;
        
        // Brandstofgegevens (bonus - NEDC krijgt meer punten)
        maxScore += 2;
        if (consumptionData?.brandstofverbruik_gecombineerd) {
            score += 2; // NEDC data is belangrijker
        } else if (fuelData?.brandstofverbruik_gecombineerd) {
            score += 1; // Reguliere fuel data als fallback
        }
        
        return Math.round((score / maxScore) * 100);
    }

    /**
     * Valideer kenteken format (basis check)
     */
    isValidKenteken(kenteken) {
        if (!kenteken || kenteken.length < 6) return false;
        
        const normalized = this.normalizeKenteken(kenteken);
        
        // Nederlandse kentekens zijn 6 karakters (letters + cijfers)
        return /^[A-Z0-9]{6}$/.test(normalized);
    }

    /**
     * Clear cache (voor testing/debugging)
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 RDW cache cleared');
    }
}

// Global instance maken
window.rdwApi = new RDWApi();

// Export voor module gebruik
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RDWApi;
}