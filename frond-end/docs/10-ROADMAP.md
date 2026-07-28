# Product Roadmap

# Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE)

Version : 1.0

---

# Pendahuluan

Dokumen ini menjelaskan roadmap pengembangan Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE).

Roadmap disusun berdasarkan prioritas fitur agar proses pengembangan lebih terarah dan sesuai dengan kebutuhan Program Studi Informatika Universitas AMIKOM Yogyakarta.

---

# Visi Produk

Membangun sistem konversi magang yang:

- Mudah digunakan oleh mahasiswa.
- Mempermudah proses review DPL.
- Memudahkan supervisor memberikan penilaian tanpa login.
- Memudahkan Admin dan Kaprodi melakukan monitoring.
- Menghasilkan nilai konversi secara otomatis berdasarkan Outcome-Based Education (OBE).

---

# Target Pengguna

- Mahasiswa
- Admin Prodi
- Dosen Pembimbing Lapangan (DPL)
- Supervisor Mitra
- Kaprodi

---

# Roadmap Pengembangan

## Phase 1 — Core System

Target

Membangun fondasi sistem.

Fitur

- Login
- Dashboard
- Role Management
- Authentication
- Layout
- Navigation
- Profile

Output

Pengguna dapat masuk ke sistem sesuai hak akses masing-masing.

---

## Phase 2 — Pengajuan Magang

Target

Mahasiswa dapat mengajukan magang.

Fitur

- Form Pengajuan
- Upload Proposal
- Upload Surat Diterima
- Generate ID Magang
- Masa Berlaku ID Magang
- Verifikasi Admin

Output

Status

Draft

↓

Menunggu Verifikasi

↓

Disetujui

---

## Phase 3 — Usulan Konversi

Target

Mahasiswa dapat mengajukan konversi berdasarkan aktivitas magang.

Fitur

- Mapping Aktivitas
- Mapping CPMK
- Mapping Mata Kuliah
- Approval DPL
- Revisi

Output

Usulan konversi tervalidasi.

---

## Phase 4 — Monitoring Magang

Target

DPL dapat memonitor perkembangan mahasiswa.

Fitur

- Upload Laporan Bulanan
- Review Laporan
- Riwayat Laporan
- Komentar DPL

Output

Monitoring magang menjadi lebih terstruktur.

---

## Phase 5 — Klaim Konversi

Target

Mahasiswa mengajukan hasil magang.

Fitur

- Upload Logbook
- Upload Sertifikat
- Upload Laporan Akhir
- Upload Bukti Aktivitas
- Upload Repository GitHub
- Upload Link Deployment

Output

Seluruh dokumen tersimpan dengan rapi.

---

## Phase 6 — Penilaian Supervisor

Target

Supervisor memberikan penilaian.

Fitur

- Email Otomatis
- Token
- Input Nilai
- Komentar

Output

Status

Menunggu Review DPL

---

## Phase 7 — Review DPL

Target

DPL memberikan nilai akademik.

Fitur

- Review Dokumen
- Nilai DPL
- Approve
- Revisi
- Reject

Output

Nilai DPL tersimpan.

---

## Phase 8 — Finalisasi Kaprodi

Target

Konversi menjadi resmi.

Fitur

- Approval Kaprodi
- Generate Nilai
- Finalisasi

Output

Konversi selesai.

---

## Phase 9 — Dashboard

Target

Monitoring seluruh aktivitas.

Dashboard Mahasiswa

- Progress Magang
- Status Pengajuan
- Timeline

Dashboard Admin

- Total Pengajuan
- Total Klaim
- Statistik

Dashboard Kaprodi

- Mahasiswa Aktif
- Mitra Industri
- Konversi
- Distribusi Nilai

---

## Phase 10 — Export

Target

Mendukung administrasi akademik.

Fitur

- Export Excel
- Export PDF

Output

Laporan siap dikirim ke sistem akademik.

---

# Timeline

| Phase | Durasi |
|--------|---------|
| Phase 1 | 1 Minggu |
| Phase 2 | 1 Minggu |
| Phase 3 | 1 Minggu |
| Phase 4 | 1 Minggu |
| Phase 5 | 1 Minggu |
| Phase 6 | 1 Minggu |
| Phase 7 | 1 Minggu |
| Phase 8 | 1 Minggu |
| Phase 9 | 1 Minggu |
| Phase 10 | 1 Minggu |

---

# Prioritas Fitur

## High Priority

- Authentication
- Pengajuan Magang
- Verifikasi Admin
- Usulan Konversi
- Klaim Konversi
- Penilaian Supervisor
- Review DPL
- Finalisasi Kaprodi
- Dashboard
- Export Excel

---

## Medium Priority

- Activity Log
- Notification
- Dashboard Analytics
- Responsive UI

---

## Low Priority

- Dark Mode
- Multi Language
- Progressive Web App (PWA)
- Mobile App

---

# Risiko Proyek

| Risiko | Solusi |
|---------|--------|
| Email gagal terkirim | Retry dan log email |
| Token kedaluwarsa | Fitur kirim ulang email |
| File upload gagal | Validasi ukuran dan tipe file |
| Data tidak sinkron | Realtime Supabase dan Activity Log |
| Pengguna bingung | Wizard dan Timeline Status |

---

# Indikator Keberhasilan

Sistem dianggap berhasil apabila:

- Seluruh proses konversi dapat dilakukan secara digital.
- Approval DPL dan Supervisor dilakukan tanpa login.
- Nilai akhir dihitung otomatis.
- Dashboard menampilkan statistik secara real-time.
- Hasil konversi dapat diekspor ke Excel.
- Seluruh aktivitas tercatat pada Activity Log.

---

# Future Development

Versi berikutnya dapat menambahkan:

- Integrasi dengan Sistem Akademik (BIMA/SIAKAD).
- Integrasi Telegram dan WhatsApp Notification.
- AI Recommendation untuk pemetaan CPMK.
- Dashboard analitik berbasis grafik.
- Mobile Application (Android dan iOS).

---

# Kesimpulan

Roadmap ini menjadi acuan pengembangan sistem secara bertahap. Setiap fase memiliki tujuan yang jelas sehingga proses implementasi dapat dilakukan secara terstruktur, mudah dipantau, dan sesuai dengan kebutuhan studi kasus hackathon.