import { Link } from 'react-router'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
} from '../data/internshipStore.js'

const processSteps = [
  {
    label: 'Pengajuan Magang',
    statuses: [
      'DRAFT_PENGAJUAN',
      'MENUNGGU_VERIFIKASI',
      'PERLU_PERBAIKAN_PENGAJUAN',
    ],
  },
  {
    label: 'Verifikasi Prodi',
    statuses: [
      'MAGANG_TERVERIFIKASI',
      'DRAFT_USULAN',
      'MENUNGGU_VALIDASI_USULAN',
      'PERLU_REVISI_USULAN',
    ],
  },
  {
    label: 'Usulan Konversi',
    statuses: [
      'USULAN_DISETUJUI',
      'DRAFT_KLAIM',
      'MENUNGGU_PENILAIAN_MITRA',
      'MENUNGGU_REVIEW_DPL',
      'PERLU_REVISI_KLAIM',
    ],
  },
  {
    label: 'Klaim dan Penilaian',
    statuses: ['SIAP_FINALISASI'],
  },
  {
    label: 'Hasil Konversi',
    statuses: ['SELESAI'],
  },
]

function getCurrentStage(status) {
  const stageIndex = processSteps.findIndex((step) =>
    step.statuses.includes(status),
  )

  return stageIndex === -1 ? 1 : stageIndex + 1
}

