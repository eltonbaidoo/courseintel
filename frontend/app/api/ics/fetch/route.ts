import { NextResponse } from "next/server";

const MAX_ICS_BYTES = 1024 * 1024; // 1 MB

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const rawUrl = (body.url ?? "").trim();
    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(parsed.toString(), { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Calendar URL request failed (${res.status})` },
        { status: 400 },
      );
    }

    const text = await res.text();
    if (text.length > MAX_ICS_BYTES) {
      return NextResponse.json({ error: "ICS file is too large (max 1 MB)" }, { status: 413 });
    }
    if (!text.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json({ error: "URL does not look like an ICS calendar" }, { status: 422 });
    }

    return NextResponse.json({ ics: text });
  } catch {
    return NextResponse.json({ error: "Could not fetch calendar URL" }, { status: 500 });
  }
}
