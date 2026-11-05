# Utee Hotel Management — pilot

A working FastAPI + SQLite application with a shared hotel desk frontend. The public GitHub Pages route is a sample-data browser demo, not the authenticated app. No customer database is deployed on GitHub Pages.

## Run locally

Use Python 3.12+. From this directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py
HOTEL_COOKIE_SECURE=false uvicorn app:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/app/ and sign in with the owner email/password you chose. Add rooms in Rooms & cleaning, then create reservations. Owners can create staff under Staff access. Run `python manage.py` again to provision another isolated hotel. There is no public account registration or default account/password. Keep the complete repository layout: the backend serves `../dist/marketplace/hotel` and shared font/brand assets.

## Included

- Owner, manager, receptionist and housekeeping roles; tenant-scoped data queries.
- Salted scrypt password hashes, hashed server sessions, HttpOnly/SameSite cookies, eight-hour expiry and login throttling.
- Serialized SQLite write transactions prevent concurrent room/date overlaps and payment overcollection.
- Calendar bookings (checkout date is exclusive), clean/unoccupied check-in, settlement before checkout, and automatic dirty-room status after checkout.
- Integer-kobo money, payment records and printable guest bills. The app does not process card payments.
- Guest directory, occupancy and aggregate payments/outstanding balances; audit records for mutations.

## Deployment boundary

This is a pilot for evaluation, not a complete commercial hotel package. Before accepting real guest records, deploy the Python service with HTTPS and durable database storage, configure backups and recovery, set the hotel's timezone, and complete a security/privacy review. Secure cookies default to ON; disable only for local HTTP. Set `HOTEL_DB` to a persistent filesystem path. SQLite targets a single service instance; move to PostgreSQL with a database-enforced room/date constraint before multi-instance scaling.

Still planned: password reset/change and account deactivation, editable room rates, taxes and extra charges, refunds, reservation amendments, historical date-filtered reports, public booking website and online payments. Public demo records stay in the visitor's browser and can be reset. Do not enter real guest data into it.

The static public demo and Python application use the same frontend. `/app/` selects authenticated API mode; `/marketplace/hotel/` selects browser demo mode. No API endpoint is connected from the public demo.

## Validation

```bash
python -m pytest tests -q
```

Covers unauthenticated access, cross-hotel isolation, cross-origin rejection, concurrent booking conflict, adjacent stays, outstanding bill protection, overpayment, housekeeping permissions, invalid dates and amounts, and login throttling.
