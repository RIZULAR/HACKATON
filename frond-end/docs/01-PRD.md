# Product Requirement Document (PRD)

# Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE)

Version : 1.0

Status : Draft

Author : Tim Hackathon

Last Update : Juli 2026

---

# 1. Executive Summary

Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE) merupakan aplikasi berbasis web yang bertujuan untuk mempermudah proses administrasi magang mahasiswa serta proses konversi kegiatan magang menjadi mata kuliah sesuai kurikulum OBE.

Sistem ini dibangun untuk menggantikan proses pada sistem BIMA yang masih memiliki beberapa kekurangan seperti proses yang rumit, sinkronisasi data yang sering gagal, istilah konversi yang membingungkan, approval yang masih manual, serta tidak adanya dashboard monitoring bagi Program Studi.

Sistem baru berfokus pada pengalaman pengguna (User Experience), otomatisasi proses bisnis, approval melalui email tanpa login, monitoring real-time, dan perhitungan nilai otomatis.

---

# 2. Background

Program Studi Informatika Universitas AMIKOM Yogyakarta menerapkan kebijakan MBKM yang memungkinkan kegiatan magang dikonversikan menjadi mata kuliah.

Saat ini proses tersebut menggunakan sistem BIMA.

Berdasarkan hasil evaluasi ditemukan beberapa kendala yaitu:

- UX sulit dipahami mahasiswa.
- Sinkronisasi ID Magang sering gagal.
- Mahasiswa bingung membedakan Usulan Konversi dan Klaim Konversi.
- Approval masih manual.
- Tidak ada dashboard monitoring.
- Penilaian dilakukan secara manual.
- Dokumen belum terorganisir dengan baik.

Oleh karena itu diperlukan sistem baru yang lebih sederhana, transparan, dan sesuai Outcome Based Education (OBE).

---

# 3. Problem Statement

Permasalahan utama yang ingin diselesaikan yaitu:

## Mahasiswa

- Sulit memahami alur konversi.
- Tidak mengetahui status pengajuan.
- Harus bertanya kepada DPL mengenai proses selanjutnya.
- Upload dokumen masih membingungkan.

## DPL

- Approval membutuhkan login.
- Sulit melakukan review melalui perangkat mobile.
- Tidak ada halaman review yang sederhana.

## Mitra

- Harus login untuk memberikan nilai.
- Proses penilaian terlalu panjang.

## Admin Prodi

- Sulit melakukan monitoring.
- Tidak ada statistik mahasiswa magang.

## Kaprodi

- Tidak dapat melihat perkembangan magang secara keseluruhan.

---

# 4. Objectives

Sistem yang dibangun memiliki tujuan sebagai berikut:

- Mempermudah proses pengajuan magang.
- Mempermudah proses usulan konversi.
- Mempermudah proses klaim konversi.
- Mendukung approval tanpa login.
- Menghasilkan nilai otomatis.
- Menyediakan dashboard monitoring.
- Menghasilkan laporan Excel.
- Menyimpan seluruh dokumen secara terorganisir.
- Mendukung konsep Outcome Based Education (OBE).

---

# 5. Scope

## In Scope

- Pengajuan Magang
- Verifikasi Admin
- Usulan Konversi
- Approval DPL
- Klaim Konversi
- Penilaian Mitra
- Review DPL
- Perhitungan Nilai
- Dashboard
- Export Excel
- Email Approval
- Notification
- Activity Log

## Out of Scope

- Sistem Akademik
- Sistem Keuangan
- Sistem Presensi
- Pengelolaan Kurikulum
- Sistem MBKM Nasional

---

# 6. User Roles

## Mahasiswa

Hak akses:

- Login
- Pengajuan Magang
- Upload Dokumen
- Usulan Konversi
- Klaim Konversi
- Melihat Status
- Download Hasil

---

## Admin Prodi

Hak akses:

- Validasi Pengajuan
- Monitoring
- Kelola Data
- Finalisasi Konversi

---

## DPL

Hak akses:

- Review Usulan
- Review Klaim
- Memberikan Nilai
- Approve
- Reject
- Revisi

Approval dilakukan melalui Email tanpa Login.

---

## Supervisor Mitra

Hak akses:

- Memberikan Nilai
- Memberikan Komentar

Supervisor tidak diwajibkan login.

---

## Kaprodi

Hak akses:

- Dashboard
- Statistik
- Monitoring
- Export Data

---

# 7. Business Process

## Tahap 1

Pengajuan Magang

Mahasiswa mengisi:

- NIM
- Nama
- Perusahaan
- Posisi
- Periode
- DPL
- Upload Proposal
- Upload Surat Diterima

