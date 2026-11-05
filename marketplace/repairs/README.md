# Repair Shop Manager — browser prototype

Working sample-data workflow: device intake and condition records, job IDs and tracking codes, technician assignment, diagnosis and itemised parts/labour quote, simulated customer approval, repair stages, payment records, balance-gated collection, printable job cards and job history. Search and filter repair jobs; use Customer view with sample tracking code PALM-4821.

Data lives only in localStorage under `utee-repair-desk-v1`. Customer view deliberately simulates both sides in one browser. Tracking codes are not secure authentication. No real customer links, staff authentication, messages, payment processing or backend storage are provided. Do not enter real customer details or device passwords.

Production needs authenticated workshop accounts, a tenant-scoped database, secure customer access, durable records, audit trails, backups, approval evidence, cancellation/refund flows and notification integration. The quote locks after approval. Deposits may be recorded after diagnosis; overpayment is rejected. Collection requires the bill to be fully settled.

Unit logic is in repairs.js. Run the source checkout tests with `node --test tests/repair.test.mjs`.
