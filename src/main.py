"""
Patrick Finance Sorter - Main Entry Point

This is the main application that orchestrates the entire finance sorting pipeline:
1. Parse CSV transactions
2. Categorize transactions
3. Aggregate statistics
4. Generate terminal report
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.parser import TransactionParser
from src.categorizer import TransactionCategorizer
from src.aggregator import FinancialAggregator
from src.reporter import FinancialReporter


def main():
    """Main execution function."""
    # Define the CSV file path
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'transactions.csv')

    try:
        print("\nPatrick Finance Sorter - Starting...\n")

        # Step 1: Parse transactions from CSV
        print("Step 1/4: Parsing transactions from CSV...")
        parser = TransactionParser(csv_path)
        transactions = parser.parse()
        print(f"  ✓ Loaded {len(transactions)} transactions\n")

        if not transactions:
            print("No transactions found in CSV file. Exiting.")
            return

        # Step 2: Categorize transactions
        print("Step 2/4: Categorizing transactions...")
        categorizer = TransactionCategorizer()
        categorized = categorizer.categorize_all(transactions)
        print(f"  ✓ Categorized {len(categorized)} transactions\n")

        # Step 3: Aggregate financial data
        print("Step 3/4: Computing financial statistics...")
        aggregator = FinancialAggregator(categorized)
        summary = aggregator.aggregate()
        print(f"  ✓ Computed statistics\n")

        # Step 4: Generate and print report
        print("Step 4/4: Generating report...")
        reporter = FinancialReporter(summary)
        reporter.print_report()

        print("✓ Report generated successfully!\n")

    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print(f"\nPlease ensure your CSV file is located at: {csv_path}")
        print("The CSV should contain these columns:")
        print("  - Account")
        print("  - Transaction Date")
        print("  - Posted Date")
        print("  - No.")
        print("  - Description")
        print("  - Debit")
        print("  - Credit")
        print("  - Long Description\n")
        sys.exit(1)

    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
