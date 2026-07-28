import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import {
  findCourseRecommendations,
  getCourseByCode,
} from '../data/conversionMaster.js'
import {
  buildGradeRows,
  calculateGradeSummary,
} from '../data/gradeUtils.js'
import {
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  saveInternshipToSupabase,
  isSupabaseConfigured,
} from '../data/supabaseSync.js'

// ---------------------------------------------------------------------------
// Design tokens — a "registrar's ledger" identity: deep indigo for
// authority/primary actions, a muted gold for approvals & completed stages,
// warm stone neutrals instead of cool slate, serif for headings, monospace
// for record numbers, course codes and IDs.
// ---------------------------------------------------------------------------
const INDIGO = '#7C3AED'
const INDIGO_DEEP = '#6D28D9'
const GOLD = '#7C3AED'
const GOLD_SOFT = '#F3E8FF'
const GOLD_BORDER = '#E9D5FF'

const tabs = [
  'Verifikasi',
  'Usulan',
  'Penilaian',
  'Finalisasi',
]

const proposalStatuses = [
  'DRAFT_USULAN',
  'MENUNGGU_VALIDASI_USULAN',
  'PERLU_REVISI_USULAN',
  'USULAN_DISETUJUI',
  'DRAFT_KLAIM',
  'MENUNGGU_PENILAIAN_MITRA',
  'MENUNGGU_REVIEW_DPL',
  'PERLU_REVISI_KLAIM',
  'SIAP_FINALISASI',
  'SELESAI',
]

const assessmentStatuses = [
  'MENUNGGU_PENILAIAN_MITRA',
  'MENUNGGU_REVIEW_DPL',
  'PERLU_REVISI_KLAIM',
  'SIAP_FINALISASI',
  'SELESAI',
]

const finalizationStatuses = ['SIAP_FINALISASI', 'SELESAI']

function getInitialTab(status) {
  if (finalizationStatuses.includes(status)) {
    return 'Finalisasi'
  }

  if (assessmentStatuses.includes(status)) {
    return 'Penilaian'
  }

  if (proposalStatuses.includes(status)) {
    return 'Usulan'
  }

  return 'Verifikasi'
}

