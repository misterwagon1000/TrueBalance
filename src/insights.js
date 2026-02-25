export function generateInsights(categorizedData, budgets, previousMonthData = null) {
    const insights = [];

    const expensesByCategory = {};
    const recurringTransactions = detectRecurring(categorizedData);

    categorizedData.forEach((item) => {
        if (!item || !item.transaction || typeof item.transaction.amount === 'undefined') {
            return;
        }

        const { transaction, category } = item;

        if (transaction.amount < 0) {
            if (!expensesByCategory[category]) {
                expensesByCategory[category] = [];
            }
            expensesByCategory[category].push(Math.abs(transaction.amount));
        }
    });

    Object.entries(expensesByCategory).forEach(([category, amounts]) => {
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        const budget = budgets.find(b => b.category === category);

        if (budget && total > budget.amount) {
            const overAmount = total - budget.amount;
            const percentOver = ((overAmount / budget.amount) * 100).toFixed(0);
            insights.push({
                insight_type: 'warning',
                category,
                message: `${category} spending exceeded budget by $${overAmount.toFixed(2)} (${percentOver}% over)`,
                amount: overAmount
            });
        } else if (budget && total > budget.amount * 0.8) {
            const remaining = budget.amount - total;
            insights.push({
                insight_type: 'trend',
                category,
                message: `${category} budget is 80% used. $${remaining.toFixed(2)} remaining this month`,
                amount: remaining
            });
        }
    });

    if (previousMonthData) {
        const prevExpenses = {};
        previousMonthData.forEach((item) => {
            if (!item || !item.transaction || typeof item.transaction.amount === 'undefined') {
                return;
            }

            const { transaction, category } = item;

            if (transaction.amount < 0) {
                prevExpenses[category] = (prevExpenses[category] || 0) + Math.abs(transaction.amount);
            }
        });

        Object.entries(expensesByCategory).forEach(([category, amounts]) => {
            const currentTotal = amounts.reduce((sum, amt) => sum + amt, 0);
            const previousTotal = prevExpenses[category] || 0;

            if (previousTotal > 0) {
                const change = currentTotal - previousTotal;
                const percentChange = ((change / previousTotal) * 100).toFixed(0);

                if (Math.abs(percentChange) > 30) {
                    const direction = change > 0 ? 'increased' : 'decreased';
                    insights.push({
                        insight_type: 'trend',
                        category,
                        message: `${category} spending ${direction} by ${Math.abs(percentChange)}% vs last month`,
                        amount: Math.abs(change)
                    });
                }
            }
        });
    }

    if (recurringTransactions.length > 0) {
        const recurringTotal = recurringTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        insights.push({
            insight_type: 'recurring',
            category: 'Subscriptions',
            message: `${recurringTransactions.length} recurring charges detected totaling $${recurringTotal.toFixed(2)}/month`,
            amount: recurringTotal
        });
    }

    const topCategories = Object.entries(expensesByCategory)
        .map(([category, amounts]) => ({
            category,
            total: amounts.reduce((sum, amt) => sum + amt, 0)
        }))
        .filter(c => c.category !== 'Income')
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    if (topCategories.length > 0) {
        insights.push({
            insight_type: 'tip',
            category: topCategories[0].category,
            message: `Your top spending category is ${topCategories[0].category} at $${topCategories[0].total.toFixed(2)}`,
            amount: topCategories[0].total
        });
    }

    const smallTransactions = categorizedData.filter((item) => {
        if (!item || !item.transaction || typeof item.transaction.amount === 'undefined') {
            return false;
        }
        return item.transaction.amount < 0 && Math.abs(item.transaction.amount) < 10;
    });

    if (smallTransactions.length > 5) {
        const total = smallTransactions.reduce((sum, item) => {
            if (!item || !item.transaction || typeof item.transaction.amount === 'undefined') {
                return sum;
            }
            return sum + Math.abs(item.transaction.amount);
        }, 0);
        insights.push({
            insight_type: 'tip',
            category: null,
            message: `${smallTransactions.length} small purchases under $10 add up to $${total.toFixed(2)}. Consider bundling trips`,
            amount: total
        });
    }

    return insights;
}

function detectRecurring(categorizedData) {
    const subscriptionKeywords = ['OPENAI', 'NETFLIX', 'SPOTIFY', 'APPLE', 'MICROSOFT', 'BOLT', 'SUBSCRIPTION'];
    const recurring = [];

    categorizedData.forEach((item) => {
        if (!item || !item.transaction || !item.transaction.description || typeof item.transaction.amount === 'undefined') {
            return;
        }

        const { transaction } = item;
        const desc = transaction.description.toUpperCase();

        if (subscriptionKeywords.some(keyword => desc.includes(keyword)) && transaction.amount < 0) {
            recurring.push(transaction);
        }
    });

    return recurring;
}
