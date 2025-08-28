# Google Sheet Payment Tracker

## Overview
A Google Apps Script to monitor multiple Google Sheets for payment deadlines.  
Highlights rows based on payment status and sends **Discord alerts** and **daily email summaries**.

### Features

- Highlights rows:
  - Upcoming: light yellow
  - Due today: bright yellow
  - Overdue: red
  - Paid: white
- Sends Discord alerts for non-paid items
- Sends daily HTML email summaries
- Supports multiple sheets and tabs
- Configurable alert threshold (`ALERT_DAYS_BEFORE`)

### Configuration

Edit `SHEETS_TO_MONITOR` to include your sheet URLs, tab names, email, and webhook:

```javascript
const SHEETS_TO_MONITOR = [
  {
    url: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID",
    tabName: "Actuals",
    email: "your-email@example.com",
    webhook: "YOUR_DISCORD_WEBHOOK_URL"
  }
];

