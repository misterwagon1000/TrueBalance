import { supabase } from './database.js';

export async function checkProStatus() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

    return subscription?.status === 'active';
}

export async function getRecurringExpenses(userId) {
    const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('average_amount', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function detectRecurringExpenses(transactions, userId) {
    const merchantFrequency = {};

    transactions
        .filter(t => t.category !== 'Income' && t.category !== 'Transfers')
        .forEach(t => {
            const merchant = normalizeMerchantName(t.description);
            if (!merchantFrequency[merchant]) {
                merchantFrequency[merchant] = [];
            }
            merchantFrequency[merchant].push({
                date: new Date(t.date),
                amount: Math.abs(t.amount),
                category: t.category
            });
        });

    const recurring = [];

    for (const [merchant, occurrences] of Object.entries(merchantFrequency)) {
        if (occurrences.length < 2) continue;

        occurrences.sort((a, b) => a.date - b.date);

        const intervals = [];
        for (let i = 1; i < occurrences.length; i++) {
            const days = Math.round((occurrences[i].date - occurrences[i - 1].date) / (1000 * 60 * 60 * 24));
            intervals.push(days);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgAmount = occurrences.reduce((sum, o) => sum + o.amount, 0) / occurrences.length;

        let frequency = 'monthly';
        if (avgInterval <= 7) frequency = 'weekly';
        else if (avgInterval <= 14) frequency = 'biweekly';
        else if (avgInterval <= 31) frequency = 'monthly';
        else if (avgInterval <= 93) frequency = 'quarterly';

        const lastOccurrence = occurrences[occurrences.length - 1];
        const nextExpectedDate = new Date(lastOccurrence.date);
        nextExpectedDate.setDate(nextExpectedDate.getDate() + Math.round(avgInterval));

        recurring.push({
            user_id: userId,
            merchant_name: merchant,
            category: occurrences[0].category,
            average_amount: avgAmount,
            frequency,
            next_expected_date: nextExpectedDate.toISOString().split('T')[0],
            last_occurrence: lastOccurrence.date.toISOString().split('T')[0],
            is_active: true
        });
    }

    for (const expense of recurring) {
        await supabase
            .from('recurring_expenses')
            .upsert(expense, {
                onConflict: 'user_id,merchant_name',
                ignoreDuplicates: false
            });
    }

    return recurring;
}

export async function calculateAdvancedSafeToSpend(monthlyData, budgets, settings, userId) {
    const isPro = await checkProStatus();

    if (!isPro) {
        return null;
    }

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthlyIncome = settings.monthlyIncome || 0;
    const budgetCycleStart = settings.budgetCycleStart || 1;

    const currentMonthData = monthlyData.find(m => m.month === currentMonth);

    if (!currentMonthData) {
        return null;
    }

    const recurring = await getRecurringExpenses(userId);

    const upcomingRecurring = recurring.filter(r => {
        const nextDate = new Date(r.next_expected_date);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return nextDate >= currentDate && nextDate <= endOfMonth;
    });

    const projectedRecurringTotal = upcomingRecurring.reduce((sum, r) => sum + parseFloat(r.average_amount), 0);

    const spentThisMonth = Math.abs(currentMonthData.summary.totalExpenses);
    const budgetedTotal = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const effectiveBudget = budgetedTotal > 0 ? budgetedTotal : monthlyIncome;

    const daysLeftInCycle = getDaysLeftInCycle(budgetCycleStart);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysElapsed = daysInMonth - daysLeftInCycle;

    const currentDailyRate = daysElapsed > 0 ? spentThisMonth / daysElapsed : 0;

    const projectedTotalSpending = spentThisMonth + projectedRecurringTotal + (currentDailyRate * daysLeftInCycle);
    const projectedEndBalance = monthlyIncome - projectedTotalSpending;

    const safeToSpendTotal = effectiveBudget - spentThisMonth - projectedRecurringTotal;
    const safePerDay = daysLeftInCycle > 0 ? Math.max(0, safeToSpendTotal / daysLeftInCycle) : 0;

    const isOnTrack = projectedEndBalance >= 0;
    const shortfall = isOnTrack ? 0 : Math.abs(projectedEndBalance);

    return {
        safeToSpend: Math.max(0, safeToSpendTotal),
        safePerDay,
        projectedEndBalance,
        projectedTotalSpending,
        upcomingRecurring,
        projectedRecurringTotal,
        daysLeftInCycle,
        currentDailyRate,
        isOnTrack,
        shortfall,
        spentThisMonth,
        effectiveBudget,
        confidence: calculateConfidenceLevel(currentMonthData, recurring)
    };
}

export async function generateFinancialAlerts(monthlyData, safeToSpend, budgets, userId) {
    const isPro = await checkProStatus();

    if (!isPro) return [];

    const alerts = [];
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthData = monthlyData.find(m => m.month === currentMonth);

    if (!currentMonthData) return alerts;

    if (safeToSpend?.projectedEndBalance < 0) {
        alerts.push({
            user_id: userId,
            alert_type: 'overspending_forecast',
            message: `Warning: Current spending pace projects a shortfall of $${Math.abs(safeToSpend.projectedEndBalance).toFixed(2)} by month end`,
            severity: 'critical',
            metadata: { shortfall: safeToSpend.projectedEndBalance }
        });
    }

    const categoryTotals = Object.fromEntries(currentMonthData.summary.categoryTotals);

    for (const budget of budgets) {
        const spent = Math.abs(categoryTotals[budget.category] || 0);
        const budgetAmount = parseFloat(budget.amount);
        const percentUsed = (spent / budgetAmount) * 100;

        if (percentUsed >= 100) {
            alerts.push({
                user_id: userId,
                alert_type: 'budget_exceeded',
                category: budget.category,
                message: `${budget.category} budget exceeded: $${spent.toFixed(2)} of $${budgetAmount.toFixed(2)}`,
                severity: 'warning',
                metadata: { spent, budget: budgetAmount, percent: percentUsed }
            });
        } else if (percentUsed >= 80) {
            alerts.push({
                user_id: userId,
                alert_type: 'budget_warning',
                category: budget.category,
                message: `${budget.category} at ${percentUsed.toFixed(0)}% of budget`,
                severity: 'info',
                metadata: { spent, budget: budgetAmount, percent: percentUsed }
            });
        }
    }

    const trends = await calculateSpendingTrends(currentMonthData, monthlyData, userId);

    for (const trend of trends) {
        if (trend.trend_direction === 'increasing' && trend.percentage_change > 25) {
            alerts.push({
                user_id: userId,
                alert_type: 'spending_increase',
                category: trend.category,
                message: `${trend.category} spending up ${trend.percentage_change.toFixed(0)}% vs last month`,
                severity: 'info',
                metadata: { change: trend.percentage_change, direction: 'increase' }
            });
        }
    }

    const smallPurchases = currentMonthData.transactions
        .filter(t => t.category !== 'Income' && Math.abs(t.amount) < 10)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (smallPurchases > 100) {
        alerts.push({
            user_id: userId,
            alert_type: 'small_purchases',
            message: `Small purchases under $10 total $${smallPurchases.toFixed(2)} this month`,
            severity: 'info',
            metadata: { total: smallPurchases }
        });
    }

    for (const alert of alerts) {
        await supabase
            .from('financial_alerts')
            .insert(alert);
    }

    return alerts;
}

export async function calculateSpendingTrends(currentMonthData, allMonthlyData, userId) {
    const isPro = await checkProStatus();

    if (!isPro || allMonthlyData.length < 2) return [];

    const currentMonth = currentMonthData.month;
    const previousMonthData = allMonthlyData[allMonthlyData.length - 2];

    if (!previousMonthData) return [];

    const currentCategories = Object.fromEntries(currentMonthData.summary.categoryTotals);
    const previousCategories = Object.fromEntries(previousMonthData.summary.categoryTotals);

    const trends = [];

    for (const [category, currentAmount] of Object.entries(currentCategories)) {
        if (category === 'Income' || category === 'Transfers') continue;

        const current = Math.abs(currentAmount);
        const previous = Math.abs(previousCategories[category] || 0);

        if (previous === 0) continue;

        const percentageChange = ((current - previous) / previous) * 100;

        let direction = 'stable';
        if (percentageChange > 10) direction = 'increasing';
        else if (percentageChange < -10) direction = 'decreasing';

        const trend = {
            user_id: userId,
            category,
            period: 'month',
            average_amount: current,
            trend_direction: direction,
            percentage_change: percentageChange,
            calculated_at: new Date().toISOString()
        };

        trends.push(trend);

        await supabase
            .from('spending_trends')
            .insert(trend);
    }

    return trends;
}

export async function learnMerchantCategory(merchant, category, userId) {
    const normalizedMerchant = normalizeMerchantName(merchant);

    const { data: existing } = await supabase
        .from('merchant_mappings')
        .select('*')
        .eq('user_id', userId)
        .eq('merchant_name', normalizedMerchant)
        .maybeSingle();

    if (existing) {
        await supabase
            .from('merchant_mappings')
            .update({
                category,
                confidence: existing.confidence + 1,
                last_used: new Date().toISOString()
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('merchant_mappings')
            .insert({
                user_id: userId,
                merchant_name: normalizedMerchant,
                category,
                confidence: 1,
                last_used: new Date().toISOString()
            });
    }
}

export async function suggestCategory(merchant, userId) {
    const normalizedMerchant = normalizeMerchantName(merchant);

    const { data } = await supabase
        .from('merchant_mappings')
        .select('category, confidence')
        .eq('user_id', userId)
        .eq('merchant_name', normalizedMerchant)
        .order('confidence', { ascending: false })
        .limit(1)
        .maybeSingle();

    return data ? { category: data.category, confidence: data.confidence } : null;
}

function normalizeMerchantName(description) {
    return description
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 3)
        .join(' ')
        .trim();
}

function getDaysLeftInCycle(cycleStart) {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (currentDay < cycleStart) {
        return cycleStart - currentDay;
    } else {
        return daysInMonth - currentDay + 1;
    }
}

function calculateConfidenceLevel(monthData, recurringExpenses) {
    if (!monthData || !monthData.transactions) return 'low';

    const transactionCount = monthData.transactions.length;
    const recurringCount = recurringExpenses.length;

    if (transactionCount >= 30 && recurringCount >= 3) return 'high';
    if (transactionCount >= 15 && recurringCount >= 1) return 'medium';
    return 'low';
}

export async function getUnreadAlerts(userId) {
    const { data, error } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function markAlertRead(alertId) {
    await supabase
        .from('financial_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
}
