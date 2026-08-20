# Pure Herbs — Connected Portal

## Run

Open PowerShell in `backend`:

```bash
npm.cmd install
npm.cmd run dev
```

Then open:

http://localhost:4000

Do not open `frontend/index.html` directly for the normal test.

## What was added

### Documents
Inside Order Details, Commercial Invoice, Packing List, and Quality Certificate now have **Download** buttons. The server generates a downloadable HTML document for the selected order.

### Admin data entry
The Admin website now has:

- Orders → **Add New Order**
- Customers → **Add Customer**
- Products → **Add Product**

The forms send data through the API and the server stores it in `backend/src/data.json`, so you do not need to edit backend code to add normal records.

### Forgot password
The Customer Login screen now has **Forgot password?**.

For this local/demo build, password reset is handled in the browser's customer account storage. It is not an email-verified production reset flow yet.

## API tests

Health:

http://localhost:4000/api/health

Orders:

http://localhost:4000/api/orders

Tracking:

http://localhost:4000/api/tracking/OOLU2336262600

Customers:

http://localhost:4000/api/customers

Products:

http://localhost:4000/api/products


## Added from pure_herbs (11) without replacing the original UI
- Status history and order events
- QC tests with customer-visible approval
- Document metadata and visibility
- Shipment records
- Delay records
- Notifications and templates
- Audit log
- Advanced order details inside the existing order modal
- Admin pages for Quality Control, Documents, Shipments, Notifications and Audit Log using the existing page/table visual language


## Release notes
- Customer form values are not persisted to `localStorage`.
- Customer demo accounts are kept in `sessionStorage` only; they disappear with the browser session.
- Customer passwords are stored as SHA-256 hashes in the session, never as plain text.
- The login form no longer auto-fills demo credentials.
- The order-details view has been visually refreshed for desktop and mobile.
- `node_modules` is intentionally excluded from the release archive. Run `npm install` inside `backend` before deployment.
