import { parseCSV } from '../parser.js';
import { categorizeTransactions } from '../categorizer.js';
import { groupTransactionsByMonth } from '../aggregator.js';
import { saveTransactions } from '../database.js';

export function renderImportSection() {
    const container = document.querySelector('[data-section="import"]');
    if (!container) return;

    container.innerHTML = `
        <div class="import-container">
            <div class="import-header">
                <h2>Import Transaction Data</h2>
                <p>Upload your bank CSV file to get started with financial tracking</p>
            </div>

            <div class="upload-box" id="import-upload-box">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <h3>Upload Your Bank Transaction CSV</h3>
                <p>Drop your CSV file here or click to browse</p>
                <input type="file" id="import-file-input" accept=".csv,.CSV" hidden>
                <button id="import-upload-btn" class="btn-primary">Select File</button>
            </div>

            <div class="import-instructions">
                <h3>How to Import Your Data</h3>
                <ol>
                    <li>Download your transaction history as a CSV file from your bank</li>
                    <li>Upload the CSV file using the upload box above</li>
                    <li>Review the automatically categorized transactions</li>
                    <li>Make any necessary adjustments to categories</li>
                    <li>Your data will be saved and ready for analysis</li>
                </ol>
            </div>
        </div>
    `;

    attachImportHandlers();
}

function attachImportHandlers() {
    const fileInput = document.getElementById('import-file-input');
    const uploadBtn = document.getElementById('import-upload-btn');
    const uploadBox = document.getElementById('import-upload-box');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImportFile(e.target.files[0]);
            }
        });
    }

    if (uploadBox) {
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('dragover');
        });

        uploadBox.addEventListener('dragleave', (e) => {
            uploadBox.classList.remove('dragover');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImportFile(files[0]);
            }
        });
    }
}

async function handleImportFile(file) {
    try {
        const text = await file.text();
        console.log('File loaded, parsing CSV...');

        const allTransactions = parseCSV(text);
        console.log('Parsed transactions:', allTransactions.length);

        if (allTransactions.length === 0) {
            alert('No valid transactions found in the CSV file. Please check the format.');
            return;
        }

        const categorizedData = categorizeTransactions(allTransactions);
        console.log('Categorized transactions:', categorizedData.length);

        if (categorizedData.length === 0) {
            alert('No valid categorized transactions. Please check the CSV format.');
            return;
        }

        const monthlyData = groupTransactionsByMonth(categorizedData);
        console.log('Monthly data groups:', monthlyData.length);

        if (monthlyData.length === 0) {
            alert('No valid monthly data generated. Please check the CSV format.');
            return;
        }

        await saveTransactions(allTransactions, categorizedData);

        if (window.appState) {
            window.appState.allTransactions = allTransactions;
            window.appState.categorizedData = categorizedData;
            window.appState.monthlyData = monthlyData;
            window.appState.hasData = true;

            const currentDate = new Date();
            window.appState.currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

            localStorage.setItem('financeAppData', JSON.stringify({
                allTransactions,
                categorizedData,
                monthlyData,
                settings: window.appState.settings
            }));
        }

        if (window.refreshAllSections) {
            await window.refreshAllSections();
        }

        if (window.navigateToSection) {
            window.navigateToSection('home');
        }

        alert(`Successfully imported ${allTransactions.length} transactions!`);

    } catch (error) {
        console.error('Error processing file:', error);
        console.error('Error stack:', error.stack);
        alert(`Error processing CSV file: ${error.message}\nPlease check the browser console for details.`);
    }
}