function HeadDashboard() {
  const internship = loadInternship()
  const hasSubmission = Boolean(internship.id)
  const currentStage = getCurrentStage(internship.status)

  const resultCourses = internship.result?.courses || []
  const totalCredits = internship.result?.totalCredits || 0
  const averageScore = internship.result?.averageScore ?? '-'
  const letterGrade = internship.result?.letterGrade || '-'

  const partnerSubmitted = Boolean(
    internship.partnerAssessment?.submittedAt,
  )

  const dplSubmitted = Boolean(
    internship.dplReview?.submittedAt,
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-wider text-indigo-600">
              KONVERSI MAGANG OBE
            </p>

            <h1 className="mt-1 text-lg font-bold text-slate-900">
              Portal Kaprodi
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Ketua Program Studi
              </p>

              <p className="text-xs text-slate-500">
                Informatika
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              KP
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu Kaprodi
            </p>

            <Link
              to="/kaprodi"
              className="block rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
            >
              Dashboard
            </Link>

            <a
              href="#monitoring"
              className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Monitoring Proses
            </a>

            <a
              href="#hasil"
              className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Hasil Konversi
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
                  Mode Monitoring Hanya-Baca
                </span>

                <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                  Monitoring Konversi Magang
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Kaprodi dapat memantau pengajuan, usulan, klaim,
                  penilaian, dan hasil konversi tanpa mengubah data.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950">
                Hanya Baca
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Pengajuan"
              value={hasSubmission ? '1' : '0'}
              helper="Pengajuan magang terdaftar"
            />

            <SummaryCard
              label="Status Proses"
              value={
                hasSubmission
                  ? getStatusLabel(internship.status)
                  : 'Belum Ada Data'
              }
              helper={
                hasSubmission
                  ? `Tahap ${currentStage} dari 5`
                  : 'Menunggu pengajuan mahasiswa'
              }
            />

            <SummaryCard
              label="Total Konversi"
              value={`${totalCredits} SKS`}
              helper="Mata kuliah hasil konversi"
            />

            <SummaryCard
              label="Rata-rata Nilai"
              value={averageScore}
              helper={`Nilai huruf ${letterGrade}`}
            />
          </div>

          {!hasSubmission ? (
            <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <h3 className="font-bold text-slate-900">
                Belum ada data magang
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Data monitoring akan tampil setelah mahasiswa
                mengirim pengajuan.
              </p>
            </section>
          ) : (
            <>
              <div
                id="monitoring"
                className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
              >
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Progres Konversi
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Perkembangan proses dari pengajuan hingga hasil.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Tahap {currentStage} dari 5
                    </span>
                  </div>

                  <div className="mt-7 space-y-1">
                    {processSteps.map((step, index) => {
                      const stepNumber = index + 1

                      const state =
                        internship.status === 'SELESAI'
                          ? 'done'
                          : stepNumber < currentStage
                            ? 'done'
                            : stepNumber === currentStage
                              ? 'active'
                              : 'locked'

                      return (
                        <ProcessStep
                          key={step.label}
                          label={step.label}
                          number={stepNumber}
                          state={state}
                          isLast={
                            index === processSteps.length - 1
                          }
                        />
                      )
                    })}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Status Penilaian
                  </h3>

                  <div className="mt-5 space-y-4">
                    <ReviewerStatus
                      label="Penilaian Mitra"
                      reviewer={
                        internship.partnerAssessment
                          ?.reviewerName ||
                        internship.partnerSupervisor
                      }
                      completed={partnerSubmitted}
                    />

                    <ReviewerStatus
                      label="Review DPL"
                      reviewer={
                        internship.dplReview?.reviewerName ||
                        internship.dplName
                      }
                      completed={dplSubmitted}
                    />

                    <ReviewerStatus
                      label="Finalisasi Prodi"
                      reviewer={
                        internship.result?.finalizedBy ||
                        'Admin Program Studi'
                      }
                      completed={
                        internship.status === 'SELESAI'
                      }
                    />
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Identitas Magang
                    </p>

                    <dl className="mt-4 space-y-3 text-sm">
                      <DetailRow
                        label="ID Magang"
                        value={internship.id}
                      />

                      <DetailRow
                        label="Mahasiswa"
                        value={internship.studentName}
                      />

                      <DetailRow
                        label="Mitra"
                        value={internship.partnerName}
                      />

                      <DetailRow
                        label="Periode"
                        value={formatDateRange(
                          internship.startDate,
                          internship.endDate,
                        )}
                      />
                    </dl>
                  </div>
                </section>
              </div>

              <section
                id="hasil"
                className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Hasil Konversi
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Ringkasan nilai akhir yang telah diproses Prodi.
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      internship.status === 'SELESAI'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {internship.status === 'SELESAI'
                      ? 'Sudah Difinalisasi'
                      : 'Belum Difinalisasi'}
                  </span>
                </div>

                {resultCourses.length > 0 ? (
                  <>
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full min-w-[800px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                            <th className="pb-3 font-semibold">
                              Mata Kuliah
                            </th>

                            <th className="pb-3 font-semibold">
                              SKS
                            </th>

                            <th className="pb-3 font-semibold">
                              Nilai Mitra
                            </th>

                            <th className="pb-3 font-semibold">
                              Nilai DPL
                            </th>

                            <th className="pb-3 font-semibold">
                              Nilai Akhir
                            </th>

                            <th className="pb-3 font-semibold">
                              Huruf
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {resultCourses.map((course) => (
                            <tr
                              key={course.courseCode}
                              className="border-b border-slate-100"
                            >
                              <td className="py-5">
                                <p className="font-bold text-slate-900">
                                  {course.courseCode}
                                </p>

                                <p className="mt-1 text-slate-500">
                                  {course.courseName}
                                </p>
                              </td>

                              <td className="py-5 font-semibold text-slate-700">
                                {course.credits}
                              </td>

                              <td className="py-5 font-semibold text-slate-700">
                                {course.partnerScore}
                              </td>

                              <td className="py-5 font-semibold text-slate-700">
                                {course.dplScore}
                              </td>

                              <td className="py-5 text-lg font-bold text-indigo-700">
                                {course.finalScore}
                              </td>

                              <td className="py-5">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                                  {course.letterGrade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                      <ResultCard
                        label="Total Konversi"
                        value={`${totalCredits} SKS`}
                      />

                      <ResultCard
                        label="Rata-rata Nilai"
                        value={averageScore}
                      />

                      <ResultCard
                        label="Nilai Huruf"
                        value={letterGrade}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 px-6 py-10 text-center">
                    <h4 className="font-bold text-slate-900">
                      Hasil belum tersedia
                    </h4>

                    <p className="mt-2 text-sm text-slate-500">
                      Nilai akan tampil setelah Mitra, DPL, dan Prodi
                      menyelesaikan proses penilaian.
                    </p>
                  </div>
                )}
              </section>

              <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm font-bold text-blue-900">
                  Mode hanya-baca
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Kaprodi hanya dapat memantau data. Perubahan,
                  verifikasi, dan finalisasi dilakukan oleh Prodi/Admin.
                </p>
              </section>
            </>
          )}
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

      <p className="mt-3 text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {helper}
      </p>
    </article>
  )
}

function ResultCard({ label, value }) {
  return (
    <article className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </article>
  )
}

function ProcessStep({
  label,
  number,
  state,
  isLast,
}) {
  const stateStyles = {
    done: 'bg-emerald-500 text-white',
    active:
      'bg-indigo-600 text-white ring-4 ring-indigo-100',
    locked: 'bg-slate-100 text-slate-400',
  }

  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[17px] top-9 h-full w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stateStyles[state]}`}
      >
        {state === 'done' ? '✓' : number}
      </div>

      <div className="pt-1">
        <p
          className={`text-sm font-bold ${
            state === 'locked'
              ? 'text-slate-400'
              : 'text-slate-900'
          }`}
        >
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {state === 'done'
            ? 'Tahap telah selesai'
            : state === 'active'
              ? 'Tahap sedang berjalan'
              : 'Belum dapat dimulai'}
        </p>
      </div>
    </div>
  )
}

function ReviewerStatus({
  label,
  reviewer,
  completed,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {reviewer || 'Belum ditentukan'}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            completed
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {completed ? 'Selesai' : 'Menunggu'}
        </span>
      </div>
    </article>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>

      <dd className="max-w-[65%] text-right font-semibold text-slate-800">
        {value || '-'}
      </dd>
    </div>
  )
}

export default HeadDashboard