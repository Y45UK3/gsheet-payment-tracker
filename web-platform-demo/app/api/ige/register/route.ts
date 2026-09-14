import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.IGE_APPS_SCRIPT_URL?.trim();
  const registrationKey = process.env.IGE_REGISTRATION_KEY?.trim();
  const demoMode = process.env.IGE_DEMO_MODE === "true";

  const body = await request.json();

  if (demoMode) {
    const token = crypto.randomUUID().replaceAll("-", "").slice(0, 18);
    return NextResponse.json({
      success: true,
      token,
      url: `https://demo.invoice.ingame.global/?t=${token}`,
      version: "demo",
      demo: true,
    });
  }

  if (!url || !registrationKey) {
    return NextResponse.json(
      { success: false, error: "Central backend is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        registrationKey,
        config: body.config,
        routing: body.routing,
      }),
      cache: "no-store",
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: "The Central Web App returned a non-JSON response." },
        { status: 502 }
      );
    }

    if (!response.ok || data?.success !== true || !data?.token) {
      return NextResponse.json(
        { success: false, error: data?.error ?? `Central backend returned HTTP ${response.status}.` },
        { status: 502 }
      );
    }

    const publicUrl = `${url.replace(/[?&]+$/g, "")}?t=${encodeURIComponent(String(data.token))}`;

    return NextResponse.json({
      success: true,
      token: data.token,
      url: publicUrl,
      version: data.version ?? "unknown",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Registration failed." },
      { status: 502 }
    );
  }
}
