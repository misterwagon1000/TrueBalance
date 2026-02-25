"""
Category configuration with keyword matching rules.

This module defines the categories and their associated keywords for
transaction categorization.
"""

from typing import Dict, List

# Category keyword rules (case-insensitive matching)
CATEGORY_RULES: Dict[str, List[str]] = {
    "Rent": ["TRAILS", "APARTMENT", "PROPERTY", "RENT"],
    "Utilities": ["ELECTRIC", "WATER", "INTERNET", "GAS", "UTILITY"],
    "Food": ["KROGER", "WALMART", "CHICK", "MCDONALD", "RESTAURANT", "CAFE", "GROCERY"],
    "Subscriptions": ["OPENAI", "NETFLIX", "SPOTIFY", "SUBSCRIPTION", "MEMBERSHIP"],
    "Transfers": ["VENMO", "ZELLE", "TRANSFER", "XFER"],
    "Income": ["EB FROM CHECKING", "PAYROLL", "DEPOSIT", "SALARY", "EARNINGS"],
}

# Default category for unmatched transactions
DEFAULT_CATEGORY = "Uncategorized"
