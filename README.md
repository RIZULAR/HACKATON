# Sistem Konversi Nilai Magang Berbasis OBE

> [!IMPORTANT]
>
> ## 🎨 Desain Alternatif Kedua
>
> Selain desain utama yang terdapat pada repository ini, tersedia **desain kedua** yang juga dapat digunakan dan dikembangkan melalui repository berikut:
>
> **[Buka Repository Desain Kedua — konversi-magang](https://github.com/Zaidanelha/konversi-magang)**

## Tentang Project

Sistem Konversi Nilai Magang Berbasis Outcome-Based Education atau OBE merupakan prototype aplikasi yang dikembangkan untuk **Hackathon Informatics Plus 2026**.

Sistem ini membantu mengelola proses magang mahasiswa secara terstruktur, mulai dari pengajuan magang, verifikasi oleh Program Studi, penyusunan usulan konversi, pengumpulan bukti kegiatan, penilaian Mitra, review Dosen Pembimbing Lapangan, hingga finalisasi hasil konversi nilai.

## Tujuan Sistem

Project ini dibuat untuk:

* Mempermudah mahasiswa mengajukan dan memantau proses magang.
* Menghubungkan aktivitas magang dengan CPMK dan mata kuliah.
* Mempermudah Program Studi melakukan verifikasi dan validasi.
* Memfasilitasi penilaian Mitra dan DPL tanpa proses login yang rumit.
* Menghitung nilai akhir konversi secara otomatis.
* Menyediakan monitoring proses bagi Kaprodi.

## Pengguna Sistem

### 1. Mahasiswa

Mahasiswa dapat:

* Mengajukan kegiatan magang.
* Melihat status verifikasi pengajuan.
* Menyusun usulan konversi aktivitas magang.
* Menghubungkan aktivitas dengan CPMK dan mata kuliah.
* Mengisi klaim realisasi kegiatan.
* Mengunggah bukti kegiatan.
* Melihat hasil akhir konversi nilai.

### 2. Program Studi atau Admin

Program Studi dapat:

* Memverifikasi pengajuan magang.
* Meminta perbaikan pengajuan mahasiswa.
* Memvalidasi usulan konversi.
* Memantau penilaian Mitra dan review DPL.
* Mengatur bobot penilaian.
* Menghitung dan memfinalisasi hasil konversi.

### 3. Mitra

Mitra dapat:

* Mengakses halaman penilaian melalui tautan token.
* Melihat klaim dan bukti aktivitas mahasiswa.
* Memberikan nilai dan komentar.
* Melakukan penilaian tanpa login.

### 4. Dosen Pembimbing Lapangan

DPL dapat:

* Mengakses halaman review melalui tautan token.
* Membandingkan usulan, klaim, bukti, dan nilai Mitra.
* Memberikan nilai akademik.
* Menyetujui klaim atau meminta revisi.

### 5. Kaprodi

Kaprodi dapat:

* Memantau seluruh proses magang dalam mode hanya-baca.
* Melihat perkembangan setiap tahapan.
* Melihat status penilaian Mitra dan DPL.
* Melihat hasil akhir konversi mahasiswa.

## Fitur Utama

* Pemilihan peran pengguna dalam mode demo.
* Dashboard mahasiswa.
* Pengajuan dan verifikasi magang.
* Sinkronisasi data atau ID magang.
* Usulan konversi Aktivitas Magang → CPMK → Mata Kuliah.
* Klaim realisasi aktivitas magang.
* Upload bukti kegiatan.
* Penilaian Mitra melalui tautan token.
* Review DPL melalui tautan token.
* Perhitungan nilai akhir otomatis.
* Finalisasi hasil konversi.
* Dashboard monitoring Program Studi.
* Dashboard Kaprodi dalam mode hanya-baca.
* Ekspor atau pencetakan hasil konversi.

## Alur Sistem

1. Mahasiswa mengisi dan mengirim pengajuan magang.
2. Program Studi memverifikasi pengajuan.
3. Mahasiswa menyusun usulan aktivitas, CPMK, dan mata kuliah.
4. Program Studi memvalidasi usulan konversi.
5. Mahasiswa mengisi klaim realisasi dan mengunggah bukti.
6. Mitra memberikan penilaian melalui tautan token.
7. DPL memberikan review akademik melalui tautan token.
8. Program Studi menghitung dan memfinalisasi nilai.
9. Mahasiswa dan Kaprodi melihat hasil akhir konversi.

## Perhitungan Nilai

Nilai akhir setiap mata kuliah dihitung menggunakan rumus:

```text
(Nilai Mitra × Bobot Mitra / 100)
+
(Nilai DPL × Bobot DPL / 100)
```

## Teknologi yang Digunakan

### Frontend

* React
* Vite
* React Router
* Tailwind CSS
* Supabase JavaScript Client

### Backend dan Database

* Supabase
* PostgreSQL
* Supabase CLI
* Node.js
* JavaScript
* Row Level Security
* Database Function atau RPC

## Struktur Repository

```text
HACKATON/
├── frond-end/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── back-end/
│   ├── scripts/
│   ├── src/
│   ├── supabase/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

> Catatan: Nama folder frontend pada repository saat ini ditulis sebagai `frond-end`.

## Menjalankan Frontend

Masuk ke folder frontend:

```bash
cd frond-end
```

Install seluruh dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Setelah berhasil, buka alamat yang ditampilkan pada terminal. Umumnya aplikasi dapat diakses melalui:

```text
http://localhost:5173
```

## Menyiapkan Backend

Masuk ke folder backend:

```bash
cd back-end
```

Install dependency:

```bash
npm install
```

Salin konfigurasi environment:

```powershell
copy .env.example .env
```

Kemudian isi variabel Supabase dan konfigurasi lain yang dibutuhkan pada file `.env`.

> Jangan mengunggah file `.env` yang berisi secret key ke repository GitHub.

## Repository

### Repository Utama

```text
https://github.com/RIZULAR/HACKATON
```

### Repository Desain Alternatif Kedua

```text
https://github.com/Zaidanelha/konversi-magang
```

## Status Project

Project ini merupakan prototype atau Minimum Viable Product yang dikembangkan untuk kebutuhan Hackathon Informatics Plus 2026 dan masih dapat dikembangkan lebih lanjut.
