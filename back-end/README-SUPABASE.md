# 🚀 BACKEND INFRASTRUCTURE & SUPABASE SERVICE LAYER
**Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE)**

Panduan komprehensif struktur backend, skrip automasi, service layer, Edge Functions, serta integrasi Supabase PostgreSQL.

---

## 📌 1. STRUKTUR BACKEND
```text
back-end/
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README-SUPABASE.md
├── DATABASE-CONTRACT.md
├── data/
│   └── courses.json
├── scripts/
│   ├── seed-demo-users.mjs
│   ├── import-courses.mjs
│   ├── smoke-test-connection.mjs
│   ├── smoke-test-application.mjs
│   ├── smoke-test-conversion.mjs
│   └── inspect-database-contract.mjs
├── src/
│   ├── lib/
│   │   ├── supabaseAdmin.js
│   │   └── supabaseClient.js
│   ├── constants/
│   │   ├── roles.js
│   │   ├── internshipStatuses.js
│   │   ├── proposalStatuses.js
│   │   ├── claimStatuses.js
│   │   └── reviewDecisions.js
│   ├── utils/
│   │   ├── validateEnv.js
│   │   ├── generateRandomToken.js
│   │   ├── hashToken.js
│   │   ├── calculateFinalScore.js
│   │   ├── validateEmail.js
│   │   └── formatError.js
│   └── services/
│       ├── index.js
│       ├── authService.js
│       ├── internshipService.js
│       ├── courseService.js
│       ├── proposalService.js
│       ├── claimService.js
│       ├── assessmentService.js
│       ├── tokenService.js
│       ├── dashboardService.js
│       └── storageService.js
└── supabase/
    ├── functions/
    │   ├── send-review-email/index.ts
    │   ├── create-review-token/index.ts
    │   └── export-conversion-result/index.ts
    └── tests/
        ├── expected-application-flow.md
        ├── expected-conversion-flow.md
        └── expected-security-rules.md
```

---

## 🛠️ 2. CARA INSTALASI
Jalankan perintah berikut pada terminal di folder `back-end`:
```bash
npm install
```

---

## 🔑 3. CARA MEMBUAT `.ENV`
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isikan nilai variabel environment yang dibutuhkan:
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_p_...
SUPABASE_SECRET_KEY=sb_s_...
SUPABASE_PROJECT_REF=<project-ref>

APP_PUBLIC_URL=http://localhost:5173

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@amikom.ac.id

DEMO_PASSWORD=Password123!
COURSES_JSON_PATH=./data/courses.json
```

---

## 🌐 4. CARA MENGHUBUNGKAN SUPABASE
Backend menggunakan dua jenis client:
- **Client Biasa** (`src/lib/supabaseClient.js`): Menggunakan `SUPABASE_PUBLISHABLE_KEY` untuk operasi standard user.
- **Client Admin** (`src/lib/supabaseAdmin.js`): Menggunakan `SUPABASE_SECRET_KEY` dengan `persistSession: false` & `autoRefreshToken: false` untuk operasi administratif server.

---

## 👤 5. CARA MENJALANKAN SEED DEMO USERS
Skrip ini secara aman membuat 5 akun demo (`mahasiswa`, `fakultas`, `kaprodi`, `dpl.ade`, `dpl.budi`):
```bash
npm run seed:users
```

---

## 📚 6. CARA IMPORT KATALOG MATA KULIAH
Import file JSON katalog mata kuliah ke Supabase:
```bash
npm run seed:courses
```

---

## 🧪 7. CARA MENJALANKAN SMOKE TEST
Gunakan script smoke test untuk memverifikasi fungsionalitas backend:
```bash
# 1. Uji Koneksi & Environment
npm run test:connection

# 2. Uji Alur Pengajuan Magang
npm run test:application

