// js/comparacion.js

let comparisonChart = null;
const strategiesContainer = document.getElementById('strategies-container');
const addStrategyButton = document.getElementById('add-strategy');
const summaryTableContainer = document.getElementById('summary-table-container');

let nextStrategyId = 1;
const MAX_STRATEGIES = 3;
let strategies = [];

// Color palette for the comparison chart
const COLORS = [
    '#1a73e8', // Primary Blue
    '#34a853', // Green
    '#f9ab00'  // Yellow/Orange
];

// --- Chart Initialization ---

function initChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor Acumulado'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            // Use settings currency
                            const currency = settings.getSettings(auth.getSessionEmail() || 'default').currency;
                            label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// --- Financial Model Core Logic ---

/**
 * Runs the investment simulation for a single strategy.
 * @param {Object} strategy - The strategy parameters.
 * @returns {Object} The simulation results (labels and data array).
 */
function runComparisonSimulation(strategy) {
    const {
        name, initialCapital, monthlyContribution, annualReturn, timeframe, isCompound
    } = strategy;

    const monthlyReturnRate = isCompound ? (Math.pow(1 + annualReturn / 100, 1/12) - 1) : (annualReturn / 100 / 12);
    const totalMonths = timeframe * 12;

    let currentCapital = initialCapital;
    const nominalData = [];
    const labels = [];
    let totalContributions = initialCapital;

    for (let month = 0; month <= totalMonths; month++) {
        // Only record data at the end of each year
        if (month % 12 === 0) {
            const year = month / 12;
            labels.push(`Año ${year}`);
            nominalData.push(currentCapital);
        }

        if (month === totalMonths) break;

        // Apply Investment Return
        currentCapital *= (1 + monthlyReturnRate);
        
        // Add Monthly Contribution
        currentCapital += monthlyContribution;

        // Track total contributions
        if (month > 0) {
            totalContributions += monthlyContribution;
        }
    }

    const finalValue = nominalData[nominalData.length - 1];
    const totalGains = finalValue - totalContributions;
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const cagr = (Math.pow(finalValue / initialCapital, 1 / timeframe) - 1) * 100;

    return { 
        name, 
        labels, 
        data: nominalData, 
        totalContributions, 
        finalValue, 
        totalGains,
        cagr: isNaN(cagr) ? 0 : cagr
    };
}

// --- UI and Data Handling ---

function renderStrategies() {
    strategiesContainer.innerHTML = '';
    strategies.forEach((strategy, index) => {
        const html = `
            <div class="strategy-card" data-id="${strategy.id}">
                <h4>
                    <span style="color: ${COLORS[index % COLORS.length]}">${strategy.name || `Estrategia ${strategy.id}`}</span>
                    <button class="remove-strategy" data-id="${strategy.id}">&times;</button>
                </h4>
                <div class="form-group">
                    <label for="name-${strategy.id}">Nombre</label>
                    <input type="text" id="name-${strategy.id}" value="${strategy.name}" data-field="name">
                </div>
                <div class="form-group">
                    <label for="initialCapital-${strategy.id}">Capital Inicial</label>
                    <input type="number" id="initialCapital-${strategy.id}" value="${strategy.initialCapital}" data-field="initialCapital" min="0">
                </div>
                <div class="form-group">
                    <label for="monthlyContribution-${strategy.id}">Contribución Mensual</label>
                    <input type="number" id="monthlyContribution-${strategy.id}" value="${strategy.monthlyContribution}" data-field="monthlyContribution" min="0">
                </div>
                <div class="form-group">
                    <label for="annualReturn-${strategy.id}">Retorno Anual Esperado (%)</label>
                    <input type="number" id="annualReturn-${strategy.id}" value="${strategy.annualReturn}" data-field="annualReturn" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label for="timeframe-${strategy.id}">Horizonte de Tiempo (Años)</label>
                    <input type="number" id="timeframe-${strategy.id}" value="${strategy.timeframe}" data-field="timeframe" min="1" max="60">
                </div>
            </div>
        `;
        strategiesContainer.insertAdjacentHTML('beforeend', html);
    });

    // Update button state
    addStrategyButton.disabled = strategies.length >= MAX_STRATEGIES;

    // Attach event listeners to new elements
    strategiesContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateStrategyFromInput);
    });
    strategiesContainer.querySelectorAll('.remove-strategy').forEach(button => {
        button.addEventListener('click', removeStrategy);
    });

    calculateAndRenderComparison();
}

function addStrategy() {
    if (strategies.length >= MAX_STRATEGIES) return;
    
    // Get default settings
    const s = settings.getSettings(auth.getSessionEmail() || 'default');
    
    const newStrategy = {
        id: nextStrategyId++,
        name: `Estrategia ${nextStrategyId - 1}`,
        initialCapital: 1000,
        monthlyContribution: 100,
        annualReturn: s.defaultRiskPreset === 'conservative' ? 4 : s.defaultRiskPreset === 'aggressive' ? 12 : 8,
        timeframe: s.defaultTimeHorizon,
        isCompound: s.compoundInterest
    };
    strategies.push(newStrategy);
    renderStrategies();
}

function removeStrategy(e) {
    const id = parseInt(e.target.dataset.id);
    strategies = strategies.filter(s => s.id !== id);
    renderStrategies();
}

function updateStrategyFromInput(e) {
    const input = e.target;
    const id = parseInt(input.closest('.strategy-card').dataset.id);
    const field = input.dataset.field;
    const value = input.type === 'number' ? parseFloat(input.value) : input.value;

    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
        strategy[field] = value;
        calculateAndRenderComparison();
    }
}

function calculateAndRenderComparison() {
    const results = strategies.map((strategy, index) => {
        // Ensure the latest settings are used for compound interest
        const s = settings.getSettings(auth.getSessionEmail() || 'default');
        strategy.isCompound = s.compoundInterest;
        return runComparisonSimulation(strategy);
    });

    updateChartComparison(results);
    renderSummaryTable(results);
}

function updateChartComparison(results) {
    const currency = settings.getSettings(auth.getSessionEmail() || 'default').currency;
    
    comparisonChart.data.labels = results.length > 0 ? results[0].labels : [];
    comparisonChart.data.datasets = results.map((res, index) => ({
        label: res.name,
        data: res.data,
        borderColor: COLORS[index % COLORS.length],
        backgroundColor: COLORS[index % COLORS.length] + '1A', // 10% opacity
        fill: false,
        tension: 0.3
    }));

    comparisonChart.options.scales.y.title.text = `Valor Acumulado (${currency})`;
    comparisonChart.update();
}

function renderSummaryTable(results) {
    if (results.length === 0) {
        summaryTableContainer.innerHTML = '';
        return;
    }

    const currency = settings.getSettings(auth.getSessionEmail() || 'default').currency;
    const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency });
    
    let tableHTML = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Estrategia</th>
                    <th>Valor Final</th>
                    <th>Contribuciones Totales</th>
                    <th>Ganancias Totales</th>
                    <th>CAGR (%)</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(res => {
        tableHTML += `
            <tr>
                <td>${res.name}</td>
                <td>${formatter.format(res.finalValue)}</td>
                <td>${formatter.format(res.totalContributions)}</td>
                <td>${formatter.format(res.totalGains)}</td>
                <td>${res.cagr.toFixed(2)}%</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    summaryTableContainer.innerHTML = tableHTML;
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    addStrategy(); // Start with one default strategy
});

addStrategyButton.addEventListener('click', addStrategy);
