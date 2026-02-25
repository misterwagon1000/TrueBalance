import { checkProStatus, suggestCategory, learnMerchantCategory } from '../proFeatures.js';
import { createProBadge } from '../components/ProBadge.js';

export async function renderTransactionsSection(monthlyData, categorizedData, userId) {
    const container = document.querySelector('[data-section="transactions"]');
    if (!container) return;

    const isPro = await checkProStatus();

    if (!categorizedData || categorizedData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No transactions available. Import data to get started.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="transactions-container">
            <div class="transactions-header">
                <h2>All Transactions</h2>
                <div class="transactions-summary">
                    Total: ${categorizedData.length} transactions
                </div>
            </div>

            <div class="transactions-filters">
                <input
                    type="text"
                    id="transactions-search"
                    class="search-input"
                    placeholder="Search by description or date..."
                />
                <select id="transactions-category-filter" class="category-filter">
                    <option value="">All Categories</option>
                </select>
                <select id="transactions-month-filter" class="month-filter">
                    <option value="">All Months</option>
                </select>
            </div>

            <div class="table-container">
                <table class="transactions-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody id="transactions-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;

    populateFilters(monthlyData, categorizedData);
    renderTransactionsTable(categorizedData);
    attachTransactionFilters();
}

function populateFilters(monthlyData, categorizedData) {
    const categoryFilter = document.getElementById('transactions-category-filter');
    const monthFilter = document.getElementById('transactions-month-filter');

    const categories = [...new Set(categorizedData.map(t => t.category))].sort();
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    if (monthlyData && monthlyData.length > 0) {
        const months = monthlyData.map(m => m.month).sort().reverse();
        monthFilter.innerHTML = '<option value="">All Months</option>' +
            months.map(month => `<option value="${month}">${formatMonthDisplay(month)}</option>`).join('');
    }
}

function renderTransactionsTable(data) {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    tbody.innerHTML = data
        .filter(item => item && item.transaction && typeof item.transaction.amount !== 'undefined')
        .map(item => {
            const isExpense = item.transaction.amount < 0;
            const amountClass = isExpense ? 'negative' : 'positive';
            const sign = isExpense ? '-' : '+';
            const amount = Math.abs(item.transaction.amount);

            return `
                <tr>
                    <td>${item.transaction.date}</td>
                    <td class="description">${item.transaction.description}</td>
                    <td><span class="category-badge ${getCategoryClass(item.category)}">${item.category}</span></td>
                    <td class="text-right ${amountClass}">${sign}$${amount.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
}

function attachTransactionFilters() {
    const searchInput = document.getElementById('transactions-search');
    const categoryFilter = document.getElementById('transactions-category-filter');
    const monthFilter = document.getElementById('transactions-month-filter');

    if (searchInput) searchInput.addEventListener('input', filterTransactions);
    if (categoryFilter) categoryFilter.addEventListener('change', filterTransactions);
    if (monthFilter) monthFilter.addEventListener('change', filterTransactions);
}

function filterTransactions() {
    const searchTerm = document.getElementById('transactions-search')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('transactions-category-filter')?.value || '';
    const selectedMonth = document.getElementById('transactions-month-filter')?.value || '';

    const allData = window.appState?.categorizedData || [];

    const filtered = allData.filter(item => {
        const matchesSearch = item.transaction.description.toLowerCase().includes(searchTerm) ||
                            item.transaction.date.includes(searchTerm);
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        const matchesMonth = !selectedMonth || extractMonth(item.transaction.date) === selectedMonth;

        return matchesSearch && matchesCategory && matchesMonth;
    });

    renderTransactionsTable(filtered);
}

function extractMonth(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}`;
}

function getCategoryClass(category) {
    const classMap = {
        'Income': 'cat-income',
        'Rent': 'cat-rent',
        'Food': 'cat-food',
        'Utilities': 'cat-utilities',
        'Auto & Gas': 'cat-auto',
        'Subscriptions': 'cat-subscriptions',
        'Transfers': 'cat-transfers',
        'Shopping': 'cat-shopping',
        'Entertainment': 'cat-entertainment',
        'Charity': 'cat-charity',
        'Uncategorized': 'cat-uncategorized'
    };
    return classMap[category] || 'cat-default';
}

function formatMonthDisplay(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

window.filterTransactions = filterTransactions;