↓

Status

Draft

↓

Menunggu Verifikasi

↓

Disetujui

---

## Tahap 2

Usulan Konversi

Mahasiswa melakukan mapping:

Aktivitas Magang

↓

CPMK

↓

Mata Kuliah

↓

Ajukan Usulan

↓

Menunggu Persetujuan DPL

---

## Tahap 3

Approval DPL

DPL menerima Email.

Klik Link.

Tidak perlu Login.

DPL dapat:

- Setuju
- Revisi
- Tolak

---

## Tahap 4

Magang Berjalan

Mahasiswa melakukan kegiatan magang.

---

## Tahap 5

Klaim Konversi

Mahasiswa mengupload:

- Logbook
- Laporan
- Sertifikat
- Bukti Aktivitas
- Link GitHub (Opsional)
- Link Deployment (Opsional)

↓

Menunggu Penilaian Mitra

---

## Tahap 6

Penilaian Mitra

Supervisor menerima Email.

↓

Klik Link

↓

Input Nilai

↓

Komentar

↓

Submit

↓

Status berubah

Menunggu Review DPL

---

## Tahap 7

Review DPL

DPL menerima Email.

↓

Review Dokumen

↓

Input Nilai

↓

Approve / Revisi / Reject

---

## Tahap 8

Perhitungan Nilai

Formula

Nilai Akhir =

(70% × Nilai Mitra)

+

(30% × Nilai DPL)

---

## Tahap 9

Generate Hasil

Sistem menghasilkan:

- Mata Kuliah
- SKS
- Nilai
- Nilai Huruf
- Riwayat CPMK
- Bukti Aktivitas

---

## Tahap 10

Export Excel

Admin dapat mengunduh hasil konversi.

---

# 8. Functional Requirements

## FR-001

Mahasiswa dapat membuat pengajuan magang.

## FR-002

Mahasiswa dapat mengupload proposal.

## FR-003

Mahasiswa dapat mengupload surat diterima.

## FR-004

Admin dapat memvalidasi pengajuan.

## FR-005

Mahasiswa dapat mengajukan usulan konversi.

## FR-006

Mahasiswa dapat memilih CPMK.

## FR-007

Mahasiswa dapat memilih Mata Kuliah.

## FR-008

DPL dapat melakukan approval.

## FR-009

Mahasiswa dapat mengupload logbook.

## FR-010

Mahasiswa dapat mengupload laporan.

## FR-011

Mahasiswa dapat mengupload sertifikat.

## FR-012

Supervisor dapat memberikan nilai.

## FR-013

Supervisor dapat memberikan komentar.

## FR-014

DPL dapat memberikan nilai.

## FR-015

DPL dapat meminta revisi.

## FR-016

Sistem menghitung nilai otomatis.

## FR-017

Sistem menghasilkan nilai huruf.

## FR-018

Admin dapat export Excel.

## FR-019

Kaprodi dapat melihat dashboard.

## FR-020

Sistem menyimpan Activity Log.

---

# 9. Non Functional Requirements

Performance

- Response < 2 detik.

Security

- JWT Authentication.
- Row Level Security.
- Signed URL.
- Token Expired.

Availability

- 99%

Scalability

- Mendukung ribuan mahasiswa.

Compatibility

- Desktop
- Tablet
- Mobile

Accessibility

- Responsive.
- Keyboard Navigation.

---

# 10. Success Metrics

Sistem dianggap berhasil apabila:

- Pengajuan magang menjadi lebih sederhana.
- Approval dapat dilakukan tanpa login.
- Mahasiswa tidak bingung antara Usulan dan Klaim.
- Dashboard dapat menampilkan statistik.
- Nilai dihitung otomatis.
- Export Excel berhasil.
- Dokumen tersimpan dengan baik.

---

# 11. Technology Stack

Frontend

- Next.js
- TypeScript
- TailwindCSS
- Shadcn UI

Backend

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Storage

- Supabase Storage

Deployment

- Vercel

---

# 12. Future Development

- Approval melalui Telegram
- Push Notification
- OCR Sertifikat
- AI Mapping CPMK
- Dashboard Analytics
- Mobile Application

---

# 13. Conclusion

Sistem ini diharapkan mampu meningkatkan efisiensi proses administrasi magang dan konversi mata kuliah berbasis Outcome Based Education (OBE). Dengan dukungan approval tanpa login, dashboard monitoring, penyimpanan dokumen terpusat, dan perhitungan nilai otomatis, proses konversi menjadi lebih transparan, cepat, dan mudah digunakan oleh seluruh aktor yang terlibat.