# 3. Uji Alur Konversi & Penilaian OBE
npm run test:conversion
```

---

## 🔍 8. CARA MENJALANKAN INSPECT DATABASE CONTRACT
Periksa ketersediaan tabel, RPC, dan bucket storage di Supabase:
```bash
npm run inspect:database
```

---

## ⚡ 9. CARA DEPLOY EDGE FUNCTIONS
Deploy Edge Function ke Supabase Cloud:
```bash
npx supabase functions deploy send-review-email
npx supabase functions deploy create-review-token
npx supabase functions deploy export-conversion-result
```

---

## 🗄️ 10. DAFTAR TABEL YANG DIASUMSIKAN (18 TABEL)
1. `profiles`
2. `internship_applications`
3. `internship_status_history`
4. `courses`
5. `course_cpmks`
6. `conversion_proposals`
7. `proposal_activities`
8. `proposal_activity_courses`
9. `proposal_activity_cpmks`
10. `conversion_claims`
11. `claim_activities`
12. `claim_evidences`
13. `partner_assessments`
14. `dpl_reviews`
15. `review_tokens`
16. `final_conversion_results`
17. `notifications`
18. `audit_logs`

---

## ⚡ 11. DAFTAR RPC YANG DIASUMSIKAN (31 RPC)
- **Pengajuan**: `create_internship_draft`, `update_internship_application`, `submit_internship_application`, `faculty_review_internship`, `kaprodi_finalize_internship`, `get_my_internship_applications`, `get_faculty_pending_applications`, `get_kaprodi_pending_applications`, `get_assigned_dpl_internships`, `get_internship_detail`, `get_available_dpl_directory`.
- **Usulan**: `create_conversion_proposal`, `add_proposal_activity`, `allocate_activity_to_course`, `map_activity_to_cpmk`, `validate_proposal_hours`, `submit_conversion_proposal`, `review_proposal_by_dpl`.
- **Klaim**: `create_conversion_claim`, `update_claim_activity`, `add_claim_evidence`, `validate_claim_documents`, `submit_conversion_claim`.
- **Penilaian**: `submit_partner_assessment`, `submit_dpl_claim_review`, `calculate_final_score`, `finalize_conversion_result`.
- **Dashboard**: `get_faculty_dashboard_summary`, `get_kaprodi_dashboard_summary`, `get_partner_statistics`, `get_dpl_workload_statistics`.

---

## 👥 12. PENJELASAN ROLE SISTEM
- `mahasiswa`: Mengajukan magang, menyusun usulan kegiatan, mengunggah bukti klaim.
- `fakultas`: Menguji kelengkapan berkas pendaftaran magang.
- `kaprodi`: Penentu keputusan akhir magang, menetapkan DPL, mengatur bobot konversi, serta memfinalisasi transkrip nilai.
- `dpl`: Dosen Pembimbing Lapangan yang menyetujui usulan konversi dan memberikan penilaian akademik.
- `mitra`: Pembimbing Industri yang memberikan penilaian performa magang industri.

---

## 🆔 13. PENJELASAN ID MAGANG (`internship_code`)
Saat aplikasi magang disetujui oleh Kaprodi (`status: approved`), sistem secara otomatis menerbitkan `internship_code` dengan format `INT-YYYY-XXXX` (misal: `INT-2026-0001`).

---

## ⏱️ 14. VALIDASI 1 SKS = 45 JAM WORKLOAD
Dalam standar OBE, 1 SKS kegiatan magang setara dengan **45 jam beban kerja (workload)**.  
$$\text{Total Jam Minimal} = \text{SKS} \times 45 \text{ jam}$$

---

## 🧮 15. RUMUS PENILAIAN BERBOBOT (70% MITRA + 30% DPL)
$$\text{Nilai Akhir} = \left( \text{Skor Mitra} \times 0.70 \right) + \left( \text{Skor DPL} \times 0.30 \right)$$
- $\ge 80.00 \rightarrow \mathbf{A}$
- $70.00 - 79.99 \rightarrow \mathbf{B}$
- $60.00 - 69.99 \rightarrow \mathbf{C}$
- $50.00 - 59.99 \rightarrow \mathbf{D}$
- $< 50.00 \rightarrow \mathbf{E}$

---

## 🚨 16. TROUBLESHOOTING JIKA TABEL / RPC BELUM TERSEDIA
Jika skrip menampilkan pesan `⛔ PROSES DIHENTIKAN` atau `[MISSING]`:
1. Jangan jalankan `supabase db reset` atau `supabase db push` dari skrip ini.
2. Sampaikan daftar `[MISSING]` dari `npm run inspect:database` ke anggota tim yang bertugas membuat migration SQL.
3. Jalankan ulang skrip setelah migration SQL berhasil diterapkan.

---

## 🤝 17. PEMBAGIAN KERJA TIM
- **Anggota Tim Lain**: SQL Migration, Skema Database PostgreSQL, dan Kebijakan Row Level Security (RLS).
- **Tugas Pada Repository Ini**: Struktur pendukung backend, Service Layer Wrapper (`src/services/`), Utility (`src/utils/`), Skrip Automasi Seeding & Testing (`scripts/`), Edge Functions (`supabase/functions/`), dan Dokumentasi Kontrak (`DATABASE-CONTRACT.md`).
