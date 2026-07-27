-- =====================================================
-- ENUM
-- =====================================================

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

-- =====================================================
-- CONVERSION PROPOSALS
-- =====================================================

create table public.conversion_proposals (

    id uuid primary key default gen_random_uuid(),

    internship_application_id uuid not null
        references public.internship_applications(id)
        on delete cascade,

    student_id uuid not null
        references public.profiles(id)
        on delete cascade,

    total_hours integer default 0,

    status conversion_status default 'draft',

    dpl_notes text,

    submitted_at timestamptz,

    approved_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now()

);

-- =====================================================
-- CONVERSION COURSES
-- =====================================================

create table public.conversion_courses (

    id uuid primary key default gen_random_uuid(),

    proposal_id uuid not null
        references public.conversion_proposals(id)
        on delete cascade,

    course_code varchar(20) not null,

    course_name text not null,

    credits integer not null,

    minimum_hours integer not null,

    created_at timestamptz default now()

);

-- =====================================================
-- CONVERSION ACTIVITIES
-- =====================================================

create table public.conversion_activities (

    id uuid primary key default gen_random_uuid(),

    course_id uuid not null
        references public.conversion_courses(id)
        on delete cascade,

    activity text not null,

    cpmk text,

    hours integer not null,

    description text,

    created_at timestamptz default now(),

    constraint chk_activity_hours
        check(hours > 0)

);

-- =====================================================
-- CONVERSION CLAIMS
-- =====================================================

create table public.conversion_claims (

    id uuid primary key default gen_random_uuid(),

    proposal_id uuid not null
        references public.conversion_proposals(id)
        on delete cascade,

    student_id uuid not null
        references public.profiles(id)
        on delete cascade,

    status claim_status default 'draft',

    submitted_at timestamptz,

    approved_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now()

);

-- =====================================================
-- CLAIM DOCUMENTS
-- =====================================================

create table public.claim_documents (

    id uuid primary key default gen_random_uuid(),

    claim_id uuid not null
        references public.conversion_claims(id)
        on delete cascade,

    document_type text not null,

    file_url text not null,

    uploaded_at timestamptz default now()

);

-- =====================================================
-- TRIGGER UPDATED_AT
-- =====================================================

create trigger trg_conversion_proposals_updated_at
before update
on public.conversion_proposals
for each row
execute function public.set_updated_at();

create trigger trg_conversion_claims_updated_at
before update
on public.conversion_claims
for each row
execute function public.set_updated_at();

-- =====================================================
-- INDEX
-- =====================================================

create index idx_conversion_student
on public.conversion_proposals(student_id);

create index idx_conversion_status
on public.conversion_proposals(status);

create index idx_conversion_claim_status
on public.conversion_claims(status);

create index idx_conversion_course
on public.conversion_courses(proposal_id);

create index idx_conversion_activity
on public.conversion_activities(course_id);

create index idx_claim_document
on public.claim_documents(claim_id);