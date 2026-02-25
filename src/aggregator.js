export function aggregateData(categorizedTransactions) {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};
    let largestExpense = null;

    console.log('Aggregating data for', categorizedTransactions.length, 'items');

    categorizedTransactions.forEach((item, index) => {
        if (!item) {
            console.warn(`Item ${index} is null/undefined`);
            return;
        }

        const { transaction, category } = item;

        if (!transaction) {
            console.warn(`Item ${index} has no transaction:`, item);
            return;
        }

        if (typeof transaction.amount === 'undefined') {
            console.warn(`Item ${index} transaction has no amount:`, transaction);
            return;
        }

        const amount = transaction.amount;

        if (amount > 0) {
            totalIncome += amount;
        } else {
            totalExpenses += Math.abs(amount);
        }

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += Math.abs(amount);

        if (amount < 0) {
            const expenseAmount = Math.abs(amount);
            if (!largestExpense || expenseAmount > largestExpense.amount) {
                largestExpense = {
                    description: transaction.description,
                    amount: expenseAmount
                };
            }
        }
    });

    const netChange = totalIncome - totalExpenses;

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    return {
        totalIncome,
        totalExpenses,
        netChange,
        categoryTotals: sortedCategories,
        largestExpense,
        transactionCount: categorizedTransactions.length
    };
}

export function groupTransactionsByMonth(categorizedTransactions) {
    const monthGroups = {};

    categorizedTransactions.forEach(item => {
        if (!item || !item.transaction || !item.transaction.date) {
            return;
        }

        const dateParts = item.transaction.date.split('/');
        if (dateParts.length < 3) {
            return;
        }

        const [month, day, year] = dateParts;
        const monthKey = `${year}-${month.padStart(2, '0')}`;

        if (!monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(item);
    });

    const months = Object.keys(monthGroups).sort();

    return months.map(monthKey => {
        const monthTransactions = monthGroups[monthKey];
        return {
            month: monthKey,
            transactions: monthTransactions.map(item => ({
                ...item.transaction,
                category: item.category
            })),
            summary: aggregateData(monthTransactions)
        };
    });
}
