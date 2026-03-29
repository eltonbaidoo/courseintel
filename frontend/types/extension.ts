export interface ScrapedItem {
  title: string;
  due_date?: string | null;
  link?: string | null;
  type: "assignment" | "exam" | "reading" | "other";
}

export interface ScrapePayload {
  course_id: string;
  platform: string;
  url: string;
  raw_text: string;
  items: ScrapedItem[];
}

export interface ScrapeValidationResponse {
  scrape_job_id: string;
  status: "accepted" | "warn" | "rejected";
  usefulness_score: number;
  accepted_items: number;
  rejected_items: number;
  merged_obligations: number;
  message: string;
}

export interface HelpCard {
  what_it_is?: string;
  page_to_open?: string;
  what_captures?: string;
  success_looks_like?: string;
  troubleshoot_tip?: string;
}
