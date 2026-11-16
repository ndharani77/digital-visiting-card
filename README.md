# Digital Visiting Card

A working digital visiting card application built with Next.js, TypeScript, and Tailwind CSS. Create and manage contact cards, share them with QR codes, import contacts in bulk, and export QR codes for printing or distribution.

## Features

- Dashboard with card counts and card search
- Create, edit, and delete digital visiting cards with field validation
- Unique QR code and shareable contact page for each card
- Contact page actions to save contact details or start a WhatsApp chat
- Import contacts from an Excel workbook, review validation results, and save valid rows
- Download a contact import template
- Select cards and export their QR codes as PNG, JPG, or PDF, or download them together as a ZIP
- Responsive layout for desktop and mobile

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

The production server listens on port 3000 by default.

## Using the application

1. Select **Create Card**, enter the contact information, and save.
2. Use the generated QR code or card link to share the contact page.
3. On the contact page, choose **Save Contact** or **WhatsApp**. Saving a contact requires confirmation in the device's contacts app or share sheet.
4. Use **My Cards** to find, edit, or delete saved cards.
5. To add multiple contacts, choose **Import from Excel**, download the template, fill it in, upload the workbook, review the rows, and import the valid contacts.
6. To export QR codes in bulk, open **Export QR**, select cards, and choose a format and download option.

## Data storage and deployment

Cards are stored in `data/cards.json`. The app creates this file if it does not exist. Keep this file and its containing directory writable, and back it up if the card data matters.

This file-based store is suitable for local development and a single persistent Node.js server. It is not suitable for serverless deployments, multiple application instances, or environments with ephemeral filesystems. For those deployments, use a shared persistent database.

To open a card from another device, the device must be able to reach the server. `localhost` only refers to the current device; use a deployed public address or a LAN address reachable by the phone.

## Current limitations

- There is no login or role-based access control.
- Card data is stored in a local JSON file rather than a database.
- Saving contacts depends on browser and device support and always requires user confirmation.
- WhatsApp links open in the WhatsApp app when available, or in WhatsApp Web.
