# Database Design

# Sistem Konversi Nilai Magang Berbasis Outcome Based Education (OBE)

Version 1.0

---

# Database Overview

Database menggunakan PostgreSQL (Supabase).

Seluruh proses dimulai dari Pengajuan Magang hingga Finalisasi Konversi.

---

## Entity Relationship

Mahasiswa
│
├── Pengajuan Magang
│      │
│      ├── Dokumen Pengajuan
│      │
│      ▼
│  Usulan Konversi
│      │
│      ├── Mapping CPMK
│      │
│      ▼
│  Laporan Bulanan
│      │
│      ▼
│  Klaim Konversi
│      │
│      ├── Dokumen Klaim
│      │
│      ▼
│  Penilaian Mitra
│      │
│      ▼
│  Review DPL
│      │
│      ▼
│  Finalisasi Kaprodi
│      │
│      ▼
│  Hasil Konversi
│
▼
Dashboard

---

# 1. users

Menyimpan akun seluruh pengguna.

| Field | Type |
|--------|------|
| id | uuid |
| name | varchar |
| email | varchar |
| role | enum |
| created_at | timestamp |
| updated_at | timestamp |

Role

- mahasiswa
- admin
- dpl
- kaprodi

---

# 2. students

Data mahasiswa.

| Field | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| nim | varchar |
| nama | varchar |
| angkatan | integer |
| prodi | varchar |

---

# 3. lecturers

Data dosen.

| Field | Type |
|--------|------|
| id | uuid |
| nama | varchar |
| email | varchar |

---

# 4. companies

Data mitra industri.

| Field | Type |
|--------|------|
| id | uuid |
| nama | varchar |
| alamat | text |
| email | varchar |
| supervisor | varchar |

---

# 5. internships

Pengajuan magang mahasiswa.

| Field | Type |
|--------|------|
| id | uuid |
| internship_code | varchar |
| student_id | uuid |
| company_id | uuid |
| dpl_id | uuid |
| posisi | varchar |
| periode_mulai | date |
| periode_selesai | date |
| proposal_file | text |
| acceptance_file | text |
| status | enum |
| expired_at | timestamp |
| created_at | timestamp |

Status

- Draft
- Menunggu Verifikasi
- Disetujui
- Ditolak

Catatan

ID Magang memiliki masa berlaku.

Apabila masa berlaku habis, mahasiswa dapat membuat pengajuan baru.

---

# 6. internship_reports

Laporan bulanan.

| Field | Type |
|--------|------|
| id | uuid |
| internship_id | uuid |
| bulan_ke | integer |
| file_laporan | text |
| komentar_dpl | text |
| status | enum |
| created_at | timestamp |

Status

- Menunggu Review
- Revisi
- Disetujui

---

# 7. conversion_proposals

Usulan konversi.

| Field | Type |
|--------|------|
| id | uuid |
| internship_id | uuid |
| student_id | uuid |
| status | enum |
| submitted_at | timestamp |

Status

- Draft
- Menunggu Approval DPL
- Revisi
- Disetujui
- Ditolak

---

# 8. proposal_details

Mapping Aktivitas → CPMK → Mata Kuliah.

| Field | Type |
|--------|------|
| id | uuid |
| proposal_id | uuid |
| aktivitas | text |
| cpmk_id | uuid |
| course_id | uuid |

---

# 9. claims

Klaim konversi.

| Field | Type |
|--------|------|
| id | uuid |
| proposal_id | uuid |
| status | enum |
| submitted_at | timestamp |

Status

- Draft
- Menunggu Penilaian Mitra
- Menunggu Review DPL
- Menunggu Finalisasi Kaprodi
- Revisi
- Disetujui
- Ditolak

---

# 10. claim_documents

Dokumen klaim.

| Field | Type |
|--------|------|
| id | uuid |
| claim_id | uuid |
| jenis | enum |
| file_url | text |

Jenis

- Logbook
- Laporan Akhir
- Sertifikat
- Dokumentasi
- GitHub
- Deployment
- Lainnya

---

# 11. mentor_reviews

Penilaian Supervisor.

| Field | Type |
|--------|------|
| id | uuid |
| claim_id | uuid |
| nilai | integer |
| komentar | text |
| reviewed_at | timestamp |

---

# 12. dpl_reviews

Penilaian DPL.

| Field | Type |
|--------|------|
| id | uuid |
| claim_id | uuid |
| nilai | integer |
| komentar | text |
| status | enum |
| reviewed_at | timestamp |

Status

- Revisi
- Disetujui
- Ditolak

---

# 13. kaprodi_reviews

Finalisasi konversi.

| Field | Type |
|--------|------|
| id | uuid |
| claim_id | uuid |
| status | enum |
| komentar | text |
| approved_at | timestamp |

Status

- Menunggu Finalisasi
- Disetujui
- Ditolak

---

# 14. conversion_results

Hasil konversi.

| Field | Type |
|--------|------|
| id | uuid |
| claim_id | uuid |
| nilai_mitra | integer |
| nilai_dpl | integer |
| nilai_akhir | decimal |
| nilai_huruf | varchar |
| total_sks | integer |

Formula

Nilai Akhir

=

70% × Nilai Mitra

+

30% × Nilai DPL

---

# 15. notifications

Notifikasi sistem.

| Field | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| title | varchar |
| message | text |
| is_read | boolean |
| created_at | timestamp |

---

# 16. activity_logs

Audit Log.

| Field | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| aktivitas | text |
| created_at | timestamp |

Contoh

- Mahasiswa membuat pengajuan
- Admin menyetujui pengajuan
- DPL menyetujui usulan
- Supervisor memberikan nilai
- Kaprodi finalisasi

---

# Relasi Database

users
└── students

lecturers
└── internships

companies
└── internships

internships
├── internship_reports
├── conversion_proposals

conversion_proposals
├── proposal_details
└── claims

claims
├── claim_documents
├── mentor_reviews
├── dpl_reviews
├── kaprodi_reviews
└── conversion_results

users
├── notifications
└── activity_logs