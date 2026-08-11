# Valodu Mājas bibliotēka

Static, accessible catalogue for GitHub Pages. Data comes from a Google Sheets spreadsheet through a read-only Google Apps Script web API. Search, filters, sorting, pagination, grid/list views, pins, dark mode, language choice, and font-size controls run in the browser.

## 1. Deploy the API

1. Open the Google Sheet and choose **Extensions → Apps Script**.
2. Replace `Code.gs` with [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. Confirm the spreadsheet ID, sheet name, and Drive folder ID in `CONFIG`.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**. The endpoint exposes only the normalized catalogue fields, not the spreadsheet itself.
6. Authorize Sheets and Drive access, deploy, and copy the URL ending in `/exec`.
7. Paste that URL into `apiUrl` in [`config.js`](config.js).

Cover thumbnails use Google Drive file IDs. For covers to display to visitors, share the cover folder/files as **Anyone with the link — Viewer**. If covers must remain private, copy optimized cover images into `assets/covers/` in this repository and set a public `cover` path in the API instead; a public GitHub Pages site cannot silently read private Drive images.

## 2. Publish on GitHub Pages

1. Create an empty GitHub repository and upload/push this folder.
2. In the repository open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then save.
4. Open the URL GitHub shows after deployment.

No build step or secret is required. Do not put private credentials in `config.js`; the Apps Script URL is a public read-only endpoint by design.

## Local preview

Run a static server from this directory (for example `python -m http.server 8080`) and open `http://localhost:8080`. With an empty `apiUrl`, the interface uses a small workbook-derived sample so it can be reviewed before deployment.

## Spreadsheet mapping

The API recognizes the current workbook headers (`Bok-ID`, `Tittel på boka`, `Navn på forfatteren…`, `Årstall`, `Språk`, `Undertema`, `Eksemplar`, and `Filnavn`) plus Latvian/English alternatives. Optional columns such as `Līmenis`, `Materiāla veids`, and `Mērķauditorija` are included automatically when added.
