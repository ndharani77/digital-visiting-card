# Digital Visiting Card

A digital visiting card application built with Next.js, TypeScript, and Tailwind CSS. Create and manage branded business contact cards, share them through QR codes and links, import contacts in bulk, and export QR codes for printing or distribution.

## Features

### Dashboard and card management

- View the total number of cards, search cards by name, designation, company, email, or phone number, and open recent cards.
- Browse all saved cards in **My Cards**.
- Create, edit, or delete cards. Deletion requires confirmation.
- Enter a contact's name, designation, country calling code, phone number, email, office address, and LinkedIn profile.
- Form validation checks required fields, email and phone formats, country calling codes, and web links.
- Company name, website, and logo use the application's Brihaspathi Technologies branding.

### QR codes and contact pages

- Generate a unique QR code and shareable contact page for each saved card.
- View the QR code from a saved card and download it individually as PNG, JPG, or PDF.
- Scan a QR code to open a mobile-friendly contact page with the person's contact details and company profile.
- Use contact shortcuts to call, email, open the office address in Google Maps, visit the company website, or open the LinkedIn profile.
- Add a contact by sharing/downloading a vCard (`.vcf`) file. The user must confirm saving in their contacts app.
- Start a WhatsApp chat with a prefilled greeting.
- Share the card link with the device's native share sheet, or use the available WhatsApp, Facebook, X, LinkedIn, and email links; copy the card link when needed.
- Download QR codes in bulk as PNG, JPG, or PDF files. Where browser folder access is supported, save files to a selected folder; otherwise download a ZIP archive.

### Company profile and enquiries

- The QR contact page includes **About Us**, **Services**, and **Enquiry** sections for Brihaspathi Technologies.
- The company profile presents an overview, vision, mission, and company metrics.
- Browse service descriptions and follow links to the relevant company service pages.
- Fill in the enquiry form to open a prefilled email in the visitor's email application. The form does not send email directly from the website.

### Bulk contact import

- Download a CSV template for preparing contact details in a spreadsheet.
- Import `.xlsx` workbooks; the first worksheet must have **Full Name**, **Designation**, **Mobile**, and **Email** columns.
- Optionally include **Country Code**, **Office Address**, and **LinkedIn Profile**. Missing country codes default to `+91`; company and website use the app defaults.
- Preview imported rows and their validation results before saving. Only valid rows can be imported.
- Each imported contact is saved as a card with its own QR code.

### Responsive interface

- Use the card dashboard, forms, import preview, QR views, and contact pages on desktop or mobile screens.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

1. Open the project folder in VS Code.
2. Open **Terminal > New Terminal**.
3. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

No environment variables or separate database are required for local development.

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

Cards are stored in `data/cards.json`. The app creates this file if it does not exist. Keep this file and its containing directory writable, and back it up if the card data matters.

This file-based store is suitable for local development and a single persistent Node.js server. It is not suitable for serverless deployments, multiple application instances, or environments with ephemeral filesystems. For those deployments, use a shared persistent database.

To open a card from another device, the device must be able to reach the server. `localhost` only refers to the current device; use a deployed public address or a LAN address reachable by the phone.

## Current limitations

- There is no login or role-based access control.
- Card data is stored in a local JSON file rather than a database.
- Saving contacts depends on browser and device support and always requires user confirmation.
- The enquiry form opens the visitor's email application; it does not send or store enquiries on the server.
- WhatsApp and social sharing links depend on the corresponding app or website being available.


