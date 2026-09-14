# IGE Invoice Web Platform Demo

A Vercel-ready web dashboard that sits **in front of the existing centralized IGE Apps Script invoice backend**.

## Why this approach

The current Apps Script system is working and operational. This demo does not replace or modify that production flow.

`IGE Staff Web Dashboard → Vercel server API → Existing Central Apps Script → Existing Registry / Recipient Form / PDF / Email / Lock`

This lets the team evaluate a proper web-platform workflow without risking the working invoice generator.

## Demo features

- Dashboard with recent invoice requests
- Create invoice in a web interface
- Project / invoice / date / currency
- Paid services table with automatic totals
- Finance To + CC routing
- Payment method enable/disable controls
- Recipient Show / Required controls
- Secure invoice-link generation using the current Central Apps Script
- Prepared copy/paste message
- Central backend health indicator
- Browser-local demo history

## Vercel setup

1. Import the GitHub repository into Vercel.
2. Select branch `invoice-web-platform-demo`.
3. Set **Root Directory** to `web-platform-demo`.
4. Add server environment variables:

```env
IGE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
IGE_REGISTRATION_KEY=YOUR_REGISTRATION_KEY
IGE_DEMO_MODE=false
```

5. Deploy.

The registration key stays server-side in Vercel. It is never exposed to the browser.

## UI-only demo without connecting production

Set:

```env
IGE_DEMO_MODE=true
```

The app will generate fake demo invoice links and can be presented safely.

## Production direction after approval

- Google Workspace login restricted to approved IGE users
- persistent project database
- project owners + permissions
- invoice statuses and payment tracking
- finance approvals
- search / filter / export
- audit trail
- notification center
- migration away from Google Sheets as the staff UI
- keep the recipient-facing branded invoice form and PDF/email workflow
