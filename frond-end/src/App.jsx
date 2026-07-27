import { Link, Route, Routes } from 'react-router'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentInternshipDetail from './pages/StudentInternshipDetail.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminInternshipDetail from './pages/AdminInternshipDetail.jsx'
import HeadDashboard from './pages/HeadDashboard.jsx'
import PartnerAssessment from './pages/PartnerAssessment.jsx'
import DplReview from './pages/DplReview.jsx'
import Login from './pages/Login.jsx'


const studyPrograms = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Desain Komunikasi Visual',
  'Manajemen',
]

function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-sm font-bold text-white shadow-md shadow-[#7C3AED]/25">
            KM
          </span>
          <span className="text-lg font-bold text-slate-900">
            Konversi Magang
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
          <a href="#beranda" className="text-slate-900">Beranda</a>
          <a href="#cara-kerja" className="transition hover:text-slate-900">Cara Kerja</a>
          <a href="#peran" className="transition hover:text-slate-900">Peran</a>
          <a href="#eksternal" className="transition hover:text-slate-900">Untuk Kampus</a>
        </nav>
      </div>
    </header>
  )
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md md:h-[460px]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-[200px] w-[200px] rounded-full bg-[#F97316]/20 blur-3xl" />

      <div className="absolute right-0 top-6 h-[340px] w-[340px] rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] shadow-xl shadow-[#7C3AED]/30 md:h-[380px] md:w-[380px]" />

      <div className="absolute left-0 top-[38%] w-[240px] -rotate-6 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8FF]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
            <rect x="4" y="7" width="16" height="12" rx="2" />
            <path d="M9 7V5.5A2 2 0 0 1 11 3.5h2a2 2 0 0 1 2 2V7" />
          </svg>
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          Magang Backend Developer
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          Semester 7 &middot; 6 SKS
        </p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-medium text-emerald-600">Terverifikasi</span>
          <span className="text-slate-400">Teknik Informatika</span>
        </div>
      </div>

      <div className="absolute right-6 top-[26%] w-[230px] rotate-3 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10 md:right-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFEDD5]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 3.5h6M8.5 11.5l2.2 2.2L15.5 9" />
          </svg>
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          CPMK Terpenuhi
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          8 dari 10 capaian
        </p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-medium text-[#7C3AED]">Menunggu DPL</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-2 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/10 md:right-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
    </div>
  )
}

