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
     * Hoofdfunctie: Haal voertuiggegevens op via kenteken
     * @param {string} kenteken - Nederlands kenteken (XX-XX-XX format)
     * @returns {Promise<Object>} Voertuiggegevens of null bij fout
     */
    async getVehicleData(kenteken) {
        if (!kenteken || kenteken.length < 6) {
            throw new Error('Kenteken is te kort of ongeldig');
        }

        // Kenteken normaliseren (uppercase, streepjes verwijderen)
        const normalizedKenteken = this.normalizeKenteken(kenteken);
        
        // Check cache eerst
        if (this.cache.has(normalizedKenteken)) {
            console.log('🎯 RDW data uit cache:', normalizedKenteken);
            return this.cache.get(normalizedKenteken);
        }

        // Rate limiting respecteren
        await this.respectRateLimit();

        try {
            console.log('🔍 RDW API lookup voor:', normalizedKenteken);
            
            // Parallel requests voor verschillende datasets
            const [basicData, fuelData, recallData] = await Promise.allSettled([
                this.fetchBasicVehicleData(normalizedKenteken),
                this.fetchFuelData(normalizedKenteken),
                this.fetchRecallData(normalizedKenteken)
            ]);

            // Combineer resultaten
            const vehicleData = this.combineVehicleData(
                basicData.status === 'fulfilled' ? basicData.value : null,
                fuelData.status === 'fulfilled' ? fuelData.value : null,
                recallData.status === 'fulfilled' ? recallData.value : null,
                normalizedKenteken
            );

            // Cache resultaat (5 minuten)
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
            return null; // Niet kritiek, kan missen
        }
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
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
    combineVehicleData(basicData, fuelData, recallData, kenteken) {
        if (!basicData) {
            return null; // Geen basis data = geen auto gevonden
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
            
            // Brandstof en milieu
            brandstof: this.normalizeBrandstofType(basicData.brandstof_omschrijving),
            isElektrisch: this.isElektrischVoertuig(basicData.brandstof_omschrijving),
            
            // Brandstofgegevens (indien beschikbaar)
            verbruikStad: fuelData?.brandstofverbruik_stad ? parseFloat(fuelData.brandstofverbruik_stad) : null,
            verbruikSnelweg: fuelData?.brandstofverbruik_buiten ? parseFloat(fuelData.brandstofverbruik_buiten) : null,
            verbruikGemengd: fuelData?.brandstofverbruik_gecombineerd ? parseFloat(fuelData.brandstofverbruik_gecombineerd) : null,
            co2Uitstoot: fuelData?.co2_uitstoot_gecombineerd ? parseInt(fuelData.co2_uitstoot_gecombineerd) : null,
            
            // Fiscale informatie
            catalogusprijs: basicData.catalogusprijs ? parseInt(basicData.catalogusprijs) : null,
            bpm: basicData.bpm ? parseInt(basicData.bpm) : 0,
            
            // Nederlandse belasting regels 2025
            bijtellingspercentage: this.getBijtellingspercentage(basicData, isYoungtimer),
            mrb: this.calculateMRB(basicData),
            
            // Extra informatie
            hasRecalls: recallData && recallData.length > 0,
            recalls: recallData || [],
            
            // API metadata
            dataQuality: this.assessDataQuality(basicData, fuelData),
            lastUpdated: new Date().toISOString()
        };
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
     * Normaliseer brandstoftype - CHAT #07 FIX
     * Verbeterde mapping voor betere RDW data parsing
     */
    normalizeBrandstofType(brandstofOmschrijving) {
        if (!brandstofOmschrijving) return 'Onbekend';
        
        const brandstof = brandstofOmschrijving.toLowerCase().trim();
        
        // Exact matches eerst (RDW gebruikt specifieke termen)
        if (brandstof === 'benzine' || brandstof === 'euro 95 benzine' || brandstof === 'super benzine') return 'Benzine';
        if (brandstof === 'diesel' || brandstof === 'gasolie') return 'Diesel';
        if (brandstof === 'elektriciteit' || brandstof === 'elektrisch') return 'Elektrisch';
        if (brandstof === 'waterstof') return 'Waterstof';
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
        
        // Elektrische varianten
        if (brandstof.includes('elektr') || brandstof.includes('ev') || brandstof.includes('battery')) return 'Elektrisch';
        
        // Alternatieve brandstoffen
        if (brandstof.includes('lpg') || brandstof.includes('autogas') || brandstof.includes('gas')) return 'LPG';
        if (brandstof.includes('cng') || brandstof.includes('aardgas') || brandstof.includes('methaan')) return 'CNG';
        if (brandstof.includes('waterstof') || brandstof.includes('hydrogen') || brandstof.includes('h2')) return 'Waterstof';
        
        // Log onbekende brandstoftypes voor debugging
        console.warn('🔥 Onbekend brandstoftype gevonden:', brandstofOmschrijving);
        
        // Fallback naar 'Benzine' voor de meeste onbekende types (meest voorkomend)
        return brandstofOmschrijving.length > 20 ? 'Benzine' : brandstofOmschrijving;
    }

    /**
     * Beoordeel kwaliteit van opgevraagde data
     */
    assessDataQuality(basicData, fuelData) {
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
        
        // Brandstofgegevens (bonus)
        maxScore += 1;
        if (fuelData?.brandstofverbruik_gecombineerd) score++;
        
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