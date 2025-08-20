/**
 * RDW API Integration - v1.11.2 (BIJTELLING BUG FIX)
 * Nederlandse RDW Open Data API voor voertuiggegevens lookup
 * Gratis API, geen key nodig
 * MET CORRECTE DET-JAAR GEBASEERDE BIJTELLING REGELS
 */

class RDWApi {
    constructor() {
        this.baseUrl = 'https://opendata.rdw.nl';
        this.rateLimitDelay = 100; // 100ms tussen requests
        this.lastRequestTime = 0;
        this.cache = new Map(); // Cache voor voertuiggegevens
        
        // Complete Nederlandse bijtelling regels tabel
        this.bijtellingsRegels = this.initializeBijtellingsRegels();
    }

    /**
     * Initialiseer complete Nederlandse bijtelling regels tabel
     */
    initializeBijtellingsRegels() {
        return {
            // EV's (0 g/km CO2)
            ev: {
                2011: { percentage: 0, drempel: null },
                2012: { percentage: 0, drempel: null },
                2013: { percentage: 0, drempel: null },
                2014: { percentage: 4, drempel: null },
                2015: { percentage: 4, drempel: null },
                2016: { percentage: 4, drempel: null },
                2017: { percentage: 4, drempel: null },
                2018: { percentage: 4, drempel: null },
                2019: { percentage: 4, drempel: 50000, percentageAbove: 22 },
                2020: { percentage: 8, drempel: 45000, percentageAbove: 22 },
                2021: { percentage: 12, drempel: 40000, percentageAbove: 22 },
                2022: { percentage: 16, drempel: 35000, percentageAbove: 22 },
                2023: { percentage: 16, drempel: 30000, percentageAbove: 22 },
                2024: { percentage: 16, drempel: 30000, percentageAbove: 22 },
                2025: { percentage: 17, drempel: 30000, percentageAbove: 22 },
                2026: { percentage: 22, drempel: null } // EV voordeel vervalt
            },
            // Fossiele brandstoffen (benzine, diesel, hybride, LPG)
            fossiel: {
                2016: { percentage: 25, drempel: null },
                2017: { percentage: 22, drempel: null } // 2017 en later
            },
            // Speciale categorieën
            waterstof: {
                2025: { percentage: 17, drempel: null } // Waterstof/zonnecel vanaf 2025
            }
        };
    }

    /**
     * Hoofdfunctie: Haal voertuiggegevens op via kenteken
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
            console.log('🔍 RDW API lookup voor:', normalizedKenteken);
            
            // Parallelle API calls voor alle data
            const [basicData, fuelData, consumptionData, recallData] = await Promise.allSettled([
                this.fetchBasicVehicleData(normalizedKenteken),
                this.fetchFuelData(normalizedKenteken),
                this.fetchConsumptionData(normalizedKenteken),
                this.fetchRecallData(normalizedKenteken)
            ]);
            
            const basicResult = basicData.status === 'fulfilled' ? basicData.value : null;
            const fuelResult = fuelData.status === 'fulfilled' ? fuelData.value : null;
            const consumptionResult = consumptionData.status === 'fulfilled' ? consumptionData.value : null;
            const recallResult = recallData.status === 'fulfilled' ? recallData.value : null;
            
            if (!basicResult) {
                console.log('❌ Geen basisgegevens gevonden voor kenteken:', normalizedKenteken);
                return null;
            }
            
            const vehicleData = this.combineVehicleData(basicResult, fuelResult, consumptionResult, recallResult, normalizedKenteken);
            
            // Cache resultaat
            if (vehicleData) {
                this.cache.set(normalizedKenteken, vehicleData);
                setTimeout(() => this.cache.delete(normalizedKenteken), 5 * 60 * 1000);
            }
            
            return vehicleData;
            
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
        return data.length > 0 ? data[0] : null;
    }

    /**
     * Brandstofgegevens (verbruik, CO2, etc.)
     */
    async fetchFuelData(kenteken) {
        const url = `${this.baseUrl}/resource/8ys7-d773.json?kenteken=${kenteken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    }

    /**
     * NEDC Brandstofverbruik data (aparte dataset met NEDC cijfers)
     */
    async fetchConsumptionData(kenteken) {
        try {
            const url = `${this.baseUrl}/resource/dqbz-ecw7.json?kenteken=${kenteken}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                return null;
            }
            
