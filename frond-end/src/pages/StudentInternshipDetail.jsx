import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import StudentResultTab from '../components/StudentResultTab.jsx'
import {
  CONVERSION_MASTER,
  getCourseByCode,
} from '../data/conversionMaster.js'
import {
  formatDateRange,
  getEmptyInternship,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  saveInternshipToSupabase,
  isSupabaseConfigured,
  sendReviewEmail,
  getLoggedInUserProfile,
} from '../data/supabaseSync.js'

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl m-4 text-red-950 font-mono">
          <h2 className="text-lg font-bold">Terjadi Kesalahan UI (React Crash)</h2>
          <p className="mt-2 text-sm">{this.state.error?.toString()}</p>
          <pre className="mt-4 p-4 bg-red-900 text-white rounded-xl text-xs overflow-auto max-h-96">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function StudentInternshipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const initialForm = getInitialForm(id)

  const [form, setForm] = useState(initialForm)
  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(initialForm.status),
  )

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const userProfile = await getLoggedInUserProfile()

        if (id !== 'baru') {
          const remoteData = await fetchInternshipFromSupabase(id)
          if (remoteData) {
            const merged = {
              ...remoteData,
              studentName: userProfile?.full_name || remoteData.studentName,
              studentId: userProfile?.nim || remoteData.studentId,
              studyProgram: userProfile?.study_program || remoteData.studyProgram,
              studentEmail: userProfile?.email || remoteData.studentEmail,
            }
            setForm(merged)
            saveInternship(merged)
            setActiveTab(getInitialTab(merged.status))
          } else {
            // Mock ID or nonexistent remote application, clear cache and prefill user details
            const emptyForm = {
              ...getEmptyInternship(),
              studentName: userProfile?.full_name || 'Nadia Putri Ramadhani',
              studentId: userProfile?.nim || '22.11.4321',
              studyProgram: userProfile?.study_program || 'Informatika',
              studentEmail: userProfile?.email || 'nadia.demo@mahasiswa.ac.id',
            }
            setForm(emptyForm)
            saveInternship(emptyForm)
          }
        } else if (userProfile) {
          setForm((prev) => ({
            ...prev,
            studentName: userProfile.full_name || prev.studentName,
            studentId: userProfile.nim || prev.studentId,
            studyProgram: userProfile.study_program || prev.studyProgram,
            studentEmail: userProfile.email || prev.studentEmail,
          }))
        }
      }
    }
    loadData()
  }, [id])

  const saveAndSync = (updatedData) => {
    const localSaved = saveInternship(updatedData)
    if (localSaved && isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }
    return localSaved
  }

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

  const pageTitle = form.bimaId ? `Magang BIMA: ${form.bimaId}` : 'Pengajuan Magang'

  const statusLabel = form.id
    ? getStatusLabel(form.status)
    : form.updatedAt
      ? 'Draf Tersimpan'
      : 'Belum Dikirim'

  const stageNumber = tabs.indexOf(getInitialTab(form.status)) + 1

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

  async function handleSaveSubmissionDraft() {
    const currentTime = new Date().toISOString()
    const originalId = form.id || ''

    const draftData = {
      ...form,
      id: originalId,
      status: originalId ? form.status : 'DRAFT_PENGAJUAN',
      createdAt: form.createdAt || currentTime,
      updatedAt: currentTime,
    }

    if (isSupabaseConfigured) {
      const res = await saveInternshipToSupabase(draftData)
      if (!res.success) {
        showMessage(`Gagal menyimpan draf ke database Cloud: ${res.error}`)
        return
      }
      draftData.id = res.id
    } else {
      if (!draftData.id) {
        draftData.id = 'MAG-2026-001'
      }
    }

    saveInternship(draftData)
    setForm(draftData)
    setSubmissionErrors({})
    showMessage('Draf pengajuan berhasil disimpan.')

    if (id === 'baru') {
      navigate(`/mahasiswa/magang/${draftData.id}`, { replace: true })
    }
  }

  async function handleSubmitInternship(event) {
    event.preventDefault()

    if (!validateSubmission()) {
      showMessage(
        'Periksa kembali kolom yang masih belum lengkap.',
      )
      return
    }

    const currentTime = new Date().toISOString()
    const originalId = form.id || ''

    const submittedData = {
      ...form,
      id: originalId,
      status: 'MENUNGGU_VERIFIKASI',
      createdAt: form.createdAt || currentTime,
      updatedAt: currentTime,
      submittedAt: currentTime,
    }

    if (isSupabaseConfigured) {
      const res = await saveInternshipToSupabase(submittedData)
      if (!res.success) {
        showMessage(`Pengajuan gagal dikirim ke Cloud Database: ${res.error}`)
        return
      }
      submittedData.id = res.id
    } else {
      if (!submittedData.id) {
        submittedData.id = 'MAG-2026-001'
      }
    }

    saveInternship(submittedData)
    setForm(submittedData)
    setSubmissionErrors({})
    showMessage('Pengajuan berhasil dikirim kepada Prodi.')

    navigate(`/mahasiswa/magang/${submittedData.id}`, {
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
              return {
                ...activity,
                description: value,
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

    // Validate 1 SKS = 45 hours OBE workload rule
    const uniqueCourseCodes = [...new Set(form.proposal.activities.flatMap(a => a.selectedCourseCodes || []))]
    const uniqueCourses = uniqueCourseCodes.map(code => getCourseByCode(code)).filter(Boolean)
    const totalSKS = uniqueCourses.reduce((sum, c) => sum + c.credits, 0)
    const totalHours = form.proposal.activities.reduce((sum, a) => sum + Number(a.estimatedHours || 0), 0)
    const minRequiredHours = totalSKS * 45

    if (totalHours < minRequiredHours) {
      nextErrors.activities = `Total beban kerja (${totalHours} jam) belum mencukupi untuk konversi ${totalSKS} SKS (minimal ${minRequiredHours} jam berdasarkan standar OBE 1 SKS = 45 jam).`
    }

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

    if (!saveAndSync(updatedData)) {
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

    if (!saveAndSync(submittedData)) {
      showMessage('Usulan gagal dikirim kepada Prodi.')
      return
    }

    // Trigger DPL Review Email
    sendReviewEmail({
      type: 'dpl_proposal_review',
      recipientEmail: 'dpl.ade@amikom.ac.id',
      recipientName: form.dplName || 'Ade Putranto, M.Kom.',
      studentName: form.studentName || 'Nadia Putri Ramadhani',
      reviewUrl: `${window.location.origin}/dpl/DPL_DEMO_TOKEN`
    }).then(res => {
      if (res && res.previewMode) {
        console.log(`%c[EMAIL SIMULATOR] Link Review Usulan DPL: ${window.location.origin}/dpl/DPL_DEMO_TOKEN`, "color: #7C3AED; font-weight: bold; font-size: 14px;");
      }
    })

    setForm(submittedData)
    setProposalErrors({})
    showMessage('Usulan berhasil dikirim kepada DPL untuk validasi.')
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

    if (!saveAndSync(updatedData)) {
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

    if (!saveAndSync(submittedData)) {
      showMessage(
        'Klaim gagal dikirim. Periksa ukuran file bukti.',
      )
      return
    }

    // Trigger Partner Assessment Email
    sendReviewEmail({
      type: 'mitra_assessment',
      recipientEmail: 'mitra@demo.com',
      recipientName: form.partnerSupervisor || 'Supervisor Mitra',
      studentName: form.studentName || 'Nadia Putri Ramadhani',
      reviewUrl: `${window.location.origin}/mitra/MITRA_DEMO_TOKEN`
    }).then(res => {
      if (res && res.previewMode) {
        console.log(`%c[EMAIL SIMULATOR] Link Penilaian Supervisor Mitra: ${window.location.origin}/mitra/MITRA_DEMO_TOKEN`, "color: #F97316; font-weight: bold; font-size: 14px;");
      }
    })

    setForm(submittedData)
    setClaimErrors({})
    showMessage(
      'Klaim berhasil dikirim untuk penilaian Mitra.',
    )
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/25">
              <FileIcon className="h-5 w-5" />
            </span>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                Detail Proses Magang
              </p>

              <h1 className="mt-0.5 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
                {pageTitle}
              </h1>

              <p className="mt-0.5 text-sm text-slate-400">
                {form.partnerName
                  ? `${form.partnerName} · ${
                      form.position || 'Posisi belum diisi'
                    }`
                  : 'Lengkapi data pengajuan magang'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1 self-start rounded-full bg-slate-50 p-1.5 sm:self-auto">
            <Link
              to="/mahasiswa"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-[#7C3AED] hover:shadow-sm"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Dashboard
            </Link>

            <span className="hidden h-4 w-px bg-slate-200 sm:block" />

            <span className="hidden rounded-full px-3 py-2 text-xs font-medium text-slate-500 sm:inline-flex">
              Tahap {stageNumber} dari {tabs.length}
            </span>

            <span className="h-4 w-px bg-slate-200" />

            <span className="px-1">
              <StatusBadge
                status={form.status}
                label={statusLabel}
              />
            </span>
          </div>
        </div>

        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#F97316] transition-all duration-500"
            style={{ width: `${(stageNumber / tabs.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="overflow-x-auto rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/50">
          <nav className="flex min-w-max gap-1.5">
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
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-[#7C3AED] shadow-md shadow-slate-200/80 scale-[1.02] border border-slate-100'
                      : accessible
                        ? 'text-slate-600 hover:bg-white/40 hover:text-[#7C3AED]'
                        : 'cursor-not-allowed text-slate-400 opacity-60'
                  }`}
                >
                  {tab}
                  {!accessible && (
                    <LockIcon className="h-3.5 w-3.5 text-slate-400" />
                  )}
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
                  <p className="text-sm font-semibold">
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
                  className="shrink-0 text-lg font-semibold opacity-60 hover:opacity-100"
                  aria-label="Tutup notifikasi"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-10">
          <div className="lg:col-span-7">
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

          <div className="lg:col-span-3">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED] text-white text-[10px]">✓</span>
                Linimasa & Audit Log
              </h3>
              
              <div className="relative border-l border-slate-100 pl-5 ml-2.5 space-y-4">
                <TimelineItem 
                  title="Pengajuan Magang" 
                  date={form.submittedAt ? new Date(form.submittedAt).toLocaleDateString() : '-'} 
                  completed={['MENUNGGU_VERIFIKASI', 'MAGANG_TERVERIFIKASI', 'DRAFT_USULAN', 'MENUNGGU_VALIDASI_USULAN', 'MAGANG_TERJALAN', 'DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'SIAP_FINALISASI', 'SELESAI'].includes(form.status)}
                  active={form.status === 'DRAFT_PENGAJUAN' || form.status === 'MENUNGGU_VERIFIKASI'}
                  description="Identitas dan proposal magang diajukan ke admin prodi."
                />
                <TimelineItem 
                  title="Usulan Konversi" 
                  date={form.proposal?.approvedAt ? new Date(form.proposal.approvedAt).toLocaleDateString() : '-'} 
                  completed={['MAGANG_TERJALAN', 'DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'SIAP_FINALISASI', 'SELESAI'].includes(form.status) || form.proposal?.status === 'approved'}
                  active={form.status === 'DRAFT_USULAN' || form.status === 'MENUNGGU_VALIDASI_USULAN'}
                  description="Pemetaan aktivitas ke mata kuliah disetujui DPL."
                />
                <TimelineItem 
                  title="Magang Berjalan" 
                  date="Aktif" 
                  completed={['DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'SIAP_FINALISASI', 'SELESAI'].includes(form.status)}
                  active={form.status === 'MAGANG_TERVERIFIKASI'}
                  description="Mahasiswa sedang aktif menjalani program magang."
                />
                <TimelineItem 
                  title="Penilaian Mitra" 
                  date={form.partnerAssessment?.submittedAt ? new Date(form.partnerAssessment.submittedAt).toLocaleDateString() : '-'} 
                  completed={['MENUNGGU_REVIEW_DPL', 'SIAP_FINALISASI', 'SELESAI'].includes(form.status)}
                  active={form.status === 'MENUNGGU_PENILAIAN_MITRA'}
                  description="Supervisor Mitra menginput nilai evaluasi magang."
                />
                <TimelineItem 
                  title="Review Akhir DPL" 
                  date={form.dplReview?.submittedAt ? new Date(form.dplReview.submittedAt).toLocaleDateString() : '-'} 
                  completed={['SIAP_FINALISASI', 'SELESAI'].includes(form.status)}
                  active={form.status === 'MENUNGGU_REVIEW_DPL'}
                  description="DPL memberikan penilaian akademik akhir."
                />
                <TimelineItem 
                  title="Finalisasi Nilai" 
                  date={form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '-'} 
                  completed={form.status === 'SELESAI'}
                  active={form.status === 'SIAP_FINALISASI'}
                  description="Nilai akhir OBE dikalkulasi oleh Kaprodi."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    </ErrorBoundary>
  )
}

function TimelineItem({ title, date, completed, active, description }) {
  return (
    <div className="relative">
      <span className={`absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-300 z-10 ${
        completed 
          ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20' 
          : active 
            ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100 animate-pulse' 
            : 'bg-white border-slate-200 text-slate-300'
      }`}>
        {completed ? '✓' : ''}
      </span>
      
      <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
        completed 
          ? 'bg-slate-50/50 border-slate-100' 
          : active 
            ? 'bg-orange-50/30 border-orange-100/50 shadow-sm shadow-orange-50/50' 
            : 'bg-transparent border-transparent'
      }`}>
        <div className="flex justify-between items-center gap-2">
          <h4 className={`text-xs font-bold ${completed ? 'text-slate-800' : active ? 'text-orange-600' : 'text-slate-400'}`}>
            {title}
          </h4>
          <span className="text-[10px] text-slate-400">{date}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-medium">
          {description}
        </p>
      </div>
    </div>
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
  const [step, setStep] = useState(1)
  const [proposalProgress, setProposalProgress] = useState(form.proposalFile ? 100 : 0)
  const [acceptanceProgress, setAcceptanceProgress] = useState(form.acceptanceFile ? 100 : 0)
  const [proposalFileName, setProposalFileName] = useState(form.proposalFile ? 'proposal_magang.pdf' : '')
  const [acceptanceFileName, setAcceptanceFileName] = useState(form.acceptanceFile ? 'bukti_diterima.pdf' : '')

  const handleFileUpload = (type, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'proposal') {
      setProposalFileName(file.name)
      setProposalProgress(0)
      let progress = 0
      const timer = setInterval(() => {
        progress += 20
        setProposalProgress(progress)
        if (progress >= 100) {
          clearInterval(timer)
          // Save to form state (simulated URL/file path)
          onChange({ target: { name: 'proposalFile', value: URL.createObjectURL(file) } })
        }
      }, 200)
    } else {
      setAcceptanceFileName(file.name)
      setAcceptanceProgress(0)
      let progress = 0
      const timer = setInterval(() => {
        progress += 20
        setAcceptanceProgress(progress)
        if (progress >= 100) {
          clearInterval(timer)
          onChange({ target: { name: 'acceptanceFile', value: URL.createObjectURL(file) } })
        }
      }, 200)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!form.partnerName || !form.position || !form.startDate || !form.endDate) {
        alert('Harap lengkapi semua kolom informasi tempat magang sebelum melanjutkan.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!proposalFileName || !acceptanceFileName) {
        alert('Harap unggah berkas proposal magang dan bukti penerimaan magang terlebih dahulu.')
        return
      }
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

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

      {/* Step Indicators */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-400'}`}>
              1
            </span>
            <span className={`text-sm font-semibold ${step === 1 ? 'text-[#7C3AED]' : 'text-slate-500'}`}>Informasi Magang</span>
          </div>
          <div className="h-px flex-1 bg-slate-200 mx-4 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </span>
            <span className={`text-sm font-semibold ${step === 2 ? 'text-[#7C3AED]' : 'text-slate-500'}`}>Unggah Dokumen</span>
          </div>
          <div className="h-px flex-1 bg-slate-200 mx-4 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-400'}`}>
              3
            </span>
            <span className={`text-sm font-semibold ${step === 3 ? 'text-[#7C3AED]' : 'text-slate-500'}`}>Review & Submit</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        {step === 1 && (
          <section className="space-y-8">
            <div>
              <SectionTitle
                title="Identitas Mahasiswa"
                description="Data mahasiswa pengusul magang."
              />
              <div className="mt-5 grid gap-5 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <ReadOnlyField label="Nama Mahasiswa" value={form.studentName} />
                <ReadOnlyField label="NIM" value={form.studentId} />
                <ReadOnlyField label="Program Studi" value={form.studyProgram} />
                <ReadOnlyField label="Semester" value={form.semester} />
                <ReadOnlyField label="Email" value={form.studentEmail} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
              <SectionTitle
                title="Informasi Tempat Magang"
                description="Informasi nama mitra, posisi, dan tanggal mulai/selesai."
              />
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {form.bimaId && (
                  <FormField
                    label="ID Magang BIMA"
                    name="bimaId"
                    value={form.bimaId}
                    disabled={true}
                    onChange={() => {}}
                  />
                )}
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
                <p className="mt-4 text-sm text-slate-400">
                  Periode magang:{' '}
                  <strong className="font-semibold text-slate-700">
                    {formatDateRange(form.startDate, form.endDate)}
                  </strong>
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-8">
              <SectionTitle
                title="Pembimbing & Deskripsi"
                description="Pembimbing Mitra, DPL, serta aktivitas pekerjaan."
              />
              <div className="mt-5 grid gap-5 md:grid-cols-2 mb-5">
                <FormField
                  label="Nama Pembimbing Mitra"
                  name="partnerSupervisor"
                  value={form.partnerSupervisor}
                  error={errors.partnerSupervisor}
                  disabled={!editable}
                  onChange={onChange}
                />
                <FormField
                  label="Nama Dosen DPL"
                  name="dplName"
                  value={form.dplName}
                  error={errors.dplName}
                  disabled={!editable}
                  onChange={onChange}
                />
              </div>
              <TextAreaField
                label="Deskripsi Pekerjaan"
                name="description"
                value={form.description}
                error={errors.description}
                disabled={!editable}
                onChange={onChange}
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <div>
              <SectionTitle
                title="Unggah Dokumen Magang"
                description="Harap unggah proposal magang yang disetujui Kaprodi dan bukti penerimaan magang."
              />

              <div className="mt-6 space-y-6">
                {/* File 1: Proposal Magang */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/30">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Proposal Magang (Tanda Tangan Kaprodi) <span className="text-red-500">*</span>
                  </label>
                  {editable ? (
                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload('proposal', e)}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F3E8FF] file:text-[#7C3AED] file:cursor-pointer hover:file:bg-[#E9D5FF]"
                      />
                      {proposalProgress > 0 && proposalProgress < 100 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-[#7C3AED] h-full" style={{ width: `${proposalProgress}%` }}></div>
                        </div>
                      )}
                      {proposalFileName && (
                        <p className="text-xs text-slate-500">File terpilih: <span className="font-semibold text-slate-700">{proposalFileName}</span></p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 font-semibold">✓ Dokumen Proposal Magang Telah Diunggah</p>
                  )}
                </div>

                {/* File 2: Bukti Diterima */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/30">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Bukti Diterima Magang / Letter of Acceptance (LoA) <span className="text-red-500">*</span>
                  </label>
                  {editable ? (
                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload('acceptance', e)}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F3E8FF] file:text-[#7C3AED] file:cursor-pointer hover:file:bg-[#E9D5FF]"
                      />
                      {acceptanceProgress > 0 && acceptanceProgress < 100 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-[#7C3AED] h-full" style={{ width: `${acceptanceProgress}%` }}></div>
                        </div>
                      )}
                      {acceptanceFileName && (
                        <p className="text-xs text-slate-500">File terpilih: <span className="font-semibold text-slate-700">{acceptanceFileName}</span></p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 font-semibold">✓ Bukti Diterima Magang Telah Diunggah</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <div>
              <SectionTitle
                title="Tinjau & Submit Pengajuan"
                description="Periksa kembali kebenaran data pengajuan magang Anda sebelum dikirim ke Prodi."
              />

              <div className="mt-6 rounded-2xl border border-slate-200 p-6 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mitra Lapangan</h4>
                    <p className="text-sm font-bold text-slate-700 mt-1">{form.partnerName}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Posisi Magang</h4>
                    <p className="text-sm font-bold text-slate-700 mt-1">{form.position}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Periode Magang</h4>
                    <p className="text-sm font-bold text-slate-700 mt-1">{formatDateRange(form.startDate, form.endDate)}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Dosen DPL</h4>
                    <p className="text-sm font-bold text-slate-700 mt-1">{form.dplName}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Berkas Terlampir</h4>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-slate-700">📄 Proposal: <span className="font-semibold">{proposalFileName}</span></p>
                    <p className="text-sm text-slate-700">📄 Bukti Penerimaan: <span className="font-semibold">{acceptanceFileName}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Sebelumnya
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            {editable && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Simpan Draf
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6D28D9] cursor-pointer"
              >
                Selanjutnya
              </button>
            ) : (
              editable && (
                <button
                  type="submit"
                  onClick={onSubmit}
                  className="rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#EA580C] cursor-pointer"
                >
                  Kirim Pengajuan ke Prodi
                </button>
              )
            )}
          </div>
        </div>
      </div>
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
  const uniqueCourseCodes = [...new Set(form.proposal.activities.flatMap(a => a.selectedCourseCodes || []))]
  const uniqueCourses = uniqueCourseCodes.map(code => getCourseByCode(code)).filter(Boolean)
  const totalSKS = uniqueCourses.reduce((sum, c) => sum + c.credits, 0)
  const totalHours = form.proposal.activities.reduce((sum, a) => sum + Number(a.estimatedHours || 0), 0)
  const minRequiredHours = totalSKS * 45
  const isValidWorkload = totalHours >= minRequiredHours

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
      <PageSectionHeader
        title="Usulan Konversi"
        description="Masukkan deskripsi aktivitas magang dan pilih rekomendasi mata kuliah konversi."
        editable={editable}
      />

      {/* SKS & Workload Summary Grid for OBE Conversion Validation */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SKS Terusul</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalSKS} SKS</p>
          <p className="mt-1 text-xs text-slate-500">Maksimum 20 SKS MBKM</p>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Beban Kerja</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalHours} Jam</p>
          <p className="mt-1 text-xs text-slate-500">Estimasi dari aktivitas</p>
        </div>

        <div className={`rounded-2xl border p-5 ${isValidWorkload ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50/70 border-orange-200'}`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Kelayakan OBE</p>
          <p className={`mt-2 text-base font-bold ${isValidWorkload ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isValidWorkload ? '✅ Beban Kerja Cukup' : '⚠️ Beban Kerja Kurang'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Butuh minimal {minRequiredHours} jam ({totalSKS} SKS × 45 jam)
          </p>
        </div>
      </div>

      <InfoBanner
        title="Pemilihan Mata Kuliah Konversi"
        description="Pilihlah mata kuliah konversi yang relevan dengan aktivitas Anda. Prodi tetap melakukan validasi akhir terhadap usulan ini."
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
          className="mt-6 rounded-xl border border-[#E9D5FF] px-5 py-3 text-sm font-medium text-[#7C3AED] transition hover:bg-[#F3E8FF]"
        >
          + Tambah Aktivitas
        </button>
      )}

      <div className="mt-8 border-t border-slate-100 pt-7">
        <label className="text-sm font-medium text-slate-700">
          Catatan Umum Usulan
        </label>

        <textarea
          rows="4"
          value={form.proposal.generalNote}
          disabled={!editable}
          onChange={onNoteChange}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:bg-slate-100"
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
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
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
        <label className="text-sm font-medium text-slate-700">
          Catatan Umum Klaim
        </label>

        <textarea
          rows="4"
          value={form.claim.generalNote}
          disabled={!editable}
          onChange={onNoteChange}
          placeholder="Tambahkan informasi umum tentang realisasi kegiatan."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:bg-slate-100"
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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex justify-between gap-4">
        <h3 className="font-semibold text-slate-900">
          Aktivitas {number}
        </h3>

        {editable && (
          <button
            type="button"
            onClick={() => onRemove(activity.id)}
            className="text-sm font-medium text-red-500 hover:text-red-700"
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
        <p className="text-sm font-semibold text-slate-900">
          Rekomendasi CPMK dan Mata Kuliah
        </p>
        
        {errors[`${activity.id}.selectedCourseCodes`] && (
          <p className="mt-1 text-sm text-red-500 font-medium">
            {errors[`${activity.id}.selectedCourseCodes`]}
          </p>
        )}

        {editable && (
          <div className="mt-3 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] cursor-pointer"
            >
              <span className="truncate text-slate-400 font-normal">Pilih Mata Kuliah Konversi...</span>
              <svg
                className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
                {CONVERSION_MASTER.map((course) => {
                  const isSelected = activity.selectedCourseCodes.includes(course.code);
                  return (
                    <button
                      key={course.code}
                      type="button"
                      disabled={isSelected}
                      onClick={() => {
                        onToggleCourse(activity.id, course.code);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#7C3AED] cursor-pointer'
                      }`}
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300">
                        {isSelected && (
                          <svg
                            className="h-3.5 w-3.5 text-[#7C3AED]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {course.code} · {course.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {course.cpmk}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {course.credits} SKS
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {activity.selectedCourseCodes.length > 0 ? (
            activity.selectedCourseCodes.map((courseCode) => {
              const course = getCourseByCode(courseCode)
              if (!course) return null

              return (
                <div
                  key={course.code}
                  className="block rounded-2xl border border-[#7C3AED] bg-[#F3E8FF] p-5 transition"
                >
                  <div className="flex gap-4 items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {course.code} · {course.name} ·{' '}
                        {course.credits} SKS
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {course.cpmk}
                      </p>
                    </div>

                    {editable && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCourse(
                            activity.id,
                            course.code,
                          )
                        }
                        className="text-sm font-semibold text-red-500 hover:text-red-700 focus:outline-none cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-slate-500 italic">
              Belum ada mata kuliah konversi yang dipilih. {editable ? 'Silakan pilih dari dropdown di atas.' : ''}
            </p>
          )}
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
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Klaim Aktivitas {number}
          </p>

          <h3 className="mt-2 font-semibold text-slate-900">
            {activity.proposalDescription}
          </h3>
        </div>

        <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Rencana {activity.estimatedHours} jam
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
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
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700"
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
        <p className="text-sm font-semibold text-slate-900">
          Bukti Aktivitas
        </p>

        <p className="mt-1 text-xs text-slate-400">
          PDF, JPG, atau PNG. Maksimal 1 MB untuk demo
          lokal.
        </p>

        {activity.evidence ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-emerald-900">
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
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-700"
                >
                  Buka Bukti
                </a>

                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveEvidence(activity.id)
                    }
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
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
            className="mt-4 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#7C3AED] file:px-4 file:py-2 file:font-medium file:text-white disabled:cursor-not-allowed"
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
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>

      <span className="w-fit rounded-full bg-[#F3E8FF] px-3 py-1.5 text-xs font-medium text-[#7C3AED]">
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
      <p className="text-sm font-semibold">{title}</p>

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
        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        {draftLabel}
      </button>

      <button
        type={submitType}
        onClick={
          submitType === 'button' ? onSubmit : undefined
        }
        className="rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
      >
        {submitLabel}
      </button>
    </div>
  )
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        {description}
      </p>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
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
      <label className="text-sm font-medium text-slate-700">
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
            : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
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
      <label className="text-sm font-medium text-slate-700">
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
            : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
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
    DRAFT_PENGAJUAN: 'bg-slate-100 text-slate-600',
    MENUNGGU_VERIFIKASI:
      'bg-amber-50 text-amber-700',
    PERLU_PERBAIKAN_PENGAJUAN:
      'bg-red-50 text-red-700',
    MAGANG_TERVERIFIKASI:
      'bg-emerald-50 text-emerald-700',
    DRAFT_USULAN: 'bg-[#F3E8FF] text-[#6D28D9]',
    MENUNGGU_VALIDASI_USULAN:
      'bg-amber-50 text-amber-700',
    PERLU_REVISI_USULAN:
      'bg-red-50 text-red-700',
    USULAN_DISETUJUI:
      'bg-emerald-50 text-emerald-700',
    DRAFT_KLAIM: 'bg-[#F3E8FF] text-[#6D28D9]',
    MENUNGGU_PENILAIAN_MITRA:
      'bg-amber-50 text-amber-700',
    MENUNGGU_REVIEW_DPL:
      'bg-amber-50 text-amber-700',
    PERLU_REVISI_KLAIM:
      'bg-red-50 text-red-700',
    SIAP_FINALISASI:
      'bg-[#F3E8FF] text-[#6D28D9]',
    SELESAI: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
        styles[status] ||
        'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  )
}

function FileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 12.5h5M9.5 15.5h5M9.5 9.5h2" strokeLinecap="round" strokeLinejoin="round" />
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

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default StudentInternshipDetail