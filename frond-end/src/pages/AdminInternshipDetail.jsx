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
  getAllInternships,
  generateUniqueInternshipId,
  MITRA_DEMO_TOKEN,
  DPL_DEMO_TOKEN,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  saveInternshipToSupabase,
  isSupabaseConfigured,
  sendReviewEmail,
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

function generateBimaId(studentId = '') {
  return generateUniqueInternshipId(studentId)
}

function incrementBimaCounter() {
  const counter = parseInt(localStorage.getItem('magista_bima_counter') || '1', 10)
  localStorage.setItem('magista_bima_counter', String(counter + 1))
}

function AdminInternshipDetail() {
  const { id } = useParams()
  const initialInternship = (() => {
    const all = getAllInternships()
    const found = all.find((item) => item.id === id || item.studentId === id)
    return found || loadInternship(id)
  })()

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
          setBimaId(remoteData.bimaId || generateBimaId())
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
    let finalBimaId = bimaId.trim()
    if (!finalBimaId) {
      finalBimaId = generateBimaId(internship.studentId)
      setBimaId(finalBimaId)
    }

    const updatedData = {
      ...internship,
      status: 'MAGANG_TERVERIFIKASI',
      bimaId: finalBimaId,
      revisionNote: '',
      updatedAt: new Date().toISOString(),
    }

    if (!saveInternship(updatedData)) {
      showMessage('Verifikasi pengajuan gagal disimpan.')
      return
    }

    if (bimaId.startsWith('MAG-')) {
      incrementBimaCounter()
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setSubmissionRevisionNote('')

    sendReviewEmail({
      type: 'VERIFICATION_SUCCESS',
      recipientEmail: updatedData.studentEmail || 'albarnaga123@gmail.com',
      recipientName: updatedData.studentName,
      studentName: updatedData.studentName,
      subject: `[MAGISTA] Pengajuan Magang Diverifikasi (${finalBimaId})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #7C3AED; font-size: 20px;">Selamat! Pengajuan Magang Terverifikasi 🎉</h2>
          <p style="color: #334155; font-size: 14px;">Halo <strong>${updatedData.studentName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">Pengajuan magang Anda di <strong>${updatedData.partnerName || 'Mitra'}</strong> telah berhasil diverifikasi oleh Admin Prodi dengan Kode Registrasi BIMA Resmi:</p>
          <div style="margin: 20px 0; padding: 16px; background-color: #F3E8FF; border-radius: 8px; text-align: center;">
            <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #7C3AED;">${finalBimaId}</span>
          </div>
          <p style="color: #64748B; font-size: 13px;">Anda dapat melanjutkan ke tahap penyusunan usulan mata kuliah konversi di dasbor mahasiswa.</p>
        </div>
      `
    }).catch(err => console.error("Email send failed:", err))

    showMessage(`Pengajuan berhasil diverifikasi. Email notifikasi terkirim dengan ID BIMA ${finalBimaId}.`)
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

function DocumentViewerSection({ internship, showSubmissionDocs = true, showClaimDocs = false }) {
  const proposalDoc = internship.proposalDocument || internship.proposalDoc || {
    name: 'Proposal_Magang_Mahasiswa.pdf',
    size: 1250000,
    url: '#',
  }
  const acceptanceDoc = internship.acceptanceDocument || internship.acceptanceDoc || {
    name: 'LoA_Diterima_Magang_Mitra.pdf',
    size: 890000,
    url: '#',
  }
  const mainDocs = internship.claim?.mainDocuments || {}

  const submissionDocs = [
    {
      title: 'Proposal Magang (ttd Kaprodi)',
      doc: proposalDoc,
      icon: '📄',
      required: true,
    },
    {
      title: 'Bukti Diterima Magang / LoA',
      doc: acceptanceDoc,
      icon: '📜',
      required: true,
    },
  ]

  const claimDocs = [
    {
      title: 'Logbook Magang',
      doc: mainDocs.logbook,
      icon: '📓',
    },
    {
      title: 'Laporan Akhir Magang',
      doc: mainDocs.report,
      icon: '📄',
    },
    {
      title: 'Sertifikat Selesai Magang',
      doc: mainDocs.certificate,
      icon: '🎓',
    },
    {
      title: 'Dokumen Pendukung',
      doc: mainDocs.supporting,
      icon: '📎',
    },
  ]

  return (
    <div className="mt-8 border-t border-slate-200 pt-6 space-y-6">
      {/* Dokumen Pengajuan (Tahap 1) */}
      {showSubmissionDocs && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#0F172A]">Dokumen Pengajuan Magang</h3>
              <p className="mt-1 text-sm text-slate-400">
                Berkas wajib yang diunggah mahasiswa saat pendaftaran magang.
              </p>
            </div>
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              2 Berkas Pengajuan
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {submissionDocs.map((item, idx) => {
              const file = item.doc

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                    file
                      ? 'border-emerald-200 bg-emerald-50/40 shadow-sm'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {item.title} <span className="text-red-500">*</span>
                        </h4>
                      </div>
                      {file ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Tersedia
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Belum Diunggah
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    {file ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {file.name || 'Dokumen.pdf'}
                          </p>
                          {file.size && (
                            <p className="text-[10px] text-slate-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>

                        {(() => {
                          const fileUrl = file.dataUrl || file.fileUrl || file.url
                          if (fileUrl && fileUrl !== '#') {
                            return (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#7C3AED] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#6D28D9] cursor-pointer"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Buka PDF
                              </a>
                            )
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const dummyWindow = window.open("", "_blank")
                                if (dummyWindow) {
                                  dummyWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Pratinjau Dokumen: ${file.name || 'Dokumen Pengajuan Magang'}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
                                          .card { background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                                          h2 { color: #a78bfa; margin-top: 0; }
                                          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                                          .badge { background: #059669; color: #fff; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 20px; }
                                          .meta { background: #0f172a; border-radius: 12px; padding: 15px; text-align: left; font-size: 13px; margin: 20px 0; color: #cbd5e1; }
                                          .meta div { margin-bottom: 6px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="card">
                                          <span class="badge">✓ Dokumen Resmi Terverifikasi</span>
                                          <h2>${file.name || item.title}</h2>
                                          <p>Dokumen ini telah diunggah dan terverifikasi di sistem MAGISTA AMIKOM.</p>
                                          <div class="meta">
                                            <div><strong>Nama Berkas:</strong> ${file.name || 'Dokumen_Pengajuan.pdf'}</div>
                                            <div><strong>Jenis Dokumen:</strong> ${item.title}</div>
                                            <div><strong>Status:</strong> Terlampir & Terverifikasi</div>
                                          </div>
                                          <p style="font-size:12px; color:#64748b;">Pratinjau Dokumen Sistem MAGISTA</p>
                                        </div>
                                      </body>
                                    </html>
                                  `)
                                }
                              }}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#7C3AED] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#6D28D9] cursor-pointer"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Lihat Dokumen
                            </button>
                          )
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs italic text-amber-700">Mahasiswa belum melampirkan file ini.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dokumen Klaim Konversi (Tahap 3 - Jika sudah ada / diizinkan) */}
      {showClaimDocs && (
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#0F172A]">Dokumen Klaim Konversi</h3>
              <p className="mt-1 text-sm text-slate-400">
                Berkas laporan, logbook, dan sertifikat pasca-magang.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {claimDocs.map((item, idx) => {
              const file = item.doc

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                    file
                      ? 'border-emerald-200 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 bg-[#F8FAFC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    {file ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {file.name || 'Dokumen.pdf'}
                          </p>
                          {file.size && (
                            <p className="text-[10px] text-slate-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>

                        {(() => {
                          const fileUrl = file.dataUrl || file.fileUrl || file.url
                          if (fileUrl && fileUrl !== '#') {
                            return (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#7C3AED] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#6D28D9] cursor-pointer"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Buka PDF
                              </a>
                            )
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const dummyWindow = window.open("", "_blank")
                                if (dummyWindow) {
                                  dummyWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Pratinjau Dokumen: ${file.name || 'Dokumen Klaim Konversi'}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
                                          .card { background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                                          h2 { color: #a78bfa; margin-top: 0; }
                                          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                                          .badge { background: #059669; color: #fff; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 20px; }
                                          .meta { background: #0f172a; border-radius: 12px; padding: 15px; text-align: left; font-size: 13px; margin: 20px 0; color: #cbd5e1; }
                                          .meta div { margin-bottom: 6px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="card">
                                          <span class="badge">✓ Dokumen Resmi Terverifikasi</span>
                                          <h2>${file.name || item.title}</h2>
                                          <p>Dokumen ini telah diunggah dan terverifikasi di sistem MAGISTA AMIKOM.</p>
                                          <div class="meta">
                                            <div><strong>Nama Berkas:</strong> ${file.name || 'Dokumen_Klaim.pdf'}</div>
                                            <div><strong>Jenis Dokumen:</strong> ${item.title}</div>
                                            <div><strong>Status:</strong> Terlampir & Terverifikasi</div>
                                          </div>
                                          <p style="font-size:12px; color:#64748b;">Pratinjau Dokumen Sistem MAGISTA</p>
                                        </div>
                                      </body>
                                    </html>
                                  `)
                                }
                              }}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#7C3AED] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#6D28D9] cursor-pointer"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Lihat Dokumen
                            </button>
                          )
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">Belum diunggah di Tahap Klaim.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
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

        {/* Dokumen PDF Pengajuan Mahasiswa (Tahap 1) */}
        <DocumentViewerSection internship={internship} showSubmissionDocs={true} showClaimDocs={false} />
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Kode Registrasi / ID Magang BIMA*
                </label>
                <button
                  type="button"
                  onClick={() => onBimaIdChange(generateBimaId(internship.studentId))}
                  className="text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 cursor-pointer hover:underline"
                >
                  ⚡ Generate ID Otomatis
                </button>
              </div>
              <input
                type="text"
                readOnly
                onClick={() => {
                  if (!bimaId) {
                    onBimaIdChange(generateBimaId(internship.studentId))
                  }
                }}
                value={bimaId}
                placeholder="Klik 'Generate ID Otomatis' di atas untuk membuat ID BIMA..."
                className="mt-1.5 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-mono outline-none bg-slate-100/70 text-slate-700 cursor-pointer select-none"
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

function AssessmentMonitoringTab({ internship, onSendMessage }) {
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

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const tokenIdentifier = internship.bimaId || internship.studentId || internship.id
  const mitraTokenUrl = `${origin}/mitra/${tokenIdentifier || MITRA_DEMO_TOKEN}`
  const dplTokenUrl = `${origin}/dpl/${tokenIdentifier || DPL_DEMO_TOKEN}`

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
          recipientEmail={internship.partnerEmail || 'supervisor.mitra@company.com'}
          submitted={partnerSubmitted}
          waitingLabel="Menunggu Penilaian Mitra"
          tokenUrl={mitraTokenUrl}
          role="Mitra Industri"
          studentName={internship.studentName}
          onSendMessage={onSendMessage}
        />

        <ReviewerStatusCard
          title="Review DPL"
          reviewer={
            internship.dplReview?.reviewerName ||
            internship.dplName
          }
          recipientEmail={internship.dplEmail || 'dpl.ade@amikom.ac.id'}
          submitted={dplSubmitted}
          waitingLabel={
            partnerSubmitted
              ? 'Menunggu Review DPL'
              : 'Menunggu Nilai Mitra'
          }
          tokenUrl={dplTokenUrl}
          role="Dosen Pembimbing Lapangan"
          studentName={internship.studentName}
          onSendMessage={onSendMessage}
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

              const partnerItem =
                internship.partnerAssessment?.scores?.find(
                  (item) => item.courseCode === courseCode,
                )
              const partnerScoreVal = partnerItem?.score ?? internship.partnerAssessment?.overallScore ?? '-'

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
                    {partnerScoreVal}
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

      {/* Dokumen PDF Klaim (Logbook, Laporan, Sertifikat) */}
      <DocumentViewerSection internship={internship} showSubmissionDocs={false} showClaimDocs={true} />
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
  recipientEmail,
  submitted,
  waitingLabel,
  tokenUrl,
  role,
  studentName,
  onSendMessage,
}) {
  const defaultEmail = recipientEmail || (role === 'Mitra Industri' ? 'supervisor.mitra@company.com' : 'dpl.ade@amikom.ac.id')
  const [targetEmail, setTargetEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState(null)

  const handleSendEmail = async () => {
    setSending(true)
    const emailToUse = targetEmail || defaultEmail

    const res = await sendReviewEmail({
      type: role === 'Mitra Industri' ? 'mitra_assessment' : 'dpl_proposal_review',
      recipientEmail: emailToUse,
      recipientName: reviewer || role,
      studentName: studentName || 'Mahasiswa',
      reviewUrl: tokenUrl,
    })

    setSending(false)
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setLastSent(timeStr)

    if (onSendMessage) {
      onSendMessage(`📧 Email notifikasi link token berhasil dikirimkan ke ${emailToUse}`)
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 p-5 bg-[#F8FAFC]/50 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-[#0F172A]">{title}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              submitted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {submitted ? '✓ Selesai' : waitingLabel}
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-800">
          {reviewer || 'Penilai belum ditentukan'}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Email Tujuan:</span>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="nama@email.com"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-700 outline-none focus:border-[#7C3AED]"
          />
        </div>

        {tokenUrl && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tautan Akses Token ({role || 'Penilai'})
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600 truncate bg-slate-50 p-1.5 rounded border border-slate-100 select-all">
              {tokenUrl}
            </p>
          </div>
        )}
      </div>

      {tokenUrl && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6D28D9] disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <span>Mengirim Email...</span>
            ) : (
              <>
                <span>📧</span>
                <span>Kirim Link Token via Email</span>
              </>
            )}
          </button>
          {lastSent && (
            <span className="shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Terkirim {lastSent}
            </span>
          )}
        </div>
      )}
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