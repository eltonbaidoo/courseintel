/**
 * Unit tests for content/scraper.ts
 *
 * Tests DOM scraping logic for each supported LMS platform using realistic
 * HTML structures matching actual Gradescope, Canvas, and Brightspace DOM
 * layouts. Runs in jsdom (no browser required).
 */

import {
  detectPlatform,
  scrapeGradescope,
  scrapeCanvas,
  scrapeBrightspace,
  scrapeGeneric,
  type ScrapedItem,
} from "../src/content/scraper";

// ── Helpers ──────────────────────────────────────────────────────────────────

function setHTML(html: string) {
  document.body.innerHTML = html;
}

// ── detectPlatform ────────────────────────────────────────────────────────────
// detectPlatform accepts an optional hostname argument for deterministic testing

describe("detectPlatform", () => {
  it("detects Gradescope by hostname", () => {
    expect(detectPlatform("www.gradescope.com")).toBe("gradescope");
  });

  it("detects Canvas via instructure.com", () => {
    expect(detectPlatform("uri.instructure.com")).toBe("canvas");
  });

  it("detects Canvas via canvas subdomain", () => {
    expect(detectPlatform("canvas.mit.edu")).toBe("canvas");
  });

  it("detects Brightspace by brightspace.com", () => {
    expect(detectPlatform("learn.brightspace.com")).toBe("brightspace");
  });

  it("detects Brightspace via d2l domain", () => {
    expect(detectPlatform("university.d2l.com")).toBe("brightspace");
  });

  it("detects Edfinity", () => {
    expect(detectPlatform("edfinity.com")).toBe("edfinity");
  });

  it("returns unknown for an unrecognized host", () => {
    expect(detectPlatform("moodle.university.edu")).toBe("unknown");
  });

  it("returns unknown for empty hostname", () => {
    expect(detectPlatform("")).toBe("unknown");
  });
});

// ── scrapeGradescope ──────────────────────────────────────────────────────────

describe("scrapeGradescope", () => {
  it("extracts assignments from .js-assignmentRow rows", () => {
    setHTML(`
      <table><tbody>
        <tr class="js-assignmentRow">
          <td><a class="assignmentTitle" href="/hw1">Homework 1</a></td>
          <td><span class="submissionTimeChart--dueDate">Feb 7 at 11:59 PM</span></td>
        </tr>
        <tr class="js-assignmentRow">
          <td><a class="assignmentTitle" href="/hw2">Homework 2</a></td>
          <td><span class="submissionTimeChart--dueDate">Feb 18 at 11:59 PM</span></td>
        </tr>
      </tbody></table>
    `);

    const items = scrapeGradescope();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Homework 1");
    expect(items[0].due_date).toBe("Feb 7 at 11:59 PM");
    expect(items[0].type).toBe("assignment");
    expect(items[1].title).toBe("Homework 2");
  });

  it("extracts from .table--assignments layout", () => {
    setHTML(`
      <table class="table--assignments"><tbody>
        <tr>
          <td>Midterm 1</td>
          <td><span class="js-due-date">Mar 6 at 9:30 AM</span></td>
        </tr>
      </tbody></table>
    `);

    const items = scrapeGradescope();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Midterm 1");
    expect(items[0].due_date).toBe("Mar 6 at 9:30 AM");
  });

  it("captures link href when present", () => {
    setHTML(`
      <table><tbody>
        <tr class="js-assignmentRow">
          <td><a class="assignmentTitle" href="https://gradescope.com/assignments/123">HW 1</a></td>
        </tr>
      </tbody></table>
    `);
    const items = scrapeGradescope();
    expect(items).toHaveLength(1);
    expect(items[0].link).toBe("https://gradescope.com/assignments/123");
  });

  it("returns empty array when no assignment rows exist", () => {
    setHTML("<div>No assignments here</div>");
    expect(scrapeGradescope()).toEqual([]);
  });

  it("skips rows with empty title", () => {
    setHTML(`
      <table><tbody>
        <tr class="js-assignmentRow"><td></td></tr>
      </tbody></table>
    `);
    expect(scrapeGradescope()).toEqual([]);
  });
});

// ── scrapeCanvas ──────────────────────────────────────────────────────────────

describe("scrapeCanvas", () => {
  it("extracts assignments from .ig-row elements", () => {
    setHTML(`
      <ul>
        <li class="ig-row">
          <span class="ig-title"><a href="/assignments/1">Problem Set 3</a></span>
          <div class="assignment-date-due">Due: Apr 3</div>
        </li>
        <li class="ig-row">
          <span class="ig-title"><a href="/assignments/2">Final Project</a></span>
          <div class="assignment-date-due">Due: May 1</div>
        </li>
      </ul>
    `);

    const items = scrapeCanvas();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Problem Set 3");
    expect(items[0].due_date).toBe("Due: Apr 3");
    expect(items[0].type).toBe("assignment");
  });

  it("extracts from .assignment elements", () => {
    setHTML(`
      <div class="assignment">
        <div class="title">Weekly Quiz</div>
        <span class="due_date_display">Feb 14</span>
      </div>
    `);

    const items = scrapeCanvas();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Weekly Quiz");
    expect(items[0].due_date).toBe("Feb 14");
  });

  it("returns empty array when no Canvas selectors match", () => {
    setHTML("<div>Empty page</div>");
    expect(scrapeCanvas()).toEqual([]);
  });

  it("captures link href from anchor inside .ig-row", () => {
    setHTML(`
      <li class="ig-row">
        <span class="ig-title">
          <a href="https://canvas.uri.edu/courses/1/assignments/5">HW 5</a>
        </span>
      </li>
    `);
    const items = scrapeCanvas();
    expect(items).toHaveLength(1);
    expect(items[0].link).toContain("assignments/5");
  });
});