function AdminInternshipDetail() {
  const { id } = useParams()
  const initialInternship = loadInternship()

  const [internship, setInternship] = useState(initialInternship)
  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(initialInternship.status),
  )

  const [submissionRevisionNote, setSubmissionRevisionNote] =
    useState(initialInternship.revisionNote || '')

  const [bimaId, setBimaId] = useState(initialInternship.bimaId || '')

  const [proposalRevisionNote, setProposalRevisionNote] =
    useState(initialInternship.proposal?.revisionNote || '')

  const [partnerWeight, setPartnerWeight] = useState(
    initialInternship.gradeSettings?.partnerWeight ?? 60,
  )

  const [dplWeight, setDplWeight] = useState(
    initialInternship.gradeSettings?.dplWeight ?? 40,
  )

  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchInternshipFromSupabase(id)
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
          setBimaId(remoteData.bimaId || '')
          setSubmissionRevisionNote(remoteData.revisionNote || '')
          setProposalRevisionNote(remoteData.proposal?.revisionNote || '')
          setPartnerWeight(remoteData.gradeSettings?.partnerWeight ?? 60)
          setDplWeight(remoteData.gradeSettings?.dplWeight ?? 40)
          setActiveTab(getInitialTab(remoteData.status))
        }
      }
    }
    loadData()
  }, [id])

  const canVerifySubmission =
    internship.status === 'MENUNGGU_VERIFIKASI'

  const proposalAccessible =
    proposalStatuses.includes(internship.status) ||
    internship.status === 'MAGANG_TERVERIFIKASI'

  const canValidateProposal =
    internship.status === 'MENUNGGU_VALIDASI_USULAN'

  const assessmentAccessible =
    assessmentStatuses.includes(internship.status)

  const finalizationAccessible =
    finalizationStatuses.includes(internship.status)

  const stageNumber =
    tabs.indexOf(getInitialTab(internship.status)) + 1

  const gradeRows = useMemo(
    () =>
      buildGradeRows(
        internship,
        Number(partnerWeight),
        Number(dplWeight),
      ),
    [internship, partnerWeight, dplWeight],
  )

  const gradeSummary = useMemo(
    () => calculateGradeSummary(gradeRows),
    [gradeRows],
  )

  function showMessage(text) {
    setMessage(text)
  }

  function handleTabChange(tab) {
    if (tab === 'Verifikasi') {
      setActiveTab(tab)
      return
    }

    if (tab === 'Usulan' && proposalAccessible) {
      setActiveTab(tab)
      return
    }

    if (tab === 'Penilaian' && assessmentAccessible) {
      setActiveTab(tab)
      return
    }

    if (tab === 'Finalisasi' && finalizationAccessible) {
      setActiveTab(tab)
    }
  }

  function handleApproveSubmission() {
    if (!bimaId.trim()) {
      showMessage('ID Magang BIMA wajib diisi untuk melakukan verifikasi.')
      return
    }

    const updatedData = {
      ...internship,
      status: 'MAGANG_TERVERIFIKASI',
      bimaId: bimaId.trim(),
      revisionNote: '',
      updatedAt: new Date().toISOString(),
    }

    if (!saveInternship(updatedData)) {
      showMessage('Verifikasi pengajuan gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setSubmissionRevisionNote('')
    showMessage('Pengajuan berhasil diverifikasi.')
  }

  function handleRequestSubmissionRevision() {
    if (!submissionRevisionNote.trim()) {
      showMessage('Catatan perbaikan pengajuan wajib diisi.')
      return
    }

    const updatedData = {
      ...internship,
      status: 'PERLU_PERBAIKAN_PENGAJUAN',
      revisionNote: submissionRevisionNote.trim(),
      updatedAt: new Date().toISOString(),
    }

    if (!saveInternship(updatedData)) {
      showMessage('Permintaan perbaikan gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)

    showMessage(
      'Permintaan perbaikan berhasil dikirim kepada mahasiswa.',
    )
  }

  function handleApproveProposal() {
    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'USULAN_DISETUJUI',
      proposal: {
        ...internship.proposal,
        revisionNote: '',
        approvedAt: currentTime,
        updatedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      showMessage('Persetujuan usulan gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setProposalRevisionNote('')
    showMessage('Usulan konversi berhasil disetujui.')
  }

  function handleRequestProposalRevision() {
    if (!proposalRevisionNote.trim()) {
      showMessage('Catatan revisi usulan wajib diisi.')
      return
    }

    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'PERLU_REVISI_USULAN',
      proposal: {
        ...internship.proposal,
        revisionNote: proposalRevisionNote.trim(),
        updatedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      showMessage('Permintaan revisi usulan gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)

    showMessage(
      'Permintaan revisi usulan berhasil dikirim kepada mahasiswa.',
    )
  }

  function handleFinalize() {
    const numericPartnerWeight = Number(partnerWeight)
    const numericDplWeight = Number(dplWeight)

    if (
      numericPartnerWeight < 0 ||
      numericDplWeight < 0 ||
      numericPartnerWeight + numericDplWeight !== 100
    ) {
      showMessage(
        'Total bobot Mitra dan DPL harus tepat 100 persen.',
      )
      return
    }

    if (
      gradeRows.length === 0 ||
      gradeRows.some((row) => row.finalScore === null)
    ) {
      showMessage(
        'Nilai Mitra dan DPL harus tersedia untuk seluruh mata kuliah.',
      )
      return
    }

    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'SELESAI',

      gradeSettings: {
        partnerWeight: numericPartnerWeight,
        dplWeight: numericDplWeight,
      },

      result: {
        courses: gradeRows,
        totalCredits: gradeSummary.totalCredits,
        averageScore: gradeSummary.averageScore,
        letterGrade: gradeSummary.letterGrade,
        finalizedAt: currentTime,
        finalizedBy: 'Admin Program Studi',
      },

      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      showMessage('Finalisasi hasil gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    showMessage('Hasil konversi berhasil difinalisasi.')
  }

  if (!internship.id) {
    return (
      <MessagePage
        title="Pengajuan tidak ditemukan"
        description="Mahasiswa belum mengirim pengajuan magang."
        backPath="/admin"
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
              style={{ backgroundColor: INDIGO }}
            >
              <ClipboardIcon className="h-5 w-5" />
            </span>

            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: GOLD }}
              >
                Berkas Review Program Studi
              </p>

              <h1
                className="mt-0.5 text-lg font-semibold leading-tight text-[#0F172A] sm:text-xl"
              >
                {internship.id}
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                {internship.studentName} · {internship.partnerName}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-[#0F172A]"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Dashboard Prodi
            </Link>

            <StatusBadge status={internship.status} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <StageTracker
          tabs={tabs}
          activeTab={activeTab}
          stageNumber={stageNumber}
          proposalAccessible={proposalAccessible}
          assessmentAccessible={assessmentAccessible}
          finalizationAccessible={finalizationAccessible}
          onChange={handleTabChange}
        />

        {message && (
          <Toast
            message={message}
            onClose={() => setMessage('')}
          />
        )}

        {activeTab === 'Verifikasi' && (
          <VerificationTab
            internship={internship}
            canVerify={canVerifySubmission}
            bimaId={bimaId}
            onBimaIdChange={setBimaId}
            revisionNote={submissionRevisionNote}
            onRevisionNoteChange={(event) => {
              setSubmissionRevisionNote(event.target.value)
              setMessage('')
            }}
            onApprove={handleApproveSubmission}
            onRequestRevision={
              handleRequestSubmissionRevision
            }
          />
        )}

        {activeTab === 'Usulan' && (
          <ProposalReviewTab
            internship={internship}
            canValidate={canValidateProposal}
            revisionNote={proposalRevisionNote}
            onRevisionNoteChange={(event) => {
              setProposalRevisionNote(event.target.value)
              setMessage('')
            }}
            onApprove={handleApproveProposal}
            onRequestRevision={handleRequestProposalRevision}
          />
        )}

        {activeTab === 'Penilaian' && (
          <AssessmentMonitoringTab
            internship={internship}
          />
        )}

        {activeTab === 'Finalisasi' && (
          <FinalizationTab
            internship={internship}
            rows={gradeRows}
            summary={gradeSummary}
            partnerWeight={partnerWeight}
            dplWeight={dplWeight}
            onPartnerWeightChange={(event) => {
              setPartnerWeight(event.target.value)
              setMessage('')
            }}
            onDplWeightChange={(event) => {
              setDplWeight(event.target.value)
              setMessage('')
            }}
            onFinalize={handleFinalize}
          />
        )}
      </div>
    </main>
  )
}

// A stepped, numbered tracker instead of a pill-tab row + separate progress
// bar — the four tabs really are a sequence (verify → propose → assess →
// finalize), so numbering here encodes real information rather than
// decorating it.
function StageTracker({
  tabs,
  activeTab,
  stageNumber,
  proposalAccessible,
  assessmentAccessible,
  finalizationAccessible,
  onChange,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
      <ol className="flex min-w-max items-start">
        {tabs.map((tab, index) => {
          const step = index + 1

          const accessible =
            tab === 'Verifikasi' ||
            (tab === 'Usulan' && proposalAccessible) ||
            (tab === 'Penilaian' && assessmentAccessible) ||
            (tab === 'Finalisasi' && finalizationAccessible)

          const isCurrent = activeTab === tab
          const isComplete = step < stageNumber

          let circleClasses =
            'flex h-9 w-9 items-center justify-center rounded-full border font-mono text-sm font-semibold transition'
          let labelClasses = 'mt-2 text-xs font-medium transition'
          let circleStyle = {}

          if (isCurrent) {
            circleStyle = { backgroundColor: INDIGO, borderColor: INDIGO }
            circleClasses += ' text-white shadow-sm'
            labelClasses += ' text-[#0F172A]'
          } else if (isComplete) {
            circleStyle = { backgroundColor: GOLD_SOFT, borderColor: GOLD_BORDER, color: GOLD }
            labelClasses += ' text-slate-600'
          } else if (accessible) {
            circleClasses += ' border-slate-400 text-slate-600 hover:border-[#7C3AED] hover:text-[#7C3AED]'
            labelClasses += ' text-slate-600'
          } else {
            circleClasses += ' border-slate-300 text-slate-400 cursor-not-allowed'
            labelClasses += ' text-slate-400'
          }

          return (
            <li key={tab} className="flex flex-1 items-start">
              <button
                type="button"
                disabled={!accessible}
                onClick={() => onChange(tab)}
                className="flex flex-col items-center gap-0 px-1"
              >
                <span className={circleClasses} style={circleStyle}>
                  {isComplete ? <CheckIcon className="h-4 w-4" /> : step}
                </span>
                <span className={labelClasses}>{tab}</span>
              </button>

              {index < tabs.length - 1 && (
                <span
                  className="mt-[18px] h-px w-10 shrink-0 sm:w-20"
                  style={{
                    backgroundColor: isComplete ? GOLD_BORDER : '#CBD5E1',
                  }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function VerificationTab({
  internship,
  canVerify,
  bimaId,
  onBimaIdChange,
  revisionNote,
  onRevisionNoteChange,
  onApprove,
  onRequestRevision,
}) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <SectionHeader
          title="Data Pengajuan Mahasiswa"
          description="Informasi pengajuan yang dikirim mahasiswa."
        />

        <dl className="mt-7 grid gap-6 rounded-lg bg-[#F8FAFC] p-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Nama Mahasiswa"
            value={internship.studentName}
          />

          <InfoItem label="NIM" value={internship.studentId} mono />

          <InfoItem
            label="Program Studi"
            value={internship.studyProgram}
          />

          <InfoItem label="Mitra" value={internship.partnerName} />

          <InfoItem label="Posisi" value={internship.position} />

          <InfoItem
            label="Periode"
            value={formatDateRange(
              internship.startDate,
              internship.endDate,
            )}
          />

          <InfoItem
            label="Pembimbing Mitra"
            value={internship.partnerSupervisor}
          />

          <InfoItem label="DPL" value={internship.dplName} />

          <InfoItem
            label="Status"
            value={getStatusLabel(internship.status)}
          />
        </dl>

        <div className="mt-8 rounded-lg bg-[#F8FAFC] p-5">
          <p className="text-sm font-semibold text-[#0F172A]">
            Deskripsi Pekerjaan
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {internship.description}
          </p>
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-[#0F172A]">
          Keputusan Verifikasi
        </h2>

        {canVerify ? (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Verifikasi jika data sudah sesuai atau minta
              perbaikan.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-[#0F172A]">
                Kode Registrasi / ID Magang BIMA*
              </label>
              <input
                type="text"
                value={bimaId}
                onChange={(e) => onBimaIdChange(e.target.value)}
                placeholder="Masukkan ID Magang BIMA (cth: BIMA-2026-98765)"
                className="mt-1.5 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10"
              />
            </div>

            <textarea
              rows="5"
              value={revisionNote}
              onChange={onRevisionNoteChange}
              placeholder="Catatan perbaikan pengajuan."
              className="mt-4 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10"
            />

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onApprove}
                className="w-full rounded-md bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
              >
                Verifikasi Pengajuan
              </button>

              <button
                type="button"
                onClick={onRequestRevision}
                className="w-full rounded-md border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Minta Perbaikan
              </button>
            </div>
          </>
        ) : (
          <DecisionCompleted
            status={internship.status}
            note={internship.revisionNote}
            bimaId={internship.bimaId}
          />
        )}
      </aside>
    </div>
  )
}

function ProposalReviewTab({
  internship,
  canValidate,
  revisionNote,
  onRevisionNoteChange,
  onApprove,
  onRequestRevision,
}) {
  const activities = internship.proposal?.activities || []

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <SectionHeader
          title="Usulan Konversi Mahasiswa"
          description="Periksa aktivitas, CPMK, dan mata kuliah."
        />

        <div className="mt-6 space-y-6">
          {activities.map((activity, index) => (
            <ProposalActivityCard
              key={activity.id}
              activity={activity}
              number={index + 1}
            />
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-[#0F172A]">
          Keputusan Validasi Usulan
        </h2>

        {canValidate ? (
          <>
            <textarea
              rows="5"
              value={revisionNote}
              onChange={onRevisionNoteChange}
              placeholder="Catatan revisi usulan."
              className="mt-6 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10"
            />

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onApprove}
                className="w-full rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Setujui Usulan
              </button>

              <button
                type="button"
                onClick={onRequestRevision}
                className="w-full rounded-md border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Minta Revisi Usulan
              </button>
            </div>
          </>
        ) : (
          <DecisionCompleted
            status={internship.status}
            note={internship.proposal?.revisionNote}
          />
        )}
      </aside>
    </div>
  )
}

function AssessmentMonitoringTab({ internship }) {
  const partnerSubmitted = Boolean(
    internship.partnerAssessment?.submittedAt,
  )

  const dplSubmitted = Boolean(
    internship.dplReview?.submittedAt,
  )

  const courseCodes = [
    ...new Set(
      internship.claim.activities.flatMap(
        (activity) => activity.selectedCourseCodes || [],
      ),
    ),
  ]

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 md:p-8">
      <SectionHeader
        title="Monitoring Penilaian"
        description="Pantau penilaian Mitra dan review akademik DPL."
      />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <ReviewerStatusCard
          title="Penilaian Mitra"
          reviewer={
            internship.partnerAssessment?.reviewerName ||
            internship.partnerSupervisor
          }
          submitted={partnerSubmitted}
          waitingLabel="Menunggu Penilaian Mitra"
        />

        <ReviewerStatusCard
          title="Review DPL"
          reviewer={
            internship.dplReview?.reviewerName ||
            internship.dplName
          }
          submitted={dplSubmitted}
          waitingLabel={
            partnerSubmitted
              ? 'Menunggu Review DPL'
              : 'Menunggu Nilai Mitra'
          }
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3 font-semibold">Mata Kuliah</th>
              <th className="px-5 py-3 font-semibold">Nilai Mitra</th>
              <th className="px-5 py-3 font-semibold">Nilai DPL</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {courseCodes.map((courseCode) => {
              const course = getCourseByCode(courseCode)

              const partnerScore =
                internship.partnerAssessment?.scores?.find(
                  (item) => item.courseCode === courseCode,
                )

              const dplScore =
                internship.dplReview?.scores?.find(
                  (item) => item.courseCode === courseCode,
                )

              return (
                <tr
                  key={courseCode}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-5 py-5">
                    <p className="font-mono text-sm font-medium text-[#0F172A]">
                      {courseCode}
                    </p>

                    <p className="mt-1 text-slate-500">
                      {course?.name}
                    </p>
                  </td>

                  <td className="px-5 py-5 font-semibold text-[#0F172A]">
                    {partnerScore?.score ?? '-'}
                  </td>

                  <td className="px-5 py-5 font-semibold text-[#0F172A]">
                    {dplScore?.score ?? '-'}
                  </td>

                  <td className="px-5 py-5">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {dplScore
                        ? 'Lengkap'
                        : partnerScore
                          ? 'Menunggu DPL'
                          : 'Menunggu Mitra'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FinalizationTab({
  internship,
  rows,
  summary,
  partnerWeight,
  dplWeight,
  onPartnerWeightChange,
  onDplWeightChange,
  onFinalize,
}) {
  const finalized = internship.status === 'SELESAI'
  const displayedRows =
    finalized && internship.result?.courses
      ? internship.result.courses
      : rows

  const displayedSummary =
    finalized && internship.result
      ? {
          totalCredits: internship.result.totalCredits,
          averageScore: internship.result.averageScore,
          letterGrade: internship.result.letterGrade,
        }
      : summary

  const weightsBalanced =
    Number(partnerWeight) + Number(dplWeight) === 100

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 md:p-8">
      <SectionHeader
        title="Finalisasi Hasil Konversi"
        description="Atur bobot, periksa nilai, lalu kunci hasil."
      />

      <div
        className="mt-6 rounded-lg border p-5"
        style={{ borderColor: GOLD_BORDER, backgroundColor: GOLD_SOFT }}
      >
        <p className="text-sm font-semibold" style={{ color: GOLD }}>
          Rumus Nilai Akhir
        </p>

        <p className="mt-2 font-mono text-sm leading-6 text-slate-600">
          (Nilai Mitra × Bobot Mitra / 100) + (Nilai DPL ×
          Bobot DPL / 100)
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <WeightField
          label="Bobot Mitra"
          value={
            finalized
              ? internship.gradeSettings.partnerWeight
              : partnerWeight
          }
          disabled={finalized}
          onChange={onPartnerWeightChange}
        />

        <WeightField
          label="Bobot DPL"
          value={
            finalized
              ? internship.gradeSettings.dplWeight
              : dplWeight
          }
          disabled={finalized}
          onChange={onDplWeightChange}
        />

        <article className="rounded-lg bg-[#F8FAFC] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Bobot
          </p>

          <p
            className={`mt-3 font-mono text-2xl font-bold ${
              weightsBalanced ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {Number(partnerWeight) + Number(dplWeight)}%
          </p>
        </article>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3 font-semibold">Mata Kuliah</th>
              <th className="px-5 py-3 font-semibold">SKS</th>
              <th className="px-5 py-3 font-semibold">Mitra</th>
              <th className="px-5 py-3 font-semibold">DPL</th>
              <th className="px-5 py-3 font-semibold">Nilai Akhir</th>
              <th className="px-5 py-3 font-semibold">Huruf</th>
            </tr>
          </thead>

          <tbody>
            {displayedRows.map((row) => (
              <tr
                key={row.courseCode}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-5 py-5">
                  <p className="font-mono text-sm font-medium text-[#0F172A]">
                    {row.courseCode}
                  </p>

                  <p className="mt-1 text-slate-500">
                    {row.courseName}
                  </p>
                </td>

                <td className="px-5 py-5">{row.credits}</td>

                <td className="px-5 py-5 font-semibold">
                  {row.partnerScore ?? '-'}
                </td>

                <td className="px-5 py-5 font-semibold">
                  {row.dplScore ?? '-'}
                </td>

                <td
                  className="px-5 py-5 font-serif text-lg font-semibold"
                  style={{ color: GOLD }}
                >
                  {row.finalScore ?? '-'}
                </td>

                <td className="px-5 py-5">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {row.letterGrade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Konversi"
          value={`${displayedSummary.totalCredits} SKS`}
        />

        <SummaryCard
          label="Rata-rata Nilai"
          value={displayedSummary.averageScore ?? '-'}
        />

        <SummaryCard
          label="Nilai Huruf"
          value={displayedSummary.letterGrade}
        />
      </div>

      {!finalized && (
        <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onFinalize}
            className="rounded-md px-6 py-3 text-sm font-semibold text-white transition"
            style={{ backgroundColor: INDIGO }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = INDIGO_DEEP
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = INDIGO
            }}
          >
            Finalisasi Hasil Konversi
          </button>
        </div>
      )}

      {finalized && (
        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">
            Hasil konversi telah difinalisasi
          </p>

          <p className="mt-2 text-sm text-emerald-700">
            Data sekarang menjadi hanya-baca dan dapat ditampilkan
            kepada mahasiswa.
          </p>
        </div>
      )}
    </section>
  )
}

function ProposalActivityCard({ activity, number }) {
  const recommendations = findCourseRecommendations(
    activity.description,
  )

  return (
    <article className="rounded-xl border border-slate-200 p-5">
      <p
        className="font-mono text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: GOLD }}
      >
        Aktivitas {String(number).padStart(2, '0')}
      </p>

      <h3 className="mt-2 font-serif font-semibold text-[#0F172A]">
        {activity.description}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Estimasi {activity.estimatedHours} jam
      </p>

      <div className="mt-5 space-y-4">
        {activity.selectedCourseCodes.map((courseCode) => {
          const course = getCourseByCode(courseCode)

          const recommendation = recommendations.find(
            (item) => item.code === courseCode,
          )

          return (
            <div
              key={courseCode}
              className="rounded-lg border p-5"
              style={{ borderColor: GOLD_BORDER, backgroundColor: GOLD_SOFT }}
            >
              <p className="font-medium text-[#0F172A]">
                <span className="font-mono">{course?.code}</span> ·{' '}
                {course?.name} · {course?.credits} SKS
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {course?.cpmk}
              </p>

              {recommendation?.matchedKeywords?.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-emerald-700">
                  Kata kunci:{' '}
                  {recommendation.matchedKeywords.join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </article>
  )
}

function ReviewerStatusCard({
  title,
  reviewer,
  submitted,
  waitingLabel,
}) {
  return (
    <article className="rounded-xl border border-slate-200 p-5">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          submitted
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {submitted ? 'Selesai' : waitingLabel}
      </span>

      <h3 className="mt-4 font-serif font-semibold text-[#0F172A]">{title}</h3>

      <p className="mt-2 text-sm text-slate-500">
        {reviewer || 'Penilai belum tersedia'}
      </p>
    </article>
  )
}

function WeightField({
  label,
  value,
  disabled,
  onChange,
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type="number"
          min="0"
          max="100"
          value={value}
          disabled={disabled}
          onChange={onChange}
          className="w-full rounded-md border border-slate-300 px-4 py-3 pr-10 font-mono text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 disabled:bg-slate-100"
        />

        <span className="absolute right-4 top-3 text-sm text-slate-500">
          %
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <h2 className="font-serif text-lg font-semibold text-[#0F172A]">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        {description}
      </p>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-lg bg-[#F8FAFC] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 font-serif text-2xl font-semibold text-[#0F172A]">
        {value}
      </p>
    </article>
  )
}

function DecisionCompleted({ status, note, bimaId }) {
  return (
    <div className="mt-5 rounded-lg bg-[#F8FAFC] p-5">
      <p className="text-sm font-semibold text-[#0F172A]">
        Keputusan telah diberikan
      </p>

      <p className="mt-2 text-sm text-slate-600">
        Status: <strong>{getStatusLabel(status)}</strong>
      </p>

      {bimaId && (
        <p className="mt-2 text-sm text-slate-600">
          ID Magang BIMA: <strong>{bimaId}</strong>
        </p>
      )}

      {note && (
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Catatan: {note}
        </p>
      )}
    </div>
  )
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd
        className={`mt-2 text-sm font-semibold text-[#0F172A] ${mono ? 'font-mono' : ''}`}
      >
        {value || '-'}
      </dd>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    DRAFT_PENGAJUAN: 'bg-slate-100 text-slate-600',
    MENUNGGU_VERIFIKASI: 'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN: 'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI: 'bg-emerald-50 text-emerald-700',
    DRAFT_USULAN: 'text-[#7C3AED]',
    MENUNGGU_VALIDASI_USULAN: 'bg-amber-50 text-amber-700',
    PERLU_REVISI_USULAN: 'bg-red-50 text-red-700',
    USULAN_DISETUJUI: 'bg-emerald-50 text-emerald-700',
    DRAFT_KLAIM: 'text-[#7C3AED]',
    MENUNGGU_PENILAIAN_MITRA: 'bg-amber-50 text-amber-700',
    MENUNGGU_REVIEW_DPL: 'bg-amber-50 text-amber-700',
    PERLU_REVISI_KLAIM: 'bg-red-50 text-red-700',
    SIAP_FINALISASI: 'text-[#7C3AED]',
    SELESAI: 'bg-emerald-50 text-emerald-700',
  }

  const goldBg = [
    'DRAFT_USULAN',
    'DRAFT_KLAIM',
    'SIAP_FINALISASI',
  ].includes(status)

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
        styles[status] || 'bg-slate-100 text-slate-600'
      }`}
      style={goldBg ? { backgroundColor: GOLD_SOFT } : undefined}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function Toast({ message, onClose }) {
  const success = message.includes('berhasil')

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm">
      <div
        className={`rounded-xl border px-5 py-4 shadow-xl ${
          success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              {success ? 'Berhasil' : 'Periksa Kembali'}
            </p>

            <p className="mt-1 text-sm leading-5">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-lg font-semibold opacity-60 hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

function MessagePage({ title, description, backPath }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 font-sans antialiased">
      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: GOLD_SOFT }}
        >
          <ClipboardIcon className="h-5 w-5" style={{ color: GOLD }} />
        </span>

        <h1 className="mt-5 font-serif text-xl font-semibold text-[#0F172A]">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>

        <Link
          to={backPath}
          className="mt-6 inline-flex rounded-md px-5 py-3 text-sm font-semibold text-white transition"
          style={{ backgroundColor: INDIGO }}
        >
          Kembali
        </Link>
      </div>
    </main>
  )
}

function ClipboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6M8.5 11.5l2.2 2.2L15.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default AdminInternshipDetail