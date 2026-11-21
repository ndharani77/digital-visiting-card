# Digital Visiting Card

A digital visiting card application built with Next.js, TypeScript, and Tailwind CSS. Create and manage branded business contact cards, share them through QR codes and links, import contacts in bulk, and export QR codes for printing or distribution.

The application supports multiple company workspaces. Company data, employee cards, previews, exports, and administrator accounts are scoped by the signed-in user's role and company.

## Features

### Dashboard and card management

- View the total number of cards, search cards by name, designation, company, email, or phone number, and open recent cards.
- Browse all saved cards in **My Cards**.
- Create, edit, or delete cards. Deletion requires confirmation.
- Super Admins manage company workspaces; Company Admins manage cards for their assigned company only.
- Super Admins can create and edit Company Admin accounts, change their company, login email, or password, and activate, deactivate, or delete them. The last active administrator for a company cannot be deactivated, moved, or deleted.
- Super Admins can view platform analytics and card statistics by company.
- Super Admins can switch the active company or view all companies. Company Admins are always restricted to their assigned company.
- Company Admins use **Preview Editing** to customize scan-page content and **Settings** to change their password or select a company brand-color palette for the dashboard and visiting cards.
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
2. Keep `STORAGE_DRIVER=json` and set `DEV_AUTH_BYPASS=true` for local work without sign-in.
3. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The app opens as a development Super Admin.

On its first run, the JSON store imports the existing `data/cards.json` and `data/company-settings.json` into `data/platform.json`; the original files are left untouched. Restart `npm run dev` after changing environment settings. The bypass grants full access to the local data to anyone who can reach the development server. Keep the server on a trusted machine and never enable the bypass in production. This does not connect SheetPilot.

## Production setup

The application uses `data/platform.json` in every environment. Deploy it as a persistent Node.js application with writable storage, one active application writer, and backups for the `data/` directory. Do not use a read-only filesystem, serverless runtime, or multiple application instances with separate local disks; JSON file storage cannot safely coordinate writes between them.

Set `AUTH_SECRET` to a unique random value of at least 32 characters, set `BOOTSTRAP_ADMIN_EMAIL` and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 14 characters, and keep `DEV_AUTH_BYPASS=false`. Do not use a sample or weak password such as `sa`, and never commit real passwords to source control. Start the app and make one sign-in request to initialize `data/platform.json` from any legacy JSON files; then stop the app and run `npm run auth:bootstrap-admin` before restarting it. Schema upgrades make a timestamped backup under `data/backups/` and leave legacy source files untouched. If an old record has no unambiguous company assignment, startup stops with an error instead of guessing or dropping it; correct the ownership in the backed-up JSON before retrying.

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

Companies, accounts, cards, and activity logs are stored in `data/platform.json` in every environment. Per-card scan preview overrides are stored with the card; cards without overrides use the selected company's preview settings. QR codes are derived from card IDs and are not stored separately. Public QR pages expose only active card and company visitor-facing details. Management endpoints enforce role and company ownership on the server; login is required except when the local development bypass is explicitly enabled.

The JSON data file is git-ignored because it contains card and account data. Back it up securely and never commit or expose it. The Super Admin is provisioned by `npm run auth:bootstrap-admin`. Company Admin passwords are hashed before they are stored; the Super Admin should communicate the chosen sign-in password securely. The application cannot retrieve a password after account creation.

To open a card from another device, the device must be able to reach the server. `localhost` only refers to the current device; use a deployed public address or a LAN address reachable by the phone.
