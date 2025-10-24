// js/proyeccion.js

// Import settings for defaults
// window.settings is available via script tag

let projectionChart = null;
const form = document.getElementById('projection-form');
const exportButton = document.getElementById('export-csv');

// --- Chart Initialization ---

function initChart() {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Valor Acumulado (Nominal)',
                data: [],
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                fill: true,
                tension: 0.3
            }]
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
 * Runs the financial projection simulation.
 * @param {Object} params - The simulation parameters.
 * @returns {Object} The simulation results (labels and data array).
 */
function runProjection(params) {
    const {
        salary, expenses, capital, annualReturn, annualInflation, annualGrowth, horizon, isRealView, isCompound
    } = params;

    const monthlyReturnRate = isCompound ? (Math.pow(1 + annualReturn / 100, 1/12) - 1) : (annualReturn / 100 / 12);
    const monthlyInflationRate = Math.pow(1 + annualInflation / 100, 1/12) - 1;
    const monthlyGrowthRate = Math.pow(1 + annualGrowth / 100, 1/12) - 1;
    const totalMonths = horizon * 12;

    let currentCapital = capital;
    let currentSalary = salary;
    let currentExpenses = expenses;

    const labels = [];
    const nominalData = [];
    const realData = [];
    let totalContributions = capital;

    for (let month = 0; month <= totalMonths; month++) {
        // Only record data at the end of each year
        if (month % 12 === 0) {
            const year = month / 12;
            labels.push(`Año ${year}`);
            nominalData.push(currentCapital);
            
            // Calculate real value (adjusted for inflation)
            const realCapital = currentCapital / Math.pow(1 + monthlyInflationRate, month);
            realData.push(realCapital);
        }

        if (month === totalMonths) break;

        // Monthly Savings
        const monthlySavings = currentSalary - currentExpenses;
        
        // Apply Investment Return
        currentCapital *= (1 + monthlyReturnRate);
        
        // Add Savings
        currentCapital += monthlySavings;

        // Track total contributions for CSV export
        if (month > 0) {
            totalContributions += monthlySavings;
        }

        // Apply Annual Salary/Expense Growth (at the end of the year)
        if ((month + 1) % 12 === 0) {
            currentSalary *= (1 + annualGrowth / 100);
            // Assuming expenses grow with inflation for simplicity in this model
            currentExpenses *= (1 + annualInflation / 100);
        }
    }

    return { labels, nominalData, realData, totalContributions };
}

// --- UI and Data Handling ---

function updateChart(results, isRealView) {
    const currency = settings.getSettings(auth.getSessionEmail() || 'default').currency;
    const data = isRealView ? results.realData : results.nominalData;
    const label = isRealView ? 'Valor Acumulado (Real)' : 'Valor Acumulado (Nominal)';

    projectionChart.data.labels = results.labels;
    projectionChart.data.datasets[0].data = data;
    projectionChart.data.datasets[0].label = label;
    projectionChart.options.scales.y.title.text = `Valor Acumulado (${currency})`;
    
    projectionChart.update();
}

function getFormParameters() {
    const s = settings.getSettings(auth.getSessionEmail() || 'default');
    
    return {
        salary: parseFloat(document.getElementById('salary').value) || 0,
        expenses: parseFloat(document.getElementById('expenses').value) || 0,
        capital: parseFloat(document.getElementById('capital').value) || 0,
        annualReturn: parseFloat(document.getElementById('return').value) || 0,
        annualInflation: parseFloat(document.getElementById('inflation').value) || 0,
        annualGrowth: parseFloat(document.getElementById('growth').value) || 0,
        horizon: parseInt(document.getElementById('horizon').value) || 1,
        isRealView: document.getElementById('view-toggle').value === 'real',
        isCompound: s.compoundInterest // Use setting for compound interest
    };
}

let lastResults = null;

function calculateAndRender() {
    const params = getFormParameters();
    lastResults = runProjection(params);
    updateChart(lastResults, params.isRealView);
}

function applyPreset(presetName) {
    let returnRate, growthRate;
    switch (presetName) {
        case 'conservative':
            returnRate = 4;
            growthRate = 1;
            break;
        case 'moderate':
            returnRate = 8;
            growthRate = 2;
            break;
        case 'aggressive':
            returnRate = 12;
            growthRate = 3;
            break;
        default:
            return; // Don't change custom
    }

    document.getElementById('return').value = returnRate;
    document.getElementById('growth').value = growthRate;
    calculateAndRender();
}

// --- Event Listeners ---

form.addEventListener('input', (e) => {
    if (e.target.id !== 'preset') {
        document.getElementById('preset').value = 'custom';
        calculateAndRender();
    }
});

document.getElementById('preset').addEventListener('change', (e) => {
    applyPreset(e.target.value);
});

document.getElementById('view-toggle').addEventListener('change', calculateAndRender);

exportButton.addEventListener('click', () => {
    if (!lastResults) return;

    const currency = settings.getSettings(auth.getSessionEmail() || 'default').currency;
    const header = `Año,Valor Nominal (${currency}),Valor Real (${currency})\n`;
    
    let csvContent = header;
    for (let i = 0; i < lastResults.labels.length; i++) {
        csvContent += `${i},${lastResults.nominalData[i].toFixed(2)},${lastResults.realData[i].toFixed(2)}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "proyeccion_financiera.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Set initial values from settings
    const s = settings.getSettings(auth.getSessionEmail() || 'default');
    document.getElementById('horizon').value = s.defaultTimeHorizon;
    document.getElementById('preset').value = s.defaultRiskPreset;
    
    initChart();
    applyPreset(s.defaultRiskPreset); // Apply the preset to set initial return/growth rates
    calculateAndRender();
});
