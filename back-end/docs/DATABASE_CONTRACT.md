# Database Contract Specification (OBE Internship Conversion System)

> **PENTING UNTUK TIM MIGRATION DATABASE**:  
> Dokumen ini adalah kontrak skema database yang digunakan oleh **Services Backend** dan **Supabase Edge Functions**. Pastikan migration SQL yang dibuat oleh anggota tim mengikuti struktur tabel, nama kolom, tipe data, dan relasi di bawah ini.

---

## 👥 1. Tabel `profiles`
Menyimpan data profil pengguna untuk 5 role sistem.

```sql
CREATE TYPE user_role AS ENUM ('mahasiswa', 'dpl', 'fakultas', 'kaprodi', 'mitra');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'mahasiswa',
    full_name TEXT NOT NULL,
    nim TEXT,
    nip TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📚 2. Tabel `courses` & `cpmks`
Katalog mata kuliah & deskripsi CPMK untuk konversi OBE.

```sql
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- Contoh: 'IF601'
    name TEXT NOT NULL,       -- Contoh: 'Rekayasa Perangkat Lunak'
    credits INT NOT NULL DEFAULT 3,
    cpmk_description TEXT,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cpmks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    weight NUMERIC(5,2) DEFAULT 100.00
);
```

---

## 💼 3. Tabel `internship_applications`
Pengajuan magang oleh mahasiswa.

```sql
CREATE TYPE internship_status AS ENUM (
    'draft',
    'submitted',
    'verified_fakultas',
    'approved_kaprodi',
    'rejected',
    'in_progress',
    'completed'
);

CREATE TABLE public.internship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    duration_months INT DEFAULT 4,
    start_date DATE,
    end_date DATE,
    dpl_id UUID REFERENCES public.profiles(id),
    status internship_status DEFAULT 'submitted',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 4. Tabel `conversion_proposals` & `conversion_claims`
Alur Usulan vs Klaim Konversi OBE.

```sql
CREATE TABLE public.conversion_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'usulan_submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversion_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    certificate_url TEXT,
    logbook_url TEXT,
    report_url TEXT,
    status TEXT DEFAULT 'klaim_submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversion_claim_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES public.conversion_claims(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    credits INT NOT NULL
);
```

---

## 🔑 5. Tabel `assessment_tokens` (Magic Link Penilaian Tanpa Login)

```sql
CREATE TABLE public.assessment_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('mitra', 'dpl')),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);
```

---

## 📝 6. Tabel `partner_assessments` & `dpl_reviews`

```sql
CREATE TABLE public.partner_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL UNIQUE REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    evaluator_name TEXT,
    evaluator_position TEXT,
    company_name TEXT,
    scores JSONB NOT NULL DEFAULT '{}', -- Contoh: {"IF601": 90, "IF602": 85}
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.dpl_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL UNIQUE REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    dpl_id UUID REFERENCES public.profiles(id),
    scores JSONB NOT NULL DEFAULT '{}', -- Contoh: {"IF601": 88, "IF602": 82}
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Kebijakan Row Level Security (RLS)
1. **`profiles`**: User dapat membaca profil sendiri. Admin/Fakultas/Kaprodi dapat membaca semua profil.
2. **`internship_applications`**: Mahasiswa dapat membuat & membaca aplikasi miliknya. Fakultas & Kaprodi memiliki akses `UPDATE` status.
3. **`assessment_tokens`**: Anonim (tanpa login) dapat membaca via Edge Function `public-assessment`.
