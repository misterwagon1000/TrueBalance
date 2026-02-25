import { checkProStatus, calculateSpendingTrends, getUnreadAlerts } from '../proFeatures.js';
import { createProBadge, createUpgradePrompt } from '../components/ProBadge.js';

export async function renderAnalysisSection(monthlyData, categorizedData, userId) {
    const container = document.querySelector('[data-section="analysis"]');
    if (!container) return;

    const isPro = await checkProStatus();

    if (!monthlyData || monthlyData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No data available for analysis. Import transactions to get started.</p>
            </div>
        `;
        return;
    }

    const aggregatedData = aggregateAnalysisData(monthlyData);

    container.innerHTML = `
        <div class="analysis-container">
            <h2>Financial Analysis</h2>

            ${!isPro ? createUpgradePrompt(
                'Advanced Insights & Alerts',
                'Get intelligent spending analysis, trend detection, and personalized alerts to stay ahead of your finances.'
            ).outerHTML : ''}

            <div class="analysis-overview-grid">
                <div class="analysis-card">
                    <h3>Income vs Expenses</h3>
                    <div class="income-expense-chart">
                        <div class="income-expense-bar">
                            <div class="income-bar-section" style="width: ${calculateBarWidth(aggregatedData.totalIncome, aggregatedData.totalExpenses)}%">
                                <span>Income: ${formatCurrency(aggregatedData.totalIncome)}</span>
                            </div>
                            <div class="expense-bar-section" style="width: ${100 - calculateBarWidth(aggregatedData.totalIncome, aggregatedData.totalExpenses)}%">
                                <span>Expenses: ${formatCurrency(aggregatedData.totalExpenses)}</span>
                            </div>
                        </div>
                        <div class="net-income-display ${aggregatedData.netChange >= 0 ? 'positive' : 'negative'}">
                            Net: ${formatCurrency(aggregatedData.netChange)}
                        </div>
                    </div>
                </div>

                <div class="analysis-card">
                    <h3>Monthly Averages</h3>
                    <div class="averages-list">
                        <div class="average-item">
                            <span>Income</span>
                            <span class="positive">${formatCurrency(aggregatedData.avgIncome)}</span>
                        </div>
                        <div class="average-item">
                            <span>Expenses</span>
                            <span class="negative">${formatCurrency(aggregatedData.avgExpenses)}</span>
                        </div>
                        <div class="average-item">
                            <span>Net Change</span>
                            <span class="${aggregatedData.avgNet >= 0 ? 'positive' : 'negative'}">${formatCurrency(aggregatedData.avgNet)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analysis-card">
                <h3>Spending by Category</h3>
                <div class="category-analysis">
                    ${renderCategoryBreakdown(aggregatedData.categoryTotals)}
                </div>
            </div>

            <div class="analysis-card">
                <h3>Category Distribution</h3>
                <div class="pie-chart-container">
                    <canvas id="analysis-pie-chart" width="400" height="400"></canvas>
                </div>
            </div>

            <div class="analysis-card">
                <h3>Month-to-Month Comparison</h3>
                <div class="month-comparison">
                    ${renderMonthComparison(monthlyData)}
                </div>
            </div>

            ${renderRecurringCharges(categorizedData)}
        </div>
    `;

    const pieData = aggregatedData.categoryTotals.filter(([cat]) => cat !== 'Income' && cat !== 'Transfers');
    renderPieChartLocal(pieData, 'analysis-pie-chart');
}

function renderPieChartLocal(categoryTotals, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = categoryTotals.reduce((sum, [_, amount]) => sum + amount, 0);
    if (total === 0) return;

    const colors = [
        '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
        '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#a855f7'
    ];

    let currentAngle = -Math.PI / 2;

    categoryTotals.forEach(([category, amount], index) => {
        const sliceAngle = (amount / total) * 2 * Math.PI;
        const color = colors[index % colors.length];

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        const middleAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(middleAngle);
        const labelY = centerY + labelRadius * Math.sin(middleAngle);

        const percentage = ((amount / total) * 100).toFixed(1);
        if (parseFloat(percentage) > 5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, labelX, labelY);
        }

        currentAngle += sliceAngle;
    });

    const legendContainer = document.createElement('div');
    legendContainer.className = 'pie-chart-legend';
    legendContainer.innerHTML = categoryTotals.map(([category, amount], index) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        const color = colors[index % colors.length];
        return `
            <div class="pie-legend-item">
                <span class="pie-legend-color" style="background-color: ${color}; width: 16px; height: 16px; display: inline-block; border-radius: 4px; margin-right: 8px;"></span>
                <span class="pie-legend-label" style="margin-right: 8px;">${category}</span>
                <span class="pie-legend-value">${formatCurrency(amount)} (${percentage}%)</span>
            </div>
        `;
    }).join('');

    const existingLegend = canvas.parentElement.querySelector('.pie-chart-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    canvas.parentElement.appendChild(legendContainer);
}

function aggregateAnalysisData(monthlyData) {
    let totalIncome = 0;
    let totalExpenses = 0;
    const allCategories = {};

    monthlyData.forEach(({ summary }) => {
        totalIncome += summary.totalIncome;
        totalExpenses += summary.totalExpenses;
        summary.categoryTotals.forEach(([cat, amt]) => {
            allCategories[cat] = (allCategories[cat] || 0) + amt;
        });
    });

    const netChange = totalIncome - totalExpenses;
    const avgIncome = totalIncome / monthlyData.length;
    const avgExpenses = totalExpenses / monthlyData.length;
    const avgNet = netChange / monthlyData.length;

    const sortedCategories = Object.entries(allCategories)
        .filter(([cat]) => cat !== 'Income' && cat !== 'Transfers')
        .sort((a, b) => b[1] - a[1]);

    return {
        totalIncome,
        totalExpenses,
        netChange,
        avgIncome,
        avgExpenses,
        avgNet,
        categoryTotals: sortedCategories,
        monthCount: monthlyData.length
    };
}

function renderCategoryBreakdown(categoryTotals) {
    const maxAmount = categoryTotals[0]?.[1] || 1;

    return categoryTotals.map(([category, amount]) => {
        const percentage = (amount / maxAmount) * 100;
        return `
            <div class="category-row">
                <div class="category-info">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">${formatCurrency(amount)}</span>
                </div>
                <div class="category-bar-container">
                    <div class="category-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMonthComparison(monthlyData) {
    return monthlyData.map((month, index) => {
        const prevMonth = index > 0 ? monthlyData[index - 1] : null;
        const changeFromPrev = prevMonth
            ? ((month.summary.totalExpenses - prevMonth.summary.totalExpenses) / prevMonth.summary.totalExpenses) * 100
            : 0;

        return `
            <div class="month-comparison-row">
                <div class="month-name">${formatMonthDisplay(month.month)}</div>
                <div class="month-stats">
                    <span class="month-income positive">${formatCurrency(month.summary.totalIncome)}</span>
                    <span class="month-expenses negative">${formatCurrency(month.summary.totalExpenses)}</span>
                    <span class="month-net ${month.summary.netChange >= 0 ? 'positive' : 'negative'}">${formatCurrency(month.summary.netChange)}</span>
                </div>
                ${prevMonth ? `
                    <div class="month-change ${changeFromPrev > 0 ? 'increased' : 'decreased'}">
                        ${changeFromPrev > 0 ? '▲' : '▼'} ${Math.abs(changeFromPrev).toFixed(1)}%
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderRecurringCharges(categorizedData) {
    const recurring = detectRecurringCharges(categorizedData);

    if (recurring.length === 0) {
        return '';
    }

    return `
        <div class="analysis-card">
            <h3>Recurring Charges Detected</h3>
            <div class="recurring-charges-list">
                ${recurring.map(charge => `
                    <div class="recurring-charge-item">
                        <div class="recurring-charge-name">${charge.description}</div>
                        <div class="recurring-charge-details">
                            <span>${formatCurrency(charge.amount)} × ${charge.count} times</span>
                            <span class="recurring-charge-frequency">${charge.frequency}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function detectRecurringCharges(categorizedData) {
    const merchants = {};

    categorizedData
        .filter(item => item.transaction.amount < 0)
        .forEach(item => {
            const desc = item.transaction.description;
            const amount = Math.abs(item.transaction.amount);

            if (!merchants[desc]) {
                merchants[desc] = [];
            }
            merchants[desc].push({ amount, date: item.transaction.date });
        });

    const recurring = [];

    Object.entries(merchants).forEach(([desc, transactions]) => {
        if (transactions.length >= 2) {
            const amounts = transactions.map(t => t.amount);
            const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;

            if (variance / avgAmount < 0.05) {
                recurring.push({
                    description: desc,
                    amount: avgAmount,
                    count: transactions.length,
                    frequency: 'Monthly'
                });
            }
        }
    });

    return recurring.sort((a, b) => b.amount - a.amount).slice(0, 10);
}

function calculateBarWidth(income, expenses) {
    const total = income + expenses;
    return total > 0 ? (income / total) * 100 : 50;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatMonthDisplay(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}
