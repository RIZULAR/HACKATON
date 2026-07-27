# Panduan Integrasi Migration Database dengan Backend

Dokumen ini menjelaskan alur kerja dan aturan integrasi antara skrip migration SQL (yang dibuat oleh anggota tim lain) dengan struktur backend & Edge Functions.

---

## 🎯 Prinsip Kerja Sama Tim
- **Tim Backend (Struktur & Services)**: Bertanggung jawab atas helper JavaScript, services API/query, Edge Functions Deno/TypeScript, skrip seeding, dan smoke test.
- **Tim Database (Migration SQL)**: Bertanggung jawab atas pembuatan file SQL di `back-end/supabase/migrations/*.sql` dan eksekusi skema database.

---

## 📋 Langkah Integrasi Saat Migration SQL Selesai Dibuat

1. **Jalankan Migration ke Instance Supabase Remote/Local**:
   ```bash
   npx supabase db push
   ```
   *(Harus dengan persetujuan tim / dieksekusi oleh penanggung jawab migration).*

2. **Jalankan Skrip Import Katalog Mata Kuliah**:
   Setelah tabel `courses` dibuat oleh migration, jalankan import data mata kuliah:
   ```bash
   npm run import-courses
   ```

3. **Jalankan Skrip Seeding Akun Demo (5 Role)**:
   Guna menyiapkan data pengujian untuk role `mahasiswa`, `dpl`, `fakultas`, `kaprodi`, dan `mitra`:
   ```bash
   npm run seed-demo
   ```

4. **Jalankan Backend Smoke Test**:
   Untuk memverifikasi seluruh komponen backend dan respons database:
   ```bash
   npm run smoke-test
   ```

---

## ⚡ Deploy Edge Function Penilaian Tanpa Login
Jika Edge Function `public-assessment` ingin dideploy ke Supabase Cloud:

```bash
npx supabase functions deploy public-assessment --no-verify-jwt
```
*Catatan: `--no-verify-jwt` digunakan agar endpoint penilaian dapat diakses oleh Mitra Industri / DPL via token unik tanpa login.*
