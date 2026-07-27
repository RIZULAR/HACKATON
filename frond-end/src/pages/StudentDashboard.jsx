import { Link } from 'react-router'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
} from '../data/internshipStore.js'

const baseProcessSteps = [
  {
    label: 'Pengajuan Magang',
    description: 'Lengkapi dan kirim data pengajuan',
  },
  {
    label: 'Verifikasi Prodi',
    description: 'Pemeriksaan data oleh Program Studi',
  },
  {
    label: 'Usulan Konversi',
    description: 'Pemetaan aktivitas, CPMK, dan mata kuliah',
  },
  {
    label: 'Klaim & Penilaian',
    description: 'Unggah bukti serta penilaian Mitra dan DPL',
  },
  {
    label: 'Hasil Konversi',
    description: 'Finalisasi nilai dan hasil konversi',
  },
]

const statusStageMap = {
  DRAFT_PENGAJUAN: 1,
  PERLU_PERBAIKAN_PENGAJUAN: 1,
  MENUNGGU_VERIFIKASI: 2,
  MAGANG_TERVERIFIKASI: 3,
  DRAFT_USULAN: 3,
  MENUNGGU_VALIDASI_USULAN: 3,
  PERLU_REVISI_USULAN: 3,
  USULAN_DISETUJUI: 4,
  DRAFT_KLAIM: 4,
  MENUNGGU_PENILAIAN_MITRA: 4,
  MENUNGGU_REVIEW_DPL: 4,
  PERLU_REVISI_KLAIM: 4,
  SIAP_FINALISASI: 5,
  SELESAI: 5,
}

