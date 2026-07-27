-- Run this once in the Supabase SQL editor after migration-quiz-leads.sql
-- has already been applied. Adds a "source" column so leads captured from
-- the Scent Finder quiz and leads captured from the Scent Swipe game can be
-- told apart in the admin dashboard and in future marketing exports.

alter table public.quiz_leads
  add column if not exists source text default 'quiz';

create index if not exists idx_quiz_leads_source on public.quiz_leads(source);
