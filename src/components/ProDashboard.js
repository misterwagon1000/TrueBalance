import { checkProStatus, calculateAdvancedSafeToSpend, getUnreadAlerts } from '../proFeatures.js';
import { createProBadge } from './ProBadge.js';

export async function createProDashboard(monthlyData, budgets, settings, goals, userId) {
    const isPro = await checkProStatus();

    if (!isPro) return null;

    const container = document.createElement('div');
    container.className = 'pro-dashboard';

    const header = document.createElement('div');
    header.className = 'pro-dashboard-header';
    header.innerHTML = `
        <h2>Financial Overview ${createProBadge().outerHTML}</h2>
        <p>Advanced insights and forecasting</p>
    `;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'pro-dashboard-grid';

    const safeToSpend = await calculateAdvancedSafeToSpend(monthlyData, budgets, settings, userId);

    if (safeToSpend) {
        grid.appendChild(createProjectionCard(safeToSpend));
        grid.appendChild(createDailySpendCard(safeToSpend));
        grid.appendChild(createForecastCard(safeToSpend));
        grid.appendChild(createRecurringCard(safeToSpend));
    }

    const alerts = await getUnreadAlerts(userId);
    if (alerts.length > 0) {
        grid.appendChild(createAlertsCard(alerts));
    }

    if (goals && goals.length > 0) {
        grid.appendChild(createGoalsCard(goals));
    }

    container.appendChild(grid);

    return container;
}

function createProjectionCard(safeToSpend) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card projection-card';

    const isPositive = safeToSpend.projectedEndBalance >= 0;
    const trend = safeToSpend.isOnTrack ? 'up' : 'down';
    const color = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

    card.innerHTML = `
        <div class="card-header">
            <h3>Projected Balance</h3>
            <span class="trend-indicator trend-${trend}">
                ${trend === 'up' ? '↗' : '↘'}
            </span>
        </div>
        <div class="card-value" style="color: ${color}">
            ${isPositive ? '+' : ''}$${Math.abs(safeToSpend.projectedEndBalance).toFixed(2)}
        </div>
        <div class="card-subtitle">
            End of month forecast
        </div>
        <div class="card-detail">
            <div class="detail-row">
                <span>Current daily rate:</span>
                <span>$${safeToSpend.currentDailyRate.toFixed(2)}/day</span>
            </div>
            <div class="detail-row">
                <span>Confidence:</span>
                <span class="confidence-${safeToSpend.confidence}">${safeToSpend.confidence}</span>
            </div>
        </div>
    `;

    return card;
}

function createDailySpendCard(safeToSpend) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card daily-spend-card';

    card.innerHTML = `
        <div class="card-header">
            <h3>Safe Daily Spend</h3>
        </div>
        <div class="card-value">
            $${safeToSpend.safePerDay.toFixed(2)}
        </div>
        <div class="card-subtitle">
            Per day for ${safeToSpend.daysLeftInCycle} days
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, (safeToSpend.spentThisMonth / safeToSpend.effectiveBudget) * 100)}%"></div>
        </div>
        <div class="card-detail">
            <div class="detail-row">
                <span>Spent:</span>
                <span>$${safeToSpend.spentThisMonth.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span>Budget:</span>
                <span>$${safeToSpend.effectiveBudget.toFixed(2)}</span>
            </div>
        </div>
    `;

    return card;
}

function createForecastCard(safeToSpend) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card forecast-card';

    card.innerHTML = `
        <div class="card-header">
            <h3>Spending Forecast</h3>
        </div>
        <div class="card-value">
            $${safeToSpend.projectedTotalSpending.toFixed(2)}
        </div>
        <div class="card-subtitle">
            Projected total this month
        </div>
        <div class="forecast-breakdown">
            <div class="breakdown-item">
                <span class="breakdown-label">Already spent</span>
                <span class="breakdown-value">$${safeToSpend.spentThisMonth.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Upcoming recurring</span>
                <span class="breakdown-value">$${safeToSpend.projectedRecurringTotal.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Other spending</span>
                <span class="breakdown-value">$${(safeToSpend.projectedTotalSpending - safeToSpend.spentThisMonth - safeToSpend.projectedRecurringTotal).toFixed(2)}</span>
            </div>
        </div>
    `;

    return card;
}

function createRecurringCard(safeToSpend) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card recurring-card';

    const upcomingCount = safeToSpend.upcomingRecurring?.length || 0;

    card.innerHTML = `
        <div class="card-header">
            <h3>Upcoming Bills</h3>
        </div>
        <div class="card-value">
            ${upcomingCount}
        </div>
        <div class="card-subtitle">
            Expected this month
        </div>
        ${upcomingCount > 0 ? `
            <div class="recurring-list">
                ${safeToSpend.upcomingRecurring.slice(0, 3).map(r => `
                    <div class="recurring-item">
                        <span class="recurring-name">${r.merchant_name}</span>
                        <span class="recurring-amount">$${parseFloat(r.average_amount).toFixed(2)}</span>
                    </div>
                `).join('')}
                ${upcomingCount > 3 ? `<div class="recurring-more">+${upcomingCount - 3} more</div>` : ''}
            </div>
        ` : '<p class="card-empty">No upcoming bills detected</p>'}
    `;

    return card;
}

function createAlertsCard(alerts) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card alerts-card';

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    card.innerHTML = `
        <div class="card-header">
            <h3>Active Alerts</h3>
            <span class="alert-count">${alerts.length}</span>
        </div>
        <div class="alerts-summary">
            ${criticalCount > 0 ? `<div class="alert-badge critical">${criticalCount} Critical</div>` : ''}
            ${warningCount > 0 ? `<div class="alert-badge warning">${warningCount} Warning</div>` : ''}
            ${alerts.length - criticalCount - warningCount > 0 ? `<div class="alert-badge info">${alerts.length - criticalCount - warningCount} Info</div>` : ''}
        </div>
        <div class="alerts-list">
            ${alerts.slice(0, 3).map(alert => `
                <div class="alert-item alert-${alert.severity}">
                    <div class="alert-icon">
                        ${alert.severity === 'critical' ? '⚠️' : alert.severity === 'warning' ? '⚡' : 'ℹ️'}
                    </div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `).join('')}
        </div>
    `;

    return card;
}

function createGoalsCard(goals) {
    const card = document.createElement('div');
    card.className = 'pro-dashboard-card goals-card';

    const activeGoals = goals.filter(g => g.status === 'active');

    card.innerHTML = `
        <div class="card-header">
            <h3>Goals Progress</h3>
        </div>
        <div class="goals-list">
            ${activeGoals.slice(0, 3).map(goal => {
                const progress = (parseFloat(goal.current_amount || 0) / parseFloat(goal.target_amount)) * 100;
                return `
                    <div class="goal-item">
                        <div class="goal-header">
                            <span class="goal-name">${goal.name}</span>
                            <span class="goal-progress">${progress.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(100, progress)}%"></div>
                        </div>
                        <div class="goal-amounts">
                            <span>$${parseFloat(goal.current_amount || 0).toFixed(0)}</span>
                            <span>$${parseFloat(goal.target_amount).toFixed(0)}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    return card;
}
