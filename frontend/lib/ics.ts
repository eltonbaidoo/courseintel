export type CalendarEvent = {
  uid: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location?: string;
  description?: string;
  source?: "upload" | "url";
};

function unfoldIcsLines(ics: string): string[] {
  const raw = ics.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDate(value: string): { iso: string; allDay: boolean } | null {
  const v = value.trim();
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return { iso: dt.toISOString(), allDay: true };
  }

  if (/^\d{8}T\d{6}Z$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const hh = Number(v.slice(9, 11));
    const mm = Number(v.slice(11, 13));
    const ss = Number(v.slice(13, 15));
    const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
    return { iso: dt.toISOString(), allDay: false };
  }

  if (/^\d{8}T\d{6}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const hh = Number(v.slice(9, 11));
    const mm = Number(v.slice(11, 13));
    const ss = Number(v.slice(13, 15));
    const dt = new Date(y, m - 1, d, hh, mm, ss);
    return { iso: dt.toISOString(), allDay: false };
  }

  return null;
}

function readValue(line: string): string {
  const idx = line.indexOf(":");
  return idx >= 0 ? line.slice(idx + 1).trim() : "";
}

export function parseIcs(ics: string): CalendarEvent[] {
  const lines = unfoldIcsLines(ics);
  const events: CalendarEvent[] = [];
  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && current.start && current.title) {
        events.push({
          uid: current.uid ?? `${current.title}-${current.start}`,
          title: current.title,
          start: current.start,
          end: current.end ?? null,
          allDay: Boolean(current.allDay),
          location: current.location,
          description: current.description,
          source: current.source,
        });
      }
      inEvent = false;
      current = {};
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("UID")) {
      current.uid = readValue(line);
    } else if (line.startsWith("SUMMARY")) {
      current.title = readValue(line);
    } else if (line.startsWith("LOCATION")) {
      current.location = readValue(line);
    } else if (line.startsWith("DESCRIPTION")) {
      current.description = readValue(line).replace(/\\n/g, "\n");
    } else if (line.startsWith("DTSTART")) {
      const parsed = parseIcsDate(readValue(line));
      if (parsed) {
        current.start = parsed.iso;
        current.allDay = parsed.allDay;
      }
    } else if (line.startsWith("DTEND")) {
      const parsed = parseIcsDate(readValue(line));
      if (parsed) current.end = parsed.iso;
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
