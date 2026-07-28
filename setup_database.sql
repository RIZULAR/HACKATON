-- =====================================================
-- DATABASE SETUP FOR SYSTEM KONVERSI MAGANG OBE
-- Run this script in your Supabase SQL Editor (New Query)
-- =====================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Custom Type Enums
create type user_role as enum (
    'mahasiswa',
    'dpl',
    'admin_prodi',
    'kaprodi',
    'mitra'
);

create type internship_scheme as enum (
    'mandiri',
    'mitra'
);

create type internship_status as enum (
    'draft',
    'submitted',
    'admin_review',
    'revision',
    'approved',
    'rejected'
);

create type conversion_status as enum (
    'draft',
    'submitted',
    'revision',
    'approved',
    'rejected'
);

create type claim_status as enum (
    'draft',
    'submitted',
    'approved',
    'rejected'
);

create type reviewer_role as enum (
    'mitra',
    'dpl'
);

create type review_status as enum (
    'draft',
    'submitted'
);

-- 3. Table: profiles
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text unique not null,
    role user_role not null,
    nim varchar(20),
    nip varchar(30),
    phone varchar(20),
    faculty text,
    study_program text,
    partner_name text,
    position text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. Table: internship_applications
create table public.internship_applications (
    id uuid primary key default gen_random_uuid(),
    application_code text unique,
    internship_code text unique,
    student_id uuid not null references public.profiles(id) on delete cascade,
    scheme internship_scheme not null,
    partner_name text not null,
    partner_address text,
    position text not null,
    start_date date not null,
    end_date date not null,
    supervisor_name text,
    supervisor_email text,
    supervisor_phone text,
    proposal_document text,
    acceptance_document text,
    proposed_dpl_id uuid references public.profiles(id),
    assigned_dpl_id uuid references public.profiles(id),
    verified_by_admin uuid references public.profiles(id),
    status internship_status default 'draft',
    admin_notes text,
    submitted_at timestamptz,
    approved_at timestamptz,
    rejected_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint chk_internship_date check (end_date >= start_date)
);

-- 5. Table: internship_status_history
create table public.internship_status_history (
    id uuid primary key default gen_random_uuid(),
    internship_application_id uuid not null references public.internship_applications(id) on delete cascade,
    old_status internship_status,
    new_status internship_status not null,
    changed_by uuid references public.profiles(id),
    note text,
    created_at timestamptz default now()
);

-- 6. Table: internship_code_counter
create table public.internship_code_counter (
    year integer primary key,
    last_number integer default 0
);

