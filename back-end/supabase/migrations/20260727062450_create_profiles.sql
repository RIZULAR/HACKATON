-- =====================================================
-- EXTENSION
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- ENUM
-- =====================================================

create type user_role as enum (
    'mahasiswa',
    'dpl',
    'admin_prodi',
    'kaprodi',
    'mitra'
);

-- =====================================================
-- TABLE PROFILES
-- =====================================================

create table public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

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

-- =====================================================
-- FUNCTION UPDATED_AT
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_profiles_updated_at
before update
on public.profiles
for each row
execute function public.set_updated_at();

-- =====================================================
-- INDEX
-- =====================================================

create index idx_profiles_role
on public.profiles(role);

create index idx_profiles_nim
on public.profiles(nim);

create index idx_profiles_nip
on public.profiles(nip);

create index idx_profiles_email
on public.profiles(email);