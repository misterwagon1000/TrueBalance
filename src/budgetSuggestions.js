export function generateBudgetSuggestions(monthlyData) {
    if (!monthlyData || monthlyData.length === 0) {
        return null;
    }

    const categoryMonthlyTotals = {};
    const incomeTransactions = [];

    monthlyData.forEach(month => {
        if (!month.transactions || !Array.isArray(month.transactions)) return;

        const monthTotals = {};

        month.transactions.forEach(transaction => {
            if (!transaction || typeof transaction.amount === 'undefined') return;

            const category = transaction.category || 'Uncategorized';
            const amount = parseFloat(transaction.amount);

            if (isNaN(amount)) return;

            if (category === 'Income') {
                incomeTransactions.push(Math.abs(amount));
                return;
            }

            if (category === 'Transfers') return;

            if (!monthTotals[category]) {
                monthTotals[category] = 0;
            }
            monthTotals[category] += Math.abs(amount);
        });

        Object.keys(monthTotals).forEach(category => {
            if (!categoryMonthlyTotals[category]) {
                categoryMonthlyTotals[category] = [];
            }
            categoryMonthlyTotals[category].push(monthTotals[category]);
        });
    });

    const mostCommonIncome = findMostCommonAmount(incomeTransactions);
    const biweeklyPaycheck = mostCommonIncome || 0;
    const monthlyIncome = biweeklyPaycheck * 2;

    if (Object.keys(categoryMonthlyTotals).length === 0) {
        return null;
    }

    const fixedCategories = ['Rent', 'Subscriptions'];
    const essentialCategories = ['Rent', 'Utilities', 'Insurance'];
    const discretionaryCategories = ['Entertainment', 'Shopping', 'Dining'];

    const suggestions = [];

    Object.keys(categoryMonthlyTotals).forEach(category => {
        const monthlyTotals = categoryMonthlyTotals[category];
        const isFixed = fixedCategories.includes(category);
        const isEssential = essentialCategories.includes(category);
        const isDiscretionary = discretionaryCategories.includes(category);

        const average = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
        const max = Math.max(...monthlyTotals);
        const min = Math.min(...monthlyTotals);

        let suggestedAmount;
        let reasoning;
        let priority;

        if (category === 'Food') {
            suggestedAmount = 1000;
            reasoning = 'Fixed monthly food budget.';
            priority = 1;
        } else if (isFixed) {
            const recurringAmount = findMostCommonAmount(monthlyTotals);
            if (recurringAmount && Math.abs(recurringAmount - average) / average < 0.15) {
                suggestedAmount = recurringAmount;
                reasoning = 'Recurring bill at consistent amount.';
            } else {
                suggestedAmount = average;
                reasoning = 'Fixed expense based on average.';
            }
            priority = 1;
        } else if (isEssential) {
            suggestedAmount = average;
            reasoning = 'Essential expense based on average.';
            priority = 2;
        } else if (isDiscretionary) {
            suggestedAmount = average * 0.9;
            reasoning = 'Discretionary spending - reduced to stay within budget.';
            priority = 4;
        } else {
            const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / monthlyTotals.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev / average > 0.3) {
                suggestedAmount = average * 1.05;
                reasoning = 'Variable spending with small buffer.';
                priority = 3;
            } else {
                suggestedAmount = average;
                reasoning = 'Based on average spending.';
                priority = 3;
            }
        }

        suggestions.push({
            category,
            suggestedAmount: Math.ceil(suggestedAmount / 10) * 10,
            average: Math.round(average),
            min: Math.round(min),
            max: Math.round(max),
            monthsTracked: monthlyTotals.length,
            reasoning,
            priority
        });
    });

    suggestions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.suggestedAmount - a.suggestedAmount;
    });

    let totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);

    if (totalSuggested > monthlyIncome * 0.95) {
        const targetBudget = monthlyIncome * 0.95;
        const essentialTotal = suggestions
            .filter(s => s.priority <= 2)
            .reduce((sum, s) => sum + s.suggestedAmount, 0);

        const remainingForDiscretionary = targetBudget - essentialTotal;
        const discretionaryItems = suggestions.filter(s => s.priority > 2);
        const currentDiscretionaryTotal = discretionaryItems.reduce((sum, s) => sum + s.suggestedAmount, 0);

        if (currentDiscretionaryTotal > 0) {
            const reductionRatio = remainingForDiscretionary / currentDiscretionaryTotal;

            discretionaryItems.forEach(item => {
                item.suggestedAmount = Math.ceil((item.suggestedAmount * reductionRatio) / 10) * 10;
                item.reasoning = 'Adjusted to ensure budget stays within income.';
            });
        }

        totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);
    }

    const discretionaryIncome = monthlyIncome - totalSuggested;

    const nextMonth = getNextMonth(monthlyData[monthlyData.length - 1].month);

    return {
        nextMonth,
        suggestions,
        totalSuggested,
        monthlyIncome: Math.round(monthlyIncome),
        biweeklyPaycheck: Math.round(biweeklyPaycheck),
        discretionaryIncome: Math.round(discretionaryIncome)
    };
}

function findMostCommonAmount(amounts) {
    if (!amounts || amounts.length === 0) return null;

    const tolerance = 5;
    const clusters = [];

    amounts.forEach(amount => {
        let foundCluster = false;
        for (let cluster of clusters) {
            if (Math.abs(cluster.center - amount) <= tolerance) {
                cluster.amounts.push(amount);
                cluster.center = cluster.amounts.reduce((sum, val) => sum + val, 0) / cluster.amounts.length;
                foundCluster = true;
                break;
            }
        }
        if (!foundCluster) {
            clusters.push({ center: amount, amounts: [amount] });
        }
    });

    clusters.sort((a, b) => b.amounts.length - a.amounts.length);

    if (clusters.length > 0 && clusters[0].amounts.length >= 2) {
        return Math.round(clusters[0].center);
    }

    return null;
}

function calculateTrend(amounts) {
    if (amounts.length < 2) return 0;

    const n = amounts.length;
    const indices = amounts.map((_, i) => i);

    const sumX = indices.reduce((sum, val) => sum + val, 0);
    const sumY = amounts.reduce((sum, val) => sum + val, 0);
    const sumXY = indices.reduce((sum, val, i) => sum + val * amounts[i], 0);
    const sumX2 = indices.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    return slope / avgY;
}

function getNextMonth(currentMonth) {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);

    const nextYear = date.getFullYear();
    const nextMonthNum = String(date.getMonth() + 1).padStart(2, '0');

    return `${nextYear}-${nextMonthNum}`;
}

export function formatMonthDisplay(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}
