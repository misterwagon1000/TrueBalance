"""
Financial aggregation and statistics computation.

This module computes totals, statistics, and summaries from categorized
transactions.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
from src.parser import Transaction


@dataclass
class FinancialSummary:
    """Contains computed financial statistics."""

    total_income: float
    total_expenses: float
    net_change: float
    spending_by_category: Dict[str, float]
    largest_expense: Tuple[str, float] or None
    transaction_count: int
    uncategorized_transactions: List[Transaction]


class FinancialAggregator:
    """Computes financial statistics from categorized transactions."""

    def __init__(self, categorized_transactions: Dict[Transaction, str]):
        """
        Initialize aggregator with categorized transactions.

        Args:
            categorized_transactions: Dict mapping transactions to categories
        """
        self.categorized_transactions = categorized_transactions

    def aggregate(self) -> FinancialSummary:
        """
        Compute all financial statistics.

        Returns:
            FinancialSummary object with computed statistics
        """
        total_income = 0.0
        total_expenses = 0.0
        spending_by_category: Dict[str, float] = {}
        largest_expense: Tuple[str, float] = None
        uncategorized_transactions: List[Transaction] = []

        # Process each transaction
        for transaction, category in self.categorized_transactions.items():
            # Track income and expenses
            if transaction.is_income():
                total_income += transaction.amount
            else:
                total_expenses += abs(transaction.amount)

            # Track spending by category
            if category not in spending_by_category:
                spending_by_category[category] = 0.0
            spending_by_category[category] += abs(transaction.amount)

            # Track largest expense
            if transaction.is_expense():
                expense_amount = abs(transaction.amount)
                if largest_expense is None or expense_amount > largest_expense[1]:
                    largest_expense = (transaction.description, expense_amount)

            # Track uncategorized transactions
            if category == "Uncategorized":
                uncategorized_transactions.append(transaction)

        # Calculate net change
        net_change = total_income - total_expenses

        return FinancialSummary(
            total_income=total_income,
            total_expenses=total_expenses,
            net_change=net_change,
            spending_by_category=spending_by_category,
            largest_expense=largest_expense,
            transaction_count=len(self.categorized_transactions),
            uncategorized_transactions=uncategorized_transactions
        )
