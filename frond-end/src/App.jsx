import { Link, Route, Routes } from 'react-router'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentInternshipDetail from './pages/StudentInternshipDetail.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminInternshipDetail from './pages/AdminInternshipDetail.jsx'
import HeadDashboard from './pages/HeadDashboard.jsx'
import PartnerAssessment from './pages/PartnerAssessment.jsx'
import DplReview from './pages/DplReview.jsx'

const roles = [
  {
    id: 'mahasiswa',
    title: 'Mahasiswa',
    description:
      'Ajukan magang, susun usulan konversi, unggah bukti, dan lihat hasil.',
    badge: 'Pengguna Utama',
    path: '/mahasiswa',
  },
  {
    id: 'prodi',
    title: 'Prodi / Admin',
    description:
      'Verifikasi pengajuan, validasi usulan, dan finalisasi hasil konversi.',
    badge: 'Pengelola',
    path: '/admin',
  },
  {
    id: 'kaprodi',
    title: 'Kaprodi',
    description:
      'Pantau seluruh proses konversi magang dalam mode hanya-baca.',
    badge: 'Monitoring',
    path: '/kaprodi',
  },
]

function RoleSelection() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-indigo-600">
              SISTEM KONVERSI MAGANG OBE
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900">
              KonversiMagang
            </h1>
          </div>

          <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            Mode Demo
          </span>
        </header>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                Hackathon Informatics Plus 2026
              </span>

              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Kelola konversi magang secara terstruktur dan transparan
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Hubungkan aktivitas magang, CPMK, mata kuliah, bukti,
                penilaian Mitra, dan review DPL dalam satu alur terintegrasi.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              {roles.map((role) => (
                <article
                  key={role.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                >
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {role.badge}
                  </span>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {role.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {role.description}
                  </p>

                  <Link
                    to={role.path}
                    className="mt-7 block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-600"
                  >
                    Masuk sebagai {role.title}
                  </Link>
                </article>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
              <p className="text-sm font-semibold text-indigo-900">
                Akses Penilaian Eksternal
              </p>

              <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/mitra/demo-mitra-001"
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm"
                >
                  Buka Tautan Mitra
                </Link>

                <Link
                  to="/dpl/demo-dpl-001"
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm"
                >
                  Buka Tautan DPL
                </Link>
              </div>

              <p className="mt-3 text-xs text-indigo-700">
                Review DPL hanya dapat dilakukan setelah Mitra selesai
                memberikan penilaian.
              </p>
            </div>

            <p className="mt-7 text-center text-sm text-slate-500">
              Mitra dan DPL mengakses penilaian melalui tautan token khusus
              tanpa login.
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
          Prototype Sistem Konversi Nilai Magang Berbasis Outcome-Based
          Education
        </footer>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />

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