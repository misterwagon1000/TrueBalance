import { supabase } from './database.js';
import { checkProStatus } from './proFeatures.js';

export async function calculateGoalProgress(goal, transactions) {
    const isPro = await checkProStatus();

    const currentAmount = parseFloat(goal.current_amount || 0);
    const targetAmount = parseFloat(goal.target_amount);
    const progress = (currentAmount / targetAmount) * 100;

    const basicProgress = {
        goalId: goal.id,
        goalName: goal.name,
        currentAmount,
        targetAmount,
        progress: Math.min(progress, 100),
        remaining: Math.max(0, targetAmount - currentAmount)
    };

    if (!isPro) {
        return basicProgress;
    }

    const monthlyContribution = parseFloat(goal.monthly_contribution || 0);

    let projectedCompletion = null;
    let recommendedContribution = 0;
    let onTrack = true;

    if (goal.target_date) {
        const targetDate = new Date(goal.target_date);
        const today = new Date();
        const monthsRemaining = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));

        recommendedContribution = (targetAmount - currentAmount) / monthsRemaining;

        if (monthlyContribution > 0) {
            const projectedMonths = Math.ceil((targetAmount - currentAmount) / monthlyContribution);
            projectedCompletion = new Date();
            projectedCompletion.setMonth(projectedCompletion.getMonth() + projectedMonths);

            onTrack = projectedCompletion <= targetDate;
        }
    } else if (monthlyContribution > 0) {
        const monthsToComplete = Math.ceil((targetAmount - currentAmount) / monthlyContribution);
        projectedCompletion = new Date();
        projectedCompletion.setMonth(projectedCompletion.getMonth() + monthsToComplete);
    }

    const recentContributions = calculateRecentContributions(goal, transactions);
    const avgMonthlyProgress = recentContributions.length > 0
        ? recentContributions.reduce((sum, c) => sum + c, 0) / recentContributions.length
        : monthlyContribution;

    const velocity = avgMonthlyProgress > 0 ? 'good' : 'slow';

    return {
        ...basicProgress,
        monthlyContribution,
        recommendedContribution,
        projectedCompletion: projectedCompletion ? projectedCompletion.toISOString().split('T')[0] : null,
        onTrack,
        targetDate: goal.target_date,
        velocity,
        recentContributions,
        avgMonthlyProgress,
        weeksToCompletion: projectedCompletion
            ? Math.ceil((projectedCompletion - new Date()) / (1000 * 60 * 60 * 24 * 7))
            : null
    };
}

export async function analyzeGoalFeasibility(goal, monthlyIncome, monthlyExpenses) {
    const isPro = await checkProStatus();

    if (!isPro) return null;

    const targetAmount = parseFloat(goal.target_amount);
    const currentAmount = parseFloat(goal.current_amount || 0);
    const remaining = targetAmount - currentAmount;

    const monthlyDisposable = monthlyIncome - monthlyExpenses;

    if (goal.target_date) {
        const targetDate = new Date(goal.target_date);
        const today = new Date();
        const monthsRemaining = Math.max(1, (targetDate - today) / (1000 * 60 * 60 * 24 * 30));

        const requiredMonthly = remaining / monthsRemaining;
        const percentOfDisposable = (requiredMonthly / monthlyDisposable) * 100;

        let feasibility = 'achievable';
        let recommendation = '';

        if (percentOfDisposable > 100) {
            feasibility = 'unrealistic';
            recommendation = `This goal requires $${requiredMonthly.toFixed(2)}/month, which exceeds your disposable income. Consider extending the deadline or reducing the target.`;
        } else if (percentOfDisposable > 50) {
            feasibility = 'challenging';
            recommendation = `This goal requires ${percentOfDisposable.toFixed(0)}% of your disposable income. It's achievable but will require significant sacrifice.`;
        } else if (percentOfDisposable > 25) {
            feasibility = 'moderate';
            recommendation = `This goal requires ${percentOfDisposable.toFixed(0)}% of your disposable income. You'll need to cut some discretionary spending.`;
        } else {
            feasibility = 'comfortable';
            recommendation = `This goal is very achievable, requiring only ${percentOfDisposable.toFixed(0)}% of your disposable income.`;
        }

        return {
            feasibility,
            requiredMonthly,
            percentOfDisposable,
            recommendation,
            alternativeTimeline: percentOfDisposable > 50
                ? Math.ceil(remaining / (monthlyDisposable * 0.3))
                : null
        };
    }

    const comfortableMonthly = monthlyDisposable * 0.2;
    const estimatedMonths = Math.ceil(remaining / comfortableMonthly);

    return {
        feasibility: 'no_deadline',
        recommendedMonthly: comfortableMonthly,
        estimatedMonths,
        recommendation: `Without a deadline, we recommend contributing $${comfortableMonthly.toFixed(2)}/month (20% of disposable income). You'd reach your goal in about ${estimatedMonths} months.`
    };
}

