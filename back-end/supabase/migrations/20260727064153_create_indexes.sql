-- =====================================================
-- COMPOSITE INDEXES
-- =====================================================

-- Internship Applications
create index if not exists idx_internship_student_status
on public.internship_applications(student_id, status);

create index if not exists idx_internship_dpl_status
on public.internship_applications(assigned_dpl_id, status);

create index if not exists idx_internship_partner_status
on public.internship_applications(partner_name, status);

-- Conversion Proposals
create index if not exists idx_conversion_student_status
on public.conversion_proposals(student_id, status);

create index if not exists idx_conversion_application
on public.conversion_proposals(internship_application_id);

-- Conversion Courses
create index if not exists idx_conversion_course_proposal
on public.conversion_courses(proposal_id);

-- Conversion Activities
create index if not exists idx_activity_course
on public.conversion_activities(course_id);

-- Conversion Claims
create index if not exists idx_claim_student_status
on public.conversion_claims(student_id, status);

create index if not exists idx_claim_proposal
on public.conversion_claims(proposal_id);

-- Claim Documents
create index if not exists idx_document_claim_type
on public.claim_documents(claim_id, document_type);

-- Reviews
create index if not exists idx_review_claim_role
on public.reviews(claim_id, reviewer_role);

create index if not exists idx_review_reviewer_role
on public.reviews(reviewer_id, reviewer_role);

-- Final Grades
create index if not exists idx_final_grade_claim
on public.final_grades(claim_id);

create index if not exists idx_final_grade_letter
on public.final_grades(letter_grade);

create index if not exists idx_final_grade_score
on public.final_grades(final_score);

-- Status History
create index if not exists idx_history_application_created
on public.internship_status_history(
    internship_application_id,
    created_at desc
);