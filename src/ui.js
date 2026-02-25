export function renderReport(summary, categorizedData) {
    document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(summary.totalExpenses);

    const netChangeEl = document.getElementById('net-change');
    netChangeEl.textContent = formatCurrency(summary.netChange);
    netChangeEl.parentElement.classList.remove('positive', 'negative');
    netChangeEl.parentElement.classList.add(summary.netChange >= 0 ? 'positive' : 'negative');

    renderCategoryChart(summary.categoryTotals);

    populateCategoryFilter(summary.categoryTotals);

    renderTransactionTable(categorizedData);
}

export function renderMonthlyReport(monthlyData) {
    const reportContainer = document.getElementById('report-container');

    if (monthlyData.length === 1) {
        const { summary, transactions } = monthlyData[0];
        renderReport(summary, transactions);
        return;
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    let allCategories = {};

    monthlyData.forEach(({ summary }) => {
        totalIncome += summary.totalIncome;
        totalExpenses += summary.totalExpenses;
        summary.categoryTotals.forEach(([cat, amt]) => {
            allCategories[cat] = (allCategories[cat] || 0) + amt;
        });
    });

    const overallNetChange = totalIncome - totalExpenses;
    const sortedCategories = Object.entries(allCategories).sort((a, b) => b[1] - a[1]);

    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);

    const netChangeEl = document.getElementById('net-change');
    netChangeEl.textContent = formatCurrency(overallNetChange);
    netChangeEl.parentElement.classList.remove('positive', 'negative');
    netChangeEl.parentElement.classList.add(overallNetChange >= 0 ? 'positive' : 'negative');

    renderCategoryChart(sortedCategories);
    renderPieChart(sortedCategories);
    populateCategoryFilter(sortedCategories);

    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = monthlyData.map(({ month, transactions, summary }) => `
        <tr class="month-separator">
            <td colspan="4" style="background: var(--color-bg-secondary); padding: 1rem; font-weight: 600; color: var(--color-primary);">
                ${formatMonthDisplay(month)} - ${formatCurrency(summary.netChange)} net change (${transactions.length} transactions)
            </td>
        </tr>
        ${transactions.filter(item => item && item.transaction && typeof item.transaction.amount !== 'undefined').map(item => {
            const isExpense = item.transaction.amount < 0;
            const amountClass = isExpense ? 'negative' : 'positive';
            const sign = isExpense ? '-' : '+';
            const amount = Math.abs(item.transaction.amount);

            return `
                <tr>
                    <td>${item.transaction.date}</td>
                    <td class="description">${item.transaction.description}</td>
                    <td><span class="category-badge ${getCategoryClass(item.category)}">${item.category}</span></td>
                    <td class="text-right ${amountClass}">${sign}$${amount.toFixed(2)}</td>
                </tr>
            `;
        }).join('')}
    `).join('');
}

