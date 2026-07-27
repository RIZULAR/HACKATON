-- =====================================================
-- STORAGE BUCKET
-- =====================================================

insert into storage.buckets (
    id,
    name,
    public
)
values (
    'internship-documents',
    'internship-documents',
    false
)
on conflict (id) do nothing;

-- =====================================================
-- STUDENT UPLOAD
-- =====================================================

create policy "Student upload documents"

on storage.objects

for insert

to authenticated

with check (

    bucket_id='internship-documents'

    and

    auth.uid()::text = (storage.foldername(name))[2]

);

create policy "Student read own documents"

on storage.objects

for select

to authenticated

using (

    bucket_id='internship-documents'

    and

    auth.uid()::text = (storage.foldername(name))[2]

);

create policy "Student delete own documents"

on storage.objects

for delete

to authenticated

using (

    bucket_id='internship-documents'

    and

    auth.uid()::text = (storage.foldername(name))[2]

);

create policy "Admin full storage"

on storage.objects

for all

to authenticated

using (

    exists (

        select 1

        from public.profiles

        where id = auth.uid()

        and role = 'admin_prodi'

    )

)

with check (

    exists (

        select 1

        from public.profiles

        where id = auth.uid()

        and role = 'admin_prodi'

    )

);

create policy "DPL read documents"

on storage.objects

for select

to authenticated

using (

    exists (

        select 1

        from public.profiles

        where id = auth.uid()

        and role = 'dpl'

    )

);

create policy "Kaprodi read documents"

on storage.objects

for select

to authenticated

using (

    exists (

        select 1

        from public.profiles

        where id = auth.uid()

        and role = 'kaprodi'

    )

);