function CaraKerjaSection() {
  return (
    <section id="cara-kerja" className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <span className="text-sm font-semibold uppercase tracking-wide text-[#7C3AED]">
          Cara Kerja
        </span>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Bagaimana proses magang berjalan
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          Program magang di Universitas Amikom Yogyakarta menjembatani teori
          akademik dengan pengalaman praktis di industri, membekali mahasiswa
          Informatika dengan keterampilan teknis dan non-teknis yang sesuai
          dengan Capaian Pembelajaran Mata Kuliah (CPMK). Magang berlangsung
          selama 3&ndash;6 bulan melalui dua skema.
        </p>

        {/* Dua skema, dengan pemisah "atau" agar keduanya terlihat setara */}
        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col rounded-2xl border border-[#E9D5FF] bg-[#F3E8FF]/40 p-6">
            <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#7C3AED] ring-1 ring-[#E9D5FF]">
              Skema 1
            </span>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              Magang Mitra Prodi
            </h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
              Magang di perusahaan yang telah bekerja sama dengan Program
              Studi Informatika.
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED] transition hover:text-[#6D28D9]"
            >
              Lihat Daftar Mitra
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-100">
              atau
            </span>
          </div>
          <div className="flex items-center justify-center md:hidden">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              &mdash; atau &mdash;
            </span>
          </div>

          <div className="flex flex-col rounded-2xl border border-[#FED7AA] bg-[#FFEDD5]/40 p-6">
            <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#F97316] ring-1 ring-[#FED7AA]">
              Skema 2
            </span>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              Magang Mandiri
            </h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
              Cari sendiri peluang magang di perusahaan IT, instansi
              pemerintah, atau BUMN yang kredibel. Pastikan sesuai dengan
              Capaian Profil Lulusan (CPL) Informatika.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#E9D5FF] bg-[#F3E8FF]/60 p-5 text-sm leading-6 text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p>
            Hasil magang dapat dikonversi hingga <strong>20 SKS</strong> atau
            digunakan untuk jalur skripsi non-reguler. Pastikan magang sesuai
            dengan bidang studi dan memenuhi tujuan pembelajaran program.
          </p>
        </div>

      </div>
    </section>
  )
}

function RoleSelection() {
  return (
    <main id="beranda" className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24 lg:px-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-100">
            <span aria-hidden="true">✨</span>
            500+ magang berhasil dikonversi jadi SKS
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 md:text-5xl">
            Magang yang Terarah,
            <br />
            <span className="text-[#7C3AED]">Menjadi Nilai yang Diakui.</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">
            Hubungkan aktivitas magangmu dengan CPMK, kelola bukti kerja, dan
            pantau proses konversi ke SKS &mdash; semua dalam satu platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/mahasiswa"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition hover:shadow-lg hover:shadow-[#7C3AED]/35"
            >
              Ajukan Magang Sekarang
              <span aria-hidden="true">&rarr;</span>
            </Link>

            <a
              href="#cara-kerja"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50"
            >
              Lihat Cara Kerja
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400">Program studi populer:</span>
            {studyPrograms.map((program) => (
              <span
                key={program}
                className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-100"
              >
                {program}
              </span>
            ))}
          </div>
        </div>

        <HeroIllustration />
      </section>

      <CaraKerjaSection />

      {/* Role picker */}
      <section id="peran" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="max-w-xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#7C3AED]">
            Peran
          </span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Masuk sesuai peranmu
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Setiap peran punya tampilan dan kendali masing-masing dalam alur
            konversi magang.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* Mahasiswa Card */}
          <article className="group flex flex-col rounded-2xl border border-[#DDD6FE] bg-[#F3E8FF] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7C3AED]/10">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5">
                <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
              </svg>
            </span>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Mahasiswa</h3>
            <p className="mt-0.5 text-xs font-medium text-[#7C3AED]">Mengajukan & memantau</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
              Ajukan magang, susun usulan konversi, unggah bukti, dan lihat hasil.
            </p>
            <Link to="/login/mahasiswa" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7C3AED] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 group-hover:shadow-md">
              Masuk sebagai Mahasiswa &rarr;
            </Link>
          </article>

          {/* Admin Card */}
          <article className="group flex flex-col rounded-2xl border border-[#DDD6FE] bg-[#F3E8FF] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7C3AED]/10">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5">
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 3.5h6M8.5 11.5l2.2 2.2L15.5 9" />
              </svg>
            </span>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Prodi / Admin</h3>
            <p className="mt-0.5 text-xs font-medium text-[#7C3AED]">Memverifikasi & mengesahkan</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
              Verifikasi pengajuan, validasi usulan, dan finalisasi hasil konversi.
            </p>
            <Link to="/login/admin" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7C3AED] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 group-hover:shadow-md">
              Masuk sebagai Prodi / Admin &rarr;
            </Link>
          </article>

          {/* Kaprodi Card */}
          <article className="group flex flex-col rounded-2xl border border-[#DDD6FE] bg-[#F3E8FF] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7C3AED]/10">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5">
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Kaprodi</h3>
            <p className="mt-0.5 text-xs font-medium text-[#7C3AED]">Mengawasi seluruh proses</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
              Pantau seluruh proses konversi magang dalam mode hanya-baca.
            </p>
            <Link to="/login/kaprodi" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7C3AED] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 group-hover:shadow-md">
              Masuk sebagai Kaprodi &rarr;
            </Link>
          </article>
        </div>
      </section>

      {/* External access */}
      <section id="eksternal" className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 md:p-10 animate-fade-in">
          <span className="relative inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
            </span>
            Akses eksternal &middot; tanpa login
          </span>

          <div className="relative mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <Link
              to="/mitra/demo-mitra-001"
              className="group relative flex flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 transition-all duration-300 hover:border-[#7C3AED] hover:bg-[#F3E8FF]/10 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-600">Langkah 1</span>
                <span className="mt-1 block text-lg font-bold text-slate-900">Tautan Penilaian Mitra</span>
              </span>
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:translate-x-1 group-hover:bg-[#7C3AED] group-hover:text-white font-bold">&rarr;</span>
            </Link>

            <div aria-hidden="true" className="hidden w-10 flex-none items-center justify-center sm:flex">
              <svg viewBox="0 0 40 24" className="h-4 w-10">
                <path d="M0 12 H40" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
                <path d="M35 8 L40 12 L35 16" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <Link
              to="/dpl/demo-dpl-001"
              className="group relative flex flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 transition-all duration-300 hover:border-[#F97316] hover:bg-[#FFEDD5]/10 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-600">Langkah 2</span>
                <span className="mt-1 block text-lg font-bold text-slate-900">Tautan Review DPL</span>
              </span>
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:translate-x-1 group-hover:bg-[#F97316] group-hover:text-white font-bold">&rarr;</span>
            </Link>
          </div>

          <p className="relative mt-5 text-xs leading-5 text-slate-500 font-medium">
            * Review DPL baru terbuka setelah pihak Mitra menyelesaikan penilaian kinerjanya. 
            Mitra & DPL masuk lewat tautan token khusus tanpa menggunakan akun login.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Prototype Sistem Konversi Nilai Magang Berbasis Outcome-Based Education</span>
          <span>Hackathon Informatics Plus 2026</span>
        </div>
      </footer>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />

      <Route path="/login/mahasiswa" element={<Login role="mahasiswa" />} />
      <Route path="/login/admin" element={<Login role="prodi" />} />
      <Route path="/login/kaprodi" element={<Login role="kaprodi" />} />

      <Route path="/mahasiswa" element={<StudentDashboard />} />

      <Route
        path="/mahasiswa/magang/:id"
        element={<StudentInternshipDetail />}
      />

      <Route path="/admin" element={<AdminDashboard />} />

      <Route
        path="/admin/magang/:id"
        element={<AdminInternshipDetail />}
      />

      <Route path="/kaprodi" element={<HeadDashboard />} />

      <Route
        path="/mitra/:token"
        element={<PartnerAssessment />}
      />

      <Route
        path="/dpl/:token"
        element={<DplReview />}
      />
    </Routes>
  )
}

export default App