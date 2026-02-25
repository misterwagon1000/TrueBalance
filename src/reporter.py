"""
Terminal report generator.

This module formats and prints financial summaries to the terminal.
"""

from src.aggregator import FinancialSummary


class FinancialReporter:
    """Generates formatted terminal reports."""

    def __init__(self, summary: FinancialSummary):
        """
        Initialize reporter with a financial summary.

        Args:
            summary: FinancialSummary object to report
        """
        self.summary = summary

    def print_report(self) -> None:
        """Print a formatted financial report to the terminal."""
        print("\n" + "=" * 50)
        print("===== PATRICK FINANCE REPORT =====")
        print("=" * 50 + "\n")

        # Summary section
        print(f"Total Income:      ${self.summary.total_income:,.2f}")
        print(f"Total Expenses:    ${self.summary.total_expenses:,.2f}")
        print(f"Net Change:        ${self.summary.net_change:,.2f}")
        print(f"\nTotal Transactions: {self.summary.transaction_count}")

        # Spending by category
        print("\n" + "-" * 50)
        print("----- Spending by Category -----")
        print("-" * 50 + "\n")

        if self.summary.spending_by_category:
            # Sort categories by spending amount (descending)
            sorted_categories = sorted(
                self.summary.spending_by_category.items(),
                key=lambda x: x[1],
                reverse=True
            )

            for category, amount in sorted_categories:
                print(f"{category:.<30} ${amount:>12,.2f}")
        else:
            print("No spending data available.")

        # Largest expense
        print("\n" + "-" * 50)
        print("----- Largest Expense -----")
        print("-" * 50 + "\n")

        if self.summary.largest_expense:
            description, amount = self.summary.largest_expense
            print(f"{description} — ${amount:,.2f}")
        else:
            print("No expenses found.")

        # Uncategorized transactions
        print("\n" + "-" * 50)
        print("----- Uncategorized Transactions -----")
        print("-" * 50 + "\n")

        if self.summary.uncategorized_transactions:
            for transaction in self.summary.uncategorized_transactions:
                sign = "+" if transaction.amount > 0 else "-"
                amount = abs(transaction.amount)
                print(f"{transaction.date} | {transaction.description:.<40} {sign}${amount:>10,.2f}")
        else:
            print("All transactions categorized successfully!")

        print("\n" + "=" * 50 + "\n")
