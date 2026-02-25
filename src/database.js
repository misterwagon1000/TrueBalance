import { supabase } from './lib/supabase.ts';

const inMemoryStorage = {
    transactions: [],
    budgets: [],
    insights: []
};

export { supabase };

export async function saveTransactions(transactions, categorizedData) {
    const transactionsToSave = categorizedData
        .filter(item => item && item.transaction && typeof item.transaction.amount !== 'undefined')
        .map(item => ({
            date: item.transaction.date,
            description: item.transaction.description,
            amount: item.transaction.amount,
            category: item.category,
            month: extractMonth(item.transaction.date)
        }));

    inMemoryStorage.transactions.push(...transactionsToSave);
    return transactionsToSave;
}

export async function getTransactionsByMonth(month) {
    return inMemoryStorage.transactions
        .filter(t => t.month === month)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getAllMonths() {
    const uniqueMonths = [...new Set(inMemoryStorage.transactions.map(t => t.month))];
    return uniqueMonths.sort().reverse();
}

export async function getBudgets(month) {
    return inMemoryStorage.budgets.filter(b => b.month === month);
}

export async function saveBudget(category, amount, month) {
    const existingIndex = inMemoryStorage.budgets.findIndex(
        b => b.category === category && b.month === month
    );

    const budget = { category, amount, month };

    if (existingIndex >= 0) {
        inMemoryStorage.budgets[existingIndex] = budget;
    } else {
        inMemoryStorage.budgets.push(budget);
    }

    return [budget];
}

export async function deleteBudget(category, month) {
    const index = inMemoryStorage.budgets.findIndex(
        b => b.category === category && b.month === month
    );

    if (index >= 0) {
        inMemoryStorage.budgets.splice(index, 1);
    }
}

export async function getInsights(month) {
    return inMemoryStorage.insights.filter(i => i.month === month);
}

export async function saveInsights(insights, month) {
    inMemoryStorage.insights = inMemoryStorage.insights.filter(i => i.month !== month);

    const insightsToSave = insights.map(insight => ({
        ...insight,
        month
    }));

    inMemoryStorage.insights.push(...insightsToSave);
    return insightsToSave;
}

function extractMonth(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}`;
}
