# Play Store Review Exporter

A Chrome Extension for exporting Google Play Store app reviews to CSV or JSON.

The extension runs on Google Play app pages, opens the reviews dialog, loads reviews in the browser, extracts the review text and metadata, and downloads the result locally.

## Why I Built This

I wanted a simple way to collect Play Store reviews without copying them one by one.

Reading reviews manually gets tedious pretty quickly, especially when looking at larger apps or comparing feedback across releases. A lot of existing review export tools are either paid, tied to dashboards, or more complicated than I needed.

So I built this as a small browser-based exporter. It does one job: open a Play Store app page, load reviews, and save them in a format I can use in a spreadsheet or script.

## Features

- Works on Google Play Store app pages
- Opens the Ratings & Reviews dialog automatically
- Loads reviews by scrolling the reviews dialog
- Lets you choose a review limit:
  - 100
  - 500
  - 1000
  - 5000
  - All Loaded
- Exports reviews as CSV
- Exports reviews as JSON
- Shows loading progress in the popup
- Shows the number of reviews loaded and exported
- Downloads the file locally through the browser
- Uses Manifest V3

## How It Works

The project is a Chrome Extension built with plain JavaScript.

When the user clicks the export button, the popup injects a content script into the active Google Play app page. The content script looks for the Ratings & Reviews button, opens the review dialog, and scrolls the review container until the selected limit is reached or no more reviews appear.

After loading, the script extracts structured review data from the page:

- username
- rating
- date
- review text

The extracted reviews are then converted into either CSV or JSON and downloaded locally. There is no backend server involved.

## Project Structure

```text
.
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
└── assets/
    └── icons/
```

### `manifest.json`

Defines the Chrome Extension metadata, permissions, popup entry point, and icons.

### `popup.html`

Contains the popup UI shown when the extension icon is clicked.

### `popup.css`

Styles the popup interface.

### `popup.js`

Handles popup state, page detection, export settings, progress updates, and script injection.

### `content.js`

Runs inside the Google Play page. It opens the reviews dialog, loads reviews, extracts data, and creates the export file.

## Installation

1. Clone this repository:

```bash
git clone https://github.com/your-username/play-store-review-exporter.git
```

2. Open Chrome and go to:

```text
chrome://extensions
```

3. Turn on **Developer mode**.

4. Click **Load unpacked**.

5. Select the project folder.

6. Pin the extension from the Chrome extensions menu if you want quick access.

## Usage

1. Open a Google Play Store app page.

Example:

```text
https://play.google.com/store/apps/details?id=com.example.app
```

2. Click the extension icon.

3. Choose how many reviews to export.

4. Choose the export format: CSV or JSON.

5. Click **Export Reviews**.

6. Wait while the extension opens the reviews dialog and loads reviews.

7. The exported file will download automatically.

## Limitations

- The extension depends on the current Google Play web UI. If Google changes the page markup, the selectors may need to be updated.
- Very large apps can take longer because reviews are loaded by scrolling the browser UI.
- The extension only extracts reviews that are visible or loadable from the web page.
- It runs entirely in the browser, so performance depends on the current tab and machine.
- It does not use the official Google Play Developer API.
- It is intended for publicly visible review data on pages the user opens manually.

## Screenshots

### Popup UI

Add a screenshot of the extension popup here.

```text
docs/screenshots/popup-ui.png
```

### Export Progress

Add a screenshot showing the progress bar while reviews are loading.

```text
docs/screenshots/export-progress.png
```

### CSV Output

Add a screenshot showing the exported CSV opened in a spreadsheet.

```text
docs/screenshots/csv-output.png
```

## Future Improvements

- Add a cancel button for long exports
- Use app name and date in exported filenames
- Add exported timestamp and app metadata to JSON output
- Improve error handling when Google Play changes its review dialog markup
- Add a small options page for default export settings
- Add basic automated tests for CSV and JSON formatting

## Tech Stack

- JavaScript
- HTML
- CSS
- Chrome Extensions Manifest V3
- Chrome `scripting` API
- Chrome `downloads` permission

## License

MIT License
# PlayStore-Review-Extractor