export async function suggestGoalMilestones(goal) {
    const isPro = await checkProStatus();

    if (!isPro) return [];

    const targetAmount = parseFloat(goal.target_amount);
    const currentAmount = parseFloat(goal.current_amount || 0);
    const remaining = targetAmount - currentAmount;

    const milestones = [];
    const milestonePercentages = [25, 50, 75, 90, 100];

    for (const percent of milestonePercentages) {
        const milestoneAmount = (targetAmount * percent) / 100;

        if (milestoneAmount <= currentAmount) continue;

        const amountNeeded = milestoneAmount - currentAmount;

        let projectedDate = null;
        if (goal.monthly_contribution && parseFloat(goal.monthly_contribution) > 0) {
            const monthsNeeded = Math.ceil(amountNeeded / parseFloat(goal.monthly_contribution));
            projectedDate = new Date();
            projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
        }

        milestones.push({
            percent,
            amount: milestoneAmount,
            amountNeeded,
            projectedDate: projectedDate ? projectedDate.toISOString().split('T')[0] : null,
            description: getMilestoneDescription(percent, goal.name)
        });
    }

    return milestones;
}

function calculateRecentContributions(goal, transactions) {
    if (!transactions || transactions.length === 0) return [];

    const contributions = transactions
        .filter(t => t.category === 'Savings' || t.description.toLowerCase().includes(goal.name.toLowerCase()))
        .filter(t => t.amount > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)
        .map(t => t.amount);

    return contributions;
}

function getMilestoneDescription(percent, goalName) {
    if (percent === 25) return `Quarter way to ${goalName}`;
    if (percent === 50) return `Halfway to ${goalName}`;
    if (percent === 75) return `Three-quarters to ${goalName}`;
    if (percent === 90) return `Almost there!`;
    if (percent === 100) return `${goalName} achieved!`;
    return `${percent}% progress`;
}

export async function optimizeGoalContributions(goals, monthlyDisposable) {
    const isPro = await checkProStatus();

    if (!isPro || goals.length === 0) return null;

    const activeGoals = goals.filter(g => g.status === 'active');

    if (activeGoals.length === 0) return null;

    const recommendations = [];
    let remainingDisposable = monthlyDisposable * 0.3;

    const prioritized = activeGoals
        .map(goal => {
            const urgency = goal.target_date
                ? (new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)
                : 999;

            const completion = parseFloat(goal.current_amount || 0) / parseFloat(goal.target_amount);

            return { goal, urgency, completion };
        })
        .sort((a, b) => {
            if (Math.abs(a.urgency - b.urgency) < 3) {
                return b.completion - a.completion;
            }
            return a.urgency - b.urgency;
        });

    for (const { goal, urgency } of prioritized) {
        const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount || 0);

        let suggestedAmount = 0;

        if (goal.target_date && urgency < 12) {
            const monthsLeft = Math.max(1, urgency);
            const minimumNeeded = remaining / monthsLeft;
            suggestedAmount = Math.min(minimumNeeded, remainingDisposable * 0.5);
        } else {
            suggestedAmount = Math.min(
                remainingDisposable / prioritized.length,
                remaining
            );
        }

        if (suggestedAmount > 0) {
            recommendations.push({
                goalId: goal.id,
                goalName: goal.name,
                suggestedContribution: suggestedAmount,
                priority: urgency < 6 ? 'high' : urgency < 12 ? 'medium' : 'low',
                reasoning: urgency < 6
                    ? `Target date approaching in ${Math.ceil(urgency)} months`
                    : `Balanced contribution based on timeline`
            });

            remainingDisposable -= suggestedAmount;
        }
    }

    return {
        recommendations,
        totalSuggested: recommendations.reduce((sum, r) => sum + r.suggestedContribution, 0),
        percentOfDisposable: ((recommendations.reduce((sum, r) => sum + r.suggestedContribution, 0)) / monthlyDisposable) * 100
    };
}
