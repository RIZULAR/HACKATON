-- =====================================================
-- GENERATE INTERNSHIP CODE
-- Format: MAG-YYYY-0001
-- =====================================================

create or replace function public.generate_internship_code()
returns text
language plpgsql
as
$$
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
    returning last_number
    into next_number;

    generated_code :=
        'MAG-' ||
        current_year ||
        '-' ||
        lpad(next_number::text,4,'0');

    return generated_code;

end;
$$;

-- =====================================================
-- CALCULATE TOTAL HOURS
-- =====================================================

create or replace function public.calculate_total_hours(
    p_proposal_id uuid
)
returns integer
language plpgsql
as
$$
declare
    total integer;
begin

    select coalesce(sum(hours),0)
    into total
    from public.conversion_activities ca
    join public.conversion_courses cc
        on cc.id = ca.course_id
    where cc.proposal_id = p_proposal_id;

    update public.conversion_proposals
    set total_hours = total
    where id = p_proposal_id;

    return total;

end;
$$;

-- =====================================================
-- LETTER GRADE
-- =====================================================

create or replace function public.get_letter_grade(
    score numeric
)
returns varchar
language plpgsql
as
$$
begin

    if score >= 85 then
        return 'A';

    elseif score >= 80 then
        return 'AB';

    elseif score >= 75 then
        return 'B';

    elseif score >= 70 then
        return 'BC';

    elseif score >= 65 then
        return 'C';

    elseif score >= 60 then
        return 'D';

    else
        return 'E';

    end if;

end;
$$;

-- =====================================================
-- FINAL GRADE
-- =====================================================

create or replace function public.calculate_final_grade(
    p_claim_id uuid
)
returns numeric
language plpgsql
as
$$
declare

    partner_score numeric;

    dpl_score numeric;

    final_score numeric;

    letter varchar;

begin

    select final_score
    into partner_score
    from public.reviews
    where claim_id = p_claim_id
    and reviewer_role='mitra';

    select final_score
    into dpl_score
    from public.reviews
    where claim_id = p_claim_id
    and reviewer_role='dpl';

    partner_score := coalesce(partner_score,0);
    dpl_score := coalesce(dpl_score,0);

    final_score :=
        (partner_score * 0.70)
        +
        (dpl_score * 0.30);

    letter :=
        public.get_letter_grade(final_score);

    insert into public.final_grades(

        claim_id,

        partner_score,

        dpl_score,

        final_score,

        letter_grade

    )

    values(

        p_claim_id,

        partner_score,

        dpl_score,

        final_score,

        letter

    )

    on conflict (claim_id)

    do update set

        partner_score = excluded.partner_score,

        dpl_score = excluded.dpl_score,

        final_score = excluded.final_score,

        letter_grade = excluded.letter_grade,

        updated_at = now();

    return final_score;

end;
$$;

-- =====================================================
-- STATUS HISTORY
-- =====================================================

create or replace function public.log_internship_status(

    p_application_id uuid,

    p_old_status internship_status,

    p_new_status internship_status,

    p_changed_by uuid,

    p_note text default null

)

returns void

language plpgsql

as
$$

begin

    insert into public.internship_status_history(

        internship_application_id,

        old_status,

        new_status,

        changed_by,

        note

    )

    values(

        p_application_id,

        p_old_status,

        p_new_status,

        p_changed_by,

        p_note

    );

end;

$$;