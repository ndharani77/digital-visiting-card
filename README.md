# Cardify — Complete Digital Visiting Card Starter

A working Next.js + TypeScript + Tailwind CSS project for creating digital visiting cards, opening a public card page from a QR code, and sharing contact details.

## Features included
- Dashboard with live counts from stored cards
- Contact details form with required-field and email validation
- Stores card details in `data/cards.json`
- My Cards listing
- Import contacts from an Excel `.xlsx` workbook, validate rows, and generate a QR code for each saved contact
- Select saved cards and export their full-name QR codes as PNG, JPG, or PDF files to a selected folder where supported, or as a ZIP download in other browsers
- Edit or delete cards from the card actions menu
- QR code generated from saved contact details
- Scanning the QR code opens the public contact page with Save Contact and WhatsApp actions
- Save Contact action that opens native contact creation on Android and the contact share sheet on supported iOS browsers; the user must confirm saving
- WhatsApp action that opens a chat with a prefilled greeting

## Requirements
- Node.js 20.9+
- npm

## Run on Windows / VS Code
1. Extract the ZIP.
2. Open the `digital-visiting-card-complete` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Visit `http://localhost:3000`.

## Test the workflow
1. Click **Create Card**.
2. Fill the required fields and submit.
3. The app saves the contact details and displays the QR code.
4. Display the QR code on a screen or print it.
5. Scan the QR code with a phone camera to open the same public contact page.
6. Choose **Save Contact** or **WhatsApp**. Save Contact opens the phone's contact creation/sharing flow; review the details and confirm Save in Contacts. Websites cannot write to a phone's contacts without user confirmation. WhatsApp opens a chat with this contact.
7. To import multiple contacts, choose **Import from Excel** in Management, download the template, fill it in Excel, and upload the `.xlsx` workbook. Review the rows and import valid contacts; each saved row links to its QR code.

## Data storage note
This starter uses a JSON file (`data/cards.json`) so it runs locally without requiring a separate database installation. It is suitable for local development and a single persistent Node.js server. For production deployments with multiple instances/serverless hosting, replace this file store with PostgreSQL or another persistent database.

## QR code / phone testing note
The QR code opens the card's public page, so the phone must be able to reach the website. Use a deployed public URL or a LAN address reachable from the phone; `localhost` on the computer is not reachable from another device.

## Current limitations
- No login or role-based access control
- No image/logo upload yet
- No analytics for actual QR scans
- Saving contacts requires a browser that supports sharing files and confirmation in the phone's Contacts app.
- WhatsApp must be available to open the chat in its app; otherwise the link may open WhatsApp Web or show its sign-in page.
