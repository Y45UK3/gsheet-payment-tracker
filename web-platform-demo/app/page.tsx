"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CONFIRMATION,
  DEFAULT_VERIFICATION,
  FIELD_DEFAULTS,
  PAYMENT_METHODS,
} from "@/lib/constants";
import type {
  FieldConfig,
  GeneratedInvoice,
  InvoiceDraft,
  ServiceItem,
} from "@/lib/types";

const emptyService = (): ServiceItem => ({ quantity: "1", description: "", unitPrice: "", total: "" });

const initialDraft = (): InvoiceDraft => ({
  formTitle: "InGame Esports Invoice Generator",
  project: "",
  invoice: "",
  date: new Date().toISOString().slice(0, 10),
  currency: "USD",
  amount: "0.00",
  showServices: true,
  services: [emptyService()],
  fields: FIELD_DEFAULTS.map((x) => ({ ...x })),
  paymentMethods: [...PAYMENT_METHODS],
  routing: { to: "finance@ingame.lk", cc: [] },
  text: {
    verificationText: DEFAULT_VERIFICATION,
    verificationCheckboxLabel: DEFAULT_CONFIRMATION,
  },
});

function money(value: string) {
  const n = Number(String(value || "0").replaceAll(",", ""));
  return Number.isFinite(n) ? n : 0;
}

