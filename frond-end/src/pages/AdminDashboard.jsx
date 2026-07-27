import { Link } from 'react-router'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
} from '../data/internshipStore.js'

function AdminDashboard() {
  const internship = loadInternship()
  const hasSubmission = Boolean(internship.id)

  const waitingVerification =
    internship.status === 'MENUNGGU_VERIFIKASI' ? 1 : 0

  const needRevision =
    internship.status === 'PERLU_PERBAIKAN_PENGAJUAN' ? 1 : 0

  const verified =
    internship.status === 'MAGANG_TERVERIFIKASI' ? 1 : 0

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-wider text-indigo-600">
              KONVERSI MAGANG OBE
            </p>

            <h1 className="mt-1 text-lg font-bold text-slate-900">
              Portal Program Studi
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Admin Program Studi
              </p>

              <p className="text-xs text-slate-500">Informatika</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              AP
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu Prodi
            </p>

            <Link
              to="/admin"
              className="block rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
            >
              Dashboard
            </Link>

            <a
              href="#pengajuan"
              className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Daftar Pengajuan
            </a>

            <div className="my-3 border-t border-slate-100" />

            <Link
              to="/"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Keluar dari Demo
            </Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-lg md:p-9">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              Dashboard Monitoring
            </span>

            <h2 className="mt-4 text-2xl font-bold md:text-3xl">
              Monitoring Konversi Magang
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Periksa pengajuan mahasiswa, validasi usulan konversi, pantau
              penilaian Mitra dan DPL, lalu finalisasi hasil.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Pengajuan"
              value={hasSubmission ? '1' : '0'}
              helper="Seluruh proses magang"
            />

            <SummaryCard
              label="Menunggu Verifikasi"
              value={String(waitingVerification)}
              helper="Perlu tindakan Prodi"
            />

            <SummaryCard
              label="Perlu Perbaikan"
              value={String(needRevision)}
              helper="Menunggu mahasiswa"
            />

            <SummaryCard
              label="Terverifikasi"
              value={String(verified)}
              helper="Dapat lanjut ke usulan"
            />
          </div>

          <section
            id="pengajuan"
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Daftar Pengajuan Magang
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Buka detail pengajuan untuk melakukan verifikasi.
              </p>
            </div>

            {hasSubmission ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-semibold">ID Magang</th>
                      <th className="pb-3 font-semibold">Mahasiswa</th>
                      <th className="pb-3 font-semibold">Mitra</th>
                      <th className="pb-3 font-semibold">Periode</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td className="py-5 font-bold text-slate-900">
                        {internship.id}
                      </td>

                      <td className="py-5">
                        <p className="font-semibold text-slate-900">
                          {internship.studentName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {internship.studentId}
                        </p>
                      </td>

                      <td className="py-5 text-slate-600">
                        {internship.partnerName}
                      </td>

                      <td className="py-5 text-slate-600">
                        {formatDateRange(
                          internship.startDate,
                          internship.endDate,
                        )}
                      </td>

                      <td className="py-5">
                        <StatusBadge status={internship.status} />
                      </td>

                      <td className="py-5 text-right">
                        <Link
                          to={`/admin/magang/${internship.id}`}
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                        >
                          Buka Detail
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <h3 className="font-bold text-slate-900">
                  Belum ada pengajuan
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Pengajuan mahasiswa akan ditampilkan di halaman ini.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

function SummaryCard({ label, value, helper }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </article>
  )
}

function StatusBadge({ status }) {
  const styles = {
    MENUNGGU_VERIFIKASI: 'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN: 'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export default AdminDashboard