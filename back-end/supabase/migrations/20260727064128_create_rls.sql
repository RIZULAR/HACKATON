-- =====================================================
-- CURRENT USER ROLE
-- =====================================================

create or replace function public.current_user_role()
returns user_role
language sql
stable
as
$$
    select role
    from public.profiles
    where id = auth.uid();
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

create policy "Profiles can view themselves"
on public.profiles
for select
using (
    id = auth.uid()
    or current_user_role() in ('admin_prodi','kaprodi')
);

create policy "Users update own profile"
on public.profiles
for update
using (
    id = auth.uid()
);

create policy "Admin manage profiles"
on public.profiles
for all
using (
    current_user_role()='admin_prodi'
)
with check (
    current_user_role()='admin_prodi'
);

create policy "Student own application"
on public.internship_applications
for all
using (
    student_id = auth.uid()
);

create policy "Assigned DPL view"
on public.internship_applications
for select
using (
    assigned_dpl_id = auth.uid()
);

create policy "Admin full internship"
on public.internship_applications
for all
using (
    current_user_role()='admin_prodi'
)
with check (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi read internship"
on public.internship_applications
for select
using (
    current_user_role()='kaprodi'
);

create policy "Student status history"
on public.internship_status_history
for select
using (
    internship_application_id in (
        select id
        from public.internship_applications
        where student_id = auth.uid()
    )
);

create policy "Admin full history"
on public.internship_status_history
for all
using (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi read history"
on public.internship_status_history
for select
using (
    current_user_role()='kaprodi'
);

create policy "Student proposal"
on public.conversion_proposals
for all
using (
    student_id = auth.uid()
);

create policy "DPL proposal"
on public.conversion_proposals
for select
using (
    internship_application_id in (
        select id
        from public.internship_applications
        where assigned_dpl_id = auth.uid()
    )
);

create policy "Admin proposal"
on public.conversion_proposals
for all
using (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi proposal"
on public.conversion_proposals
for select
using (
    current_user_role()='kaprodi'
);

create policy "Read conversion courses"
on public.conversion_courses
for select
using (true);

create policy "Student manage own courses"
on public.conversion_courses
for all
using (
    proposal_id in (
        select id
        from public.conversion_proposals
        where student_id = auth.uid()
    )
);

create policy "Student manage activities"
on public.conversion_activities
for all
using (
    course_id in (
        select cc.id
        from public.conversion_courses cc
        join public.conversion_proposals cp
        on cp.id = cc.proposal_id
        where cp.student_id = auth.uid()
    )
);

create policy "Student claim"
on public.conversion_claims
for all
using (
    student_id = auth.uid()
);

create policy "DPL read claims"
on public.conversion_claims
for select
using (
    proposal_id in (
        select cp.id
        from public.conversion_proposals cp
        join public.internship_applications ia
        on ia.id = cp.internship_application_id
        where ia.assigned_dpl_id = auth.uid()
    )
);

create policy "Admin claims"
on public.conversion_claims
for all
using (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi claims"
on public.conversion_claims
for select
using (
    current_user_role()='kaprodi'
);

create policy "Student documents"
on public.claim_documents
for all
using (
    claim_id in (
        select id
        from public.conversion_claims
        where student_id = auth.uid()
    )
);

create policy "DPL read documents"
on public.claim_documents
for select
using (
    claim_id in (
        select cc.id
        from public.conversion_claims cc
        join public.conversion_proposals cp
        on cp.id = cc.proposal_id
        join public.internship_applications ia
        on ia.id = cp.internship_application_id
        where ia.assigned_dpl_id = auth.uid()
    )
);

create policy "Reviewer own review"
on public.reviews
for all
using (
    reviewer_id = auth.uid()
);

create policy "Admin reviews"
on public.reviews
for all
using (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi read reviews"
on public.reviews
for select
using (
    current_user_role()='kaprodi'
);

create policy "Student final grade"
on public.final_grades
for select
using (
    claim_id in (
        select id
        from public.conversion_claims
        where student_id = auth.uid()
    )
);

create policy "DPL final grade"
on public.final_grades
for select
using (
    claim_id in (
        select cc.id
        from public.conversion_claims cc
        join public.conversion_proposals cp
        on cp.id = cc.proposal_id
        join public.internship_applications ia
        on ia.id = cp.internship_application_id
        where ia.assigned_dpl_id = auth.uid()
    )
);

create policy "Admin final grade"
on public.final_grades
for all
using (
    current_user_role()='admin_prodi'
);

create policy "Kaprodi final grade"
on public.final_grades
for select
using (
    current_user_role()='kaprodi'
);