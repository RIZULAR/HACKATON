import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'
import { fetchInternshipFromSupabase, fetchStatsFromSupabase, isSupabaseConfigured } from '../data/supabaseSync.js'
import { CONVERSION_MASTER } from '../data/conversionMaster.js'

const processSteps = [
  {
    label: 'Pengajuan Magang',
    description: 'Data pengajuan dikirim mahasiswa',
    statuses: [
      'DRAFT_PENGAJUAN',
      'MENUNGGU_VERIFIKASI',
      'PERLU_PERBAIKAN_PENGAJUAN',
    ],
  },
  {
    label: 'Verifikasi Prodi',
    description: 'Pemeriksaan data oleh Program Studi',
    statuses: [
      'MAGANG_TERVERIFIKASI',
      'DRAFT_USULAN',
      'MENUNGGU_VALIDASI_USULAN',
      'PERLU_REVISI_USULAN',
    ],
  },
  {
    label: 'Usulan Konversi',
    description: 'Pemetaan aktivitas, CPMK, dan mata kuliah',
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
    description: 'Penilaian Mitra dan DPL',
    statuses: ['SIAP_FINALISASI'],
  },
  {
    label: 'Hasil Konversi',
    description: 'Finalisasi nilai dan hasil konversi',
    statuses: ['SELESAI'],
  },
]

const NAV_ITEMS = [
  { label: 'Dashboard', href: '#ringkasan', icon: HomeIcon, active: true },
  { label: 'Monitoring Proses', href: '#monitoring', icon: LayersIcon },
  { label: 'Hasil Konversi', href: '#hasil', icon: TrophyIcon },
]

function getCurrentStage(status) {
  const stageIndex = processSteps.findIndex((step) =>
    step.statuses.includes(status),
  )

  return stageIndex === -1 ? 1 : stageIndex + 1
}

