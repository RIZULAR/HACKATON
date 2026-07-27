import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  findCourseRecommendations,
  getCourseByCode,
} from '../data/conversionMaster.js'
import {
  buildGradeRows,
  calculateGradeSummary,
} from '../data/gradeUtils.js'
import {
  DPL_DEMO_TOKEN,
  MITRA_DEMO_TOKEN,
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'

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
  const initialInternship = loadInternship()

  const [internship, setInternship] = useState(initialInternship)
  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(initialInternship.status),
  )

  const [submissionRevisionNote, setSubmissionRevisionNote] =
    useState(initialInternship.revisionNote || '')

  const [proposalRevisionNote, setProposalRevisionNote] =
    useState(initialInternship.proposal?.revisionNote || '')

  const [partnerWeight, setPartnerWeight] = useState(
    initialInternship.gradeSettings?.partnerWeight ?? 60,
  )

  const [dplWeight, setDplWeight] = useState(
    initialInternship.gradeSettings?.dplWeight ?? 40,
  )

  const [message, setMessage] = useState('')

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
    const updatedData = {
      ...internship,
      status: 'MAGANG_TERVERIFIKASI',
      revisionNote: '',
      updatedAt: new Date().toISOString(),
    }

    if (!saveInternship(updatedData)) {
      showMessage('Verifikasi pengajuan gagal disimpan.')
      return
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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <Link
            to="/admin"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            ← Kembali ke Dashboard Prodi
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Detail Review Prodi
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {internship.id}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {internship.studentName} · {internship.partnerName}
              </p>
            </div>

            <StatusBadge status={internship.status} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const accessible =
                tab === 'Verifikasi' ||
                (tab === 'Usulan' && proposalAccessible) ||
                (tab === 'Penilaian' &&
                  assessmentAccessible) ||
                (tab === 'Finalisasi' &&
                  finalizationAccessible)

              return (
                <button
                  key={tab}
                  type="button"
                  disabled={!accessible}
                  onClick={() => handleTabChange(tab)}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : accessible
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'cursor-not-allowed text-slate-400'
                  }`}
                >
                  {tab}
                  {!accessible && ' · Terkunci'}
                </button>
              )
            })}
          </nav>
        </div>

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

function VerificationTab({
  internship,
  canVerify,
  revisionNote,
  onRevisionNoteChange,
  onApprove,
  onRequestRevision,
}) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          title="Data Pengajuan Mahasiswa"
          description="Informasi pengajuan yang dikirim mahasiswa."
        />

        <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Nama Mahasiswa"
            value={internship.studentName}
          />

          <InfoItem label="NIM" value={internship.studentId} />

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

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-900">
            Deskripsi Pekerjaan
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {internship.description}
          </p>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">
          Keputusan Verifikasi
        </h2>

        {canVerify ? (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Verifikasi jika data sudah sesuai atau minta
              perbaikan.
            </p>

            <textarea
              rows="5"
              value={revisionNote}
              onChange={onRevisionNoteChange}
              placeholder="Catatan perbaikan pengajuan."
              className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onApprove}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Verifikasi Pengajuan
              </button>

              <button
                type="button"
                onClick={onRequestRevision}
                className="w-full rounded-xl border border-red-300 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                Minta Perbaikan
              </button>
            </div>
          </>
        ) : (
          <DecisionCompleted
            status={internship.status}
            note={internship.revisionNote}
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">
          Keputusan Validasi Usulan
        </h2>

        {canValidate ? (
          <>
            <textarea
              rows="5"
              value={revisionNote}
              onChange={onRevisionNoteChange}
              placeholder="Catatan revisi usulan."
              className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onApprove}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Setujui Usulan
              </button>

              <button
                type="button"
                onClick={onRequestRevision}
                className="w-full rounded-xl border border-red-300 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
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
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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
          link={`/mitra/${MITRA_DEMO_TOKEN}`}
          waitingLabel="Menunggu Penilaian Mitra"
        />

        <ReviewerStatusCard
          title="Review DPL"
          reviewer={
            internship.dplReview?.reviewerName ||
            internship.dplName
          }
          submitted={dplSubmitted}
          link={`/dpl/${DPL_DEMO_TOKEN}`}
          waitingLabel={
            partnerSubmitted
              ? 'Menunggu Review DPL'
              : 'Menunggu Nilai Mitra'
          }
        />
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3 font-semibold">Mata Kuliah</th>
              <th className="pb-3 font-semibold">Nilai Mitra</th>
              <th className="pb-3 font-semibold">Nilai DPL</th>
              <th className="pb-3 font-semibold">Status</th>
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
                  className="border-b border-slate-100"
                >
                  <td className="py-5">
                    <p className="font-bold text-slate-900">
                      {courseCode}
                    </p>

                    <p className="mt-1 text-slate-500">
                      {course?.name}
                    </p>
                  </td>

                  <td className="py-5 font-bold text-slate-900">
                    {partnerScore?.score ?? '-'}
                  </td>

                  <td className="py-5 font-bold text-slate-900">
                    {dplScore?.score ?? '-'}
                  </td>

                  <td className="py-5">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <SectionHeader
        title="Finalisasi Hasil Konversi"
        description="Atur bobot, periksa nilai, lalu kunci hasil."
      />

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-bold text-blue-900">
          Rumus Nilai Akhir
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
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

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Bobot
          </p>

          <p
            className={`mt-3 text-2xl font-bold ${
              Number(partnerWeight) + Number(dplWeight) === 100
                ? 'text-emerald-700'
                : 'text-red-600'
            }`}
          >
            {Number(partnerWeight) + Number(dplWeight)}%
          </p>
        </article>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-3 font-semibold">Mata Kuliah</th>
              <th className="pb-3 font-semibold">SKS</th>
              <th className="pb-3 font-semibold">Mitra</th>
              <th className="pb-3 font-semibold">DPL</th>
              <th className="pb-3 font-semibold">Nilai Akhir</th>
              <th className="pb-3 font-semibold">Huruf</th>
            </tr>
          </thead>

          <tbody>
            {displayedRows.map((row) => (
              <tr
                key={row.courseCode}
                className="border-b border-slate-100"
              >
                <td className="py-5">
                  <p className="font-bold text-slate-900">
                    {row.courseCode}
                  </p>

                  <p className="mt-1 text-slate-500">
                    {row.courseName}
                  </p>
                </td>

                <td className="py-5">{row.credits}</td>

                <td className="py-5 font-semibold">
                  {row.partnerScore ?? '-'}
                </td>

                <td className="py-5 font-semibold">
                  {row.dplScore ?? '-'}
                </td>

                <td className="py-5 text-lg font-bold text-indigo-700">
                  {row.finalScore ?? '-'}
                </td>

                <td className="py-5">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
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
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Finalisasi Hasil Konversi
          </button>
        </div>
      )}

      {finalized && (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-emerald-900">
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
    <article className="rounded-2xl border border-slate-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Aktivitas {number}
      </p>

      <h3 className="mt-2 font-bold text-slate-900">
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
              className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5"
            >
              <p className="font-bold text-slate-900">
                {course?.code} · {course?.name} ·{' '}
                {course?.credits} SKS
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
  link,
  waitingLabel,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          submitted
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {submitted ? 'Selesai' : waitingLabel}
      </span>

      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm text-slate-500">
        {reviewer || 'Penilai belum tersedia'}
      </p>

      <Link
        to={link}
        className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
      >
        Buka Tautan
      </Link>
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
      <label className="text-sm font-semibold text-slate-800">
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
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
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
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  )
}

function SummaryCard({ label, value }) {
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

function DecisionCompleted({ status, note }) {
  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-900">
        Keputusan telah diberikan
      </p>

      <p className="mt-2 text-sm text-slate-600">
        Status: <strong>{getStatusLabel(status)}</strong>
      </p>

      {note && (
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Catatan: {note}
        </p>
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd className="mt-2 text-sm font-semibold text-slate-900">
        {value || '-'}
      </dd>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className="w-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
      {getStatusLabel(status)}
    </span>
  )
}

function Toast({ message, onClose }) {
  const success = message.includes('berhasil')

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm">
      <div
        className={`rounded-2xl border px-5 py-4 shadow-xl ${
          success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}
      >
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm font-bold">
              {success ? 'Berhasil' : 'Periksa Kembali'}
            </p>

            <p className="mt-1 text-sm">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg font-bold"
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>

        <Link
          to={backPath}
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          Kembali
        </Link>
      </div>
    </main>
  )
}

export default AdminInternshipDetail