export default function HomePage() {
  const [tab, setTab] = useState<"dashboard" | "builder">("dashboard");
  const [draft, setDraft] = useState<InvoiceDraft>(() => initialDraft());
  const [history, setHistory] = useState<GeneratedInvoice[]>([]);
  const [health, setHealth] = useState<{ loading: boolean; ok: boolean; version?: string; backend?: string; error?: string }>({ loading: true, ok: false });
  const [busy, setBusy] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ige_invoice_demo_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
    checkHealth();
  }, []);

  useEffect(() => {
    localStorage.setItem("ige_invoice_demo_history", JSON.stringify(history));
  }, [history]);

  const calculatedTotal = useMemo(
    () => draft.services.reduce((sum, item) => sum + money(item.total), 0),
    [draft.services]
  );

  useEffect(() => {
    if (draft.showServices) {
      setDraft((prev) => ({ ...prev, amount: calculatedTotal.toFixed(2) }));
    }
  }, [calculatedTotal, draft.showServices]);

  async function checkHealth() {
    setHealth({ loading: true, ok: false });
    try {
      const response = await fetch("/api/ige/health", { cache: "no-store" });
      const data = await response.json();
      setHealth({ loading: false, ok: Boolean(data.ok), version: data.version, backend: data.backend, error: data.error });
    } catch {
      setHealth({ loading: false, ok: false, error: "Unable to reach the platform backend." });
    }
  }

  function updateService(index: number, key: keyof ServiceItem, value: string) {
    setDraft((prev) => {
      const next = prev.services.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: value };
        if (key === "quantity" || key === "unitPrice") {
          updated.total = (money(updated.quantity) * money(updated.unitPrice)).toFixed(2);
        }
        return updated;
      });
      return { ...prev, services: next };
    });
  }

  function toggleField(index: number, key: "show" | "required") {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) =>
        i === index
          ? { ...field, [key]: !field[key], ...(key === "show" && field.show ? { required: false } : {}) }
          : field
      ),
    }));
  }

  async function generateInvoice() {
    setNotice("");
    setGeneratedLink("");

    if (!draft.project.trim() || !draft.invoice.trim() || !draft.date || !draft.routing.to.trim()) {
      setNotice("Complete Project, Invoice Number, Invoice Date and Finance Email.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/ige/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            formTitle: draft.formTitle,
            project: draft.project,
            invoice: draft.invoice,
            date: draft.date,
            currency: draft.currency,
            amount: draft.amount,
            showServices: draft.showServices,
            services: draft.services.filter((s) => s.description.trim() || money(s.total) > 0).slice(0, 10),
            fields: draft.fields,
            paymentMethods: draft.paymentMethods,
            text: draft.text,
          },
          routing: { to: draft.routing.to, cc: draft.routing.cc.filter(Boolean) },
        }),
      });

      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || "Secure invoice link could not be generated.");

      setGeneratedLink(data.url);
      setNotice("Secure invoice link generated successfully.");
      const record: GeneratedInvoice = {
        id: crypto.randomUUID(),
        project: draft.project,
        invoice: draft.invoice,
        date: draft.date,
        currency: draft.currency,
        amount: draft.amount,
        link: data.url,
        createdAt: new Date().toISOString(),
        status: "Open",
      };
      setHistory((prev) => [record, ...prev.filter((x) => x.invoice !== record.invoice)]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invoice generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setNotice("Copied to clipboard.");
  }

  const message = generatedLink
    ? `Hi,\n\nYour invoice request for ${draft.project} is ready.\n\nPlease complete and submit the invoice form using the link below:\n${generatedLink}\n\nInvoice details:\n- Project / Event: ${draft.project}\n- Invoice Date: ${draft.date}\n- Amount: ${draft.currency} ${Number(draft.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nPlease review the pre-filled information and enter all remaining required details accurately. Once submitted, you will receive a confirmation email with a copy of your invoice.\n\nThis invoice link can be submitted once. If any correction is required after submission, contact support@ingame.lk.\n\nYou will be notified separately once the payment has been processed.\n\nRegards,\nIGE Finance Team`
    : "";

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <img src="https://raw.githubusercontent.com/Y45UK3/gsheet-payment-tracker/main/assets/ingame-global-favicon-exact.png" alt="IGE" className="brandIcon" />
          <div><strong>IGE Invoice</strong><span>Platform Demo</span></div>
        </div>
        <nav className="navList">
          <button className={tab === "dashboard" ? "navItem active" : "navItem"} onClick={() => setTab("dashboard")}>Dashboard</button>
          <button className={tab === "builder" ? "navItem active" : "navItem"} onClick={() => setTab("builder")}>Create Invoice</button>
        </nav>
        <div className="systemCard">
          <div className="systemRow"><span className={health.ok ? "dot ok" : "dot"} /><strong>{health.loading ? "Checking system..." : health.ok ? "System Online" : "System Offline"}</strong></div>
          <small>{health.ok ? `Central ${health.version ?? ""} · Backend ${health.backend ?? ""}` : health.error ?? "Backend check failed"}</small>
          <button className="linkButton" onClick={checkHealth}>Recheck</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">INGAME ESPORTS · FINANCE OPERATIONS</p><h1>{tab === "dashboard" ? "Invoice Dashboard" : "Create Invoice"}</h1></div>
          <button className="primaryButton" onClick={() => setTab("builder")}>+ New Invoice</button>
        </header>

        {tab === "dashboard" ? (
          <Dashboard history={history} healthOk={health.ok} onOpenBuilder={() => setTab("builder")} />
        ) : (
          <section className="builderGrid">
            <div className="panel formPanel">
              <div className="panelHeader"><div><p className="eyebrow">INVOICE SETUP</p><h2>Invoice details</h2></div><span className="badge">Demo Web Platform</span></div>

              <div className="sectionBlock">
                <h3>Project & Finance</h3>
                <div className="fieldsGrid">
                  <label>Project / Event<input value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} placeholder="2026 EWC - RJC Coverage Campaign" /></label>
                  <label>Invoice Number<input value={draft.invoice} onChange={(e) => setDraft({ ...draft, invoice: e.target.value })} placeholder="EWC-RJC-001" /></label>
                  <label>Invoice Date<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
                  <label>Currency<select value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>{["USD", "LKR", "EUR", "GBP", "INR", "KES", "ZAR", "AED"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
                  <label>Finance Email<input type="email" value={draft.routing.to} onChange={(e) => setDraft({ ...draft, routing: { ...draft.routing, to: e.target.value } })} /></label>
                  <label>CC Emails<input value={draft.routing.cc.join(", ")} onChange={(e) => setDraft({ ...draft, routing: { ...draft.routing, cc: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} placeholder="name@ingame.lk, second@ingame.lk" /></label>
                </div>
              </div>

              <div className="sectionBlock">
                <div className="sectionTitleRow"><div><h3>Paid Services</h3><p>Itemize the invoice or keep a single total amount.</p></div><label className="switchLine"><input type="checkbox" checked={draft.showServices} onChange={(e) => setDraft({ ...draft, showServices: e.target.checked })} />Show table</label></div>
                {draft.showServices ? (
                  <div className="services">
                    {draft.services.map((item, index) => (
                      <div className="serviceRow" key={index}>
                        <input value={item.quantity} onChange={(e) => updateService(index, "quantity", e.target.value)} placeholder="Qty" />
                        <input value={item.description} onChange={(e) => updateService(index, "description", e.target.value)} placeholder="Description" />
                        <input value={item.unitPrice} onChange={(e) => updateService(index, "unitPrice", e.target.value)} placeholder="Unit price" />
                        <input value={item.total} readOnly placeholder="Total" />
                        <button className="iconButton" onClick={() => setDraft((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }))} disabled={draft.services.length === 1} aria-label="Remove service">×</button>
                      </div>
                    ))}
                    <button className="secondaryButton" disabled={draft.services.length >= 10} onClick={() => setDraft((prev) => ({ ...prev, services: [...prev.services, emptyService()] }))}>+ Add service</button>
                  </div>
                ) : (
                  <label className="singleAmount">Total Amount<input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></label>
                )}
                <div className="totalStrip"><span>Invoice Total</span><strong>{draft.currency} {Number(draft.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
              </div>

              <div className="sectionBlock">
                <h3>Payment Methods</h3>
                <div className="choiceGrid">{PAYMENT_METHODS.map((method) => <label className="choiceCard" key={method}><input type="checkbox" checked={draft.paymentMethods.includes(method)} onChange={() => setDraft((prev) => ({ ...prev, paymentMethods: prev.paymentMethods.includes(method) ? prev.paymentMethods.filter((x) => x !== method) : [...prev.paymentMethods, method] }))} /><span>{method}</span></label>)}</div>
              </div>

              <details className="sectionBlock">
                <summary>Recipient Field Configuration</summary>
                <div className="fieldTable">
                  <div className="fieldTableHead"><span>Field</span><span>Show</span><span>Required</span></div>
                  {draft.fields.map((field: FieldConfig, index: number) => <div className="fieldTableRow" key={field.key}><span>{field.label}</span><input type="checkbox" checked={field.show} onChange={() => toggleField(index, "show")} /><input type="checkbox" checked={field.required} disabled={!field.show} onChange={() => toggleField(index, "required")} /></div>)}
                </div>
              </details>

              <div className="actionBar"><div>{notice && <p className="notice">{notice}</p>}</div><button className="primaryButton large" disabled={busy} onClick={generateInvoice}>{busy ? "Generating..." : "Generate Secure Invoice Link"}</button></div>
            </div>

            <aside className="panel previewPanel">
              <p className="eyebrow">LIVE OUTPUT</p><h2>Share with payee</h2>
              {!generatedLink ? (
                <div className="emptyPreview"><div className="previewIcon">↗</div><strong>Secure link will appear here</strong><p>Complete the invoice details and generate the link. The platform will use the existing centralized IGE backend.</p></div>
              ) : (
                <>
                  <div className="successBox"><span className="successDot">✓</span><div><strong>Invoice ready</strong><p>Secure one-time link generated successfully.</p></div></div>
                  <div className="linkCard"><span>Secure Invoice Link</span><a href={generatedLink} target="_blank" rel="noreferrer">{generatedLink}</a><button className="secondaryButton" onClick={() => copy(generatedLink)}>Copy link</button></div>
                  <div className="messageCard"><div className="sectionTitleRow"><strong>Prepared Message</strong><button className="linkButton" onClick={() => copy(message)}>Copy message</button></div><pre>{message}</pre></div>
                </>
              )}
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}

function Dashboard({ history, healthOk, onOpenBuilder }: { history: GeneratedInvoice[]; healthOk: boolean; onOpenBuilder: () => void }) {
  const totalValue = history.reduce((sum, item) => sum + money(item.amount), 0);
  return (
    <section>
      <div className="statsGrid">
        <div className="statCard"><span>Total Invoices</span><strong>{history.length}</strong><small>Generated from this browser</small></div>
        <div className="statCard"><span>Open Requests</span><strong>{history.filter((x) => x.status === "Open").length}</strong><small>Awaiting submission</small></div>
        <div className="statCard"><span>Tracked Value</span><strong>USD {totalValue.toLocaleString()}</strong><small>Demo dashboard total</small></div>
        <div className="statCard"><span>Central System</span><strong className={healthOk ? "onlineText" : "offlineText"}>{healthOk ? "Online" : "Check"}</strong><small>Apps Script backend</small></div>
      </div>
      <div className="dashboardGrid">
        <div className="panel">
          <div className="panelHeader"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Invoices</h2></div><button className="secondaryButton" onClick={onOpenBuilder}>Create invoice</button></div>
          {history.length === 0 ? <div className="emptyTable"><strong>No invoices generated yet</strong><p>Create your first invoice from the web platform.</p></div> : <div className="invoiceTable"><div className="invoiceTableHead"><span>Invoice</span><span>Project</span><span>Amount</span><span>Status</span><span></span></div>{history.slice(0, 8).map((item) => <div className="invoiceTableRow" key={item.id}><div><strong>{item.invoice}</strong><small>{item.date}</small></div><span>{item.project}</span><strong>{item.currency} {Number(item.amount).toLocaleString()}</strong><span className="statusPill">{item.status}</span><a href={item.link} target="_blank" rel="noreferrer">Open ↗</a></div>)}</div>}
        </div>
        <aside className="panel"><p className="eyebrow">PLATFORM DIRECTION</p><h2>Web-first workflow</h2><div className="roadmap"><div><span className="step done">1</span><p><strong>Demo Platform</strong><small>Vercel-ready web dashboard using the current backend.</small></p></div><div><span className="step">2</span><p><strong>IGE Google Login</strong><small>Restrict staff access to approved company accounts.</small></p></div><div><span className="step">3</span><p><strong>Central Database</strong><small>Projects, owners, invoice statuses and audit history.</small></p></div><div><span className="step">4</span><p><strong>Finance Workflow</strong><small>Approval, payment status and reporting from one platform.</small></p></div></div></aside>
      </div>
    </section>
  );
}