function HeadDashboard() {
  const [internship, setInternship] = useState(() => loadInternship())
  const [stats, setStats] = useState({
    totalMagang: internship.id ? 1 : 0,
    waitingVerification: internship.status === 'MENUNGGU_VERIFIKASI' ? 1 : 0,
    needRevision: internship.status === 'PERLU_PERBAIKAN_PENGAJUAN' ? 1 : 0,
    verified: internship.status === 'MAGANG_TERVERIFIKASI' ? 1 : 0,
  })

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchInternshipFromSupabase()
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
        }
        const remoteStats = await fetchStatsFromSupabase()
        if (remoteStats) {
          setStats(remoteStats)
        }
      }
    }
    loadData()
  }, [])

  const hasSubmission = Boolean(internship.id)
  const currentStage = getCurrentStage(internship.status)

  const finalScore = internship.partnerAssessment?.scores?.length > 0
    ? (internship.partnerAssessment.scores.reduce((sum, s) => sum + s.score, 0) / internship.partnerAssessment.scores.length) * 0.7 + 
      (internship.dplReview?.scores?.length > 0 ? (internship.dplReview.scores.reduce((sum, s) => sum + s.score, 0) / internship.dplReview.scores.length) * 0.3 : 0)
    : null

  const averageScore = finalScore ? finalScore.toFixed(2) : '-'
  const letterGrade = finalScore
    ? (finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 60 ? 'C' : finalScore >= 50 ? 'D' : 'E')
    : '-'

  const resultCourses = []
  if (internship.proposal?.activities) {
    const courseCodes = new Set()
    internship.proposal.activities.forEach(act => {
      act.selectedCourseCodes?.forEach(code => courseCodes.add(code))
    })
    courseCodes.forEach(code => {
      const master = CONVERSION_MASTER.find(m => m.courseCode === code)
      if (master) resultCourses.push(master)
    })
  }

  const totalCredits = resultCourses.reduce((sum, c) => sum + c.credits, 0)

  const partnerSubmitted = Boolean(internship.partnerAssessment?.submittedAt)
  const dplSubmitted = Boolean(internship.dplReview?.submittedAt)
  const isFinalized = internship.status === 'SELESAI'

  const handleExportCSV = () => {
    if (!internship || !internship.id) {
      alert('Belum ada data magang yang terkonversi untuk diekspor.')
      return
    }

    const headers = ['Kode MK', 'Mata Kuliah', 'NIM', 'Nama Mahasiswa', 'Nilai Angka', 'Nilai Huruf']
    const rows = []

    if (resultCourses.length > 0) {
      resultCourses.forEach(c => {
        rows.push([
          c.courseCode,
          c.courseName,
          internship.studentId,
          internship.studentName,
          averageScore,
          letterGrade
        ])
      })
    } else {
      rows.push(['-', 'Belum ada mata kuliah yang terkonversi', internship.studentId, internship.studentName, '-', '-'])
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Rekap_Konversi_Magang_${internship.studentId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const steps = processSteps.map((step, index) => {
    const stepNumber = index + 1

    if (isFinalized || stepNumber < currentStage) {
      return { ...step, state: 'done' }
    }

    if (stepNumber === currentStage) {
      return { ...step, state: 'active' }
    }

    return { ...step, state: 'locked' }
  })

  const initials = getInitials('Ketua Program Studi')

  const overallPercent = hasSubmission
    ? Math.round((currentStage / processSteps.length) * 100)
    : 0
  const submissionPercent = hasSubmission ? 100 : 0
  const numericAverage = typeof averageScore === 'number' ? averageScore : null
  const averagePercent =
    numericAverage !== null ? Math.min(100, Math.round((numericAverage / 100) * 100)) : 0
  const creditsPercent = Math.min(100, Math.round((totalCredits / 6) * 100))

  return (
    <main className="bg-slate-50 font-sans antialiased">
      <div className="grid lg:grid-cols-[240px_1fr]">
        {/* LEFT SIDEBAR — fixed white */}
        <aside className="hidden border-r border-slate-100 bg-white px-6 py-8 lg:flex lg:flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-base font-bold text-white shadow-md shadow-[#7C3AED]/25">
              KM
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight text-slate-900">
                Konversi Magang
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7C3AED]">
                Portal Kaprodi
              </span>
            </div>
          </div>

          <nav className="mt-10 flex flex-1 flex-col gap-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-full px-2 py-1.5 text-[14px] font-medium transition ${
                  item.active
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    item.active ? 'bg-white' : 'bg-slate-100'
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${
                      item.active ? 'text-[#F97316]' : 'text-slate-400'
                    }`}
                  />
                </span>
                {item.label}
              </a>
            ))}

            <Link
              to="/"
              className="flex items-center gap-3 rounded-full px-2 py-1.5 text-[14px] font-medium text-slate-400 transition hover:text-red-500"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <ExitIcon className="h-[18px] w-[18px] text-slate-400" />
              </span>
              Keluar dari Demo
            </Link>
          </nav>

          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9D5FF]">
              <ShieldIcon className="h-6 w-6 text-[#7C3AED]" />
            </div>
            <p className="mt-3 text-[13px] font-semibold text-slate-900">
              Mode hanya-baca
            </p>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">
              Kaprodi hanya dapat memantau. Perubahan dilakukan oleh
              Prodi/Admin.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT — soft gray */}
        <div className="flex min-w-0 flex-col">
          {/* HEADER BAR */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-sm font-semibold text-white lg:hidden">
                KM
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Pantau progres konversi magang mahasiswa
                </h1>
                <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
                  {hasSubmission
                    ? 'Monitoring pengajuan, usulan, klaim, dan hasil konversi.'
                    : 'Menunggu pengajuan magang dari mahasiswa.'}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50"
                aria-label="Notifikasi"
              >
                <BellIcon className="h-5 w-5 text-slate-400" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <div className="flex shrink-0 items-center gap-3 rounded-full bg-[#F3E8FF]/70 py-1.5 pl-1.5 pr-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold leading-none text-slate-900">
                    Ketua Program Studi
                  </p>
                  <p className="mt-1 text-[11px] leading-none text-[#7C3AED]">
                    Informatika
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <section id="ringkasan" className="min-w-0 bg-slate-50 px-5 py-8 lg:px-8">
            {/* HERO */}
            <div className="flex flex-col justify-between gap-6 rounded-3xl bg-[#7C3AED] p-8 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                  Mode Monitoring Hanya-Baca
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                  Monitoring Konversi Magang
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
                  Kaprodi dapat memantau pengajuan, usulan, klaim, penilaian,
                  dan hasil konversi tanpa mengubah data.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-5 py-3 text-sm font-semibold text-white transition cursor-pointer shadow-sm"
                >
                  Ekspor Rekapitulasi CSV
                </button>

                <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">
                  Hanya Baca
                </span>
              </div>
            </div>

            {/* STAT CARDS */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GradientStatCard
                icon={FolderIcon}
                label="Total Pengajuan"
                value={hasSubmission ? '1' : '0'}
                helper="Pengajuan magang terdaftar"
                percent={submissionPercent}
                from="#7C3AED"
                to="#6D28D9"
              />
              <GradientStatCard
                icon={ActivityIcon}
                label="Status Proses"
                value={
                  hasSubmission ? getStatusLabel(internship.status) : 'Belum Ada Data'
                }
                helper={
                  hasSubmission
                    ? `Tahap ${currentStage} dari 5`
                    : 'Menunggu pengajuan mahasiswa'
                }
                percent={overallPercent}
                from="#FF9640"
                to="#F97316"
              />
              <GradientStatCard
                icon={TargetIcon}
                label="Total Konversi"
                value={`${totalCredits} SKS`}
                helper="Mata kuliah hasil konversi"
                percent={creditsPercent}
                from="#7C3AED"
                to="#6D28D9"
              />
              <GradientStatCard
                icon={TrophyIcon}
                label="Rata-rata Nilai"
                value={String(averageScore)}
                helper={`Nilai huruf ${letterGrade}`}
                percent={averagePercent}
                from="#FF9640"
                to="#F97316"
              />
            </div>

            {!hasSubmission ? (
              <div className="mt-9 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <h4 className="font-semibold text-slate-900">
                  Belum ada data magang
                </h4>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Data monitoring akan tampil setelah mahasiswa mengirim
                  pengajuan magang.
                </p>
              </div>
            ) : (
              <>
                {/* TIMELINE + REVIEW PANEL */}
                <div id="monitoring" className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Progres Konversi
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Perkembangan proses dari pengajuan hingga hasil.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F3E8FF] px-3 py-1.5 text-xs font-medium text-[#7C3AED]">
                        Tahap {currentStage} dari 5
                      </span>
                    </div>

                    <div className="mt-6">
                      {steps.map((step, index) => (
                        <div key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
                          {index < steps.length - 1 && (
                            <span className="absolute left-4 top-8 h-full w-px -translate-x-1/2 bg-slate-100" />
                          )}
                          <span
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              step.state === 'done'
                                ? 'bg-emerald-500 text-white'
                                : step.state === 'active'
                                  ? 'bg-[#7C3AED] text-white'
                                  : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {step.state === 'done' ? (
                              <CheckIcon className="h-4 w-4" strokeWidth="2.5" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                step.state === 'locked' ? 'text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STATUS PENILAIAN + IDENTITAS */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-base font-semibold text-slate-900">
                      Status Penilaian
                    </h3>

                    <div className="mt-4 space-y-3">
                      <ReviewerStatus
                        label="Penilaian Mitra"
                        reviewer={
                          internship.partnerAssessment?.reviewerName ||
                          internship.partnerSupervisor
                        }
                        completed={partnerSubmitted}
                      />
                      <ReviewerStatus
                        label="Review DPL"
                        reviewer={internship.dplReview?.reviewerName || internship.dplName}
                        completed={dplSubmitted}
                      />
                      <ReviewerStatus
                        label="Finalisasi Prodi"
                        reviewer={internship.result?.finalizedBy || 'Admin Program Studi'}
                        completed={isFinalized}
                      />
                    </div>

                    <div className="mt-6 rounded-xl bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Identitas Magang
                      </p>
                      <dl className="mt-4 space-y-3 text-sm">
                        <DetailRow label="ID Magang" value={internship.id} />
                        <DetailRow label="Mahasiswa" value={internship.studentName} />
                        <DetailRow label="Mitra" value={internship.partnerName} />
                        <DetailRow
                          label="Periode"
                          value={formatDateRange(internship.startDate, internship.endDate)}
                        />
                      </dl>
                    </div>
                  </div>
                </div>

                {/* HASIL KONVERSI */}
                <div id="hasil" className="mt-9 rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Hasil Konversi
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Ringkasan nilai akhir yang telah diproses Prodi.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        isFinalized
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isFinalized ? 'Sudah Difinalisasi' : 'Belum Difinalisasi'}
                    </span>
                  </div>

                  {resultCourses.length > 0 ? (
                    <>
                      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full min-w-[800px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                              <th className="px-5 py-3 font-medium">Mata Kuliah</th>
                              <th className="px-5 py-3 font-medium">SKS</th>
                              <th className="px-5 py-3 font-medium">Nilai Mitra</th>
                              <th className="px-5 py-3 font-medium">Nilai DPL</th>
                              <th className="px-5 py-3 font-medium">Nilai Akhir</th>
                              <th className="px-5 py-3 font-medium">Huruf</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultCourses.map((course) => (
                              <tr key={course.courseCode} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-5 py-5">
                                  <p className="font-medium text-slate-900">{course.courseCode}</p>
                                  <p className="mt-1 text-slate-500">{course.courseName}</p>
                                </td>
                                <td className="px-5 py-5 font-medium text-slate-700">
                                  {course.credits}
                                </td>
                                <td className="px-5 py-5 font-medium text-slate-700">
                                  {course.partnerScore}
                                </td>
                                <td className="px-5 py-5 font-medium text-slate-700">
                                  {course.dplScore}
                                </td>
                                <td className="px-5 py-5 text-base font-semibold text-[#7C3AED]">
                                  {course.finalScore}
                                </td>
                                <td className="px-5 py-5">
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {course.letterGrade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <ResultCard label="Total Konversi" value={`${totalCredits} SKS`} />
                        <ResultCard label="Rata-rata Nilai" value={String(averageScore)} />
                        <ResultCard label="Nilai Huruf" value={letterGrade} />
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
                      <h4 className="font-semibold text-slate-900">Hasil belum tersedia</h4>
                      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                        Nilai akan tampil setelah Mitra, DPL, dan Prodi
                        menyelesaikan proses penilaian.
                      </p>
                    </div>
                  )}
                </div>

                {/* READ-ONLY NOTICE */}
                <div className="mt-5 rounded-2xl border border-[#E9D5FF] bg-[#F3E8FF]/60 p-5">
                  <p className="text-sm font-semibold text-[#6D28D9]">Mode hanya-baca</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Kaprodi hanya dapat memantau data. Perubahan, verifikasi,
                    dan finalisasi dilakukan oleh Prodi/Admin.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

/* Colorful gradient stat card with a circular progress ring — matches the
   mahasiswa dashboard's stat cards. */
function GradientStatCard({ icon: Icon, label, value, helper, percent, from, to }) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-10 right-6 h-20 w-20 rounded-full bg-white/10" />

      {Icon && (
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Icon className="h-4 w-4 text-white" strokeWidth="1.75" />
        </span>
      )}

      <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold leading-tight">{value}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <CircularProgress percent={percent} />
        <p className="max-w-[7.5rem] truncate text-right text-[11px] leading-4 text-white/70">
          {helper}
        </p>
      </div>
    </article>
  )
}

function CircularProgress({ percent = 0, size = 56, stroke = 5 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

function ResultCard({ label, value }) {
  return (
    <article className="rounded-2xl bg-slate-50 p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </article>
  )
}

function ReviewerStatus({ label, reviewer, completed }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-xs text-slate-400">{reviewer || 'Belum ditentukan'}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
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
      <dt className="text-slate-400">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium text-slate-700">{value || '-'}</dd>
    </div>
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/* --- inline icons (no external icon package required) --- */

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LayersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FolderIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExitIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrophyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 .8-3 2.5-3s2.5 1 2.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 3 4.5 6v6c0 5 3.2 7.7 7.5 9 4.3-1.3 7.5-4 7.5-9V6L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3 12h4l2.5-7 5 14 2.5-7H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default HeadDashboard