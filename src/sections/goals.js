import { checkProStatus } from '../proFeatures.js';
import { calculateGoalProgress, analyzeGoalFeasibility, suggestGoalMilestones } from '../goalTracking.js';
import { createProBadge, createUpgradePrompt } from '../components/ProBadge.js';

export async function renderGoalsSection(monthlyData, settings) {
    const container = document.querySelector('[data-section="goals"]');
    if (!container) return;

    const goals = await fetchGoals();
    const isPro = await checkProStatus();

    container.innerHTML = `
        <div class="goals-container">
            <div class="goals-header">
                <h2>Financial Goals</h2>
                <button class="btn-primary" onclick="window.showAddGoalModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Goal
                </button>
            </div>

            ${!isPro ? createUpgradePrompt(
                'Advanced Goal Tracking',
                'Get smart recommendations, projected completion dates, and feasibility analysis to reach your goals faster.'
            ).outerHTML : ''}

            ${goals.length === 0 ? `
                <div class="empty-state">
                    <p>No goals set yet. Create a goal to track your financial objectives.</p>
                </div>
            ` : `
                <div class="goals-grid">
                    ${goals.map(goal => renderGoalCard(goal, isPro)).join('')}
                </div>
            `}
        </div>
    `;

    if (isPro && goals.length > 0) {
        await enhanceGoalsWithProFeatures(container, goals, monthlyData, settings);
    }
}

async function enhanceGoalsWithProFeatures(container, goals, monthlyData, settings) {
    const goalCards = container.querySelectorAll('.goal-card');
    const transactions = monthlyData.flatMap(m => m.transactions || []);

    for (let i = 0; i < goals.length && i < goalCards.length; i++) {
        const goal = goals[i];
        const card = goalCards[i];

        const progress = await calculateGoalProgress(goal, transactions);

        if (progress.projectedCompletion) {
            const projectionSection = document.createElement('div');
            projectionSection.className = 'goal-pro-section';
            projectionSection.innerHTML = `
                <div class="goal-pro-header">
                    ${createProBadge().outerHTML}
                    <span>Smart Projections</span>
                </div>
                <div class="goal-projection-grid">
                    <div class="projection-item">
                        <span class="projection-label">Projected Completion</span>
                        <span class="projection-value">${new Date(progress.projectedCompletion).toLocaleDateString()}</span>
                    </div>
                    <div class="projection-item">
                        <span class="projection-label">Recommended Monthly</span>
                        <span class="projection-value">${formatCurrency(progress.recommendedContribution)}</span>
                    </div>
                    <div class="projection-item ${progress.onTrack ? 'on-track' : 'behind'}">
                        <span class="projection-label">Status</span>
                        <span class="projection-value">${progress.onTrack ? 'On Track' : 'Behind Schedule'}</span>
                    </div>
                </div>
            `;
            card.appendChild(projectionSection);
        }

        const currentMonth = monthlyData[monthlyData.length - 1];
        const monthlyIncome = settings?.monthlyIncome || 0;
        const monthlyExpenses = Math.abs(currentMonth?.summary?.totalExpenses || 0);

        const feasibility = await analyzeGoalFeasibility(goal, monthlyIncome, monthlyExpenses);

        if (feasibility && feasibility.feasibility !== 'no_deadline') {
            const feasibilitySection = document.createElement('div');
            feasibilitySection.className = `goal-feasibility ${feasibility.feasibility}`;
            feasibilitySection.innerHTML = `
                <div class="feasibility-label">Feasibility Assessment</div>
                <div class="feasibility-badge">${feasibility.feasibility.toUpperCase()}</div>
                <div class="feasibility-recommendation">${feasibility.recommendation}</div>
            `;
            card.appendChild(feasibilitySection);
        }
    }
}

function renderGoalCard(goal, isPro = false) {
    const progress = goal.target_amount > 0
        ? (goal.current_amount / goal.target_amount) * 100
        : 0;

    const remaining = goal.target_amount - goal.current_amount;

    let daysUntilTarget = '';
    if (goal.target_date) {
        const target = new Date(goal.target_date);
        const now = new Date();
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysUntilTarget = diffDays > 0 ? `${diffDays} days remaining` : 'Target date passed';
    }

    return `
        <div class="goal-card">
            <div class="goal-header">
                <div class="goal-icon ${goal.category}">
                    ${getGoalIcon(goal.category)}
                </div>
                <div class="goal-title-section">
                    <h3>${goal.name}</h3>
                    <span class="goal-category-badge">${goal.category}</span>
                </div>
            </div>

            <div class="goal-progress-section">
                <div class="goal-amounts">
                    <span class="goal-current">${formatCurrency(goal.current_amount)}</span>
                    <span class="goal-target">of ${formatCurrency(goal.target_amount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="goal-progress-text">${progress.toFixed(1)}% complete</div>
            </div>

            <div class="goal-details">
                ${remaining > 0 ? `
                    <div class="goal-detail-item">
                        <span>Remaining</span>
                        <strong>${formatCurrency(remaining)}</strong>
                    </div>
                ` : `
                    <div class="goal-detail-item success">
                        <span>Goal Achieved!</span>
                    </div>
                `}
                ${daysUntilTarget ? `
                    <div class="goal-detail-item">
                        <span>${daysUntilTarget}</span>
                    </div>
                ` : ''}
            </div>

            <div class="goal-actions">
                <button class="btn-small btn-secondary" onclick="window.updateGoalProgress('${goal.id}')">
                    Update Progress
                </button>
                <button class="btn-small btn-delete" onclick="window.deleteGoal('${goal.id}')">
                    Delete
                </button>
            </div>
        </div>
    `;
}

function getGoalIcon(category) {
    const icons = {
        emergency: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        savings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        debt: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
        vacation: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
        purchase: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'
    };
    return icons[category] || icons.savings;
}

async function fetchGoals() {
    if (window.appState && window.appState.goals) {
        return window.appState.goals;
    }
    return [];
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}
