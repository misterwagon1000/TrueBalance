export function calculateSafeToSpend(monthlyData, budgets, settings = {}) {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const monthlyIncome = settings.monthlyIncome || calculateMonthlyIncome(monthlyData);
    const budgetCycleStart = settings.budgetCycleStart || 1;

    const currentMonthData = monthlyData.find(m => m.month === currentMonth);

    if (!currentMonthData) {
        return {
            safeToSpend: 0,
            safePerDay: 0,
            remainingBudget: 0,
            projectedEndBalance: 0,
            daysLeftInCycle: 0,
            spentThisMonth: 0,
            budgetedTotal: 0,
            monthlyIncome,
            isOnTrack: true
        };
    }

    const budgetedTotal = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);

    const spentThisMonth = Math.abs(currentMonthData.summary.totalExpenses);

    const remainingBudget = budgetedTotal > 0
        ? budgetedTotal - spentThisMonth
        : monthlyIncome - spentThisMonth;

    const daysLeftInCycle = getDaysLeftInCycle(budgetCycleStart);

    const safePerDay = daysLeftInCycle > 0 ? remainingBudget / daysLeftInCycle : 0;

    const projectedEndBalance = monthlyIncome - (spentThisMonth + (safePerDay * daysLeftInCycle));

    const expectedSpendingByNow = calculateExpectedSpending(budgetedTotal || monthlyIncome, budgetCycleStart);
    const isOnTrack = spentThisMonth <= expectedSpendingByNow;

    return {
        safeToSpend: Math.max(0, remainingBudget),
        safePerDay: Math.max(0, safePerDay),
        remainingBudget,
        projectedEndBalance,
        daysLeftInCycle,
        spentThisMonth,
        budgetedTotal: budgetedTotal || monthlyIncome,
        monthlyIncome,
        isOnTrack,
        trend: calculateSpendingTrend(currentMonthData),
        categoryBreakdown: calculateCategoryBreakdown(currentMonthData, budgets)
    };
}

function calculateMonthlyIncome(monthlyData) {
    if (!monthlyData || monthlyData.length === 0) return 0;

    const incomes = monthlyData.map(m => m.summary.totalIncome);
    const avgIncome = incomes.reduce((sum, val) => sum + val, 0) / incomes.length;

    return avgIncome;
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

function calculateExpectedSpending(totalBudget, cycleStart) {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    let daysElapsed;
    if (currentDay >= cycleStart) {
        daysElapsed = currentDay - cycleStart + 1;
    } else {
        const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        daysElapsed = (prevMonthDays - cycleStart + 1) + currentDay;
    }

    const dailyBudget = totalBudget / daysInMonth;
    return dailyBudget * daysElapsed;
}

function calculateSpendingTrend(monthData) {
    if (!monthData || !monthData.transactions) {
        return 'stable';
    }

    const transactions = monthData.transactions
        .filter(t => t.category !== 'Income' && t.category !== 'Transfers')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (transactions.length < 7) {
        return 'stable';
    }

    const midpoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midpoint);
    const secondHalf = transactions.slice(midpoint);

    const firstHalfTotal = firstHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const secondHalfTotal = secondHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const firstHalfAvg = firstHalfTotal / firstHalf.length;
    const secondHalfAvg = secondHalfTotal / secondHalf.length;

    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    if (change > 0.15) return 'increasing';
    if (change < -0.15) return 'decreasing';
    return 'stable';
}

function calculateCategoryBreakdown(monthData, budgets) {
    if (!monthData) return [];

    const categoryMap = Object.fromEntries(monthData.summary.categoryTotals);
    const budgetMap = Object.fromEntries(budgets.map(b => [b.category, parseFloat(b.amount)]));

    return monthData.summary.categoryTotals
        .filter(([cat]) => cat !== 'Income' && cat !== 'Transfers')
        .map(([category, spent]) => {
            const budget = budgetMap[category] || 0;
            const remaining = budget > 0 ? budget - Math.abs(spent) : null;
            const percentUsed = budget > 0 ? (Math.abs(spent) / budget) * 100 : 0;

            return {
                category,
                spent: Math.abs(spent),
                budget,
                remaining,
                percentUsed: Math.min(percentUsed, 100),
                status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'good'
            };
        })
        .sort((a, b) => b.spent - a.spent);
}

export function getTrendLabel(trend) {
    const labels = {
        increasing: 'Spending more than earlier this month',
        decreasing: 'Spending less than earlier this month',
        stable: 'Spending at a consistent pace'
    };
    return labels[trend] || labels.stable;
}

export function getTrendColor(trend) {
    const colors = {
        increasing: 'var(--color-danger)',
        decreasing: 'var(--color-success)',
        stable: 'var(--color-text-secondary)'
    };
    return colors[trend] || colors.stable;
}
