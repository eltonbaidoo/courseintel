export interface CourseIdentity {
  canonical_name: string;
  course_code: string;
  university: string;
  official_links: string[];
  confidence: number;
  notes: string;
}

export interface GradingCategory {
  name: string;
  weight: number; // 0.0 – 1.0
  notes?: string | null;
}

export interface DetectedTool {
  tool_name: string;
  evidence: string;
  purpose: string;
  confidence: number;
  integration_type: "api" | "extension_scrape" | "manual";
}

export interface PublicResource {
  title: string;
  url: string;
  type: "github_repo" | "notes" | "slides" | "assignments" | "other";
  relevance_score: number;
  reason: string;
}

export interface StudentSignal {
  workload?: string | null;
  difficulty?: string | null;
  grading_style?: string | null;
  key_warnings: string[];
  positive_signals: string[];
  summary: string;
  confidence: number;
}

export interface SyllabusStatus {
  found: boolean;
  confidence: number;
  source: "upload" | "web_search";
}

export interface CourseProfile {
  grading_categories: GradingCategory[];
  late_policy?: string;
  attendance_policy?: string;
  drop_rules?: string;
  required_tools?: string[];
  key_deadlines?: { title: string; date: string; type: string }[];
  course_summary?: string;
  workflow_notes?: string;
}

export interface BootstrapResponse {
  course_identity: CourseIdentity;
  syllabus_status: SyllabusStatus;
  course_profile: CourseProfile;
  resources: PublicResource[];
  detected_tools: DetectedTool[];
  student_signal: StudentSignal;
}

/** Local aggregate stored in Zustand; combines bootstrap data + metadata */
export interface Course {
  id: string;
  university: string;
  courseName: string;
  courseCode: string;
  professor: string;
  createdAt: string;
  bootstrap: BootstrapResponse;
}
