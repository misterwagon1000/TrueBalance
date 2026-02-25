export function parseCSV(text) {
    const lines = text.trim().split('\n');
    const transactions = [];
    let skippedCount = 0;

    console.log(`Parsing CSV with ${lines.length} lines`);

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) {
            skippedCount++;
            continue;
        }

        const row = parseCSVLine(line);

        if (row.length >= 7) {
            const date = row[1].replace(/"/g, '').trim();
            const description = row[4].replace(/"/g, '').trim();
            const debitStr = row[5].replace(/"/g, '').trim();
            const creditStr = row[6].replace(/"/g, '').trim();

            if (!date || !description) {
                console.warn(`Line ${i+1}: Missing date or description`);
                skippedCount++;
                continue;
            }

            let amount = 0;
            if (debitStr) {
                const debitValue = parseFloat(debitStr);
                if (!isNaN(debitValue) && debitValue !== 0) {
                    amount = -Math.abs(debitValue);
                }
            } else if (creditStr) {
                const creditValue = parseFloat(creditStr);
                if (!isNaN(creditValue) && creditValue !== 0) {
                    amount = Math.abs(creditValue);
                }
            }

            if (amount === 0) {
                console.warn(`Line ${i+1}: No valid amount - debit: "${debitStr}", credit: "${creditStr}"`);
                skippedCount++;
                continue;
            }

            transactions.push({
                date,
                description,
                amount
            });
        } else {
            console.warn(`Line ${i+1}: Only ${row.length} columns, expected at least 7`);
            skippedCount++;
        }
    }

    console.log(`Parsed ${transactions.length} valid transactions, skipped ${skippedCount} lines`);
    return transactions;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}