function renderCategoryChart(categoryTotals) {
    const chartContainer = document.getElementById('category-chart');
    const maxAmount = categoryTotals[0]?.[1] || 1;

    chartContainer.innerHTML = categoryTotals.map(([category, amount]) => {
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

function populateCategoryFilter(categoryTotals) {
    const filterSelect = document.getElementById('category-filter');
    const currentValue = filterSelect.value;

    filterSelect.innerHTML = '<option value="">All Categories</option>' +
        categoryTotals.map(([category]) =>
            `<option value="${category}">${category}</option>`
        ).join('');

    if (currentValue) {
        filterSelect.value = currentValue;
    }
}

function renderTransactionTable(data) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = data.filter(item => item && item.transaction && typeof item.transaction.amount !== 'undefined').map(item => {
        const isExpense = item.transaction.amount < 0;
        const amountClass = isExpense ? 'negative' : 'positive';
        const sign = isExpense ? '-' : '+';
        const amount = Math.abs(item.transaction.amount);

        return `
            <tr>
                <td>${item.transaction.date}</td>
                <td class="description">${item.transaction.description}</td>
                <td><span class="category-badge ${getCategoryClass(item.category)}">${item.category}</span></td>
                <td class="text-right ${amountClass}">${sign}$${amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

function getCategoryClass(category) {
    const classMap = {
        'Income': 'cat-income',
        'Rent': 'cat-rent',
        'Food': 'cat-food',
        'Utilities': 'cat-utilities',
        'Auto & Gas': 'cat-auto',
        'Subscriptions': 'cat-subscriptions',
        'Transfers': 'cat-transfers',
        'Shopping': 'cat-shopping',
        'Entertainment': 'cat-entertainment',
        'Charity': 'cat-charity',
        'Uncategorized': 'cat-uncategorized'
    };
    return classMap[category] || 'cat-default';
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

export function renderInsights(insights) {
    const container = document.getElementById('insights-section');

    if (!insights || insights.length === 0) {
        container.innerHTML = '';
        return;
    }

    const insightIcons = {
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        trend: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
        tip: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        recurring: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>'
    };

    container.innerHTML = `
        <div class="insights-grid">
            ${insights.map(insight => `
                <div class="insight-card ${insight.insight_type}">
                    <div class="insight-header">
                        <span class="insight-icon">${insightIcons[insight.insight_type] || insightIcons.tip}</span>
                        <span class="insight-type">${insight.insight_type}</span>
                    </div>
                    <div class="insight-message">${insight.message}</div>
                </div>
            `).join('')}
        </div>
    `;
}

export function renderBudgets(budgets, categoryTotals, currentMonth) {
    const container = document.getElementById('budgets-list');

    if (!budgets || budgets.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 1rem;">No budgets set. Click + to add one.</p>';
        return;
    }

    const categoryMap = Object.fromEntries(categoryTotals);

    container.innerHTML = budgets.map(budget => {
        const spent = Math.abs(categoryMap[budget.category] || 0);
        const budgetAmount = parseFloat(budget.amount);
        const percentage = Math.min((spent / budgetAmount) * 100, 100);

        let progressClass = '';
        if (percentage >= 100) {
            progressClass = 'danger';
        } else if (percentage >= 80) {
            progressClass = 'warning';
        }

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <span class="budget-category">${budget.category}</span>
                    <button class="btn-small btn-delete" onclick="deleteBudgetItem('${budget.category}')">Delete</button>
                </div>
                <div class="budget-amounts">
                    <span>${formatCurrency(spent)} / ${formatCurrency(budgetAmount)}</span>
                    <span style="margin-left: auto;">${percentage.toFixed(0)}%</span>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill ${progressClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

export function renderSuggestedBudget(budgetPlan) {
    const container = document.getElementById('suggested-budget-container');

    if (!budgetPlan) {
        container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 2rem;">Upload transaction data to see budget suggestions.</p>';
        return;
    }

    const { nextMonth, suggestions, totalSuggested, monthlyIncome, biweeklyPaycheck, discretionaryIncome } = budgetPlan;

    const incomeInfoSection = monthlyIncome > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(6, 182, 212, 0.2);">
            <div>
                <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">Bi-weekly Paycheck</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">${formatCurrency(biweeklyPaycheck)}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">Monthly Income</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">${formatCurrency(monthlyIncome)}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">Total Budget</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary);">${formatCurrency(totalSuggested)}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">Remaining</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: ${discretionaryIncome >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">${formatCurrency(discretionaryIncome)}</div>
            </div>
        </div>
    ` : `
        <p style="margin-top: 0.75rem;"><strong>Total Suggested Budget:</strong> ${formatCurrency(totalSuggested)}</p>
    `;

    container.innerHTML = `
        <div class="suggested-budget-info">
            <h3>Budget Plan for ${formatMonthDisplay(nextMonth)}</h3>
            <p>Based on your bi-weekly paycheck income and spending patterns. Rent is fixed, and other categories are allocated from remaining funds.</p>
            ${incomeInfoSection}
        </div>
        <div class="suggested-budget-grid">
            ${suggestions.map(suggestion => `
                <div class="suggested-budget-card">
                    <div class="suggested-budget-header">
                        <span class="suggested-budget-category">${suggestion.category}</span>
                        <span class="suggested-budget-amount">${formatCurrency(suggestion.suggestedAmount)}</span>
                    </div>
                    <div class="suggested-budget-details">
                        <div class="suggested-budget-detail">
                            <span class="suggested-budget-detail-label">Average:</span>
                            <span class="suggested-budget-detail-value">${formatCurrency(suggestion.average)}</span>
                        </div>
                        <div class="suggested-budget-detail">
                            <span class="suggested-budget-detail-label">Range:</span>
                            <span class="suggested-budget-detail-value">${formatCurrency(suggestion.min)} - ${formatCurrency(suggestion.max)}</span>
                        </div>
                        <div class="suggested-budget-detail">
                            <span class="suggested-budget-detail-label">Months tracked:</span>
                            <span class="suggested-budget-detail-value">${suggestion.monthsTracked}</span>
                        </div>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.75rem; line-height: 1.4;">${suggestion.reasoning}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function renderPieChart(categoryTotals) {
    const canvas = document.getElementById('pie-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = categoryTotals.reduce((sum, [_, amount]) => sum + amount, 0);
    if (total === 0) return;

    const colors = [
        '#06b6d4',
        '#8b5cf6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#3b82f6',
        '#ec4899',
        '#14b8a6',
        '#f97316',
        '#84cc16',
        '#6366f1',
        '#a855f7'
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
                <span class="pie-legend-color" style="background-color: ${color}"></span>
                <span class="pie-legend-label">${category}</span>
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
