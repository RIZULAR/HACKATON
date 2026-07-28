import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  isSupabaseConfigured,
  getLoggedInUserProfile,
  logoutFromSupabase,
} from '../data/supabaseSync.js'

const baseProcessSteps = [
  {
    label: 'Pengajuan Magang',
    description: 'Lengkapi dan kirim data pengajuan',
    icon: DocumentIcon,
    from: '#7C3AED',
    to: '#6D28D9',
  },
  {
    label: 'Verifikasi Prodi',
    description: 'Pemeriksaan data oleh Program Studi',
    icon: SearchIcon,
    from: '#FF9640',
    to: '#F97316',
  },
  {
    label: 'Usulan Konversi',
    description: 'Pemetaan aktivitas, CPMK, dan mata kuliah',
    icon: RefreshIcon,
    from: '#C084FC',
    to: '#9333EA',
  },
  {
    label: 'Klaim & Penilaian',
    description: 'Unggah bukti serta penilaian Mitra dan DPL',
    icon: UploadIcon,
    from: '#FBBF24',
    to: '#D97706',
  },
  {
    label: 'Hasil Konversi',
    description: 'Finalisasi nilai dan hasil konversi',
    icon: TrophyIcon,
    from: '#6D28D9',
    to: '#4C1D95',
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

const NAV_ITEMS = [
  { label: 'Dashboard', href: '#ringkasan', icon: HomeIcon, active: true },
  { label: 'Proses Magang', href: '#proses', icon: LayersIcon },
  { label: 'Tindakan Berikutnya', href: '#tindakan', icon: BellDotIcon },
  { label: 'Pengajuan', href: '#pengajuan', icon: FolderIcon },
]

function StudentDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    full_name: 'Nadia Putri Ramadhani',
    nim: '22.11.4321',
    study_program: 'Informatika',
    semester: '7',
    email: 'nadia.demo@mahasiswa.ac.id'
  })

  const [internship, setInternship] = useState(() => loadInternship())

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const userProfile = await getLoggedInUserProfile()
        if (userProfile) {
          setProfile(userProfile)
        }

        const remoteData = await fetchInternshipFromSupabase()
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
        } else {
          // Reset local cache to empty state using logged-in profile
          const empty = {
            id: '',
            status: 'DRAFT_PENGAJUAN',
            studentName: userProfile?.full_name || 'Nadia Putri Ramadhani',
            studentId: userProfile?.nim || '22.11.4321',
            studyProgram: userProfile?.study_program || 'Informatika',
            semester: '7',
            studentEmail: userProfile?.email || 'nadia.demo@mahasiswa.ac.id',
            partnerName: '',
            position: '',
            startDate: '',
            endDate: '',
            partnerSupervisor: '',
            dplName: '',
            description: '',
            revisionNote: '',
          }
          setInternship(empty)
          saveInternship(empty)
        }
      }
    }
    loadData()
  }, [])

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
      return { ...step, state: 'done', percent: 100 }
    }

    if (stepNumber === currentStage) {
      return { ...step, state: 'active', percent: 55 }
    }

    return { ...step, state: 'locked', percent: 0 }
  })

  const studentName = (profile && profile.full_name && profile.full_name !== 'Nadia Putri Ramadhani') ? profile.full_name : (internship.studentName || 'Nadia Putri Ramadhani')
  const studentFirstName = studentName.split(' ')[0]
  const studentNim = (profile && profile.nim && profile.nim !== '22.11.4321') ? profile.nim : (internship.studentId || '22.11.4321')
  const studentProdi = (profile && profile.study_program && profile.study_program !== 'Informatika') ? profile.study_program : (internship.studyProgram || 'Informatika')
  const studentSemester = (profile && profile.semester) ? profile.semester : (internship.semester || '7')

  const actionContent = getActionContent(internship, hasSubmission)
  const initials = getInitials(studentName)

  const periodLabel =
    internship.startDate && internship.endDate
      ? formatDateRange(internship.startDate, internship.endDate)
      : 'Belum Diisi'

  // Progress values that power the circular stat cards below
  const overallPercent = Math.round((currentStage / baseProcessSteps.length) * 100)
  const idPercent = hasSubmission ? 100 : 0
  const targetPercent = overallPercent
  const periodePercent = internship.startDate && internship.endDate ? 100 : 0

  return (
    <main className=" bg-slate-50 font-sans antialiased">
      <div className=" grid  lg:grid-cols-[240px_1fr]">
        {/* LEFT SIDEBAR — white */}
        <aside className="hidden border-r border-slate-100 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-base font-bold text-white shadow-md shadow-[#7C3AED]/25">
              KM
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight text-slate-900">
                Konversi Magang
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7C3AED]">
                Magang · OBE
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

            <a
              href="#pengaturan"
              className="flex items-center gap-3 rounded-full px-2 py-1.5 text-[14px] font-medium text-slate-400 transition hover:text-slate-600"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <SettingsIcon className="h-[18px] w-[18px] text-slate-400" />
              </span>
              Pengaturan
            </a>

            <button
              onClick={async () => {
                if (isSupabaseConfigured) {
                  await logoutFromSupabase()
                }
                window.localStorage.removeItem('konversi-magang-internship')
                navigate('/')
              }}
              className="flex w-full items-center gap-3 rounded-full px-2 py-1.5 text-[14px] font-medium text-slate-400 transition hover:text-red-500 text-left bg-transparent border-0 cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <ExitIcon className="h-[18px] w-[18px] text-slate-400" />
              </span>
              Log out
            </button>
          </nav>

          
        </aside>

        {/* MAIN CONTENT — soft gray */}
        <div className="flex min-w-0 flex-col">
          {/* HEADER BAR — flush to the sidebar, top, and right edge, no outer margin */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-sm font-semibold text-white lg:hidden">
                KM
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Pantau progres konversi magangmu
                </h1>
                <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
                  {actionContent.heroDescription}
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
                    {studentFirstName}
                  </p>
                  <p className="mt-1 text-[11px] leading-none text-[#7C3AED]">
                    {studentNim}
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
                Semester {studentSemester} · {studentProdi}
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                Selamat datang, {studentFirstName}! <span className="align-middle">👋</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
                Mahasiswa · Semester {studentSemester} {studentProdi}
              </p>
            </div>

            <Link
              to={detailPath}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:self-start"
            >
              {hasSubmission ? 'Lihat Pengajuan' : 'Buat Pengajuan'}
            </Link>
          </div>

          {/* STAT CARDS — colorful, circular progress */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GradientStatCard
              icon={ActivityIcon}
              label="Status Saat Ini"
              value={statusLabel}
              helper="Tindakan berikutnya oleh mahasiswa"
              percent={overallPercent}
              from="#7C3AED"
              to="#6D28D9"
            />
            <GradientStatCard
              icon={FolderIcon}
              label="ID Magang"
              value={internship.id || 'Belum Dibuat'}
              helper="Dibuat setelah pengajuan dikirim"
              percent={idPercent}
              from="#FF9640"
              to="#F97316"
            />
            <GradientStatCard
              icon={TargetIcon}
              label="Target Konversi"
              value="6 SKS"
              helper="2 mata kuliah direncanakan"
              percent={targetPercent}
              from="#7C3AED"
              to="#6D28D9"
            />
            <GradientStatCard
              icon={CalendarIcon}
              label="Periode Magang"
              value={periodLabel}
              helper={internship.partnerName || 'Mitra belum diisi'}
              percent={periodePercent}
              from="#FF9640"
              to="#F97316"
            />
          </div>

          {/* TIMELINE + ACTION PANEL */}
          <div id="proses" className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Progres Konversi
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Pantau tahapan pengajuan sampai hasil akhir.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F3E8FF] px-3 py-1.5 text-xs font-medium text-[#7C3AED]">
                  Tahap {currentStage} dari 5
                </span>
              </div>

              <div id="tindakan" className="mt-6">
                {processSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {index < processSteps.length - 1 && (
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
                          step.state === 'locked'
                            ? 'text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEXT ACTION PANEL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Tindakan Berikutnya
              </h3>

              <div
                className={`mt-4 rounded-2xl border p-6 ${actionContent.panelClass}`}
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${actionContent.badgeClass}`}
                >
                  {actionContent.badge}
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {actionContent.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {actionContent.description}
                </p>

                {actionContent.showButton && (
                  <Link
                    to={detailPath}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#6D28D9] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#7C3AED]"
                  >
                    {actionContent.buttonLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* SUBMISSION TABLE */}
          <div
            id="pengajuan"
            className="mt-9 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900">
                Pengajuan Magang
              </h3>
              <Link
                to={detailPath}
                className="text-xs font-medium text-[#7C3AED] hover:text-[#6D28D9]"
              >
                {hasSubmission ? 'Buka detail →' : 'Buat pengajuan →'}
              </Link>
            </div>

            {hasSubmission ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 font-medium">ID Magang</th>
                      <th className="px-5 py-3 font-medium">Mitra</th>
                      <th className="px-5 py-3 font-medium">Periode</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-5 py-5 font-medium text-slate-900">
                        {internship.id}
                      </td>
                      <td className="px-5 py-5 text-slate-500">
                        {internship.partnerName}
                      </td>
                      <td className="px-5 py-5 text-slate-500">
                        {formatDateRange(
                          internship.startDate,
                          internship.endDate,
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <StatusBadge status={internship.status} />
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link
                          to={detailPath}
                          className="font-medium text-[#7C3AED] hover:text-[#6D28D9]"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
                <h4 className="font-semibold text-slate-900">
                  Belum ada pengajuan magang
                </h4>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Lengkapi data magang agar sistem dapat membuat ID Magang dan
                  memulai proses konversi.
                </p>
                <Link
                  to="/mahasiswa/magang/baru"
                  className="mt-5 inline-flex rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
                >
                  Buat Pengajuan Magang
                </Link>
              </div>
            )}
          </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function getActionContent(internship, hasSubmission) {
  if (!hasSubmission || internship.status === 'DRAFT_PENGAJUAN') {
    return {
      heroDescription:
        'Lengkapi pengajuan magang untuk memulai proses konversi berbasis CPMK dan mata kuliah.',
      badge: 'Perlu Tindakan',
      title: 'Lengkapi pengajuan magang',
      description:
        'Isi informasi mitra, posisi, periode, pembimbing Mitra, DPL, dan deskripsi pekerjaan.',
      buttonLabel: 'Isi Pengajuan',
      showButton: true,
      panelClass: 'border-[#E9D5FF] bg-[#F3E8FF]/60',
      badgeClass: 'bg-[#E9D5FF] text-[#6D28D9]',
    }
  }

  if (internship.status === 'PERLU_PERBAIKAN_PENGAJUAN') {
    return {
      heroDescription:
        'Prodi meminta perbaikan pada data pengajuan magang. Periksa catatan dan kirim kembali.',
      badge: 'Perlu Perbaikan',
      title: 'Perbaiki data pengajuan',
      description:
        internship.revisionNote ||
        'Periksa catatan Prodi dan perbaiki data yang diperlukan.',
      buttonLabel: 'Buka Pengajuan',
      showButton: true,
      panelClass: 'border-red-100 bg-red-50/60',
      badgeClass: 'bg-red-100 text-red-700',
    }
  }

  if (internship.status === 'MENUNGGU_VERIFIKASI') {
    return {
      heroDescription:
        'Pengajuan magangmu sedang diperiksa oleh Prodi. Kamu dapat memantau status melalui dashboard.',
      badge: 'Menunggu Prodi',
      title: 'Pengajuan sedang diverifikasi',
      description:
        'Kamu belum perlu melakukan tindakan. Periksa kembali dashboard apabila Prodi meminta perbaikan.',
      buttonLabel: '',
      showButton: false,
      panelClass: 'border-amber-100 bg-amber-50/60',
      badgeClass: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    heroDescription:
      'Proses konversi magangmu sedang berjalan. Buka detail untuk melihat tahapan berikutnya.',
    badge: 'Proses Berjalan',
    title: getStatusLabel(internship.status),
    description:
      'Buka detail proses untuk melihat informasi dan tindakan yang tersedia.',
    buttonLabel: 'Buka Detail',
    showButton: true,
    panelClass: 'border-emerald-100 bg-emerald-50/60',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  }
}

/* Colorful gradient stat card with a circular progress ring, inspired by the
   language-learning card layout: bold gradient, big label, ring bottom-left,
   faint decorative icon on the right. */
function GradientStatCard({ icon: Icon, label, value, helper, percent, from, to }) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* soft decorative blob */}
      <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-10 right-6 h-20 w-20 rounded-full bg-white/10" />

      {Icon && (
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Icon className="h-4 w-4 text-white" strokeWidth="1.75" />
        </span>
      )}

      <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-2 truncate text-lg font-semibold leading-tight">
        {value}
      </p>

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

function StatusBadge({ status }) {
  const badgeClasses = {
    DRAFT_PENGAJUAN: 'bg-slate-100 text-slate-600',
    MENUNGGU_VERIFIKASI: 'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN: 'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        badgeClasses[status] || 'bg-[#F3E8FF] text-[#6D28D9]'
      }`}
    >
      {getStatusLabel(status)}
    </span>
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

function BellDotIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" strokeLinecap="round" strokeLinejoin="round" />
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

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" strokeLinecap="round" strokeLinejoin="round" />
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

function DocumentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 12.5h5M9.5 15.5h5M9.5 9.5h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M4 10a8 8 0 0 1 14.5-4.5M20 5v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14a8 8 0 0 1-14.5 4.5M4 19v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UploadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
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

function GraduationCapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 9.5v5" strokeLinecap="round" strokeLinejoin="round" />
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

function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" strokeLinejoin="round" />
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

export default StudentDashboard