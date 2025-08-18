/**
 * Calculator: Auto Privé Kopen + Zakelijk Gebruiken
 * Nederlandse kostencalculatie met €0,23/km aftrek (2025)
 */

class PriveKopenZakelijkCalculator {
    constructor() {
        this.currentVehicleData = null;
        this.currentCalculation = null;
        
        // Nederlandse tarieven 2025
        this.kilometervergoeding = 0.23; // €0,23 per zakelijke kilometer
        
        // Default waarden
        this.defaults = {
            aankoopprijs: 25000,
            restwaarde: 10000,
            eigendomDuur: 5,
            kmPerJaar: 15000,
            zakelijkPercentage: 60,
            brandstofprijs: 1.85,
            verzekeringType: 'allrisk',
            belastingtarief: 37 // Gemiddeld Nederlandse belastingtarief
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeForm();
        console.log('💰 Calculator geïnitialiseerd voor: Auto Privé Kopen + Zakelijk Gebruiken');
    }

    setupEventListeners() {
        // Kenteken lookup - Auto search on input
        const kentekenInput = document.getElementById('kenteken');
        if (kentekenInput) {
            let timeout;
            kentekenInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => this.handleKentekenInput(e.target.value), 500);
            });
        }

        // Lookup button - Manual search trigger
        const lookupBtn = document.getElementById('lookup-btn');
        if (lookupBtn) {
            lookupBtn.addEventListener('click', () => {
                const kenteken = document.getElementById('kenteken')?.value;
                if (kenteken && kenteken.length >= 6) {
                    this.performKentekenLookup(kenteken);
                } else {
                    this.showKentekenError('Voer een geldig kenteken in (minimaal 6 tekens)');
                }
            });
        }

        // Real-time calculation updates
        const calculatorInputs = document.querySelectorAll('.calculator-input input, .calculator-input select');
        calculatorInputs.forEach(input => {
            input.addEventListener('input', () => this.updateCalculation());
            input.addEventListener('change', () => this.updateCalculation());
        });

        // Percentage sliders synchronisatie
        this.setupPercentageSliders();

        // Calculate button
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.performCalculation());
        }
    }

    setupPercentageSliders() {
        const zakelijkSlider = document.getElementById('zakelijk-percentage-slider');
        const zakelijkNumber = document.getElementById('zakelijk-percentage');
        
        if (zakelijkSlider && zakelijkNumber) {
            // Sync slider met number input
            zakelijkSlider.addEventListener('input', (e) => {
                zakelijkNumber.value = e.target.value;
                this.updateKilometerBreakdown();
                this.updateCalculation();
            });
            
            zakelijkNumber.addEventListener('input', (e) => {
                const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                zakelijkSlider.value = value;
                zakelijkNumber.value = value;
                this.updateKilometerBreakdown();
                this.updateCalculation();
            });
        }
    }

    initializeForm() {
        // Vul default waarden in
        this.setFieldValue('aankoopprijs', this.defaults.aankoopprijs);
        this.setFieldValue('restwaarde', this.defaults.restwaarde);
        this.setFieldValue('eigendom-duur', this.defaults.eigendomDuur);
        this.setFieldValue('km-per-jaar', this.defaults.kmPerJaar);
        this.setFieldValue('zakelijk-percentage', this.defaults.zakelijkPercentage);
        this.setFieldValue('zakelijk-percentage-slider', this.defaults.zakelijkPercentage);
        this.setFieldValue('brandstofprijs', this.defaults.brandstofprijs);
        this.setFieldValue('verzekering-type', this.defaults.verzekeringType);
        this.setFieldValue('belastingtarief', this.defaults.belastingtarief);
        
        this.updateKilometerBreakdown();
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    getFieldValue(fieldId, defaultValue = 0) {
        const field = document.getElementById(fieldId);
        if (!field) return defaultValue;
        
        const value = field.type === 'number' ? parseFloat(field.value) || defaultValue : field.value;
        return value;
    }

    async handleKentekenInput(kenteken) {
        if (!kenteken || kenteken.length < 6) {
            this.clearVehicleData();
            return;
        }

        // Auto-lookup alleen bij volledige kentekens (6+ chars)
        if (kenteken.length >= 6) {
            await this.performKentekenLookup(kenteken);
        }
    }

    async performKentekenLookup(kenteken) {
        try {
            this.showKentekenLoading(true);
            
            // RDW lookup via global rdwApi
            if (typeof window.rdwApi === 'undefined') {
                throw new Error('RDW API niet geladen - controleer of rdw-api.js correct is ingeladen');
            }
            
            const vehicleData = await window.rdwApi.getVehicleData(kenteken);
            
            if (vehicleData) {
                this.currentVehicleData = vehicleData;
                this.populateVehicleData(vehicleData);
                this.updateCalculation();
                this.showKentekenSuccess(vehicleData);
            } else {
                this.showKentekenError('Auto niet gevonden in RDW database. Vul de gegevens handmatig in.');
            }
            
        } catch (error) {
            console.error('Kenteken lookup fout:', error);
            this.showKentekenError(`RDW API fout: ${error.message}`);
        } finally {
            this.showKentekenLoading(false);
        }
    }

    populateVehicleData(vehicleData) {
        // Update auto informatie in UI
        this.updateVehicleDisplay(vehicleData);
        
        // Estimate aankoopprijs gebaseerd op leeftijd/type
        const estimatedPrice = this.estimateVehiclePrice(vehicleData);
        if (estimatedPrice > 0) {
            this.setFieldValue('aankoopprijs', estimatedPrice);
        }
        
        // Estimate restwaarde (60% van geschatte waarde na 5 jaar)
        const estimatedResale = Math.round(estimatedPrice * 0.6);
        this.setFieldValue('restwaarde', estimatedResale);
        
        // Update brandstofprijs default gebaseerd op brandstoftype
        const fuelPrice = this.getDefaultFuelPrice(vehicleData.brandstof);
        this.setFieldValue('brandstofprijs', fuelPrice);
    }

    estimateVehiclePrice(vehicleData) {
        // Basis schatting gebaseerd op catalogusprijs en leeftijd
        let basePrice = vehicleData.catalogusprijs || 0;
        
        if (basePrice === 0) {
            // Fallback schatting gebaseerd op merk/type
            basePrice = this.estimatePriceByBrand(vehicleData.merk, vehicleData.bouwjaar);
        }
        
        // Afschrijving gebaseerd op leeftijd
        const ageDepreciation = Math.max(0.2, 1 - (vehicleData.leeftijd * 0.12)); // 12% per jaar, min 20%
        
        return Math.round(basePrice * ageDepreciation);
    }

    estimatePriceByBrand(merk, bouwjaar) {
        // Vereenvoudigde schatting per merk (zou uitgebreider kunnen)
        const brandEstimates = {
            'BMW': 45000,
            'MERCEDES-BENZ': 50000,
            'AUDI': 43000,
            'VOLKSWAGEN': 35000,
            'TOYOTA': 30000,
            'VOLVO': 38000,
            'FORD': 28000,
            'OPEL': 25000,
            'PEUGEOT': 27000,
            'RENAULT': 26000,
            'NISSAN': 29000,
            'HYUNDAI': 25000,
            'KIA': 24000,
            'SKODA': 26000,
            'SEAT': 25000
        };
        
        const currentYear = new Date().getFullYear();
        const basePrice = brandEstimates[merk?.toUpperCase()] || 30000;
        
        // Simpele afschrijving voor schatting
        const age = currentYear - bouwjaar;
        const depreciation = Math.max(0.15, 1 - (age * 0.1));
        
        return Math.round(basePrice * depreciation);
    }

    getDefaultFuelPrice(brandstofType) {
        const fuelPrices = {
            'Benzine': 1.85,
            'Diesel': 1.65,
            'Elektrisch': 0.35, // Per kWh equivalent
            'LPG': 0.85,
            'CNG': 1.25,
            'Hybride': 1.75
        };
        
        return fuelPrices[brandstofType] || 1.75;
    }

    updateVehicleDisplay(vehicleData) {
        // Update vehicle info display
        const vehicleInfo = document.getElementById('vehicle-info');
        if (vehicleInfo) {
            vehicleInfo.innerHTML = `
                <div class="vehicle-card">
                    <h4>${vehicleData.merk} ${vehicleData.handelsbenaming}</h4>
                    <div class="vehicle-details">
                        <span><strong>Kenteken:</strong> ${vehicleData.kenteken}</span>
                        <span><strong>Bouwjaar:</strong> ${vehicleData.bouwjaar}</span>
                        <span><strong>Brandstof:</strong> ${vehicleData.brandstof}</span>
                        <span><strong>Gewicht:</strong> ${vehicleData.gewicht} kg</span>
                        ${vehicleData.isYoungtimer ? '<span class="youngtimer-badge">Youngtimer (35% bijtelling)</span>' : ''}
                    </div>
                </div>
            `;
        }
    }

    updateKilometerBreakdown() {
        const kmPerJaar = this.getFieldValue('km-per-jaar', 15000);
        const zakelijkPercentage = this.getFieldValue('zakelijk-percentage', 60);
        
        const zakelijkeKm = Math.round(kmPerJaar * zakelijkPercentage / 100);
        const priveKm = kmPerJaar - zakelijkeKm;
        
        const breakdown = document.querySelector('.kilometers-breakdown');
        if (breakdown) {
            breakdown.innerHTML = `
                <span>Zakelijk: ${zakelijkeKm.toLocaleString()} km</span>
                <span>Privé: ${priveKm.toLocaleString()} km</span>
            `;
        }
    }

    async performCalculation() {
        try {
            // Gather all input values
            const inputs = this.gatherInputs();
            
            // Perform calculation
            const calculation = this.calculateCosts(inputs);
            
            // Store result
            this.currentCalculation = calculation;
            
            // Update UI
            this.displayResults(calculation);
            
            console.log('💰 Calculatie voltooid:', calculation);
            
        } catch (error) {
            console.error('Calculatie fout:', error);
            this.showCalculationError(error.message);
        }
    }

    gatherInputs() {
        return {
            // Voertuig info
            vehicleData: this.currentVehicleData,
            kenteken: this.getFieldValue('kenteken', ''),
            
            // Financiële parameters
            aankoopprijs: this.getFieldValue('aankoopprijs', this.defaults.aankoopprijs),
            restwaarde: this.getFieldValue('restwaarde', this.defaults.restwaarde),
            eigendomDuur: this.getFieldValue('eigendom-duur', this.defaults.eigendomDuur),
            
            // Gebruik
            kmPerJaar: this.getFieldValue('km-per-jaar', this.defaults.kmPerJaar),
            zakelijkPercentage: this.getFieldValue('zakelijk-percentage', this.defaults.zakelijkPercentage),
            
            // Kosten
            brandstofprijs: this.getFieldValue('brandstofprijs', this.defaults.brandstofprijs),
            verzekeringType: this.getFieldValue('verzekering-type', this.defaults.verzekeringType),
            
            // Belasting
            belastingtarief: this.getFieldValue('belastingtarief', this.defaults.belastingtarief)
        };
    }

    calculateCosts(inputs) {
        const zakelijkeKmPerJaar = inputs.kmPerJaar * inputs.zakelijkPercentage / 100;
        const priveKmPerJaar = inputs.kmPerJaar - zakelijkeKmPerJaar;
        
        // 1. VASTE KOSTEN PER JAAR
        const afschrijving = (inputs.aankoopprijs - inputs.restwaarde) / inputs.eigendomDuur;
        const verzekering = this.calculateInsurance(inputs);
        const mrb = this.calculateMRBCost(inputs);
        const apk = inputs.vehicleData?.leeftijd > 3 ? 50 : 0; // APK vanaf 4 jaar
        const onderhoud = this.calculateMaintenance(inputs);
        
        const vasteKostenPerJaar = afschrijving + verzekering + mrb + apk + onderhoud;
        
        // 2. VARIABELE KOSTEN PER JAAR
        const brandstofKosten = this.calculateFuelCosts(inputs);
        const banden = Math.round(inputs.kmPerJaar / 50000 * 800); // €800 per set, elke 50.000km
        const reparaties = this.calculateRepairCosts(inputs);
        
        const variabeleKostenPerJaar = brandstofKosten + banden + reparaties;
        
        // 3. TOTALE KOSTEN
        const totaleKostenPerJaar = vasteKostenPerJaar + variabeleKostenPerJaar;
        const totaleKostenPerMaand = totaleKostenPerJaar / 12;
        
        // 4. FISCAAL VOORDEEL (€0,23 per zakelijke kilometer)
        const kilometervergoedingPerJaar = zakelijkeKmPerJaar * this.kilometervergoeding;
        const belastingvoordeel = kilometervergoedingPerJaar * (inputs.belastingtarief / 100);
        
        // 5. NETTO KOSTEN (na aftrek)
        const nettoKostenPerJaar = totaleKostenPerJaar - belastingvoordeel;
        const nettoKostenPerMaand = nettoKostenPerJaar / 12;
        const nettoKostenPerKm = nettoKostenPerJaar / inputs.kmPerJaar;
        
        return {
            // Input samenvatting
            inputs: inputs,
            
            // Kosten breakdown
            vasteKosten: {
                afschrijving: Math.round(afschrijving),
                verzekering: Math.round(verzekering),
                mrb: Math.round(mrb),
                apk: apk,
                onderhoud: Math.round(onderhoud),
                totaal: Math.round(vasteKostenPerJaar)
            },
            
            variabeleKosten: {
                brandstof: Math.round(brandstofKosten),
                banden: banden,
                reparaties: Math.round(reparaties),
                totaal: Math.round(variabeleKostenPerJaar)
            },
            
            // Fiscaal
            fiscaal: {
                zakelijkeKmPerJaar: Math.round(zakelijkeKmPerJaar),
                kilometervergoeding: Math.round(kilometervergoedingPerJaar),
                belastingvoordeel: Math.round(belastingvoordeel),
                tarief: inputs.belastingtarief
            },
            
            // Totalen
            totaal: {
                bruttoJaar: Math.round(totaleKostenPerJaar),
                bruttoMaand: Math.round(totaleKostenPerMaand),
                nettoJaar: Math.round(nettoKostenPerJaar),
                nettoMaand: Math.round(nettoKostenPerMaand),
                nettoPerKm: Math.round(nettoKostenPerKm * 100) / 100
            },
            
            // Metadata
            calculationDate: new Date().toISOString(),
            method: 'prive-kopen-zakelijk-gebruiken'
        };
    }

    calculateInsurance(inputs) {
        const baseInsurance = {
            'wa': 600,
            'wa-plus': 800,
            'allrisk': 1200
        };
        
        const base = baseInsurance[inputs.verzekeringType] || 800;
        
        // Adjust gebaseerd op waarde auto
        const valueFactor = Math.min(2.0, inputs.aankoopprijs / 25000);
        
        return base * valueFactor;
    }

    calculateMRBCost(inputs) {
        if (inputs.vehicleData?.mrb) {
            return inputs.vehicleData.mrb * 12; // MRB per maand → per jaar
        }
        
        // Fallback schatting
        const gewicht = inputs.vehicleData?.gewicht || 1500;
        return Math.round((gewicht / 100) * 8 * 12); // €8 per 100kg per maand
    }

    calculateMaintenance(inputs) {
        // Onderhoud gebaseerd op leeftijd en kilometers
        const baseKosten = 800; // Basis onderhoud per jaar
        const leeftijd = inputs.vehicleData?.leeftijd || 5;
        const kmFactor = inputs.kmPerJaar / 15000; // Factor voor hoge kilometrage
        
        const leeftijdFactor = 1 + (leeftijd * 0.1); // 10% extra per jaar
        
        return baseKosten * leeftijdFactor * kmFactor;
    }

    calculateFuelCosts(inputs) {
        // Brandstofkosten gebaseerd op verbruik of schatting
        let verbruik = 7.0; // Default l/100km
        
        if (inputs.vehicleData?.verbruikGemengd) {
            verbruik = inputs.vehicleData.verbruikGemengd;
        } else if (inputs.vehicleData?.brandstof === 'Elektrisch') {
            verbruik = 20; // kWh/100km voor elektrisch
        }
        
        const kmPerJaar = inputs.kmPerJaar;
        const brandstofPerJaar = (kmPerJaar / 100) * verbruik;
        
        return brandstofPerJaar * inputs.brandstofprijs;
    }

    calculateRepairCosts(inputs) {
        // Reparatiekosten gebaseerd op leeftijd
        const leeftijd = inputs.vehicleData?.leeftijd || 5;
        const baseReparaties = 300; // Basis per jaar
        
        // Exponentiële toename na 5 jaar
        const leeftijdFactor = leeftijd > 5 ? Math.pow(1.2, leeftijd - 5) : 1;
        
        return baseReparaties * leeftijdFactor;
    }

    displayResults(calculation) {
        const resultsContainer = document.getElementById('results-container');
        const placeholder = document.getElementById('results-placeholder');
        
        if (!resultsContainer) return;
        
        // Hide placeholder, show results
        if (placeholder) placeholder.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        resultsContainer.innerHTML = `
            <div class="results-content">
                <h3>💰 Kostencalculatie Resultaat</h3>
                
                <div class="results-summary">
                    <div class="cost-highlight">
                        <div class="cost-label">Netto kosten per maand</div>
                        <div class="cost-value">€${calculation.totaal.nettoMaand.toLocaleString()}</div>
                        <div class="cost-detail">€${calculation.totaal.nettoPerKm} per kilometer</div>
                    </div>
                </div>
                
                <div class="results-breakdown">
                    <div class="cost-section">
                        <h4>Vaste Kosten (${calculation.vasteKosten.totaal.toLocaleString()}/jaar)</h4>
                        <div class="cost-items">
                            <div class="cost-item">
                                <span>Afschrijving</span>
                                <span>€${calculation.vasteKosten.afschrijving.toLocaleString()}</span>
                            </div>
                            <div class="cost-item">
                                <span>Verzekering</span>
                                <span>€${calculation.vasteKosten.verzekering.toLocaleString()}</span>
                            </div>
                            <div class="cost-item">
                                <span>MRB</span>
                                <span>€${calculation.vasteKosten.mrb.toLocaleString()}</span>
                            </div>
                            <div class="cost-item">
                                <span>Onderhoud</span>
                                <span>€${calculation.vasteKosten.onderhoud.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cost-section">
                        <h4>Variabele Kosten (${calculation.variabeleKosten.totaal.toLocaleString()}/jaar)</h4>
                        <div class="cost-items">
                            <div class="cost-item">
                                <span>Brandstof</span>
                                <span>€${calculation.variabeleKosten.brandstof.toLocaleString()}</span>
                            </div>
                            <div class="cost-item">
                                <span>Banden</span>
                                <span>€${calculation.variabeleKosten.banden.toLocaleString()}</span>
                            </div>
                            <div class="cost-item">
                                <span>Reparaties</span>
                                <span>€${calculation.variabeleKosten.reparaties.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cost-section fiscal-benefit">
                        <h4>💡 Fiscaal Voordeel</h4>
                        <div class="cost-items">
                            <div class="cost-item">
                                <span>Zakelijke kilometers</span>
                                <span>${calculation.fiscaal.zakelijkeKmPerJaar.toLocaleString()} km</span>
                            </div>
                            <div class="cost-item">
                                <span>Kilometervergoeding (€0,23/km)</span>
                                <span>€${calculation.fiscaal.kilometervergoeding.toLocaleString()}</span>
                            </div>
                            <div class="cost-item highlight">
                                <span>Belastingvoordeel (${calculation.fiscaal.tarief}%)</span>
                                <span>-€${calculation.fiscaal.belastingvoordeel.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="results-footer">
                    <button class="btn btn-primary" onclick="calculator.exportResults()">
                        📄 Download Rapport
                    </button>
                    <button class="btn btn-secondary" onclick="calculator.shareResults()">
                        📤 Deel Resultaat
                    </button>
                </div>
            </div>
        `;
        
        // Scroll to results on mobile
        if (window.innerWidth <= 768) {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // UI Helper functies
    showKentekenLoading(show) {
        const button = document.getElementById('lookup-btn');
        const spinner = document.getElementById('lookup-spinner');
        const text = document.getElementById('lookup-text');
        
        if (button) {
            button.disabled = show;
            
            if (spinner && text) {
                spinner.style.display = show ? 'inline' : 'none';
                text.textContent = show ? 'Opzoeken...' : 'Opzoeken';
            } else {
                button.textContent = show ? '🔄 Bezig...' : '🔍 Opzoeken';
            }
        }
    }

    showKentekenSuccess(vehicleData) {
        // Implementatie voor success feedback
        console.log('✅ Kenteken gevonden:', vehicleData.kenteken);
    }

    showKentekenError(message) {
        console.error('❌ Kenteken fout:', message);
        
        // Show error in UI
        const vehicleInfo = document.getElementById('vehicle-info');
        if (vehicleInfo) {
            vehicleInfo.innerHTML = `
                <div class="error-message">
                    <h4>❌ RDW Lookup Fout</h4>
                    <p>${message}</p>
                    <small>Vul de gegevens handmatig in om door te gaan.</small>
                </div>
            `;
        }
        
        // Reset button state
        this.showKentekenLoading(false);
    }

    clearVehicleData() {
        this.currentVehicleData = null;
        const vehicleInfo = document.getElementById('vehicle-info');
        if (vehicleInfo) {
            vehicleInfo.innerHTML = '';
        }
    }

    updateCalculation() {
        // Real-time update (debounced)
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.performCalculation();
        }, 1000);
    }

    showCalculationError(message) {
        const resultsContainer = document.querySelector('.calculator-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h4>❌ Calculatie Fout</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    exportResults() {
        if (!this.currentCalculation) return;
        
        // Implementatie voor PDF export
        console.log('📄 Exporteren naar PDF...');
    }

    shareResults() {
        if (!this.currentCalculation) return;
        
        // Implementatie voor delen via URL/email
        console.log('📤 Resultaat delen...');
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new PriveKopenZakelijkCalculator();
    console.log('🚀 Calculator pagina geladen en geïnitialiseerd');
});