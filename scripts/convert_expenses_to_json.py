import csv
import json
from datetime import datetime
from pathlib import Path

# Input CSV path (relative to repo root)
CSV_PATH = Path('AydMaxx Calc EXpenses - Expenses.csv')
OUT_PATH = Path('scripts/expenses.json')

rows = []
with CSV_PATH.open('r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    for r in reader:
        # Skip fully empty lines
        if not any((v or '').strip() for v in r.values()):
            continue

        raw_date = (r.get('Date') or '').strip()
        if not raw_date:
            continue

        # Normalize date: supports 'dd.mm.yyyy' and 'dd,mm,yyyy'
        norm = raw_date.replace(',', '.')
        try:
            dt = datetime.strptime(norm, '%d.%m.%Y').date().isoformat()
        except Exception:
            # If parse fails, skip the row for now
            continue

        # Normalize amount: keep as string for SQL cast later
        amount = (r.get('Amount') or '').strip()
        if amount == '':
            # skip lines without amount
            continue

        # Build minimal cleaned row
        rows.append({
            'date': dt,
            'vin': (r.get('VIN') or '').strip() or None,
            'model': (r.get('Model') or '').strip() or None,
            'description': (r.get('Description') or '').strip() or None,
            'amount': amount.replace(',', ''),  # defensive: remove thousands separators if any
            'category': (r.get('Category') or '').strip() or None,
            'investor': (r.get('Investor') or '').strip() or None,
            'notes': (r.get('Notes') or '').strip() or None,
        })

# Ensure output dir exists
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with OUT_PATH.open('w', encoding='utf-8') as out:
    json.dump(rows, out, ensure_ascii=False)
    out.write('\n')