            const data = await response.json();
            return data.length > 0 ? data[0] : null;
            
        } catch (error) {
            return null;
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
            return null;
        }
    }

    /**
     * Combineer alle API responses tot één bruikbaar object
     */
    combineVehicleData(basicData, fuelData, consumptionData, recallData, kenteken) {
        if (!basicData) {
            return null;
        }

        // Extract DET jaar en voertuig leeftijd
        const detYear = this.extractDETYear(basicData);
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - detYear;
        const isYoungtimer = vehicleAge >= 15 && vehicleAge <= 30;
        const isOldtimer = vehicleAge > 30;

        // Enhanced brandstof en elektrisch detectie
        const brandstofType = this.enhancedBrandstofDetection(basicData);
        const isElektrisch = this.enhancedElektrischDetection(basicData);
        
        // CORRECTE bijtelling berekening met DET jaar
        const bijtellingsData = this.calculateCorrectBijtelling(basicData, detYear, isYoungtimer, isOldtimer);

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
            detYear: detYear,
            bouwjaar: detYear || 0,
            leeftijd: vehicleAge,
            isYoungtimer: isYoungtimer,
            isOldtimer: isOldtimer,
            
            // Technische specs
            massa: parseInt(basicData.massa_ledig_voertuig) || 0,
            gewicht: parseInt(basicData.massa_ledig_voertuig) || 0,
            maximumMassa: parseInt(basicData.toegestane_maximum_massa_voertuig) || 0,
            aantalZitplaatsen: parseInt(basicData.aantal_zitplaatsen) || 0,
            aantalDeuren: parseInt(basicData.aantal_deuren) || 0,
            
            // Brandstof en milieu - Enhanced Detection
            brandstof: brandstofType,
            isElektrisch: isElektrisch,
            
            // Brandstofgegevens (NEDC heeft prioriteit)
            verbruikStad: this.getBestConsumptionValue(fuelData?.brandstofverbruik_stad, consumptionData?.brandstofverbruik_stad),
            verbruikSnelweg: this.getBestConsumptionValue(fuelData?.brandstofverbruik_buiten, consumptionData?.brandstofverbruik_buiten),
            verbruikGemengd: this.getBestConsumptionValue(fuelData?.brandstofverbruik_gecombineerd, consumptionData?.brandstofverbruik_gecombineerd),
            co2Uitstoot: this.getBestConsumptionValue(fuelData?.co2_uitstoot_gecombineerd, consumptionData?.co2_uitstoot_gecombineerd, true),
            
            // NEDC specifieke velden
            brandstofverbruik_nedc: consumptionData?.brandstofverbruik_gecombineerd ? parseFloat(consumptionData.brandstofverbruik_gecombineerd) : null,
            brandstofverbruik_wltp: fuelData?.brandstofverbruik_gecombineerd ? parseFloat(fuelData.brandstofverbruik_gecombineerd) : null,
            co2_nedc: consumptionData?.co2_uitstoot_gecombineerd ? parseInt(consumptionData.co2_uitstoot_gecombineerd) : null,
            hasNedcData: !!consumptionData,
            
            // CORRECTE Fiscale informatie met DET jaar regels
            catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : null,
            bpm: basicData.bpm ? parseInt(basicData.bpm) : 0,
            
            // NIEUWE CORRECTE BIJTELLING DATA
            bijtellingspercentage: bijtellingsData.percentage,
            bijtellingsDetails: bijtellingsData,
            
            mrb: this.calculateMRB(basicData, isElektrisch),
            
            // Extra informatie
            hasRecalls: recallData && recallData.length > 0,
            recalls: recallData || [],
            
            // API metadata
            dataQuality: this.assessDataQuality(basicData, fuelData, consumptionData),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Extract DET jaar (Datum Eerste Toelating) uit RDW data
     */
    extractDETYear(basicData) {
        // Probeer datum_eerste_toelating
        if (basicData.datum_eerste_toelating) {
            const detString = basicData.datum_eerste_toelating.toString();
            if (detString.length >= 4) {
                return parseInt(detString.substr(0, 4));
            }
        }
        
        // Fallback naar bouwjaar indien beschikbaar
        if (basicData.bouwjaar) {
            return parseInt(basicData.bouwjaar);
        }
        
        // Laatste fallback: huidige jaar minus geschatte leeftijd
        console.warn('⚠️ Geen DET jaar gevonden, gebruik huidige jaar als fallback');
        return new Date().getFullYear();
    }

    /**
     * CORRECTE bijtelling berekening met DET jaar regels
     * Implementeert volledige Nederlandse regels 2011-2026+
     */
    calculateCorrectBijtelling(basicData, detYear, isYoungtimer, isOldtimer) {
        const catalogusprijs = parseInt(basicData.catalogusprijs) || 0;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Oldtimers: geen bijtelling
        if (isOldtimer) {
            return {
                percentage: 0,
                reason: 'Oldtimer (>30 jaar)',
                detYear: detYear,
                is60MonthsActive: false,
                endDate60Months: null,
                brutoPerYear: 0,
                appliedRule: 'Oldtimer regeling'
            };
        }
        
        // Youngtimers: 35% over dagwaarde (geschat als 20% van catalogusprijs)
        if (isYoungtimer) {
            const geschatteDagwaarde = Math.round(catalogusprijs * 0.2);
            return {
                percentage: 35,
                reason: 'Youngtimer (15-30 jaar)',
                detYear: detYear,
                is60MonthsActive: false,
                endDate60Months: null,
                brutoPerYear: Math.round(geschatteDagwaarde * 0.35),
                appliedRule: '35% over dagwaarde',
                geschatteDagwaarde: geschatteDagwaarde,
                warning: 'Geen 60-maandenbescherming - politiek onzeker'
            };
        }
        
        // Bereken 60-maanden einddatum
        const detDate = this.parseDETDate(basicData.datum_eerste_toelating);
        const endDate60Months = new Date(detDate);
        endDate60Months.setMonth(endDate60Months.getMonth() + 60);
        const is60MonthsActive = currentDate <= endDate60Months;
        
        const isElektrisch = this.enhancedElektrischDetection(basicData);
        const isWaterstof = this.isWaterstofVehicle(basicData);
        
        let bijtellingsResult;
        
        if (is60MonthsActive) {
            // Gebruik DET jaar regels (60-maanden bescherming actief)
            bijtellingsResult = this.getBijtellingsRegelByDETYear(detYear, catalogusprijs, isElektrisch, isWaterstof);
            bijtellingsResult.appliedRule = `DET ${detYear} regels (60-maanden bescherming)`;
        } else {
            // 60-maanden periode voorbij - gebruik huidige regels
            bijtellingsResult = this.getBijtellingsRegelByDETYear(currentYear, catalogusprijs, isElektrisch, isWaterstof);
            bijtellingsResult.appliedRule = `Huidige ${currentYear} regels (60-maanden periode verlopen)`;
        }
        
        return {
            ...bijtellingsResult,
            detYear: detYear,
            is60MonthsActive: is60MonthsActive,
            endDate60Months: endDate60Months.toISOString().substr(0, 7), // YYYY-MM format
            brutoPerYear: Math.round(catalogusprijs * (bijtellingsResult.effectivePercentage / 100))
        };
    }

    /**
     * Haal bijtelling regel op basis van DET jaar
     */
    getBijtellingsRegelByDETYear(detYear, catalogusprijs, isElektrisch, isWaterstof) {
        // Waterstof speciale regeling vanaf 2025
        if (isWaterstof && detYear >= 2025) {
            return {
                percentage: 17,
                effectivePercentage: 17,
                reason: 'Waterstof/zonnecel vanaf 2025',
                drempel: null
            };
        }
        
        if (isElektrisch) {
            // EV regels op basis van DET jaar
            const evRule = this.bijtellingsRegels.ev[detYear] || this.bijtellingsRegels.ev[2026]; // Default naar 2026 regel
            
            if (evRule.drempel && catalogusprijs > evRule.drempel) {
                // Drempel systeem: verschillende percentages onder/boven drempel
                const belowThreshold = evRule.drempel * (evRule.percentage / 100);
                const aboveThreshold = (catalogusprijs - evRule.drempel) * (evRule.percentageAbove / 100);
                const totalBijtelling = belowThreshold + aboveThreshold;
                const effectivePercentage = (totalBijtelling / catalogusprijs) * 100;
                
                return {
                    percentage: `${evRule.percentage}% tot €${evRule.drempel.toLocaleString()}, ${evRule.percentageAbove}% daarboven`,
                    effectivePercentage: effectivePercentage,
                    reason: `EV DET ${detYear} met drempel`,
                    drempel: evRule.drempel,
                    calculation: {
                        belowThreshold: Math.round(belowThreshold),
                        aboveThreshold: Math.round(aboveThreshold),
                        total: Math.round(totalBijtelling)
                    }
                };
            } else {
                // Flat percentage
                return {
                    percentage: evRule.percentage,
                    effectivePercentage: evRule.percentage,
                    reason: `EV DET ${detYear}`,
                    drempel: evRule.drempel
                };
            }
        } else {
            // Fossiele brandstoffen
            if (detYear <= 2016) {
                return {
                    percentage: 25,
                    effectivePercentage: 25,
                    reason: 'Pre-2017 fossiel (grootvaderregeling)',
                    drempel: null
                };
            } else {
                return {
                    percentage: 22,
                    effectivePercentage: 22,
                    reason: 'Post-2017 fossiel',
                    drempel: null
                };
            }
        }
    }

    /**
     * Parse DET datum voor 60-maanden berekening
     */
    parseDETDate(datumEersteToelating) {
        if (!datumEersteToelating) {
            return new Date(); // Fallback naar nu
        }
        
        const detString = datumEersteToelating.toString();
        
        if (detString.length === 8) {
            // Format: YYYYMMDD
            const year = parseInt(detString.substr(0, 4));
            const month = parseInt(detString.substr(4, 2)) - 1; // Month is 0-indexed
            const day = parseInt(detString.substr(6, 2));
            return new Date(year, month, day);
        }
        
        return new Date(); // Fallback
    }

    /**
     * Check of voertuig waterstof gebruikt
     */
    isWaterstofVehicle(basicData) {
        const brandstofOmschrijving = (basicData.brandstof_omschrijving || '').toLowerCase();
        return brandstofOmschrijving.includes('waterstof') || brandstofOmschrijving.includes('hydrogen');
    }

    /**
     * Bepaal beste brandstofverbruik waarde (NEDC heeft prioriteit)
     */
    getBestConsumptionValue(fuelValue, nedcValue, isInteger = false) {
        const parseValue = (val) => {
            if (!val || val === '' || val === '0') return null;
            return isInteger ? parseInt(val) : parseFloat(val);
        };
        
        const nedcParsed = parseValue(nedcValue);
        const fuelParsed = parseValue(fuelValue);
        
        // NEDC heeft prioriteit
        if (nedcParsed !== null && nedcParsed > 0) {
            return nedcParsed;
        }
        
        return fuelParsed;
    }

    /**
     * LEGACY functie voor backwards compatibility - gebruik calculateCorrectBijtelling
     * @deprecated Use calculateCorrectBijtelling instead
     */
    calculateSimpleBijtelling(basicData, isYoungtimer) {
        console.warn('⚠️ calculateSimpleBijtelling is deprecated - gebruik calculateCorrectBijtelling');
        const detYear = this.extractDETYear(basicData);
        const isOldtimer = (new Date().getFullYear() - detYear) > 30;
        const result = this.calculateCorrectBijtelling(basicData, detYear, isYoungtimer, isOldtimer);
        return typeof result.percentage === 'number' ? result.percentage : result.effectivePercentage;
    }

    /**
     * Bereken MRB (Motorrijtuigenbelasting)
     */
    calculateMRB(basicData, isElektrisch) {
        const massa = parseInt(basicData.massa_ledig_voertuig) || 0;
        
        if (massa === 0) return 0;
        
        let baseMRB = Math.round((massa / 100) * 8);
        
        if (isElektrisch) {
            baseMRB = Math.round(baseMRB * 0.75); // 25% korting
        }
        
        return baseMRB;
    }

    /**
     * Enhanced brandstof detection voor Tesla's en andere EV's
     */
    enhancedBrandstofDetection(basicData) {
        const merk = (basicData.merk || '').toLowerCase();
        const model = (basicData.handelsbenaming || '').toLowerCase();
        
        // Tesla's zijn altijd elektrisch
        if (merk.includes('tesla')) {
            return 'Elektrisch';
        }
        
        // Andere bekende elektrische modellen
        if ((merk.includes('nissan') && model.includes('leaf')) ||
            (merk.includes('bmw') && (model.includes('i3') || model.includes('ix'))) ||
            (merk.includes('volkswagen') && model.includes('id.')) ||
            (merk.includes('audi') && model.includes('e-tron'))) {
            return 'Elektrisch';
        }
        
        return this.normalizeBrandstofType(basicData.brandstof_omschrijving);
    }

    /**
     * Enhanced elektrisch detection
     */
    enhancedElektrischDetection(basicData) {
        const brandstof = this.enhancedBrandstofDetection(basicData);
        return brandstof === 'Elektrisch' || brandstof === 'Waterstof';
    }

    /**
     * Normaliseer brandstoftype
     */
    normalizeBrandstofType(brandstofOmschrijving) {
        if (!brandstofOmschrijving) return 'Onbekend';
        
        const brandstof = brandstofOmschrijving.toLowerCase().trim();
        
        if (brandstof === 'benzine' || brandstof.includes('benzine')) return 'Benzine';
        if (brandstof === 'diesel' || brandstof.includes('diesel')) return 'Diesel';
        if (brandstof.includes('elektr') || brandstof === 'electric') return 'Elektrisch';
        if (brandstof.includes('waterstof') || brandstof.includes('hydrogen')) return 'Waterstof';
        if (brandstof.includes('lpg') || brandstof.includes('autogas')) return 'LPG';
        if (brandstof.includes('cng') || brandstof.includes('aardgas')) return 'CNG';
        if (brandstof.includes('hybride') || brandstof.includes('hybrid')) return 'Hybride';
        
        return 'Onbekend';
    }

    /**
     * Beoordeel kwaliteit van opgevraagde data
     */
    assessDataQuality(basicData, fuelData, consumptionData) {
        let score = 0;
        let maxScore = 7;
        
        if (basicData?.merk) score++;
        if (basicData?.datum_eerste_toelating) score++;
        if (basicData?.massa_ledig_voertuig) score++;
        if (basicData?.catalogusprijs) score++;
        if (basicData?.brandstof_omschrijving) score++;
        
        if (consumptionData?.brandstofverbruik_gecombineerd) {
            score += 2; // NEDC bonus
        } else if (fuelData?.brandstofverbruik_gecombineerd) {
            score += 1;
        }
        
        return Math.round((score / maxScore) * 100);
    }

    /**
     * Valideer kenteken format
     */
    isValidKenteken(kenteken) {
        if (!kenteken || kenteken.length < 6) return false;
        
        const normalized = this.normalizeKenteken(kenteken);
        return /^[A-Z0-9]{6}$/.test(normalized);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 RDW cache cleared');
    }
}

// Global instance
window.rdwApi = new RDWApi();

// Export voor module gebruik
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RDWApi;
}