-- 7. Table: conversion_proposals
create table public.conversion_proposals (
    id uuid primary key default gen_random_uuid(),
    internship_application_id uuid not null references public.internship_applications(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    total_hours integer default 0,
    status conversion_status default 'draft',
    dpl_notes text,
    submitted_at timestamptz,
    approved_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 8. Table: conversion_courses
create table public.conversion_courses (
    id uuid primary key default gen_random_uuid(),
    proposal_id uuid not null references public.conversion_proposals(id) on delete cascade,
    course_code varchar(20) not null,
    course_name text not null,
    credits integer not null,
    minimum_hours integer not null,
    created_at timestamptz default now()
);

-- 9. Table: conversion_activities
create table public.conversion_activities (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.conversion_courses(id) on delete cascade,
    activity text not null,
    cpmk text,
    hours integer not null,
    description text,
    created_at timestamptz default now(),
    constraint chk_activity_hours check(hours > 0)
);

-- 10. Table: conversion_claims
create table public.conversion_claims (
    id uuid primary key default gen_random_uuid(),
    proposal_id uuid not null references public.conversion_proposals(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    status claim_status default 'draft',
    submitted_at timestamptz,
    approved_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 11. Table: claim_documents
create table public.claim_documents (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.conversion_claims(id) on delete cascade,
    document_type text not null,
    file_url text not null,
    uploaded_at timestamptz default now()
);

-- 12. Table: reviews
create table public.reviews (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.conversion_claims(id) on delete cascade,
    reviewer_id uuid not null references public.profiles(id) on delete cascade,
    reviewer_role reviewer_role not null,
    discipline_score numeric(5,2),
    teamwork_score numeric(5,2),
    communication_score numeric(5,2),
    initiative_score numeric(5,2),
    technical_score numeric(5,2),
    report_score numeric(5,2),
    presentation_score numeric(5,2),
    final_score numeric(5,2),
    comments text,
    status review_status default 'draft',
    submitted_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint chk_score_range check (
        (discipline_score between 0 and 100 or discipline_score is null) and
        (teamwork_score between 0 and 100 or teamwork_score is null) and
        (communication_score between 0 and 100 or communication_score is null) and
        (initiative_score between 0 and 100 or initiative_score is null) and
        (technical_score between 0 and 100 or technical_score is null) and
        (report_score between 0 and 100 or report_score is null) and
        (presentation_score between 0 and 100 or presentation_score is null) and
        (final_score between 0 and 100 or final_score is null)
    )
);

-- 13. Table: final_grades
create table public.final_grades (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid unique not null references public.conversion_claims(id) on delete cascade,
    partner_score numeric(5,2) not null,
    dpl_score numeric(5,2) not null,
    final_score numeric(5,2) not null,
    letter_grade varchar(2) not null,
    published_by uuid references public.profiles(id),
    published_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint chk_final_score check(final_score between 0 and 100),
    constraint chk_letter_grade check(letter_grade in ('A', 'AB', 'B', 'BC', 'C', 'D', 'E'))
);

-- 14. Helper Updated_At Functions & Triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_internship_updated_at before update on public.internship_applications for each row execute function public.set_updated_at();
create trigger trg_conversion_proposals_updated_at before update on public.conversion_proposals for each row execute function public.set_updated_at();
create trigger trg_conversion_claims_updated_at before update on public.conversion_claims for each row execute function public.set_updated_at();
create trigger trg_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger trg_final_grades_updated_at before update on public.final_grades for each row execute function public.set_updated_at();

-- 15. Stored Procedures & Functions (RPCs)
create or replace function public.generate_internship_code()
returns text language plpgsql as $$
declare
    current_year integer;
    next_number integer;
    generated_code text;
begin
    current_year := extract(year from now());
    insert into public.internship_code_counter(year, last_number)
    values(current_year, 0)
    on conflict (year) do nothing;

    update public.internship_code_counter
    set last_number = last_number + 1
    where year = current_year
    returning last_number into next_number;

    generated_code := 'MAG-' || current_year || '-' || lpad(next_number::text,4,'0');
    return generated_code;
end;
$$;

create or replace function public.calculate_total_hours(p_proposal_id uuid)
returns integer language plpgsql as $$
declare
    total integer;
begin
    select coalesce(sum(hours),0) into total
    from public.conversion_activities ca
    join public.conversion_courses cc on cc.id = ca.course_id
    where cc.proposal_id = p_proposal_id;

    update public.conversion_proposals
    set total_hours = total
    where id = p_proposal_id;

    return total;
end;
$$;

create or replace function public.get_letter_grade(score numeric)
returns varchar language plpgsql as $$
begin
    if score >= 85 then return 'A';
    elseif score >= 80 then return 'AB';
    elseif score >= 75 then return 'B';
    elseif score >= 70 then return 'BC';
    elseif score >= 65 then return 'C';
    elseif score >= 60 then return 'D';
    else return 'E';
    end if;
end;
$$;

create or replace function public.calculate_final_grade(p_claim_id uuid)
returns numeric language plpgsql as $$
declare
    partner_score numeric;
    dpl_score numeric;
    final_score numeric;
    letter varchar;
begin
    select final_score into partner_score from public.reviews where claim_id = p_claim_id and reviewer_role='mitra';
    select final_score into dpl_score from public.reviews where claim_id = p_claim_id and reviewer_role='dpl';
    partner_score := coalesce(partner_score,0);
    dpl_score := coalesce(dpl_score,0);
    final_score := (partner_score * 0.70) + (dpl_score * 0.30);
    letter := public.get_letter_grade(final_score);

    insert into public.final_grades(claim_id, partner_score, dpl_score, final_score, letter_grade)
    values(p_claim_id, partner_score, dpl_score, final_score, letter)
    on conflict (claim_id) do update set
        partner_score = excluded.partner_score,
        dpl_score = excluded.dpl_score,
        final_score = excluded.final_score,
        letter_grade = excluded.letter_grade,
        updated_at = now();
    return final_score;
end;
$$;

create or replace function public.log_internship_status(
    p_application_id uuid,
    p_old_status internship_status,
    p_new_status internship_status,
    p_changed_by uuid,
    p_note text default null
)
returns void language plpgsql as $$
begin
    insert into public.internship_status_history(internship_application_id, old_status, new_status, changed_by, note)
    values(p_application_id, p_old_status, p_new_status, p_changed_by, p_note);
end;
$$;

-- 16. Performance Indexes
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_nim on public.profiles(nim);
create index idx_profiles_nip on public.profiles(nip);
create index idx_profiles_email on public.profiles(email);
create index idx_internship_student on public.internship_applications(student_id);
create index idx_internship_status on public.internship_applications(status);
create index idx_internship_assigned_dpl on public.internship_applications(assigned_dpl_id);
create index idx_internship_partner on public.internship_applications(partner_name);
create index idx_status_history_application on public.internship_status_history(internship_application_id);
create index if not exists idx_internship_student_status on public.internship_applications(student_id, status);
create index if not exists idx_internship_dpl_status on public.internship_applications(assigned_dpl_id, status);
create index if not exists idx_internship_partner_status on public.internship_applications(partner_name, status);
create index if not exists idx_conversion_student_status on public.conversion_proposals(student_id, status);
create index if not exists idx_conversion_application on public.conversion_proposals(internship_application_id);
create index if not exists idx_conversion_course_proposal on public.conversion_courses(proposal_id);
create index if not exists idx_activity_course on public.conversion_activities(course_id);
create index if not exists idx_claim_student_status on public.conversion_claims(student_id, status);
create index if not exists idx_claim_proposal on public.conversion_claims(proposal_id);
create index if not exists idx_document_claim_type on public.claim_documents(claim_id, document_type);
create index if not exists idx_review_claim_role on public.reviews(claim_id, reviewer_role);
create index if not exists idx_review_reviewer_role on public.reviews(reviewer_id, reviewer_role);
create index if not exists idx_final_grade_claim on public.final_grades(claim_id);
create index if not exists idx_final_grade_letter on public.final_grades(letter_grade);
create index if not exists idx_final_grade_score on public.final_grades(final_score);
create index if not exists idx_history_application_created on public.internship_status_history(internship_application_id, created_at desc);

-- 17. Row-Level Security (RLS) Configuration
create or replace function public.current_user_role()
returns user_role language sql security definer stable as $$
    select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.internship_applications enable row level security;
alter table public.internship_status_history enable row level security;
alter table public.conversion_proposals enable row level security;
alter table public.conversion_courses enable row level security;
alter table public.conversion_activities enable row level security;
alter table public.conversion_claims enable row level security;
alter table public.claim_documents enable row level security;
alter table public.reviews enable row level security;
alter table public.final_grades enable row level security;

-- 18. RLS Policies
create policy "Profiles can view themselves" on public.profiles for select using (id = auth.uid() or current_user_role() in ('admin_prodi','kaprodi'));
create policy "Users update own profile" on public.profiles for update using (id = auth.uid());
create policy "Admin manage profiles" on public.profiles for all using (current_user_role()='admin_prodi') with check (current_user_role()='admin_prodi');
create policy "Allow public profile creation" on public.profiles for insert with check (true); -- Critical fix to allow student signup registrations

create policy "Student own application" on public.internship_applications for all using (student_id = auth.uid());
create policy "Assigned DPL view" on public.internship_applications for select using (assigned_dpl_id = auth.uid());
create policy "Admin full internship" on public.internship_applications for all using (current_user_role()='admin_prodi') with check (current_user_role()='admin_prodi');
create policy "Kaprodi read internship" on public.internship_applications for select using (current_user_role()='kaprodi');

create policy "Student status history" on public.internship_status_history for select using (internship_application_id in (select id from public.internship_applications where student_id = auth.uid()));
create policy "Admin full history" on public.internship_status_history for all using (current_user_role()='admin_prodi');
create policy "Kaprodi read history" on public.internship_status_history for select using (current_user_role()='kaprodi');

create policy "Student proposal" on public.conversion_proposals for all using (student_id = auth.uid());
create policy "DPL proposal" on public.conversion_proposals for select using (internship_application_id in (select id from public.internship_applications where assigned_dpl_id = auth.uid()));
create policy "Admin proposal" on public.conversion_proposals for all using (current_user_role()='admin_prodi');
create policy "Kaprodi proposal" on public.conversion_proposals for select using (current_user_role()='kaprodi');

create policy "Read conversion courses" on public.conversion_courses for select using (true);
create policy "Student manage own courses" on public.conversion_courses for all using (proposal_id in (select id from public.conversion_proposals where student_id = auth.uid()));

create policy "Student manage activities" on public.conversion_activities for all using (course_id in (select cc.id from public.conversion_courses cc join public.conversion_proposals cp on cp.id = cc.proposal_id where cp.student_id = auth.uid()));

create policy "Student claim" on public.conversion_claims for all using (student_id = auth.uid());
create policy "DPL read claims" on public.conversion_claims for select using (proposal_id in (select cp.id from public.conversion_proposals cp join public.internship_applications ia on ia.id = cp.internship_application_id where ia.assigned_dpl_id = auth.uid()));
create policy "Admin claims" on public.conversion_claims for all using (current_user_role()='admin_prodi');
create policy "Kaprodi claims" on public.conversion_claims for select using (current_user_role()='kaprodi');

create policy "Student documents" on public.claim_documents for all using (claim_id in (select id from public.conversion_claims where student_id = auth.uid()));
create policy "DPL read documents" on public.claim_documents for select using (claim_id in (select cc.id from public.conversion_claims cc join public.conversion_proposals cp on cp.id = cc.proposal_id join public.internship_applications ia on ia.id = cp.internship_application_id where ia.assigned_dpl_id = auth.uid()));

create policy "Reviewer own review" on public.reviews for all using (reviewer_id = auth.uid());
create policy "Admin reviews" on public.reviews for all using (current_user_role()='admin_prodi');
create policy "Kaprodi read reviews" on public.reviews for select using (current_user_role()='kaprodi');

create policy "Student final grade" on public.final_grades for select using (claim_id in (select id from public.conversion_claims where student_id = auth.uid()));
create policy "DPL final grade" on public.final_grades for select using (claim_id in (select cc.id from public.conversion_claims cc join public.conversion_proposals cp on cp.id = cc.proposal_id join public.internship_applications ia on ia.id = cp.internship_application_id where ia.assigned_dpl_id = auth.uid()));
create policy "Admin final grade" on public.final_grades for all using (current_user_role()='admin_prodi');
create policy "Kaprodi final grade" on public.final_grades for select using (current_user_role()='kaprodi');
