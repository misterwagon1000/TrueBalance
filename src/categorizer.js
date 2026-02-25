const CATEGORY_RULES = {
    "Rent": ["TRAILS", "APARTMENT", "PROPERTY", "RENT", "RPS"],
    "Utilities": ["ELECTRIC", "WATER", "INTERNET", "GAS", "UTILITY", "GALLATINELECTRC", "ATT BILL", "AT&T"],
    "Food": [
        "KROGER", "WALMART", "CHICK", "MCDONALD", "RESTAURANT", "CAFE", "GROCERY",
        "PUBLIX", "TARGET", "PAPA JOHN", "CULVER", "WENDY", "CRACKER BARREL",
        "PANERA", "KEKES", "WHATABURGER", "WAFFLE HOUSE", "ALDI", "INSTACART",
        "CHINA BUFFET", "ROUXS CREOLE", "STORMING CRAB", "FLAVORS OF INDIA",
        "BEST DONUTS", "DONUT"
    ],
    "Subscriptions": [
        "OPENAI", "NETFLIX", "SPOTIFY", "SUBSCRIPTION", "MEMBERSHIP", "BOLT",
        "MICROSOFT", "APPLE.COM/BILL", "NETWORKSOLU", "APPLE"
    ],
    "Transfers": [
        "VENMO", "ZELLE", "TRANSFER", "XFER", "SCHWAB BROKERAGE",
        "EB TO SAVINGS", "ATM WITHDRAWAL"
    ],
    "Income": [
        "EB FROM CHECKING", "PAYROLL", "DEPOSIT", "SALARY", "EARNINGS",
        "MONTGOMERY ENGIN", "IRS TREAS", "TAX REFUND"
    ],
    "Auto & Gas": [
        "RACETRAC", "SHELL", "MARATHON", "MURPHY", "KROGER FUEL",
        "MISTER CAR WASH", "BJ S AUTO"
    ],
    "Shopping": ["AMAZON", "LOWE", "SALLY BEAUTY", "CSC SERVICE"],
    "Entertainment": ["REG INDIAN LAKE", "FANDANGO"],
    "Charity": ["GIV*FIRST CUMBER"]
};

export function categorizeTransactions(transactions) {
    if (!Array.isArray(transactions)) {
        console.error('categorizeTransactions received non-array:', transactions);
        return [];
    }

    return transactions
        .filter(transaction => {
            if (!transaction) {
                console.warn('Null transaction found');
                return false;
            }
            if (!transaction.description) {
                console.warn('Transaction missing description:', transaction);
                return false;
            }
            if (typeof transaction.amount === 'undefined') {
                console.warn('Transaction missing amount:', transaction);
                return false;
            }
            return true;
        })
        .map(transaction => ({
            transaction,
            category: categorize(transaction)
        }));
}

function categorize(transaction) {
    if (!transaction || !transaction.description) {
        return "Uncategorized";
    }

    const descriptionUpper = transaction.description.toUpperCase();

    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
        for (const keyword of keywords) {
            if (descriptionUpper.includes(keyword.toUpperCase())) {
                return category;
            }
        }
    }

    return "Uncategorized";
}
