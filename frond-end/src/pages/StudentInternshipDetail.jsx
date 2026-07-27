import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import StudentResultTab from '../components/StudentResultTab.jsx'
import {
  findCourseRecommendations,
  getCourseByCode,
} from '../data/conversionMaster.js'
import {
  formatDateRange,
  getEmptyInternship,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'

const tabs = ['Pengajuan', 'Usulan', 'Klaim', 'Hasil']

const requiredSubmissionFields = [
  'partnerName',
  'position',
  'startDate',
  'endDate',
  'partnerSupervisor',
  'dplName',
  'description',
]

const proposalAccessibleStatuses = [
  'MAGANG_TERVERIFIKASI',
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

const proposalEditableStatuses = [
  'MAGANG_TERVERIFIKASI',
  'DRAFT_USULAN',
  'PERLU_REVISI_USULAN',
]

const claimAccessibleStatuses = [
  'USULAN_DISETUJUI',
  'DRAFT_KLAIM',
  'MENUNGGU_PENILAIAN_MITRA',
  'MENUNGGU_REVIEW_DPL',
  'PERLU_REVISI_KLAIM',
  'SIAP_FINALISASI',
  'SELESAI',
]

const claimEditableStatuses = [
  'USULAN_DISETUJUI',
  'DRAFT_KLAIM',
  'PERLU_REVISI_KLAIM',
]

function createActivity() {
  return {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    estimatedHours: '',
    selectedCourseCodes: [],
  }
}

function createClaimActivities(
  proposalActivities,
  existingClaimActivities,
) {
  return proposalActivities.map((proposalActivity) => {
    const existingClaim = existingClaimActivities.find(
      (claimActivity) =>
        claimActivity.proposalActivityId === proposalActivity.id,
    )

    if (existingClaim) {
      return {
        ...existingClaim,
        proposalDescription: proposalActivity.description,
        estimatedHours: proposalActivity.estimatedHours,
        selectedCourseCodes:
          proposalActivity.selectedCourseCodes,
      }
    }

    return {
      id: `CLM-${proposalActivity.id}`,
      proposalActivityId: proposalActivity.id,
      proposalDescription: proposalActivity.description,
      estimatedHours: proposalActivity.estimatedHours,
      actualDescription: proposalActivity.description,
      actualHours: proposalActivity.estimatedHours,
      achievement: '',
      differenceExplanation: '',
      selectedCourseCodes: [
        ...proposalActivity.selectedCourseCodes,
      ],
      evidence: null,
    }
  })
}

function getInitialTab(status) {
  if (status === 'SELESAI') {
    return 'Hasil'
  }

  if (claimAccessibleStatuses.includes(status)) {
    return 'Klaim'
  }

  if (proposalAccessibleStatuses.includes(status)) {
    return 'Usulan'
  }

  return 'Pengajuan'
}

function getInitialForm(routeId) {
  const savedInternship = loadInternship()

  if (routeId === 'baru') {
    const hasSavedDraft =
      savedInternship.status === 'DRAFT_PENGAJUAN' &&
      !savedInternship.id &&
      Boolean(
        savedInternship.partnerName ||
          savedInternship.position ||
          savedInternship.startDate ||
          savedInternship.endDate ||
          savedInternship.partnerSupervisor ||
          savedInternship.dplName ||
          savedInternship.description,
      )

    return hasSavedDraft
      ? savedInternship
      : getEmptyInternship()
  }

  if (
    claimAccessibleStatuses.includes(savedInternship.status) &&
    savedInternship.proposal.activities.length > 0
  ) {
    return {
      ...savedInternship,
      claim: {
        ...savedInternship.claim,
        activities: createClaimActivities(
          savedInternship.proposal.activities,
          savedInternship.claim.activities,
        ),
      },
    }
  }

  return savedInternship
}

function StudentInternshipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const initialForm = getInitialForm(id)

  const [form, setForm] = useState(initialForm)
  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(initialForm.status),
  )

  const [submissionErrors, setSubmissionErrors] = useState({})
  const [proposalErrors, setProposalErrors] = useState({})
  const [claimErrors, setClaimErrors] = useState({})
  const [message, setMessage] = useState('')

  const submissionEditable =
    !form.id ||
    form.status === 'DRAFT_PENGAJUAN' ||
    form.status === 'PERLU_PERBAIKAN_PENGAJUAN'

  const proposalAccessible =
    proposalAccessibleStatuses.includes(form.status)

  const proposalEditable =
    proposalEditableStatuses.includes(form.status)

  const claimAccessible =
    claimAccessibleStatuses.includes(form.status)

  const claimEditable =
    claimEditableStatuses.includes(form.status)

  const resultAccessible =
    form.status === 'SELESAI' &&
    Boolean(form.result?.courses?.length)

  const pageTitle = form.id || 'Pengajuan Magang Baru'

  const statusLabel = form.id
    ? getStatusLabel(form.status)
    : form.updatedAt
      ? 'Draf Tersimpan'
      : 'Belum Dikirim'

  function showMessage(text) {
    setMessage(text)
  }

  function handleTabChange(tab) {
    if (tab === 'Pengajuan') {
      setActiveTab(tab)
      return
    }

    if (tab === 'Usulan' && proposalAccessible) {
      setActiveTab(tab)
      return
    }

    if (tab === 'Klaim' && claimAccessible) {
      setForm((currentForm) => ({
        ...currentForm,
        claim: {
          ...currentForm.claim,
          activities: createClaimActivities(
            currentForm.proposal.activities,
            currentForm.claim.activities,
          ),
        },
      }))

      setActiveTab(tab)
      return
    }

    if (tab === 'Hasil' && resultAccessible) {
      setActiveTab(tab)
    }
  }

  function handleSubmissionChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    setSubmissionErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))

    setMessage('')
  }

  function validateSubmission() {
    const nextErrors = {}

    requiredSubmissionFields.forEach((field) => {
      if (!String(form[field] || '').trim()) {
        nextErrors[field] = 'Kolom ini wajib diisi.'
      }
    })

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) > new Date(form.endDate)
    ) {
      nextErrors.endDate =
        'Tanggal selesai harus setelah tanggal mulai.'
    }

    setSubmissionErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  function handleSaveSubmissionDraft() {
    const currentTime = new Date().toISOString()

    const draftData = {
      ...form,
      id: form.id || '',
      status: form.id ? form.status : 'DRAFT_PENGAJUAN',
      createdAt: form.createdAt || currentTime,
      updatedAt: currentTime,
    }

    if (!saveInternship(draftData)) {
      showMessage('Draf gagal disimpan. Silakan coba kembali.')
      return
    }

    setForm(draftData)
    setSubmissionErrors({})
    showMessage('Draf pengajuan berhasil disimpan.')
  }

  function handleSubmitInternship(event) {
    event.preventDefault()

    if (!validateSubmission()) {
      showMessage(
        'Periksa kembali kolom yang masih belum lengkap.',
      )
      return
    }

    const currentTime = new Date().toISOString()
    const internshipId = form.id || 'MAG-2026-001'

    const submittedData = {
      ...form,
      id: internshipId,
      status: 'MENUNGGU_VERIFIKASI',
      createdAt: form.createdAt || currentTime,
      updatedAt: currentTime,
      submittedAt: currentTime,
    }

    if (!saveInternship(submittedData)) {
      showMessage('Pengajuan gagal dikirim. Silakan coba kembali.')
      return
    }

    setForm(submittedData)
    setSubmissionErrors({})
    showMessage('Pengajuan berhasil dikirim kepada Prodi.')

    navigate(`/mahasiswa/magang/${internshipId}`, {
      replace: true,
    })
  }

  function handleAddActivity() {
    setForm((currentForm) => ({
      ...currentForm,
      proposal: {
        ...currentForm.proposal,
        activities: [
          ...currentForm.proposal.activities,
          createActivity(),
        ],
      },
    }))

    setMessage('')
  }

  function handleRemoveActivity(activityId) {
    setForm((currentForm) => ({
      ...currentForm,
      proposal: {
        ...currentForm.proposal,
        activities:
          currentForm.proposal.activities.filter(
            (activity) => activity.id !== activityId,
          ),
      },
    }))

    setMessage('')
  }

  function handleActivityChange(activityId, field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      proposal: {
        ...currentForm.proposal,
        activities:
          currentForm.proposal.activities.map((activity) => {
            if (activity.id !== activityId) {
              return activity
            }

            if (field === 'description') {
              const recommendationCodes =
                findCourseRecommendations(value).map(
                  (course) => course.code,
                )

              return {
                ...activity,
                description: value,
                selectedCourseCodes:
                  activity.selectedCourseCodes.filter(
                    (courseCode) =>
                      recommendationCodes.includes(courseCode),
                  ),
              }
            }

            return {
              ...activity,
              [field]: value,
            }
          }),
      },
    }))

    setProposalErrors((currentErrors) => ({
      ...currentErrors,
      [`${activityId}.${field}`]: '',
    }))

    setMessage('')
  }

  function handleToggleCourse(activityId, courseCode) {
    setForm((currentForm) => ({
      ...currentForm,
      proposal: {
        ...currentForm.proposal,
        activities:
          currentForm.proposal.activities.map((activity) => {
            if (activity.id !== activityId) {
              return activity
            }

            const selected =
              activity.selectedCourseCodes.includes(courseCode)

            return {
              ...activity,
              selectedCourseCodes: selected
                ? activity.selectedCourseCodes.filter(
                    (code) => code !== courseCode,
                  )
                : [
                    ...activity.selectedCourseCodes,
                    courseCode,
                  ],
            }
          }),
      },
    }))

    setProposalErrors((currentErrors) => ({
      ...currentErrors,
      [`${activityId}.selectedCourseCodes`]: '',
    }))

    setMessage('')
  }

  function handleProposalNoteChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      proposal: {
        ...currentForm.proposal,
        generalNote: event.target.value,
      },
    }))

    setMessage('')
  }

  function validateProposal() {
    const nextErrors = {}

    if (form.proposal.activities.length === 0) {
      nextErrors.activities =
        'Tambahkan minimal satu aktivitas magang.'
    }

    form.proposal.activities.forEach((activity) => {
      if (!activity.description.trim()) {
        nextErrors[`${activity.id}.description`] =
          'Deskripsi aktivitas wajib diisi.'
      }

      if (
        !activity.estimatedHours ||
        Number(activity.estimatedHours) <= 0
      ) {
        nextErrors[`${activity.id}.estimatedHours`] =
          'Estimasi jam harus lebih dari 0.'
      }

      if (activity.selectedCourseCodes.length === 0) {
        nextErrors[`${activity.id}.selectedCourseCodes`] =
          'Pilih minimal satu rekomendasi mata kuliah.'
      }
    })

    setProposalErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  function handleSaveProposalDraft() {
    const currentTime = new Date().toISOString()

    const updatedData = {
      ...form,
      status:
        form.status === 'PERLU_REVISI_USULAN'
          ? 'PERLU_REVISI_USULAN'
          : 'DRAFT_USULAN',
      proposal: {
        ...form.proposal,
        createdAt:
          form.proposal.createdAt || currentTime,
        updatedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      showMessage('Draf usulan gagal disimpan.')
      return
    }

    setForm(updatedData)
    setProposalErrors({})
    showMessage('Draf usulan berhasil disimpan.')
  }

  function handleSubmitProposal() {
    if (!validateProposal()) {
      showMessage(
        'Periksa kembali data usulan yang belum lengkap.',
      )
      return
    }

    const currentTime = new Date().toISOString()

    const submittedData = {
      ...form,
      status: 'MENUNGGU_VALIDASI_USULAN',
      proposal: {
        ...form.proposal,
        createdAt:
          form.proposal.createdAt || currentTime,
        updatedAt: currentTime,
        submittedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(submittedData)) {
      showMessage('Usulan gagal dikirim kepada Prodi.')
      return
    }

    setForm(submittedData)
    setProposalErrors({})
    showMessage('Usulan berhasil dikirim kepada Prodi.')
  }

  function handleClaimChange(claimActivityId, field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      claim: {
        ...currentForm.claim,
        activities: currentForm.claim.activities.map(
          (activity) =>
            activity.id === claimActivityId
              ? {
                  ...activity,
                  [field]: value,
                }
              : activity,
        ),
      },
    }))

    setClaimErrors((currentErrors) => ({
      ...currentErrors,
      [`${claimActivityId}.${field}`]: '',
    }))

    setMessage('')
  }

  function handleClaimNoteChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      claim: {
        ...currentForm.claim,
        generalNote: event.target.value,
      },
    }))

    setMessage('')
  }

  function handleEvidenceChange(claimActivityId, event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
    ]

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        'Bukti hanya boleh berupa PDF, JPG, atau PNG.',
      )
      event.target.value = ''
      return
    }

    if (file.size > 1024 * 1024) {
      showMessage(
        'Ukuran bukti maksimal 1 MB untuk demo lokal.',
      )
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setForm((currentForm) => ({
        ...currentForm,
        claim: {
          ...currentForm.claim,
          activities: currentForm.claim.activities.map(
            (activity) =>
              activity.id === claimActivityId
                ? {
                    ...activity,
                    evidence: {
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      dataUrl: reader.result,
                    },
                  }
                : activity,
          ),
        },
      }))

      setClaimErrors((currentErrors) => ({
        ...currentErrors,
        [`${claimActivityId}.evidence`]: '',
      }))

      showMessage('Bukti berhasil ditambahkan.')
    }

    reader.onerror = () => {
      showMessage(
        'Bukti gagal dibaca. Silakan pilih file lain.',
      )
    }

    reader.readAsDataURL(file)
  }

  function handleRemoveEvidence(claimActivityId) {
    setForm((currentForm) => ({
      ...currentForm,
      claim: {
        ...currentForm.claim,
        activities: currentForm.claim.activities.map(
          (activity) =>
            activity.id === claimActivityId
              ? {
                  ...activity,
                  evidence: null,
                }
              : activity,
        ),
      },
    }))

    setMessage('')
  }

  function claimHasDifference(activity) {
    const descriptionDifferent =
      activity.actualDescription.trim().toLowerCase() !==
      activity.proposalDescription.trim().toLowerCase()

    const hoursDifferent =
      Number(activity.actualHours) !==
      Number(activity.estimatedHours)

    return descriptionDifferent || hoursDifferent
  }

  function validateClaim() {
    const nextErrors = {}

    if (form.claim.activities.length === 0) {
      nextErrors.activities =
        'Data aktivitas klaim belum tersedia.'
    }

    form.claim.activities.forEach((activity) => {
      if (!activity.actualDescription.trim()) {
        nextErrors[`${activity.id}.actualDescription`] =
          'Realisasi aktivitas wajib diisi.'
      }

      if (
        !activity.actualHours ||
        Number(activity.actualHours) <= 0
      ) {
        nextErrors[`${activity.id}.actualHours`] =
          'Durasi realisasi harus lebih dari 0.'
      }

      if (!activity.achievement.trim()) {
        nextErrors[`${activity.id}.achievement`] =
          'Capaian aktivitas wajib diisi.'
      }

      if (
        claimHasDifference(activity) &&
        !activity.differenceExplanation.trim()
      ) {
        nextErrors[
          `${activity.id}.differenceExplanation`
        ] =
          'Jelaskan perbedaan antara usulan dan realisasi.'
      }

      if (!activity.evidence) {
        nextErrors[`${activity.id}.evidence`] =
          'Unggah minimal satu bukti aktivitas.'
      }
    })

    setClaimErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  function handleSaveClaimDraft() {
    const currentTime = new Date().toISOString()

    const updatedData = {
      ...form,
      status:
        form.status === 'PERLU_REVISI_KLAIM'
          ? 'PERLU_REVISI_KLAIM'
          : 'DRAFT_KLAIM',
      claim: {
        ...form.claim,
        createdAt: form.claim.createdAt || currentTime,
        updatedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      showMessage(
        'Draf klaim gagal disimpan. Periksa ukuran file bukti.',
      )
      return
    }

    setForm(updatedData)
    setClaimErrors({})
    showMessage('Draf klaim berhasil disimpan.')
  }

  function handleSubmitClaim() {
    if (!validateClaim()) {
      showMessage(
        'Periksa kembali data klaim yang belum lengkap.',
      )
      return
    }

    const currentTime = new Date().toISOString()

    const submittedData = {
      ...form,
      status: 'MENUNGGU_PENILAIAN_MITRA',
      claim: {
        ...form.claim,
        createdAt: form.claim.createdAt || currentTime,
        updatedAt: currentTime,
        submittedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(submittedData)) {
      showMessage(
        'Klaim gagal dikirim. Periksa ukuran file bukti.',
      )
      return
    }

    setForm(submittedData)
    setClaimErrors({})
    showMessage(
      'Klaim berhasil dikirim untuk penilaian Mitra.',
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <Link
            to="/mahasiswa"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            ← Kembali ke Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Detail Proses Magang
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {pageTitle}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {form.partnerName
                  ? `${form.partnerName} · ${
                      form.position || 'Posisi belum diisi'
                    }`
                  : 'Lengkapi data pengajuan magang'}
              </p>
            </div>

            <StatusBadge
              status={form.status}
              label={statusLabel}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const accessible =
                tab === 'Pengajuan' ||
                (tab === 'Usulan' &&
                  proposalAccessible) ||
                (tab === 'Klaim' && claimAccessible) ||
                (tab === 'Hasil' && resultAccessible)

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
          <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm">
            <div
              className={`rounded-2xl border px-5 py-4 shadow-xl ${
                message.includes('berhasil')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">
                    {message.includes('berhasil')
                      ? 'Berhasil'
                      : 'Periksa Kembali'}
                  </p>

                  <p className="mt-1 text-sm leading-5">
                    {message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMessage('')}
                  className="shrink-0 text-lg font-bold opacity-60 hover:opacity-100"
                  aria-label="Tutup notifikasi"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Pengajuan' && (
          <SubmissionTab
            form={form}
            errors={submissionErrors}
            editable={submissionEditable}
            onChange={handleSubmissionChange}
            onSaveDraft={handleSaveSubmissionDraft}
            onSubmit={handleSubmitInternship}
          />
        )}

        {activeTab === 'Usulan' && (
          <ProposalTab
            form={form}
            errors={proposalErrors}
            editable={proposalEditable}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onActivityChange={handleActivityChange}
            onToggleCourse={handleToggleCourse}
            onNoteChange={handleProposalNoteChange}
            onSaveDraft={handleSaveProposalDraft}
            onSubmit={handleSubmitProposal}
          />
        )}

        {activeTab === 'Klaim' && (
          <ClaimTab
            form={form}
            errors={claimErrors}
            editable={claimEditable}
            hasDifference={claimHasDifference}
            onChange={handleClaimChange}
            onNoteChange={handleClaimNoteChange}
            onEvidenceChange={handleEvidenceChange}
            onRemoveEvidence={handleRemoveEvidence}
            onSaveDraft={handleSaveClaimDraft}
            onSubmit={handleSubmitClaim}
          />
        )}

        {activeTab === 'Hasil' && (
          <StudentResultTab internship={form} />
        )}
      </div>
    </main>
  )
}

function SubmissionTab({
  form,
  errors,
  editable,
  onChange,
  onSaveDraft,
  onSubmit,
}) {
  return (
    <>
      {!editable && (
        <InfoBanner
          title="Pengajuan sudah dikirim"
          description="Data pengajuan menjadi hanya-baca selama proses berikutnya."
          type="warning"
        />
      )}

      {form.revisionNote && (
        <InfoBanner
          title="Catatan Perbaikan Prodi"
          description={form.revisionNote}
          type="danger"
        />
      )}

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <PageSectionHeader
          title="Form Pengajuan Magang"
          description="Data ini digunakan dalam seluruh proses konversi."
          editable={editable}
        />

        <section className="mt-7">
          <SectionTitle
            title="Identitas Mahasiswa"
            description="Data mahasiswa pada skenario demo."
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ReadOnlyField
              label="Nama Mahasiswa"
              value={form.studentName}
            />

            <ReadOnlyField
              label="NIM"
              value={form.studentId}
            />

            <ReadOnlyField
              label="Program Studi"
              value={form.studyProgram}
            />

            <ReadOnlyField
              label="Semester"
              value={form.semester}
            />

            <ReadOnlyField
              label="Email"
              value={form.studentEmail}
            />
          </div>
        </section>

        <section className="mt-9 border-t border-slate-100 pt-8">
          <SectionTitle
            title="Informasi Tempat Magang"
            description="Informasi mitra dan posisi magang."
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField
              label="Nama Mitra"
              name="partnerName"
              value={form.partnerName}
              error={errors.partnerName}
              disabled={!editable}
              onChange={onChange}
            />

            <FormField
              label="Posisi atau Divisi"
              name="position"
              value={form.position}
              error={errors.position}
              disabled={!editable}
              onChange={onChange}
            />

            <FormField
              label="Tanggal Mulai"
              name="startDate"
              type="date"
              value={form.startDate}
              error={errors.startDate}
              disabled={!editable}
              onChange={onChange}
            />

            <FormField
              label="Tanggal Selesai"
              name="endDate"
              type="date"
              value={form.endDate}
              error={errors.endDate}
              disabled={!editable}
              onChange={onChange}
            />
          </div>

          {form.startDate && form.endDate && (
            <p className="mt-4 text-sm text-slate-500">
              Periode magang:{' '}
              <strong className="text-slate-800">
                {formatDateRange(
                  form.startDate,
                  form.endDate,
                )}
              </strong>
            </p>
          )}
        </section>

        <section className="mt-9 border-t border-slate-100 pt-8">
          <SectionTitle
            title="Pembimbing"
            description="Pembimbing Mitra dan DPL."
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField
              label="Nama Pembimbing Mitra"
              name="partnerSupervisor"
              value={form.partnerSupervisor}
              error={errors.partnerSupervisor}
              disabled={!editable}
              onChange={onChange}
            />

            <FormField
              label="Nama DPL"
              name="dplName"
              value={form.dplName}
              error={errors.dplName}
              disabled={!editable}
              onChange={onChange}
            />
          </div>
        </section>

        <section className="mt-9 border-t border-slate-100 pt-8">
          <SectionTitle
            title="Deskripsi Pekerjaan"
            description="Aktivitas utama selama magang."
          />

          <TextAreaField
            name="description"
            value={form.description}
            error={errors.description}
            disabled={!editable}
            onChange={onChange}
          />
        </section>

        {editable && (
          <ActionButtons
            draftLabel="Simpan Draf"
            submitLabel="Kirim Pengajuan ke Prodi"
            onSaveDraft={onSaveDraft}
          />
        )}
      </form>
    </>
  )
}

function ProposalTab({
  form,
  errors,
  editable,
  onAddActivity,
  onRemoveActivity,
  onActivityChange,
  onToggleCourse,
  onNoteChange,
  onSaveDraft,
  onSubmit,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <PageSectionHeader
        title="Usulan Konversi"
        description="Masukkan aktivitas, lalu sistem mencocokkan kata kunci dengan data master."
        editable={editable}
      />

      <InfoBanner
        title="Rekomendasi berbasis kata kunci"
        description="Sistem hanya memberikan rekomendasi. Prodi tetap melakukan validasi akhir."
        type="info"
      />

      {form.proposal.revisionNote && (
        <InfoBanner
          title="Catatan Revisi Prodi"
          description={form.proposal.revisionNote}
          type="danger"
        />
      )}

      <div className="mt-6 space-y-6">
        {form.proposal.activities.map(
          (activity, index) => (
            <ProposalActivityCard
              key={activity.id}
              activity={activity}
              number={index + 1}
              errors={errors}
              editable={editable}
              onRemove={onRemoveActivity}
              onChange={onActivityChange}
              onToggleCourse={onToggleCourse}
            />
          ),
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={onAddActivity}
          className="mt-6 rounded-xl border border-indigo-300 px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
        >
          + Tambah Aktivitas
        </button>
      )}

      <div className="mt-8 border-t border-slate-100 pt-7">
        <label className="text-sm font-semibold text-slate-800">
          Catatan Umum Usulan
        </label>

        <textarea
          rows="4"
          value={form.proposal.generalNote}
          disabled={!editable}
          onChange={onNoteChange}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
        />
      </div>

      {editable && (
        <ActionButtons
          draftLabel="Simpan Draf Usulan"
          submitLabel="Kirim Usulan ke Prodi"
          onSaveDraft={onSaveDraft}
          onSubmit={onSubmit}
          submitType="button"
        />
      )}
    </section>
  )
}

function ClaimTab({
  form,
  errors,
  editable,
  hasDifference,
  onChange,
  onNoteChange,
  onEvidenceChange,
  onRemoveEvidence,
  onSaveDraft,
  onSubmit,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <PageSectionHeader
        title="Klaim Konversi"
        description="Laporkan realisasi kegiatan dan unggah bukti untuk setiap aktivitas."
        editable={editable}
      />

      <InfoBanner
        title="Perbedaan Usulan dan Klaim"
        description="Usulan merupakan rencana awal. Klaim merupakan aktivitas yang benar-benar dilaksanakan dan harus didukung bukti."
        type="info"
      />

      {form.claim.revisionNote && (
        <InfoBanner
          title="Catatan Revisi DPL"
          description={form.claim.revisionNote}
          type="danger"
        />
      )}

      <div className="mt-6 space-y-6">
        {form.claim.activities.map(
          (activity, index) => (
            <ClaimActivityCard
              key={activity.id}
              activity={activity}
              number={index + 1}
              errors={errors}
              editable={editable}
              hasDifference={hasDifference(activity)}
              onChange={onChange}
              onEvidenceChange={onEvidenceChange}
              onRemoveEvidence={onRemoveEvidence}
            />
          ),
        )}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-7">
        <label className="text-sm font-semibold text-slate-800">
          Catatan Umum Klaim
        </label>

        <textarea
          rows="4"
          value={form.claim.generalNote}
          disabled={!editable}
          onChange={onNoteChange}
          placeholder="Tambahkan informasi umum tentang realisasi kegiatan."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
        />
      </div>

      {editable && (
        <ActionButtons
          draftLabel="Simpan Draf Klaim"
          submitLabel="Kirim Klaim ke Mitra"
          onSaveDraft={onSaveDraft}
          onSubmit={onSubmit}
          submitType="button"
        />
      )}
    </section>
  )
}

function ProposalActivityCard({
  activity,
  number,
  errors,
  editable,
  onRemove,
  onChange,
  onToggleCourse,
}) {
  const recommendations =
    findCourseRecommendations(activity.description)

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex justify-between gap-4">
        <h3 className="font-bold text-slate-900">
          Aktivitas {number}
        </h3>

        {editable && (
          <button
            type="button"
            onClick={() => onRemove(activity.id)}
            className="text-sm font-semibold text-red-600"
          >
            Hapus
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_220px]">
        <TextAreaField
          label="Deskripsi Aktivitas"
          value={activity.description}
          error={errors[`${activity.id}.description`]}
          disabled={!editable}
          onChange={(event) =>
            onChange(
              activity.id,
              'description',
              event.target.value,
            )
          }
        />

        <FormField
          label="Estimasi Jam"
          type="number"
          value={activity.estimatedHours}
          error={
            errors[`${activity.id}.estimatedHours`]
          }
          disabled={!editable}
          onChange={(event) =>
            onChange(
              activity.id,
              'estimatedHours',
              event.target.value,
            )
          }
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm font-bold text-slate-900">
          Rekomendasi CPMK dan Mata Kuliah
        </p>

        <div className="mt-4 space-y-4">
          {recommendations.map((course) => {
            const selected =
              activity.selectedCourseCodes.includes(
                course.code,
              )

            return (
              <label
                key={course.code}
                className={`block rounded-2xl border p-5 ${
                  selected
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!editable}
                    onChange={() =>
                      onToggleCourse(
                        activity.id,
                        course.code,
                      )
                    }
                    className="mt-1 accent-indigo-600"
                  />

                  <div>
                    <p className="font-bold text-slate-900">
                      {course.code} · {course.name} ·{' '}
                      {course.credits} SKS
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {course.cpmk}
                    </p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </article>
  )
}

function ClaimActivityCard({
  activity,
  number,
  errors,
  editable,
  hasDifference,
  onChange,
  onEvidenceChange,
  onRemoveEvidence,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Klaim Aktivitas {number}
          </p>

          <h3 className="mt-2 font-bold text-slate-900">
            {activity.proposalDescription}
          </h3>
        </div>

        <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Rencana {activity.estimatedHours} jam
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Mata Kuliah yang Disetujui
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {activity.selectedCourseCodes.map(
            (courseCode) => {
              const course =
                getCourseByCode(courseCode)

              return (
                <span
                  key={courseCode}
                  className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800"
                >
                  {course?.code} · {course?.name}
                </span>
              )
            },
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
        <TextAreaField
          label="Realisasi Aktivitas"
          value={activity.actualDescription}
          error={
            errors[
              `${activity.id}.actualDescription`
            ]
          }
          disabled={!editable}
          onChange={(event) =>
            onChange(
              activity.id,
              'actualDescription',
              event.target.value,
            )
          }
        />

        <FormField
          label="Durasi Realisasi"
          type="number"
          value={activity.actualHours}
          error={
            errors[`${activity.id}.actualHours`]
          }
          disabled={!editable}
          onChange={(event) =>
            onChange(
              activity.id,
              'actualHours',
              event.target.value,
            )
          }
        />
      </div>

      <div className="mt-5">
        <TextAreaField
          label="Capaian atau Hasil"
          value={activity.achievement}
          error={
            errors[`${activity.id}.achievement`]
          }
          disabled={!editable}
          placeholder="Jelaskan hasil konkret dari aktivitas ini."
          onChange={(event) =>
            onChange(
              activity.id,
              'achievement',
              event.target.value,
            )
          }
        />
      </div>

      <div className="mt-5">
        <TextAreaField
          label={`Penjelasan Perbedaan${
            hasDifference ? ' *' : ''
          }`}
          value={activity.differenceExplanation}
          error={
            errors[
              `${activity.id}.differenceExplanation`
            ]
          }
          disabled={!editable}
          placeholder={
            hasDifference
              ? 'Jelaskan mengapa realisasi berbeda dari usulan.'
              : 'Tidak wajib jika realisasi sama dengan usulan.'
          }
          onChange={(event) =>
            onChange(
              activity.id,
              'differenceExplanation',
              event.target.value,
            )
          }
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm font-bold text-slate-900">
          Bukti Aktivitas
        </p>

        <p className="mt-1 text-xs text-slate-500">
          PDF, JPG, atau PNG. Maksimal 1 MB untuk demo
          lokal.
        </p>

        {activity.evidence ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-emerald-900">
                  {activity.evidence.name}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  {(
                    activity.evidence.size / 1024
                  ).toFixed(1)}{' '}
                  KB
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={activity.evidence.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700"
                >
                  Buka Bukti
                </a>

                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveEvidence(activity.id)
                    }
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={!editable}
            onChange={(event) =>
              onEvidenceChange(activity.id, event)
            }
            className="mt-4 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-bold file:text-white disabled:cursor-not-allowed"
          />
        )}

        {errors[`${activity.id}.evidence`] && (
          <p className="mt-2 text-xs font-medium text-red-600">
            {errors[`${activity.id}.evidence`]}
          </p>
        )}
      </div>
    </article>
  )
}

function PageSectionHeader({
  title,
  description,
  editable,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        {editable ? 'Dapat Diedit' : 'Hanya Baca'}
      </span>
    </div>
  )
}

function InfoBanner({ title, description, type }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning:
      'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  }

  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${styles[type]}`}
    >
      <p className="text-sm font-bold">{title}</p>

      <p className="mt-1 text-sm leading-6">
        {description}
      </p>
    </div>
  )
}

function ActionButtons({
  draftLabel,
  submitLabel,
  onSaveDraft,
  onSubmit,
  submitType = 'submit',
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onSaveDraft}
        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        {draftLabel}
      </button>

      <button
        type={submitType}
        onClick={
          submitType === 'button' ? onSubmit : undefined
        }
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
      >
        {submitLabel}
      </button>
    </div>
  )
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h2 className="font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value || '-'}
      </p>
    </div>
  )
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  error,
  disabled,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 disabled:bg-slate-100 ${
          error
            ? 'border-red-300 focus:ring-red-100'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
        }`}
      />

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function TextAreaField({
  label = 'Deskripsi Aktivitas',
  name,
  value,
  error,
  disabled,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">
        {label}
      </label>

      <textarea
        name={name}
        rows="4"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 disabled:bg-slate-100 ${
          error
            ? 'border-red-300 focus:ring-red-100'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
        }`}
      />

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function StatusBadge({ status, label }) {
  const styles = {
    DRAFT_PENGAJUAN: 'bg-slate-100 text-slate-700',
    MENUNGGU_VERIFIKASI:
      'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN:
      'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI:
      'bg-emerald-50 text-emerald-700',
    DRAFT_USULAN: 'bg-indigo-50 text-indigo-700',
    MENUNGGU_VALIDASI_USULAN:
      'bg-amber-50 text-amber-700',
    PERLU_REVISI_USULAN:
      'bg-red-50 text-red-700',
    USULAN_DISETUJUI:
      'bg-emerald-50 text-emerald-700',
    DRAFT_KLAIM: 'bg-indigo-50 text-indigo-700',
    MENUNGGU_PENILAIAN_MITRA:
      'bg-amber-50 text-amber-700',
    MENUNGGU_REVIEW_DPL:
      'bg-amber-50 text-amber-700',
    PERLU_REVISI_KLAIM:
      'bg-red-50 text-red-700',
    SIAP_FINALISASI:
      'bg-indigo-50 text-indigo-700',
    SELESAI: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
        styles[status] ||
        'bg-slate-100 text-slate-700'
      }`}
    >
      {label}
    </span>
  )
}

export default StudentInternshipDetail