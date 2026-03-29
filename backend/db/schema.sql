-- CourseIntel Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- All tables use Row Level Security: auth.uid() = user_id enforced for all ops.

-- ─── Courses ────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  university    text not null,
  course_name   text not null,
  course_code   text,
  professor     text,

  -- Bootstrap agent outputs stored as JSONB (schema-free, evolves without migrations)
  course_identity  jsonb default '{}',   -- DiscoveryAgent: canonical name, code, links
  syllabus_status  jsonb default '{}',   -- SyllabusAcquisitionAgent: found, confidence, source
  course_profile   jsonb default '{}',   -- SyllabusIntelligenceAgent: categories, deadlines, policies
  resources        jsonb default '[]',   -- PublicResourcesAgent: GitHub, courseware, Reddit
  detected_tools   jsonb default '[]',   -- ToolDiscoveryAgent: Gradescope, Ed Discussion, etc.
  student_signal   jsonb default '{}',   -- ReputationAgent: workload, difficulty, warnings
  obligations      jsonb default '[]',   -- ObligationDeadlineAgent: urgency-ranked deadlines

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Grade Entries ──────────────────────────────────────────────────────────
create table if not exists public.grade_entries (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  assignment_title text not null,
  category         text not null,  -- must match a category name from course_profile
  score_earned     double precision not null check (score_earned >= 0),
  score_possible   double precision not null check (score_possible > 0),
  due_date         timestamptz,
  source           text default 'manual',  -- manual | extension | import
  created_at       timestamptz default now()
);

-- ─── Study Materials (metadata only; files go in Supabase Storage) ──────────
create table if not exists public.study_materials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  file_path   text,          -- path in Supabase Storage bucket
  content     text,          -- extracted text (populated by pdf_parser after upload)
  type        text default 'notes',  -- notes | slides | textbook | other
  created_at  timestamptz default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- RLS prevents cross-user data access at the database level,
-- regardless of application-layer bugs.
alter table public.courses enable row level security;
alter table public.grade_entries enable row level security;
alter table public.study_materials enable row level security;

-- Courses: users can only SELECT/INSERT/UPDATE/DELETE their own rows
create policy "Users manage own courses"
  on public.courses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Grade entries: users can only access their own
create policy "Users manage own grade entries"
  on public.grade_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Study materials: users can only access their own
create policy "Users manage own study materials"
  on public.study_materials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_courses_user_id
  on public.courses(user_id);

create index if not exists idx_courses_course_code
  on public.courses(user_id, course_code);  -- fast lookup for cache dedup

create index if not exists idx_grade_entries_course_user
  on public.grade_entries(course_id, user_id);

create index if not exists idx_grade_entries_category
  on public.grade_entries(course_id, category);  -- fast category aggregation

create index if not exists idx_study_materials_course_user
  on public.study_materials(course_id, user_id);

create index if not exists idx_courses_created_at
  on public.courses(user_id, created_at desc);  -- dashboard list ordering

-- ─── Updated-at trigger ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ─── Migration: add obligations column if upgrading from older schema ────────
-- Safe to run on existing databases; no-op if column already exists.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'courses'
      and column_name  = 'obligations'
  ) then
    alter table public.courses add column obligations jsonb default '[]';
  end if;
end $$;
