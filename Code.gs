// ================= CONFIGURATION =================
const SHEETS_TO_MONITOR = [
  {
    url: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID", // placeholder only
    tabName: "Actuals",
    email: "your-email@example.com",
    webhook: "YOUR_DISCORD_WEBHOOK_URL"
  },
  {
    url: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_2", // placeholder only
    tabName: "Actuals",
    email: "your-email@example.com",
    webhook: "YOUR_DISCORD_WEBHOOK_URL"
  }
];

const PAYEE_COL = 2;
const DUE_DATE_COL = 8;
const STATUS_COL = 11;
const ALERT_DAYS_BEFORE = 5;
const DISCORD_TAG_UID = "YOUR_DISCORD_USER_ID";

const COLOR_WARNING = "#FFF3CD";
const COLOR_TODAY = "#FFD966";
const COLOR_OVERDUE = "#F8D7DA";
const COLOR_CLEARED = "#FFFFFF";
// ==================================================

// ============== MASTER FUNCTION ==================
function checkAllFinanceSheets() {
  let summary = { upcoming: [], today: [], overdue: [] };

  SHEETS_TO_MONITOR.forEach(sheetConfig => {
    const sheetSummary = checkPaymentDeadlines(
      sheetConfig.url,
      sheetConfig.tabName,
      sheetConfig.email,
      sheetConfig.webhook
    );
    summary.upcoming.push(...sheetSummary.upcoming);
    summary.today.push(...sheetSummary.today);
    summary.overdue.push(...sheetSummary.overdue);
  });

  if (summary.upcoming.length || summary.today.length || summary.overdue.length) {
    sendDailySummaryEmail(summary);
  }
}

// ============== PAYMENT CHECK FUNCTION ===========
function checkPaymentDeadlines(sheetUrl, sheetName, email, webhook) {
  const ss = SpreadsheetApp.openByUrl(sheetUrl);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const projectName = ss.getName();

  let sheetSummary = { upcoming: [], today: [], overdue: [] };

  for (let i = 1; i < data.length; i++) {
    if (i === 2) continue; // skip row 3

    const payee = data[i][PAYEE_COL - 1];
    const dueDateText = data[i][DUE_DATE_COL - 1];
    const statusRaw = (data[i][STATUS_COL - 1] || "").toLowerCase();
    const status = statusRaw === "paid" ? "Paid" : "Not Paid";

    if (!dueDateText) continue;
    const dueDate = new Date(dueDateText);
    if (isNaN(dueDate)) continue;

    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    let color = COLOR_CLEARED;

    if (statusRaw === "paid") {
      color = COLOR_CLEARED;
    } else if (diffDays > 0 && diffDays <= ALERT_DAYS_BEFORE) {
      color = COLOR_WARNING;
      sheetSummary.upcoming.push({ payee, status, dueDateText, overdueDays: 0, project: projectName });
    } else if (diffDays === 0) {
      color = COLOR_TODAY;
      sheetSummary.today.push({ payee, status, dueDateText, overdueDays: 0, project: projectName });
    } else if (diffDays < 0 && statusRaw !== "paid") {
      color = COLOR_OVERDUE;
      sheetSummary.overdue.push({ payee, status, dueDateText, overdueDays: Math.abs(diffDays), project: projectName });
    }

    sheet.getRange(i + 1, 1, 1, sheet.getLastColumn()).setBackground(color);

    if (statusRaw !== "paid" && webhook) {
      const messageDetails = {
        payee: payee,
        status: status,
        dueDate: dueDateText,
        overdueDays: diffDays < 0 ? Math.abs(diffDays) : 0
      };
      sendDiscordAlert(messageDetails, webhook, projectName);
      Utilities.sleep(10000);
    }
  }

  return sheetSummary;
}

// ============== DISCORD ALERT FUNCTION ============
function sendDiscordAlert(messageDetails, webhook, projectName) {
  const statusEmoji = messageDetails.status === "Paid" ? "✅" : "❌";
  let overdueText = "";
  if (messageDetails.overdueDays && messageDetails.overdueDays > 0) {
    overdueText = `- Overdue: ${messageDetails.overdueDays} day(s)`;
  }

  const discordMessage = 
`## PAYMENT ALERT 🚨

- Project: **${projectName}**
- Payee: ${messageDetails.payee}
- Status: ${statusEmoji} ${messageDetails.status}
- Due Date: ${messageDetails.dueDate}
${overdueText}

⚠️ Action Required: Please arrange payment immediately to avoid further delays. <@${DISCORD_TAG_UID}>`;

  UrlFetchApp.fetch(webhook, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ content: discordMessage })
  });
}

// ============== DAILY SUMMARY EMAIL ==============
function sendDailySummaryEmail(summary) {
  let body = "<h2 style='color:#b71c1c;'>⚠️ PAYMENT STATUS ALERT</h2>";
  body += "<p>Dear Finance Team,</p>";

  function addSection(title, list, showOverdue) {
    if (list.length) {
      body += `<h3 style="color:#d84315;">${title}</h3><pre>`;
      list.forEach(item => {
        body += `Project: ${item.project} | Payee: ${item.payee} | Due Date: ${item.dueDate} | Status: ${item.status}`;
        if (showOverdue && item.overdueDays) body += ` | Overdue: ${item.overdueDays} day(s)`;
        body += "\n";
      });
      body += "</pre>";
    }
  }

  addSection("⏳ Upcoming Payments", summary.upcoming, false);
  addSection("⚠️ Payments Due Today", summary.today, false);
  addSection("❗ Overdue Payments", summary.overdue, true);

  body += "<p>Please arrange payments accordingly.</p>";
  body += "<p>— Payment Status Tracker</p>";

  MailApp.sendEmail({
    to: "your-email@example.com",
    subject: "⚠️ Daily Payment Status Alert",
    htmlBody: body,
    name: "Payment Status Tracker"
  });
}
