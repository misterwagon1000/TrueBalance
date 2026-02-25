import './style.css';
import { initializeNavigation, navigateToSection } from './navigation.js';
import { renderHomeSection } from './sections/home.js';
import { renderTransactionsSection } from './sections/transactions.js';
import { renderAnalysisSection } from './sections/analysis.js';
import { renderGoalsSection } from './sections/goals.js';
import { renderImportSection } from './sections/import.js';
import { renderSettingsSection } from './sections/settings.js';
import { getBudgets, supabase } from './database.js';
import { detectRecurringExpenses, generateFinancialAlerts, calculateSpendingTrends } from './proFeatures.js';

window.appState = {
    allTransactions: [],
    categorizedData: [],
    monthlyData: [],
    currentMonth: null,
    currentBudgets: [],
    goals: [],
    settings: {
        monthlyIncome: 0,
        budgetCycleStart: 1
    },
    hasData: false
};

async function initializeApp() {
    initializeNavigation();

    window.onSectionChange = async (sectionName) => {
        await renderSection(sectionName);
    };

    await loadExistingData();

    if (window.appState.hasData) {
        navigateToSection('home');
    } else {
        renderImportSection();
    }
}

async function loadExistingData() {
    const storedData = localStorage.getItem('financeAppData');
    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            if (parsed.allTransactions && parsed.allTransactions.length > 0) {
                window.appState.allTransactions = parsed.allTransactions;
                window.appState.categorizedData = parsed.categorizedData || [];
                window.appState.monthlyData = parsed.monthlyData || [];
                window.appState.hasData = true;

                if (parsed.settings) {
                    window.appState.settings = parsed.settings;
                }

                const currentDate = new Date();
                window.appState.currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch (e) {
            console.error('Error loading stored data:', e);
        }
    }
}

async function renderSection(sectionName) {
    const { monthlyData, categorizedData, currentMonth, currentBudgets, settings, goals } = window.appState;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    switch (sectionName) {
        case 'home':
            if (!window.appState.hasData) {
                navigateToSection('import');
                return;
            }
            const budgets = currentMonth ? await getBudgets(currentMonth) : currentBudgets;
            await renderHomeSection(monthlyData, budgets, settings, goals, userId);
            break;

        case 'transactions':
            await renderTransactionsSection(monthlyData, categorizedData, userId);
            break;

        case 'analysis':
            await renderAnalysisSection(monthlyData, categorizedData, userId);
            break;

        case 'goals':
            await renderGoalsSection(monthlyData, settings);
            break;

        case 'import':
            renderImportSection();
            break;

        case 'settings':
            await renderSettingsSection();
            break;
    }
}

window.refreshAllSections = async function() {
    const currentDate = new Date();
    window.appState.currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    if (window.appState.currentMonth) {
        window.appState.currentBudgets = await getBudgets(window.appState.currentMonth);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && window.appState.hasData) {
        await runProAnalytics(user.id);
    }

    const currentSection = document.querySelector('.nav-item.active')?.getAttribute('data-nav-section');
    if (currentSection) {
        await renderSection(currentSection);
    }
};

async function runProAnalytics(userId) {
    try {
        const { monthlyData, categorizedData, currentBudgets, settings } = window.appState;

        if (!monthlyData || monthlyData.length === 0) return;

        const allTransactions = monthlyData.flatMap(m => m.transactions || []);

        await detectRecurringExpenses(allTransactions, userId);

        const currentMonthData = monthlyData[monthlyData.length - 1];
        if (currentMonthData && monthlyData.length >= 2) {
            await calculateSpendingTrends(currentMonthData, monthlyData, userId);
        }

        const { calculateAdvancedSafeToSpend } = await import('./proFeatures.js');
        const safeToSpend = await calculateAdvancedSafeToSpend(monthlyData, currentBudgets, settings, userId);

        if (safeToSpend) {
            await generateFinancialAlerts(monthlyData, safeToSpend, currentBudgets, userId);
        }
    } catch (error) {
        console.error('Error running Pro analytics:', error);
    }
}

window.navigateToSection = navigateToSection;

initializeApp();
