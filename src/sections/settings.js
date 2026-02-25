export async function renderSettingsSection() {
    const container = document.querySelector('[data-section="settings"]');
    if (!container) return;

    const settings = await fetchSettings();

    container.innerHTML = `
        <div class="settings-container">
            <h2>Settings</h2>

            <div class="settings-section">
                <h3>Budget Configuration</h3>
                <form id="budget-settings-form" class="settings-form">
                    <div class="form-group">
                        <label for="monthly-income">Monthly Income ($)</label>
                        <input
                            type="number"
                            id="monthly-income"
                            step="0.01"
                            min="0"
                            value="${settings.monthlyIncome || 0}"
                            class="form-input"
                        />
                        <small>Your expected monthly income. Leave at 0 to auto-calculate from transaction data.</small>
                    </div>

                    <div class="form-group">
                        <label for="budget-cycle-start">Budget Cycle Start Day</label>
                        <input
                            type="number"
                            id="budget-cycle-start"
                            min="1"
                            max="31"
                            value="${settings.budgetCycleStart || 1}"
                            class="form-input"
                        />
                        <small>The day of the month when your budget cycle begins (e.g., payday).</small>
                    </div>

                    <button type="submit" class="btn-primary">Save Budget Settings</button>
                </form>
            </div>

            <div class="settings-section">
                <h3>Data Management</h3>
                <div class="data-actions">
                    <button class="btn-secondary" onclick="window.exportData()">
                        Export All Data
                    </button>
                    <button class="btn-delete" onclick="window.clearAllData()">
                        Clear All Data
                    </button>
                </div>
            </div>

            <div class="settings-section">
                <h3>About</h3>
                <p>Financial Control System v1.0</p>
                <p>A comprehensive tool for tracking and managing your personal finances.</p>
            </div>
        </div>
    `;

    attachSettingsHandlers();
}

function attachSettingsHandlers() {
    const form = document.getElementById('budget-settings-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings();
        });
    }
}

async function saveSettings() {
    const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    const budgetCycleStart = parseInt(document.getElementById('budget-cycle-start').value) || 1;

    if (!window.appState) {
        window.appState = {};
    }

    window.appState.settings = {
        monthlyIncome,
        budgetCycleStart
    };

    const storedData = localStorage.getItem('financeAppData');
    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            parsed.settings = window.appState.settings;
            localStorage.setItem('financeAppData', JSON.stringify(parsed));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    if (window.refreshAllSections) {
        await window.refreshAllSections();
    }

    alert('Settings saved successfully!');
}

async function fetchSettings() {
    if (window.appState && window.appState.settings) {
        return window.appState.settings;
    }

    return {
        monthlyIncome: 0,
        budgetCycleStart: 1
    };
}

window.exportData = function() {
    if (!window.appState || !window.appState.allTransactions) {
        alert('No data to export');
        return;
    }

    const dataStr = JSON.stringify(window.appState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

window.clearAllData = function() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        return;
    }

    localStorage.removeItem('financeAppData');

    if (window.appState) {
        window.appState.allTransactions = [];
        window.appState.categorizedData = [];
        window.appState.monthlyData = [];
        window.appState.hasData = false;
        window.appState.goals = [];
        window.appState.settings = {
            monthlyIncome: 0,
            budgetCycleStart: 1
        };
    }

    if (window.refreshAllSections) {
        window.refreshAllSections();
    }

    if (window.navigateToSection) {
        window.navigateToSection('import');
    }

    alert('All data has been cleared.');
};
