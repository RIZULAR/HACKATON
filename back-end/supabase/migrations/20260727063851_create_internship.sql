-- =====================================================
-- ENUM
-- =====================================================

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

-- =====================================================
-- TABLE INTERNSHIP APPLICATIONS
-- =====================================================

create table public.internship_applications (

    id uuid primary key default gen_random_uuid(),

    application_code text unique,

    internship_code text unique,

    student_id uuid not null
        references public.profiles(id)
        on delete cascade,

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

    proposed_dpl_id uuid
        references public.profiles(id),

    assigned_dpl_id uuid
        references public.profiles(id),

    verified_by_admin uuid
        references public.profiles(id),

    status internship_status
        default 'draft',

    admin_notes text,

    submitted_at timestamptz,

    approved_at timestamptz,

    rejected_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now(),

    constraint chk_internship_date
        check (end_date >= start_date)

);

-- =====================================================
-- TABLE STATUS HISTORY
-- =====================================================

create table public.internship_status_history (

    id uuid primary key default gen_random_uuid(),

    internship_application_id uuid not null
        references public.internship_applications(id)
        on delete cascade,

    old_status internship_status,

    new_status internship_status not null,

    changed_by uuid
        references public.profiles(id),

    note text,

    created_at timestamptz default now()

);

-- =====================================================
-- TABLE COUNTER
-- =====================================================

create table public.internship_code_counter (

    year integer primary key,

    last_number integer default 0

);