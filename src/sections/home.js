import { calculateSafeToSpend, getTrendLabel, getTrendColor } from '../safeToSpend.js';
import { checkProStatus } from '../proFeatures.js';
import { createProDashboard } from '../components/ProDashboard.js';

export async function renderHomeSection(monthlyData, budgets, settings, goals, userId) {
    const container = document.querySelector('[data-section="home"]');
    if (!container) return;

    if (!monthlyData || monthlyData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No transaction data available. Please import your transactions to get started.</p>
            </div>
        `;
        return;
    }

    const safeBudgets = budgets || [];
    const safeSettings = settings || { monthlyIncome: 0, budgetCycleStart: 1 };
    const safeToSpendData = calculateSafeToSpend(monthlyData, safeBudgets, safeSettings);

    const isPro = await checkProStatus();

    container.innerHTML = `
        <div class="home-container">
            ${renderWelcomeGuide()}

            <div class="safe-to-spend-card">
                <div class="safe-to-spend-main">
                    <div class="safe-to-spend-label">Safe to Spend</div>
                    <div class="safe-to-spend-amount ${safeToSpendData.safeToSpend < 0 ? 'negative' : ''}">
                        ${formatCurrency(safeToSpendData.safeToSpend)}
                    </div>
                    <div class="safe-to-spend-subtitle">
                        ${safeToSpendData.daysLeftInCycle} days left this cycle
                    </div>
                </div>

                <div class="safe-to-spend-daily">
                    <div class="daily-budget-label">Safe per day</div>
                    <div class="daily-budget-amount">
                        ${formatCurrency(safeToSpendData.safePerDay)}
                    </div>
                </div>
            </div>

            <div class="spending-status-card ${safeToSpendData.isOnTrack ? 'on-track' : 'over-budget'}">
                <div class="status-indicator">
                    ${safeToSpendData.isOnTrack
                        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
                    }
                </div>
                <div class="status-text">
                    <div class="status-title">
                        ${safeToSpendData.isOnTrack ? 'On Track' : 'Over Budget'}
                    </div>
                    <div class="status-description">
                        ${safeToSpendData.isOnTrack
                            ? 'Your spending is within expected levels for this point in the cycle.'
                            : 'You\'re spending faster than planned. Consider reducing discretionary expenses.'
                        }
                    </div>
                </div>
            </div>

            <div class="home-stats-grid">
                <div class="home-stat-card">
                    <div class="stat-label">Spent This Month</div>
                    <div class="stat-value">${formatCurrency(safeToSpendData.spentThisMonth)}</div>
                    <div class="stat-subtitle">of ${formatCurrency(safeToSpendData.budgetedTotal)}</div>
                </div>

                <div class="home-stat-card">
                    <div class="stat-label">Projected Balance</div>
                    <div class="stat-value ${safeToSpendData.projectedEndBalance >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(safeToSpendData.projectedEndBalance)}
                    </div>
                    <div class="stat-subtitle">end of cycle</div>
                </div>

                <div class="home-stat-card">
                    <div class="stat-label">Spending Trend</div>
                    <div class="stat-value" style="color: ${getTrendColor(safeToSpendData.trend)}; font-size: 1rem;">
                        ${getTrendLabel(safeToSpendData.trend)}
                    </div>
                </div>
            </div>

            ${renderTopCategories(safeToSpendData.categoryBreakdown)}

            <div class="quick-actions">
                <button class="btn-primary" onclick="window.showAddTransactionModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Transaction
                </button>
            </div>
        </div>
    `;

    if (isPro && userId) {
        const proDashboard = await createProDashboard(monthlyData, safeBudgets, safeSettings, goals, userId);
        if (proDashboard) {
            const homeContainer = container.querySelector('.home-container');
            homeContainer.insertBefore(proDashboard, homeContainer.firstChild.nextSibling);
        }
    }
}

function renderWelcomeGuide() {
    return `
        <details class="welcome-guide">
            <summary>How to Use This App</summary>
            <div class="welcome-content">
                <h3>Understanding Your Financial Control System</h3>
                <p><strong>"Safe to Spend"</strong> shows how much money you can safely spend for the rest of this month without going over budget.</p>
                <p><strong>"Safe per day"</strong> breaks that down into a daily amount to help you pace your spending.</p>
                <p>Navigate using the menu on the left to:</p>
                <ul>
                    <li><strong>Transactions:</strong> View and manage all your financial activity</li>
                    <li><strong>Analysis:</strong> Deep dive into spending patterns and trends</li>
                    <li><strong>Goals:</strong> Track progress toward financial objectives</li>
                    <li><strong>Import/Data:</strong> Upload and categorize new transactions</li>
                    <li><strong>Settings:</strong> Configure your budget cycle and income</li>
                </ul>
            </div>
        </details>
    `;
}

function renderTopCategories(categoryBreakdown) {
    if (!categoryBreakdown || categoryBreakdown.length === 0) {
        return '';
    }

    const top3 = categoryBreakdown.slice(0, 3);

    return `
        <div class="top-categories">
            <h3>Top Spending Categories</h3>
            <div class="category-quick-list">
                ${top3.map(cat => `
                    <div class="category-quick-item">
                        <div class="category-quick-header">
                            <span class="category-quick-name">${cat.category}</span>
                            <span class="category-quick-amount">${formatCurrency(cat.spent)}</span>
                        </div>
                        ${cat.budget > 0 ? `
                            <div class="category-quick-progress">
                                <div class="category-quick-bar ${cat.status}">
                                    <div class="category-quick-fill" style="width: ${cat.percentUsed}%"></div>
                                </div>
                                <span class="category-quick-percent">${cat.percentUsed.toFixed(0)}% of budget</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}
