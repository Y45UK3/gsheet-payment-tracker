import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.IGE_APPS_SCRIPT_URL?.trim();
  const registrationKey = process.env.IGE_REGISTRATION_KEY?.trim();
  const demoMode = process.env.IGE_DEMO_MODE === "true";

  if (demoMode) {
    return NextResponse.json({ ok: true, demo: true, version: "demo", backend: "DEMO" });
  }

  if (!url || !registrationKey) {
    return NextResponse.json(
      { ok: false, error: "Backend environment variables are not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping", registrationKey }),
      cache: "no-store",
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Central backend returned a non-JSON response." },
        { status: 502 }
      );
    }

    const ok = response.ok && data?.success === true && data?.action === "ping" && data?.backend === "PASS";

    return NextResponse.json(
      {
        ok,
        version: data?.version ?? "unknown",
        backend: data?.backend ?? "unknown",
        status: data?.status ?? "unknown",
      },
      { status: ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Health check failed." },
      { status: 502 }
    );
  }
}
