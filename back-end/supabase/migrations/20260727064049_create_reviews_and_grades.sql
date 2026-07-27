-- =====================================================
-- ENUM
-- =====================================================

create type reviewer_role as enum (
    'mitra',
    'dpl'
);

create type review_status as enum (
    'draft',
    'submitted'
);

-- =====================================================
-- TABLE REVIEWS
-- =====================================================

create table public.reviews (

    id uuid primary key default gen_random_uuid(),

    claim_id uuid not null
        references public.conversion_claims(id)
        on delete cascade,

    reviewer_id uuid not null
        references public.profiles(id)
        on delete cascade,

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

    constraint chk_score_range
        check (

            (discipline_score between 0 and 100 or discipline_score is null)
            and
            (teamwork_score between 0 and 100 or teamwork_score is null)
            and
            (communication_score between 0 and 100 or communication_score is null)
            and
            (initiative_score between 0 and 100 or initiative_score is null)
            and
            (technical_score between 0 and 100 or technical_score is null)
            and
            (report_score between 0 and 100 or report_score is null)
            and
            (presentation_score between 0 and 100 or presentation_score is null)
            and
            (final_score between 0 and 100 or final_score is null)

        )

);

-- =====================================================
-- TABLE FINAL GRADES
-- =====================================================

create table public.final_grades (

    id uuid primary key default gen_random_uuid(),

    claim_id uuid unique not null
        references public.conversion_claims(id)
        on delete cascade,

    partner_score numeric(5,2) not null,

    dpl_score numeric(5,2) not null,

    final_score numeric(5,2) not null,

    letter_grade varchar(2) not null,

    published_by uuid
        references public.profiles(id),

    published_at timestamptz,

    created_at timestamptz default now(),

    updated_at timestamptz default now(),

    constraint chk_final_score
        check(final_score between 0 and 100),

    constraint chk_letter_grade
        check(letter_grade in (
            'A',
            'AB',
            'B',
            'BC',
            'C',
            'D',
            'E'
        ))

);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_reviews_updated_at
before update
on public.reviews
for each row
execute function public.set_updated_at();

create trigger trg_final_grades_updated_at
before update
on public.final_grades
for each row
execute function public.set_updated_at();

-- =====================================================
-- INDEX
-- =====================================================

create index idx_reviews_claim
on public.reviews(claim_id);

create index idx_reviews_reviewer
on public.reviews(reviewer_id);

create index idx_reviews_role
on public.reviews(reviewer_role);

create index idx_final_grades_claim
on public.final_grades(claim_id);

create index idx_final_grades_score
on public.final_grades(final_score);