-- CourseIntel Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─── Courses ────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  university    text not null,
  course_name   text not null,
  course_code   text,
  professor     text,

  -- Bootstrap results stored as JSONB
  course_identity  jsonb default '{}',
  syllabus_status  jsonb default '{}',
  course_profile   jsonb default '{}',
  resources        jsonb default '[]',
  detected_tools   jsonb default '[]',
  student_signal   jsonb default '{}',

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Grade Entries ──────────────────────────────────────────────────────────
create table if not exists public.grade_entries (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  assignment_title text not null,
  category         text not null,
  score_earned     double precision not null,
  score_possible   double precision not null,
  due_date         timestamptz,
  source           text default 'manual',
  created_at       timestamptz default now()
);

-- ─── Study Materials (metadata only; files go in Supabase Storage) ──────────
create table if not exists public.study_materials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  file_path   text,          -- path in Supabase Storage bucket
  content     text,          -- extracted text (populated after parsing)
  type        text default 'notes',
  created_at  timestamptz default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.courses enable row level security;
alter table public.grade_entries enable row level security;
alter table public.study_materials enable row level security;

-- Courses: users can only access their own
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
create index if not exists idx_courses_user_id on public.courses(user_id);
create index if not exists idx_grade_entries_course_id on public.grade_entries(course_id);
create index if not exists idx_grade_entries_user_id on public.grade_entries(user_id);
create index if not exists idx_study_materials_course_id on public.study_materials(course_id);

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