function StudentDashboard() {
  const internship = loadInternship()
  const hasSubmission = Boolean(internship.id)
  const currentStage = statusStageMap[internship.status] || 1
  const statusLabel = hasSubmission
    ? getStatusLabel(internship.status)
    : 'Belum Ada Pengajuan'

  const detailPath = hasSubmission
    ? `/mahasiswa/magang/${internship.id}`
    : '/mahasiswa/magang/baru'

  const processSteps = baseProcessSteps.map((step, index) => {
    const stepNumber = index + 1

    if (stepNumber < currentStage) {
      return { ...step, state: 'done' }
    }

    if (stepNumber === currentStage) {
      return { ...step, state: 'active' }
    }

    return { ...step, state: 'locked' }
  })

  const actionContent = getActionContent(internship, hasSubmission)

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-wider text-indigo-600">
              KONVERSI MAGANG OBE
            </p>

            <h1 className="mt-1 text-lg font-bold text-slate-900">
              Portal Mahasiswa
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Nadia Putri Ramadhani
              </p>
              <p className="text-xs text-slate-500">22.11.4321</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              NP
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu Utama
            </p>

            <Link
              to="/mahasiswa"
              className="block rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
            >
              Dashboard
            </Link>

            <a
              href="#proses"
              className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Proses Magang
            </a>

            <a
              href="#tindakan"
              className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Tindakan Berikutnya
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
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                  Semester 7 · Informatika
                </span>

                <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                  Selamat datang, Nadia
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  {actionContent.heroDescription}
                </p>
              </div>

              <Link
                to={detailPath}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-100"
              >
                {actionContent.heroButton}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Status Saat Ini"
              value={statusLabel}
              helper={actionContent.statusHelper}
            />

            <SummaryCard
              label="ID Magang"
              value={internship.id || 'Belum Dibuat'}
              helper={
                hasSubmission
                  ? 'Terhubung ke seluruh proses'
                  : 'Dibuat setelah pengajuan dikirim'
              }
            />

            <SummaryCard
              label="Target Konversi"
              value="6 SKS"
              helper="2 mata kuliah direncanakan"
            />

            <SummaryCard
              label="Periode Magang"
              value={
                internship.startDate && internship.endDate
                  ? formatDateRange(
                      internship.startDate,
                      internship.endDate,
                    )
                  : 'Belum Diisi'
              }
              helper={internship.partnerName || 'Mitra belum diisi'}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section
              id="proses"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Progres Konversi
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Pantau tahapan pengajuan sampai hasil akhir.
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Tahap {currentStage} dari 5
                </span>
              </div>

              <div className="mt-7 space-y-1">
                {processSteps.map((step, index) => (
                  <ProcessStep
                    key={step.label}
                    step={step}
                    number={index + 1}
                    isLast={index === processSteps.length - 1}
                  />
                ))}
              </div>
            </section>

            <section
              id="tindakan"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-bold text-slate-900">
                Tindakan Berikutnya
              </p>

              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  actionContent.panelClass
                }`}
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    actionContent.badgeClass
                  }`}
                >
                  {actionContent.badge}
                </span>

                <h3 className="mt-4 font-bold text-slate-900">
                  {actionContent.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {actionContent.description}
                </p>

                {actionContent.showButton && (
                  <Link
                    to={detailPath}
                    className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
                  >
                    {actionContent.buttonLabel}
                  </Link>
                )}
              </div>

              {hasSubmission && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Pengajuan Aktif
                  </p>

                  <dl className="mt-4 space-y-3 text-sm">
                    <DetailRow
                      label="Mitra"
                      value={internship.partnerName || '-'}
                    />

                    <DetailRow
                      label="Posisi"
                      value={internship.position || '-'}
                    />

                    <DetailRow
                      label="DPL"
                      value={internship.dplName || '-'}
                    />
                  </dl>
                </div>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Pengajuan Magang
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Satu pengajuan digunakan untuk seluruh proses konversi.
                </p>
              </div>

              <Link
                to={detailPath}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
              >
                {hasSubmission ? 'Buka detail →' : 'Buat pengajuan →'}
              </Link>
            </div>

            {hasSubmission ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-semibold">ID Magang</th>
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
                          to={detailPath}
                          className="font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="font-bold text-slate-900">
                  Belum ada pengajuan magang
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Lengkapi data magang agar sistem dapat membuat ID Magang dan
                  memulai proses konversi.
                </p>

                <Link
                  to="/mahasiswa/magang/baru"
                  className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Buat Pengajuan Magang
                </Link>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

function getActionContent(internship, hasSubmission) {
  if (!hasSubmission || internship.status === 'DRAFT_PENGAJUAN') {
    return {
      heroDescription:
        'Lengkapi pengajuan magang untuk memulai proses konversi berbasis CPMK dan mata kuliah.',
      heroButton: 'Buat Pengajuan',
      statusHelper: 'Tindakan berikutnya oleh mahasiswa',
      badge: 'Perlu Tindakan',
      title: 'Lengkapi pengajuan magang',
      description:
        'Isi informasi mitra, posisi, periode, pembimbing Mitra, DPL, dan deskripsi pekerjaan.',
      buttonLabel: 'Isi Pengajuan',
      showButton: true,
      panelClass: 'border-indigo-200 bg-indigo-50',
      badgeClass: 'bg-indigo-100 text-indigo-700',
    }
  }

  if (internship.status === 'PERLU_PERBAIKAN_PENGAJUAN') {
    return {
      heroDescription:
        'Prodi meminta perbaikan pada data pengajuan magang. Periksa catatan dan kirim kembali.',
      heroButton: 'Perbaiki Pengajuan',
      statusHelper: 'Tindakan berikutnya oleh mahasiswa',
      badge: 'Perlu Perbaikan',
      title: 'Perbaiki data pengajuan',
      description:
        internship.revisionNote ||
        'Periksa catatan Prodi dan perbaiki data yang diperlukan.',
      buttonLabel: 'Buka Pengajuan',
      showButton: true,
      panelClass: 'border-red-200 bg-red-50',
      badgeClass: 'bg-red-100 text-red-700',
    }
  }

  if (internship.status === 'MENUNGGU_VERIFIKASI') {
    return {
      heroDescription:
        'Pengajuan magangmu sedang diperiksa oleh Prodi. Kamu dapat memantau status melalui dashboard.',
      heroButton: 'Lihat Detail Proses',
      statusHelper: 'Tindakan berikutnya oleh Prodi',
      badge: 'Menunggu Prodi',
      title: 'Pengajuan sedang diverifikasi',
      description:
        'Kamu belum perlu melakukan tindakan. Periksa kembali dashboard apabila Prodi meminta perbaikan.',
      buttonLabel: '',
      showButton: false,
      panelClass: 'border-amber-200 bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    heroDescription:
      'Proses konversi magangmu sedang berjalan. Buka detail untuk melihat tahapan berikutnya.',
    heroButton: 'Lihat Detail Proses',
    statusHelper: 'Ikuti tahapan proses yang aktif',
    badge: 'Proses Berjalan',
    title: getStatusLabel(internship.status),
    description:
      'Buka detail proses untuk melihat informasi dan tindakan yang tersedia.',
    buttonLabel: 'Buka Detail',
    showButton: true,
    panelClass: 'border-emerald-200 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  }
}

function SummaryCard({ label, value, helper }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-lg font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  )
}

function ProcessStep({ step, number, isLast }) {
  const stateStyles = {
    done: 'bg-emerald-500 text-white',
    active: 'bg-indigo-600 text-white ring-4 ring-indigo-100',
    locked: 'bg-slate-100 text-slate-400',
  }

  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[17px] top-9 h-full w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          stateStyles[step.state]
        }`}
      >
        {step.state === 'done' ? '✓' : number}
      </div>

      <div className="pt-1">
        <p
          className={`text-sm font-bold ${
            step.state === 'locked' ? 'text-slate-400' : 'text-slate-900'
          }`}
        >
          {step.label}
        </p>

        <p className="mt-1 text-xs text-slate-500">{step.description}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }) {
  const badgeClasses = {
    DRAFT_PENGAJUAN: 'bg-slate-100 text-slate-700',
    MENUNGGU_VERIFIKASI: 'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN: 'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        badgeClasses[status] || 'bg-indigo-50 text-indigo-700'
      }`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export default StudentDashboard