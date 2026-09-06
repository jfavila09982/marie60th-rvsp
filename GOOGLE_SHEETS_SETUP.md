# Connect the RSVP form to Google Sheets

The spreadsheet stays private. Only the Apps Script web app is public, allowing the RSVP page to add rows and read the guest names it displays.

1. Create a Google Sheet for the event.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with [`google-apps-script/Code.gs`](google-apps-script/Code.gs), then save.
4. Select **Deploy → New deployment → Web app**.
5. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
6. Deploy, approve the requested spreadsheet permission, and copy the URL ending in `/exec`.
7. In [`index.html`](index.html), replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

The script uses the spreadsheet it is attached to and writes to `Sheet1`, creating its header row automatically after the first request. Whenever you change `Code.gs`, edit the existing deployment and select **New version**; editing the spreadsheet itself does not require redeployment.

The guest-list read uses JSONP because Google Apps Script web apps do not include browser CORS headers. RSVP writes use a standard form-style request and refresh the JSONP list afterward.

## Privacy note

The public RSVP page displays the names, attendance status, party size, and family-member names returned by the script. Do not collect phone numbers, email addresses, or other private information through this public list endpoint.
