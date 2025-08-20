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
            
            // CHAT #16: COMPLETE BIJTELLING ENGINE - DET-jaar gebaseerde berekening
            ...(() => {
                const bijtellingsInfo = this.calculateBijtellingspercentage({
                    kenteken: this.formatKenteken(kenteken),
                    kentekenRaw: kenteken,
                    bouwjaar: vehicleYear,
                    catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : 0,
                    brandstof: this.enhancedBrandstofDetection(basicData),
                    datumEersteToelating: basicData.datum_eerste_toelating || `${vehicleYear}-01-01`
                });
                return {
                    // Backwards compatibility - old format
                    bijtellingspercentage: bijtellingsInfo.bijtelling_percentage,
                    bijtellingsType: bijtellingsInfo.bijtelling_type,
                    bijtellingsRegel: bijtellingsInfo.toegepast_percentage,
                    bijtellingsBaseType: bijtellingsInfo.bijtelling_basis,
                    
                    // NEW: Complete bijtelling data volgens JSON specificatie
                    bijtelling_complete: bijtellingsInfo,
                    
                    // NEW: Key financial values for easy access
                    bijtelling_bruto_jaar: bijtellingsInfo.bijtelling_bruto_per_jaar,
                    bijtelling_netto_maand: bijtellingsInfo.bijtelling_netto_per_maand,
                    det_jaar: bijtellingsInfo.det_jaar,
                    einde_60_maanden: bijtellingsInfo.einde_60_maanden
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
     * DEPRECATED - Gebruik calculateBijtellingspercentage() voor complete bijtelling berekening
     * Behouden voor backwards compatibility
     */
    getBijtellingspercentage(basicData, isYoungtimer) {
        console.warn('⚠️ getBijtellingspercentage() is deprecated, gebruik calculateBijtellingspercentage()');
        
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
     * CHAT #16: COMPLETE BIJTELLING ENGINE - DET-jaar gebaseerde berekening
     * Implementeert alle Nederlandse bijtelling regels 2011-2026+ met 60-maanden vastlegging
     * Basis: BIJTELLING_REFERENCE_GUIDE.md + Richard's expertise
     */
    calculateBijtellingspercentage(vehicleData) {
        const kenteken = vehicleData.kenteken || vehicleData.kentekenRaw || 'Onbekend';
        const bouwjaar = parseInt(vehicleData.bouwjaar) || new Date().getFullYear();
        const catalogusprijs = parseInt(vehicleData.catalogusprijs) || 0;
        const brandstof = vehicleData.brandstof || 'Benzine';
        const datumEersteToelating = vehicleData.datumEersteToelating || `${bouwjaar}-01-01`;
        
        console.log(`🎯 COMPLETE BIJTELLING BEREKENING voor ${kenteken}:`);
        console.log(`   DET: ${datumEersteToelating}, Bouwjaar: ${bouwjaar}, Brandstof: ${brandstof}, Catalogus: €${catalogusprijs.toLocaleString()}`);
        
        // STAP 1: Extract DET jaar (Datum Eerste Toelating bepaalt de regeling)
        const detYear = this.extractDETYear(datumEersteToelating, bouwjaar);
        console.log(`📅 DET jaar geëxtraheerd: ${detYear}`);
        
        // STAP 2: Age-based checks (youngtimer/oldtimer)
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - bouwjaar;
        
        if (vehicleAge > 30) {
            console.log('🏛️ OLDTIMER: Geen bijtelling (>30 jaar)');
            return this.createBijtellingsResponse({
                kenteken, detYear, catalogusprijs, datumEersteToelating,
                percentage: 0, type: 'oldtimer', basis: 'geen',
                regel: 'Geen bijtelling - Oldtimer (>30 jaar)',
                belastingtarief: 0
            });
        }
        
        if (vehicleAge >= 15 && vehicleAge <= 30) {
            console.log('🏛️ YOUNGTIMER: 35% over dagwaarde (15-30 jaar)');
            return this.createBijtellingsResponse({
                kenteken, detYear, catalogusprijs, datumEersteToelating,
                percentage: 35, type: 'youngtimer', basis: 'dagwaarde',
                regel: '35% over dagwaarde (15-30 jaar oud)',
                belastingtarief: 37, // Default voor berekening
                waarschuwing: 'Youngtimer regeling heeft geen 60-maanden bescherming (politiek onzeker)'
            });
        }
        
        // STAP 3: DET-jaar gebaseerde bijtelling regels (MET 60-maanden check)
        const bijtellingsRegels = this.getBijtellingsRegelByDETYear(detYear, brandstof, catalogusprijs, datumEersteToelating);
        console.log(`📊 Toegepaste regeling:`, bijtellingsRegels);
        
        // STAP 4: Bereken 60-maanden einddatum (DET + 1 maand + 60 maanden)
        const eindDatum60Maanden = this.calculate60MonthsEndDate(datumEersteToelating);
        
        return this.createBijtellingsResponse({
            kenteken, detYear, catalogusprijs, datumEersteToelating,
            ...bijtellingsRegels,
            belastingtarief: 37, // Default voor berekening  
            einde60Maanden: eindDatum60Maanden
        });
    }
    
    /**
     * Extract DET jaar uit datum string of fallback naar bouwjaar
     */
    extractDETYear(datumEersteToelating, bouwjaar) {
        if (datumEersteToelating && datumEersteToelating.length >= 4) {
            const detYear = parseInt(datumEersteToelating.substr(0, 4));
            if (detYear > 1990 && detYear <= new Date().getFullYear()) {
                return detYear;
            }
        }
        console.log(`⚠️ DET datum onbruikbaar (${datumEersteToelating}), gebruik bouwjaar: ${bouwjaar}`);
        return bouwjaar;
    }
    
    /**
     * Complete DET-jaar gebaseerde bijtelling regeltabel 2011-2026+
     * 🚨 CHAT #18 FIX: 60-maanden expiry check toegevoegd
     */
    getBijtellingsRegelByDETYear(detYear, brandstof, catalogusprijs, datumEersteToelating) {
        const isElektrisch = (brandstof === 'Elektrisch' || brandstof === 'Waterstof');
        
        console.log(`🔍 Regel lookup: DET ${detYear}, Elektrisch: ${isElektrisch}, Catalogus: €${catalogusprijs.toLocaleString()}`);
        
        // 🚨 CHAT #18 CRITICAL: Check 60-maanden expiry voor EV's
        if (isElektrisch && this.is60MonthsExpired(datumEersteToelating)) {
            console.log(`⏰ 60-MAANDEN VERLOPEN voor DET ${detYear} - gebruik huidige regeling ipv oude regeling`);
            return {
                percentage: 22,
                type: 'ev-60maanden-verlopen',
                basis: 'catalogusprijs',
                regel: `22% (60-maanden bescherming verlopen, was DET ${detYear} regeling)`
            };
        }
        
        // FOSSIEL BRANDSTOFTYPES (benzine, diesel, hybride, LPG, CNG)
        if (!isElektrisch) {
            if (detYear <= 2016) {
                return {
                    percentage: 25,
                    type: 'fossiel-pre2017',
                    basis: 'catalogusprijs',
                    regel: '25% behouden tarief (DET ≤2016)'
                };
            } else {
                return {
                    percentage: 22,
                    type: 'fossiel-standaard',
                    basis: 'catalogusprijs', 
                    regel: '22% standaard fossiel (DET ≥2017)'
                };
            }
        }
        
        // ELEKTRISCHE AUTO'S - Jaar-specifieke regels
        const evRegels = {
            2011: { percentage: 0, regel: '0% (DET 2011-2013)' },
            2012: { percentage: 0, regel: '0% (DET 2011-2013)' },
            2013: { percentage: 0, regel: '0% (DET 2011-2013)' },
            2014: { percentage: 4, regel: '4% over alles (DET 2014-2016)' },
            2015: { percentage: 4, regel: '4% over alles (DET 2014-2016)' },
            2016: { percentage: 4, regel: '4% over alles (DET 2014-2016)' },
            2017: { percentage: 4, regel: '4% over alles (DET 2017-2018)' },
            2018: { percentage: 4, regel: '4% over alles (DET 2017-2018)' },
            2019: { drempel: 50000, laag: 4, hoog: 22, regel: '4% tot €50.000, rest 22% (DET 2019)' },
            2020: { drempel: 45000, laag: 8, hoog: 22, regel: '8% tot €45.000, rest 22% (DET 2020)' },
            2021: { drempel: 40000, laag: 12, hoog: 22, regel: '12% tot €40.000, rest 22% (DET 2021)' },
            2022: { drempel: 35000, laag: 16, hoog: 22, regel: '16% tot €35.000, rest 22% (DET 2022)' },
            2023: { drempel: 30000, laag: 16, hoog: 22, regel: '16% tot €30.000, rest 22% (DET 2023)' },
            2024: { drempel: 30000, laag: 16, hoog: 22, regel: '16% tot €30.000, rest 22% (DET 2024)' },
            2025: { drempel: 30000, laag: 17, hoog: 22, regel: '17% tot €30.000, rest 22% (DET 2025)' }
        };
        
        // Specifieke jaar regels
        if (evRegels[detYear]) {
            const regel = evRegels[detYear];
            
            // Eenvoudige percentage (2011-2018)
            if (regel.percentage !== undefined) {
                return {
                    percentage: regel.percentage,
                    type: `ev-${detYear}`,
                    basis: 'catalogusprijs',
                    regel: regel.regel
                };
            }
            
            // Drempelwaarde systeem (2019+)
            if (regel.drempel !== undefined) {
                if (catalogusprijs <= regel.drempel) {
                    return {
                        percentage: regel.laag,
                        type: `ev-${detYear}-laag`,
                        basis: 'catalogusprijs',
                        regel: regel.regel
                    };
                } else {
                    return {
                        percentage: regel.hoog,
                        type: `ev-${detYear}-hoog`,
                        basis: 'catalogusprijs',
                        regel: regel.regel
                    };
                }
            }
        }
        
        // 2026+ regel: Geen voordeel meer voor EV's (behalve waterstof/zonnecel)
        if (detYear >= 2026) {
            if (brandstof === 'Waterstof') {
                return {
                    percentage: 17,
                    type: 'waterstof-standaard',
                    basis: 'catalogusprijs',
                    regel: '17% waterstof/zonnecel (vanaf DET 2026)'
                };
            } else {
                return {
                    percentage: 22,
                    type: 'ev-geen-voordeel',
                    basis: 'catalogusprijs',
                    regel: '22% elektrisch geen voordeel meer (DET ≥2026)'
                };
            }
        }
        
        // Fallback voor onbekende jaren (gebruik 2025 regels)
        console.warn(`⚠️ Onbekend DET jaar ${detYear}, gebruik 2025 regels als fallback`);
        if (catalogusprijs <= 30000) {
            return {
                percentage: 17,
                type: 'ev-fallback-laag',
                basis: 'catalogusprijs',
                regel: `17% tot €30.000 (fallback voor DET ${detYear})`
            };
        } else {
            return {
                percentage: 22,
                type: 'ev-fallback-hoog',
                basis: 'catalogusprijs',
                regel: `22% boven €30.000 (fallback voor DET ${detYear})`
            };
        }
    }
    
    /**
     * Bereken 60-maanden einddatum (DET + 1 maand + 60 maanden)
     */
    calculate60MonthsEndDate(datumEersteToelating) {
        try {
            const detDate = new Date(datumEersteToelating);
            if (isNaN(detDate.getTime())) {
                return null; // Ongeldige datum
            }
            
            // DET + 1 maand + 60 maanden = 61 maanden totaal
            const endDate = new Date(detDate.getFullYear(), detDate.getMonth() + 61, 1);
            
            return endDate.toISOString().substr(0, 7); // YYYY-MM format
        } catch (error) {
            console.warn('⚠️ Kan 60-maanden datum niet berekenen:', error);
            return null;
        }
    }
    
    /**
     * 🚨 CHAT #18: Check of 60-maanden bescherming is verlopen
     * Kritieke functie voor Tesla K693BS fix - moet 22% zijn ipv 4%
     */
    is60MonthsExpired(datumEersteToelating) {
        try {
            const detDate = new Date(datumEersteToelating);
            if (isNaN(detDate.getTime())) {
                console.warn('⚠️ Ongeldige DET datum voor 60-maanden check:', datumEersteToelating);
                return false; // Conservatief: als datum ongeldig, geen expiry
            }
            
            // Bereken 60-maanden einddatum: DET + 1 maand + 60 maanden
            const endDate = new Date(detDate.getFullYear(), detDate.getMonth() + 61, 1);
            const now = new Date();
            
            const isExpired = now >= endDate;
            
            console.log(`🕰️ 60-MAANDEN CHECK: DET ${datumEersteToelating} -> Einde ${endDate.toISOString().substr(0, 7)} -> Verlopen: ${isExpired}`);
            
            return isExpired;
        } catch (error) {
            console.warn('⚠️ Fout bij 60-maanden check:', error);
            return false; // Conservatief: bij fout geen expiry
        }
    }
    
    /**
     * Maak gestructureerde bijtelling response volgens Richard's JSON specificatie
     */
    createBijtellingsResponse({ kenteken, detYear, catalogusprijs, datumEersteToelating, percentage, type, basis, regel, belastingtarief = 37, einde60Maanden = null, waarschuwing = null }) {
        const bouwjaar = detYear; // DET jaar is leidend
        const isYoungtimer = type === 'youngtimer';
        
        // Bereken bijtelling bedragen
        const basisWaarde = isYoungtimer ? (catalogusprijs * 0.7) : catalogusprijs; // Youngtimer: schatting 70% van catalogus = dagwaarde
        const bijtellingsJaar = Math.round((basisWaarde * percentage / 100));
        const bijtellingsPerMaand = Math.round((bijtellingsJaar * belastingtarief / 100) / 12);
        
        const response = {
            // BASIS INFORMATIE
            kenteken: kenteken,
            bouwjaar: bouwjaar.toString(),
            eerste_toelating: datumEersteToelating,
            det_jaar: detYear,
            
            // FINANCIËLE WAARDES
            cataloguswaarde: catalogusprijs,
            dagwaarde: isYoungtimer ? Math.round(basisWaarde) : null,
            
            // BIJTELLING BEREKENING
            bijtelling_percentage: percentage,
            bijtelling_bruto_per_jaar: bijtellingsJaar,
            bijtelling_netto_per_maand: bijtellingsPerMaand,
            
            // TOEGEPASTE REGELING
            toegepast_percentage: regel,
            bijtelling_type: type,
            bijtelling_basis: basis,
            
            // DATUM INFORMATIE
            einde_60_maanden: einde60Maanden,
            
            // FLAGS
            youngtimer: isYoungtimer,
            oldtimer: (type === 'oldtimer'),
            
            // WAARSCHUWINGEN
            waarschuwing: waarschuwing,
            
            // META
            belastingtarief_gebruikt: belastingtarief,
            berekening_datum: new Date().toISOString().substr(0, 10)
        };
        
        console.log('💰 BIJTELLING BEREKENING RESULTAAT:', {
            kenteken: response.kenteken,
            regel: response.toegepast_percentage,
            percentage: response.bijtelling_percentage + '%',
            bruto: '€' + response.bijtelling_bruto_per_jaar.toLocaleString() + '/jaar',
            netto: '€' + response.bijtelling_netto_per_maand + '/maand',
            einde60: response.einde_60_maanden || 'N/A'
        });
        
        return response;
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