// ── scrapeBrightspace ─────────────────────────────────────────────────────────

describe("scrapeBrightspace", () => {
  it("extracts from D2L table rows with .dco_title", () => {
    setHTML(`
      <table class="d2l-table"><tbody>
        <tr>
          <td class="dco_title"><a href="/d2l/hw1">Assignment 1</a></td>
          <td><span class="d2l-dates-text">Feb 7, 2025</span></td>
        </tr>
        <tr>
          <td class="dco_title"><a href="/d2l/midterm">Midterm Exam</a></td>
          <td><span class="d2l-dates-text">Mar 6, 2025</span></td>
        </tr>
      </tbody></table>
    `);

    const items = scrapeBrightspace();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Assignment 1");
    expect(items[0].type).toBe("assignment");
    expect(items[0].due_date).toBe("Feb 7, 2025");
  });

  it("classifies midterm as exam type by title keyword", () => {
    setHTML(`
      <table class="d2l-table"><tbody>
        <tr>
          <td><a class="d2l-link" href="#">Midterm Exam</a></td>
        </tr>
      </tbody></table>
    `);

    const items = scrapeBrightspace();
    expect(items[0].type).toBe("exam");
  });

  it("classifies quiz items as exam type", () => {
    setHTML(`
      <div class="d2l-datalist-item">
        <a class="d2l-link" href="#">Week 3 Quiz</a>
      </div>
    `);

    const items = scrapeBrightspace();
    expect(items[0].type).toBe("exam");
  });

  it("classifies final exam correctly", () => {
    setHTML(`
      <div class="d2l-datalist-item">
        <a class="d2l-link" href="#">Final Exam</a>
      </div>
    `);
    const items = scrapeBrightspace();
    expect(items[0].type).toBe("exam");
  });

  it("returns empty array for unrecognized Brightspace layout", () => {
    setHTML("<div>Unknown content</div>");
    expect(scrapeBrightspace()).toEqual([]);
  });
});

// ── scrapeGeneric ─────────────────────────────────────────────────────────────

describe("scrapeGeneric", () => {
  it("picks up date-adjacent content from table rows", () => {
    setHTML(`
      <table>
        <tr><td>Homework 1 due Jan 15</td></tr>
        <tr><td>Midterm on Feb 20 in room 101</td></tr>
      </table>
    `);

    const items = scrapeGeneric();
    // Both rows have date matches and are under 300 chars
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.every((i: ScrapedItem) => i.type === "other")).toBe(true);
  });

  it("limits output to 20 items", () => {
    const rows = Array.from(
      { length: 30 },
      (_, i) => `<tr><td>Item ${i} due Jan ${(i % 28) + 1}</td></tr>`,
    ).join("");
    setHTML(`<table>${rows}</table>`);

    const items = scrapeGeneric();
    expect(items.length).toBeLessThanOrEqual(20);
  });

  it("skips elements whose text exceeds 300 chars", () => {
    const longText = "Jan 1 " + "x".repeat(350);
    setHTML(`<table><tbody><tr><td>${longText}</td></tr></tbody></table>`);
    const items = scrapeGeneric();
    expect(items).toHaveLength(0);
  });

  it("truncates captured title to 120 chars", () => {
    const text = "Assignment due Jan 15 " + "y".repeat(200);
    setHTML(`<table><tbody><tr><td>${text}</td></tr></tbody></table>`);

    const items = scrapeGeneric();
    if (items.length > 0) {
      expect(items[0].title.length).toBeLessThanOrEqual(120);
    }
  });

  it("returns empty array when no date patterns found", () => {
    setHTML("<table><tr><td>No dates in here</td></tr></table>");
    expect(scrapeGeneric()).toEqual([]);
  });
});

// ── ScrapedItem shape ─────────────────────────────────────────────────────────

describe("ScrapedItem shape invariants", () => {
  it("Gradescope items always have all required fields", () => {
    setHTML(`
      <table><tbody>
        <tr class="js-assignmentRow">
          <td><span class="assignmentTitle">HW 1</span></td>
        </tr>
      </tbody></table>
    `);

    const items = scrapeGradescope();
    items.forEach((item: ScrapedItem) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("due_date");
      expect(item).toHaveProperty("link");
      expect(item).toHaveProperty("type");
      expect(["assignment", "exam", "reading", "other"]).toContain(item.type);
      expect(typeof item.title).toBe("string");
      expect(item.title.length).toBeGreaterThan(0);
    });
  });

  it("Canvas items always have all required fields", () => {
    setHTML(`
      <div class="assignment">
        <div class="title">Problem Set</div>
      </div>
    `);

    const items = scrapeCanvas();
    items.forEach((item: ScrapedItem) => {
      expect(["assignment", "exam", "reading", "other"]).toContain(item.type);
    });
  });
});
