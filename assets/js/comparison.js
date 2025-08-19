/**
 * Comparison Page JavaScript
 * CHAT #07 FIX: Auto's vergelijken functionality
 */

class ComparisonManager {
    constructor() {
        this.comparisons = [];
        this.init();
    }

    init() {
        this.loadComparisons();
        this.updateComparisonCount();
        this.renderComparisons();
        console.log('🔄 Comparison Manager geïnitialiseerd');
    }

    loadComparisons() {
        try {
            const stored = localStorage.getItem('autoComparisons');
            this.comparisons = stored ? JSON.parse(stored) : [];
            console.log('📊 Vergelijkingen geladen:', this.comparisons.length);
        } catch (error) {
            console.error('Fout bij laden vergelijkingen:', error);
            this.comparisons = [];
        }
    }

    updateComparisonCount() {
        const countElement = document.getElementById('comparison-count');
        if (countElement) {
            countElement.textContent = this.comparisons.length;
        }
    }

    renderComparisons() {
        const container = document.getElementById('comparison-container');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        if (this.comparisons.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Sorteer vergelijkingen op netto kosten (laagste eerst)
        const sortedComparisons = [...this.comparisons].sort((a, b) => {
            const costA = a.calculation?.totaal?.nettoMaand || 9999;
            const costB = b.calculation?.totaal?.nettoMaand || 9999;
            return costA - costB;
        });

        container.innerHTML = `
            <div class="comparison-header">
                <h2>Jouw Auto Vergelijkingen</h2>
                <div class="comparison-actions">
                    <button class="btn btn-secondary" onclick="comparisonManager.clearAll()">
                        🗑️ Wis Alles
                    </button>
                    <button class="btn btn-primary" onclick="comparisonManager.exportAll()">
                        📄 Export Rapport
                    </button>
                </div>
            </div>
            
            <div class="comparison-grid">
                ${sortedComparisons.map((comp, index) => this.renderComparisonCard(comp, index)).join('')}
            </div>
            
            <div class="comparison-summary">
                <h3>📋 Samenvatting</h3>
                <div class="summary-content">
                    <p><strong>Goedkoopste optie:</strong> ${this.getBestOption()}</p>
                    <p><strong>Prijsverschil:</strong> €${this.getPriceDifference()}/maand</p>
                    <p><strong>Totaal vergeleken:</strong> ${this.comparisons.length} opties</p>
                </div>
            </div>
        `;
    }

    renderComparisonCard(comparison, index) {
        const vehicle = comparison.vehicle;
        const calc = comparison.calculation;
        const isFirst = index === 0;
        
        return `
            <div class="comparison-card ${isFirst ? 'best-option' : ''}">
                <div class="card-header">
                    <h4>${comparison.typeName}</h4>
                    ${isFirst ? '<div class="best-badge">💡 Goedkoopste</div>' : ''}
                    <button class="remove-btn" onclick="comparisonManager.removeComparison('${comparison.id}')">
                        ❌
                    </button>
                </div>
                
                <div class="vehicle-info">
                    <h5>${vehicle.merk} ${vehicle.model}</h5>
                    <div class="vehicle-details">
                        <span>📋 ${vehicle.kenteken}</span>
                        <span>📅 ${vehicle.bouwjaar}</span>
                        <span>⛽ ${vehicle.brandstof}</span>
                    </div>
                </div>
                
                <div class="cost-summary">
                    <div class="main-cost">
                        <span class="cost-label">Netto per maand</span>
                        <span class="cost-value">€${calc.totaal.nettoMaand.toLocaleString()}</span>
                    </div>
                    <div class="cost-breakdown">
                        <div class="cost-item">
                            <span>Vaste kosten</span>
                            <span>€${Math.round(calc.vasteKosten.totaal / 12).toLocaleString()}</span>
                        </div>
                        <div class="cost-item">
                            <span>Variabele kosten</span>
                            <span>€${Math.round(calc.variabeleKosten.totaal / 12).toLocaleString()}</span>
                        </div>
                        ${calc.fiscaal ? `
                        <div class="cost-item fiscal">
                            <span>Fiscaal voordeel</span>
                            <span>-€${Math.round(calc.fiscaal.belastingvoordeel / 12).toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="comparisonManager.viewDetails('${comparison.id}')">
                        📊 Details
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="comparisonManager.recalculate('${comparison.type}')">
                        🔄 Herbereken
                    </button>
                </div>
                
                <div class="comparison-timestamp">
                    <small>Berekend: ${new Date(comparison.timestamp).toLocaleDateString('nl-NL')}</small>
                </div>
            </div>
        `;
    }

    getBestOption() {
        if (this.comparisons.length === 0) return 'Geen vergelijkingen';
        
        const sorted = [...this.comparisons].sort((a, b) => {
            const costA = a.calculation?.totaal?.nettoMaand || 9999;
            const costB = b.calculation?.totaal?.nettoMaand || 9999;
            return costA - costB;
        });
        
        return sorted[0].typeName;
    }

    getPriceDifference() {
        if (this.comparisons.length < 2) return '0';
        
        const sorted = [...this.comparisons].sort((a, b) => {
            const costA = a.calculation?.totaal?.nettoMaand || 9999;
            const costB = b.calculation?.totaal?.nettoMaand || 9999;
            return costA - costB;
        });
        
        const cheapest = sorted[0].calculation?.totaal?.nettoMaand || 0;
        const most_expensive = sorted[sorted.length - 1].calculation?.totaal?.nettoMaand || 0;
        
        return Math.round(most_expensive - cheapest).toLocaleString();
    }

    removeComparison(id) {
        if (confirm('Weet je zeker dat je deze vergelijking wilt verwijderen?')) {
            this.comparisons = this.comparisons.filter(comp => comp.id != id);
            this.saveComparisons();
            this.renderComparisons();
            this.updateComparisonCount();
        }
    }

    clearAll() {
        if (confirm('Weet je zeker dat je alle vergelijkingen wilt wissen?')) {
            this.comparisons = [];
            this.saveComparisons();
            this.renderComparisons();
            this.updateComparisonCount();
        }
    }

    saveComparisons() {
        try {
            localStorage.setItem('autoComparisons', JSON.stringify(this.comparisons));
        } catch (error) {
            console.error('Fout bij opslaan vergelijkingen:', error);
        }
    }

    viewDetails(id) {
        const comparison = this.comparisons.find(comp => comp.id == id);
        if (!comparison) return;

        // Toon modal met details
        this.showDetailsModal(comparison);
    }

    showDetailsModal(comparison) {
        const modal = document.createElement('div');
        modal.className = 'details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${comparison.typeName}</h3>
                    <button class="close-btn" onclick="this.closest('.details-modal').remove()">❌</button>
                </div>
                <div class="modal-body">
                    <div class="detail-section">
                        <h4>Voertuig</h4>
                        <p>${comparison.vehicle.merk} ${comparison.vehicle.model} (${comparison.vehicle.bouwjaar})</p>
                        <p>Kenteken: ${comparison.vehicle.kenteken}</p>
                        <p>Brandstof: ${comparison.vehicle.brandstof}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Kosten Breakdown</h4>
                        <div class="detail-costs">
                            <div class="cost-row">
                                <span>Vaste kosten per jaar:</span>
                                <span>€${comparison.calculation.vasteKosten.totaal.toLocaleString()}</span>
                            </div>
                            <div class="cost-row">
                                <span>Variabele kosten per jaar:</span>
                                <span>€${comparison.calculation.variabeleKosten.totaal.toLocaleString()}</span>
                            </div>
                            ${comparison.calculation.fiscaal ? `
                            <div class="cost-row fiscal">
                                <span>Fiscaal voordeel per jaar:</span>
                                <span>-€${comparison.calculation.fiscaal.belastingvoordeel.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            <div class="cost-row total">
                                <span><strong>Netto kosten per jaar:</strong></span>
                                <span><strong>€${comparison.calculation.totaal.nettoJaar.toLocaleString()}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.details-modal').remove()">Sluiten</button>
                    <button class="btn btn-primary" onclick="comparisonManager.recalculate('${comparison.type}')">Herbereken</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    recalculate(optionType) {
        // Redirect naar juiste calculator
        const calculatorUrls = {
            'prive-kopen-zakelijk': '/auto-prive-kopen-en-zakelijk-gebruiken.html'
        };
        
        const url = calculatorUrls[optionType] || '/auto-prive-kopen-en-zakelijk-gebruiken.html';
        window.location.href = url;
    }

    exportAll() {
        alert('Export functionaliteit komt binnenkort beschikbaar!');
        console.log('📄 Export alle vergelijkingen...');
    }
}

// CSS styling
const comparisonStyles = `
<style>
.comparison-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
.comparison-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.comparison-card.best-option { border: 2px solid #10b981; }
.best-badge { background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.main-cost { text-align: center; background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
.cost-value { font-size: 1.5rem; font-weight: 700; color: #2563eb; display: block; }
.details-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; }
</style>
`;

document.head.insertAdjacentHTML('beforeend', comparisonStyles);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.comparisonManager = new ComparisonManager();
    console.log('🚀 Comparison pagina geladen');
});