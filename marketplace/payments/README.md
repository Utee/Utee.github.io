# Payment & Invoice Desk — interactive prototype

Browser-local demo for the Utee Builds catalogue. Uses integer kobo for amounts; client-side sample records are stored under `utee-invoice-desk-v1`. No credentials, real client data, payment processing, payment verification, live payment links or server persistence are included.

Included: line items and quantities, full/50-50/40-30-30 schedules, exact milestone allocation, partial payment recording, balance checks, overdue status (Africa/Lagos date), invoice search/filter, business details, copy summary, print/PDF and sample reset. Payments allocate to milestones in sequence; the overall invoice due date applies to the balance.

Production work still required: authenticated business accounts, database and tenant isolation, client invoice links, server-generated IDs and totals, provider merchant onboarding, server-side checkout and webhook verification, idempotency, refunds, audit trails, backups, privacy/legal pages and account recovery. Payment provider choice and commercial pricing are not settled. This is separate from the hotel Python backend and does not use it.

Run the repository's static preview. Test the money and invoice logic from the source checkout with `node --test tests/invoice.test.mjs`.
