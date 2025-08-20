/**
 * RDW API Integration - v1.11 (RESTORED)
 * Nederlandse RDW Open Data API voor voertuiggegevens lookup
 * Gratis API, geen key nodig
 * ZONDER de problematische v1.12 60-maanden complexity
 */

class RDWApi {
    constructor() {
        this.baseUrl = 'https://opendata.rdw.nl';
        this.rateLimitDelay = 100; // 100ms tussen requests
        this.lastRequestTime = 0;
        this.cache = new Map(); // Cache voor voertuiggegevens
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
            
            // Brandstof en milieu - Enhanced Tesla Detection
            brandstof: this.enhancedBrandstofDetection(basicData),
            isElektrisch: this.enhancedElektrischDetection(basicData),
            
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
            
            // Fiscale informatie - SIMPLIFIED v1.11 bijtelling (without 60-months complexity)
            catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : null,
            bpm: basicData.bpm ? parseInt(basicData.bpm) : 0,
            bijtellingspercentage: this.calculateSimpleBijtelling(basicData, isYoungtimer),
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
     * Vereenvoudigde bijtelling berekening - v1.11 (ZONDER 60-maanden complexity)
     * Implementeert Nederlandse regels 2025 zonder de problematische edge cases
     */
    calculateSimpleBijtelling(basicData, isYoungtimer) {
        if (isYoungtimer) {
            return 35; // Youngtimers: 35% over dagwaarde
        }

        const isElektrisch = this.enhancedElektrischDetection(basicData);
        const catalogusprijs = parseInt(basicData.catalogusprijs) || 0;
        
        // Pre-2017 auto's behouden 25%
        const bouwjaar = parseInt(basicData.datum_eerste_toelating?.substr(0, 4) || 0);
        if (bouwjaar < 2017) {
            return 25;
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
        const isElektrisch = this.enhancedElektrischDetection(basicData);
        
        if (massa === 0) return 0;
        
        let baseMRB = Math.round((massa / 100) * 8);
        
        if (isElektrisch) {
            baseMRB = Math.round(baseMRB * 0.75); // 25% korting
        }
        
        return baseMRB;
    }

    /**
     * Enhanced brandstof detection voor Tesla's
     */
    enhancedBrandstofDetection(basicData) {
        const merk = basicData.merk?.toLowerCase() || '';
        const model = basicData.handelsbenaming?.toLowerCase() || '';
        
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