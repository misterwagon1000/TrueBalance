"""
CSV parser for bank transaction exports.

This module reads bank transaction CSV files and normalizes them into
Transaction objects for further processing.
"""

import csv
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime


@dataclass(frozen=True)
class Transaction:
    """Represents a single bank transaction."""

    date: str
    description: str
    amount: float

    def is_expense(self) -> bool:
        """Returns True if this is an expense (negative amount)."""
        return self.amount < 0

    def is_income(self) -> bool:
        """Returns True if this is income (positive amount)."""
        return self.amount > 0


class TransactionParser:
    """Parses bank transaction CSV files."""

    def __init__(self, csv_path: str):
        """
        Initialize the parser with a CSV file path.

        Args:
            csv_path: Path to the CSV file containing transactions
        """
        self.csv_path = csv_path

    def parse(self) -> List[Transaction]:
        """
        Parse the CSV file and return a list of Transaction objects.

        Returns:
            List of Transaction objects

        Raises:
            FileNotFoundError: If the CSV file doesn't exist
            ValueError: If the CSV format is invalid
        """
        transactions: List[Transaction] = []

        try:
            with open(self.csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)

                for row in reader:
                    transaction = self._parse_row(row)
                    if transaction:
                        transactions.append(transaction)

        except FileNotFoundError:
            raise FileNotFoundError(f"CSV file not found: {self.csv_path}")
        except KeyError as e:
            raise ValueError(f"CSV is missing required column: {e}")

        return transactions

    def _parse_row(self, row: dict) -> Optional[Transaction]:
        """
        Parse a single CSV row into a Transaction object.

        Args:
            row: Dictionary containing CSV row data

        Returns:
            Transaction object or None if row should be skipped
        """
        try:
            # Extract data from CSV columns
            date = row['Transaction Date'].strip()
            description = row['Description'].strip()
            debit = row['Debit'].strip()
            credit = row['Credit'].strip()

            # Calculate amount (negative for debit, positive for credit)
            amount = 0.0
            if debit:
                amount = -float(debit.replace(',', ''))
            elif credit:
                amount = float(credit.replace(',', ''))
            else:
                # Skip rows with no amount
                return None

            return Transaction(
                date=date,
                description=description,
                amount=amount
            )

        except (ValueError, KeyError) as e:
            # Skip invalid rows
            print(f"Warning: Skipping invalid row: {e}")
            return None
