"""
Transaction categorization engine.

This module assigns categories to transactions based on keyword matching
rules defined in the categories configuration.
"""

import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.categories import CATEGORY_RULES, DEFAULT_CATEGORY
from src.parser import Transaction
from typing import Dict, List


class TransactionCategorizer:
    """Categorizes transactions based on keyword matching."""

    def __init__(self):
        """Initialize the categorizer with default rules."""
        self.rules = CATEGORY_RULES
        self.default_category = DEFAULT_CATEGORY

    def categorize(self, transaction: Transaction) -> str:
        """
        Categorize a single transaction based on its description.

        Args:
            transaction: Transaction object to categorize

        Returns:
            Category name as a string
        """
        description_upper = transaction.description.upper()

        # Check each category's keywords
        for category, keywords in self.rules.items():
            for keyword in keywords:
                if keyword.upper() in description_upper:
                    return category

        # No match found
        return self.default_category

    def categorize_all(self, transactions: List[Transaction]) -> Dict[Transaction, str]:
        """
        Categorize a list of transactions.

        Args:
            transactions: List of Transaction objects

        Returns:
            Dictionary mapping transactions to their categories
        """
        categorized = {}
        for transaction in transactions:
            categorized[transaction] = self.categorize(transaction)
        return categorized
