# Digital Visiting Card

A digital visiting card application built with Next.js, TypeScript, and Tailwind CSS. Create and manage branded business contact cards, share them through QR codes and links, import contacts in bulk, and export QR codes for printing or distribution.

The application supports multiple company workspaces. Company data, employee cards, previews, exports, and administrator accounts are scoped by the signed-in user's role and company.

## Features

### Dashboard and card management

- View the total number of cards, search cards by name, designation, company, branch, email, or phone number, and open recent cards.
- Browse all saved cards in **My Cards**.
- Create, edit, or delete cards. Deletion requires confirmation.
- Super Admins manage company workspaces; Company Admins manage their company's cards and employee access; Employees can update and activate/deactivate only their own card.
- Company Admins can create employee accounts with one-time temporary passwords. Employees must replace the temporary password when they first sign in.
- Super Admins can switch the active company or view all companies. Company Admins and Employees are always restricted to their assigned company.
- Company Admins and Super Admins can create and activate/deactivate branches within a company. Branches organize cards by location; they are not separate companies, and assigning a card to a branch is optional.
- Customize the scan-page About Us, Services, Enquiry form, and default WhatsApp message for each card, or use the shared company defaults.
- Enter a contact's name, designation, country calling code, phone number, email, office address, and LinkedIn profile.
- Form validation checks required fields, email and phone formats, country calling codes, and web links.
- Company form details and scan-preview content are managed from the Company dropdown in the sidebar. Form details set locked card values; preview details control the About Us, Services, and Enquiry sections shown after a QR scan.

### QR codes and contact pages

- Generate a unique QR code and shareable contact page for each saved card.
- View a card's QR code and download it individually as a PNG, JPG, or PDF.
- Scan a QR code to open a mobile-friendly contact page with the person's contact details and company profile.
- Visitors can directly download an active card as a PDF from the QR contact page without opening the browser's print dialog. The PDF contains the card and About Us overview, followed by one page per service; the Enquiry form is omitted.
- Use contact shortcuts to call, email, open the office address in Google Maps, visit the company website, or open the LinkedIn profile.
- Add a contact by sharing/downloading a vCard (`.vcf`) file. The user must confirm saving in their contacts app.
- Start a WhatsApp chat with a prefilled greeting.
- Share the card link with the device's native share sheet, or use the available WhatsApp, Facebook, X, LinkedIn, and email links; copy the card link when needed.

### Company profile and enquiries

- Each company's QR contact page includes its own **About Us**, **Services**, and **Enquiry** details.
- The company profile presents an overview, vision, mission, and company metrics.
- Browse service descriptions and follow links to the relevant company service pages.
- Fill in the enquiry form to open a prefilled email in the visitor's email application. The form does not send email directly from the website.

### Bulk contact import

- Download a CSV template for preparing contact details in a spreadsheet.
- Import `.xlsx` workbooks; the first worksheet must have **Full Name**, **Designation**, **Mobile**, and **Email** columns.
- Optionally include **Country Code**, **Office Address**, and **LinkedIn Profile**. Missing country codes default to `+91`; company and website use the app defaults.
- Review the imported people and validation results before creating cards. Select or deselect individual valid rows, or use **Select all valid** and **Deselect all**. Invalid rows cannot be selected.
- Valid rows are selected by default. The import button shows how many are selected and creates cards only for those selected contacts.
- Each imported contact is saved as a card with its own QR code.

### Bulk QR code export

- Open **Export QR Codes** to choose which saved cards to export. Select individual cards or use **Select all** and **Deselect all**.
- Choose PNG, JPG, or PDF. The export includes only the selected cards, with files named after each contact.
- In supported secure browsers, choose a folder and save the files there. Otherwise, the application downloads one ZIP containing the selected QR code files.
- The export view reports progress and any files that could not be created.

### Responsive interface

- Use the card dashboard, forms, import preview, QR views, and contact pages on desktop or mobile screens.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Keep `STORAGE_DRIVER=json` and set `DEV_AUTH_BYPASS=true` for local work without a database or sign-in.
3. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The app opens as a development Super Admin.

On its first run, the JSON store imports the existing `data/cards.json` and `data/company-settings.json` into `data/platform.json`; the original files are left untouched. Restart `npm run dev` after changing environment settings. The bypass grants full access to the local data to anyone who can reach the development server. Keep the server on a trusted machine and never enable the bypass in production. JSON storage is intended for a single persistent development server; it is not safe for multiple app instances or concurrent multi-server writes. This does not connect SheetPilot.

## Production setup

Production continues to use PostgreSQL. Configure `DATABASE_URL`, set `AUTH_SECRET` to a unique random value of at least 32 characters, and set `BOOTSTRAP_ADMIN_EMAIL` plus a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 14 characters. Then run `npm run db:migrate` to import the legacy JSON records and `npm run db:bootstrap-admin` to create the initial Super Admin. Do not enable `DEV_AUTH_BYPASS` in production.

The database migration creates timestamped backups under `data/backups/`, preserves existing card UUIDs and QR URLs, and does not delete the JSON source files. Stop the old application before migrating. If the migration detects ambiguous duplicate employee records, it stops without importing data; review the backup and resolve the source records before retrying.

## Build and run for production

```bash
npm run build
npm start
```

The production server listens on port 3000 by default. To run the linter, use:

```bash
npm run lint
```

## Data storage and deployment

In local development, companies, employees, users, and cards are stored in `data/platform.json`. In production, they are stored in PostgreSQL with company-scoped foreign keys. Per-card scan preview overrides are stored with the card; cards without overrides use the selected company's preview settings. Public QR pages expose only active card and company visitor-facing details. Management endpoints enforce role and company ownership on the server; login is required except when the local development bypass is explicitly enabled.

The local JSON data file is git-ignored because it contains card and account data. Production deployments must provide a persistent PostgreSQL database, `DATABASE_URL`, and a private `AUTH_SECRET`. The Super Admin is provisioned from environment variables; Company Admins create employee accounts and must securely provide the one-time temporary password themselves because the application does not send email.

To open a card from another device, the device must be able to reach the server. `localhost` only refers to the current device; use a deployed public address or a LAN address reachable by the phone.
