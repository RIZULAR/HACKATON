# 🛡️ EXPECTED SECURITY & RLS POLICIES SPECIFICATION
**Sistem Konversi Nilai Magang Berbasis OBE**

Dokumen ini menjadi acuan teknis bagi anggota tim pengembang database yang mengonfigurasi **Row Level Security (RLS)** dan *Grant Permissions* pada Supabase PostgreSQL.

---

## 👥 MATRIKS HAK AKSES PER ROLE SISTEM

| Tabel / Resource | Mahasiswa | Fakultas | Kaprodi | DPL | Mitra | Anonymous (Token) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `profiles` | Read (Own) | Read (All) | Read (All) | Read (All) | Read (Own) | No Access |
| `internship_applications` | Read/Write (Own) | Read/Update (All) | Read/Update (All) | Read (Assigned) | Read (Assigned) | No Access |
| `conversion_proposals` | Read/Write (Own) | Read (All) | Read (All) | Read/Update (Assigned) | No Access | No Access |
| `conversion_claims` | Read/Write (Own) | Read (All) | Read/Finalize (All) | Read (Assigned) | Read (Assigned) | No Access |
| `partner_assessments` | Read (Final) | Read (All) | Read (All) | Read (Assigned) | Write (Assigned) | Write (Valid Token) |
| `dpl_reviews` | Read (Final) | Read (All) | Read (All) | Write (Assigned) | No Access | Write (Valid Token) |
| `courses` & `cpmks` | Read (All) | Read/Write (All) | Read/Write (All) | Read (All) | Read (All) | No Access |
| `review_tokens` | No Access | Read (All) | Read (All) | Read (Assigned) | Read (Via Token) | Read (Via Token) |

---

## 🔒 SPESIFIKASI POLICY RLS BERDASARKAN ROLE

### 1. Role: `mahasiswa`
- **Tujuan**: Mengisolasi data pendaftaran, usulan, dan klaim agar mahasiswa hanya dapat membaca dan mengubah miliknya sendiri.
- **Kondisi Policy RLS**:
  - `SELECT / INSERT / UPDATE` pada `internship_applications` di mana `student_id = auth.uid()`.
  - HANYA dapat melakukan `UPDATE` jika status bernilai `draft`, `faculty_revision`, atau `kaprodi_revision`.
  - Dilarang secara langsung mengubah kolom `status`, `dpl_id`, atau `internship_code` secara ad-hoc tanpa melalui RPC.

### 2. Role: `fakultas` (Admin Fakultas)
- **Tujuan**: Verifikasi kelengkapan berkas pendaftaran magang seluruh mahasiswa.
- **Kondisi Policy RLS**:
  - `SELECT` pada seluruh record `internship_applications`, `conversion_proposals`, dan `conversion_claims`.
  - `UPDATE` pada `internship_applications` khusus kolom verifikasi saat status ber-nilai `submitted`.

### 3. Role: `kaprodi` (Ketua Program Studi)
- **Tujuan**: Pengambil keputusan akhir, penugasan DPL, pengelolaan bobot konversi, dan finalisasi transkrip nilai.
- **Kondisi Policy RLS**:
  - Full `SELECT` & `UPDATE` pada seluruh aplikasi magang, usulan, dan klaim konversi.
  - Memiliki akses eksklusif untuk mengeksekusi RPC finalisasi transkrip dan perubahan konfigurasi bobot nilai.

### 4. Role: `dpl` (Dosen Pembimbing Lapangan)
- **Tujuan**: Membimbing mahasiswa, mengulas usulan konversi, dan memberikan penilaian akademik (30%).
- **Kondisi Policy RLS**:
  - `SELECT` pada `internship_applications` di mana `dpl_id = auth.uid()`.
  - `INSERT / UPDATE` pada `dpl_reviews` untuk mahasiswa bimbingannya.

### 5. Role: `mitra` (Pembimbing Industri)
- **Tujuan**: Memberikan penilaian performa magang industri (70%).
- **Kondisi Policy RLS**:
  - `INSERT / UPDATE` pada `partner_assessments` sesuai pendaftaran magang mitra terkait.

### 6. Role: `anonymous` (Akses Tanpa Login / Magic Link Token)
- **Tujuan**: Memungkinkan Pembimbing Mitra / DPL mengisi penilaian via token rahasia tanpa membuat akun auth Supabase.
- **Kondisi Policy RLS**:
  - Akses `SELECT` pada `review_tokens` hanya jika token cocok (`token_hash = sha256(input_token)`), belum terpakai (`is_used = false`), dan belum kadaluarsa (`expires_at > NOW()`).
  - Akses `INSERT` pada `partner_assessments` atau `dpl_reviews` khusus untuk record yang terikat dengan token sah tersebut.
  - Dilarang keras membaca data tabel sensitif lain (`profiles`, `audit_logs`, dll).
