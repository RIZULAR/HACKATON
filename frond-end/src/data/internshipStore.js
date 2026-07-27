export const STORAGE_KEY = 'konversi-magang-internship'

export const MITRA_DEMO_TOKEN = 'demo-mitra-001'
export const DPL_DEMO_TOKEN = 'demo-dpl-001'

export const STATUS_LABELS = {
  DRAFT_PENGAJUAN: 'Draf Pengajuan',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi Prodi',
  PERLU_PERBAIKAN_PENGAJUAN: 'Perlu Perbaikan Pengajuan',
  PENGAJUAN_DITOLAK: 'Pengajuan Ditolak',
  MAGANG_TERVERIFIKASI: 'Pengajuan Terverifikasi',

  DRAFT_USULAN: 'Draf Usulan Konversi',
  MENUNGGU_VALIDASI_USULAN: 'Menunggu Validasi Usulan',
  PERLU_REVISI_USULAN: 'Perlu Revisi Usulan',
  USULAN_DISETUJUI: 'Usulan Disetujui',

  DRAFT_KLAIM: 'Draf Klaim Konversi',
  MENUNGGU_PENILAIAN_MITRA: 'Menunggu Penilaian Mitra',
  MENUNGGU_REVIEW_DPL: 'Menunggu Review DPL',
  PERLU_REVISI_KLAIM: 'Perlu Revisi Klaim',
  SIAP_FINALISASI: 'Siap Difinalisasi',
  SELESAI: 'Proses Selesai',
}

const EMPTY_PROPOSAL = {
  activities: [],
  generalNote: '',
  revisionNote: '',
  createdAt: '',
  updatedAt: '',
  submittedAt: '',
  approvedAt: '',
}

const EMPTY_CLAIM = {
  activities: [],
  generalNote: '',
  revisionNote: '',
  createdAt: '',
  updatedAt: '',
  submittedAt: '',
}

const EMPTY_PARTNER_ASSESSMENT = {
  token: MITRA_DEMO_TOKEN,
  reviewerName: '',
  reviewerPosition: '',
  scores: [],
  generalComment: '',
  submittedAt: '',
}

const EMPTY_DPL_REVIEW = {
  token: DPL_DEMO_TOKEN,
  reviewerName: '',
  scores: [],
  generalComment: '',
  decision: '',
  revisionNote: '',
  submittedAt: '',
}

const EMPTY_GRADE_SETTINGS = {
  partnerWeight: 60,
  dplWeight: 40,
}

const EMPTY_INTERNSHIP = {
  id: '',
  status: 'DRAFT_PENGAJUAN',

  studentName: 'Nadia Putri Ramadhani',
  studentId: '22.11.4321',
  studyProgram: 'Informatika',
  semester: '7',
  studentEmail: 'nadia.demo@mahasiswa.ac.id',

  partnerName: '',
  position: '',
  startDate: '',
  endDate: '',
  partnerSupervisor: '',
  dplName: '',
  description: '',

  revisionNote: '',
  proposal: EMPTY_PROPOSAL,
  claim: EMPTY_CLAIM,
  partnerAssessment: EMPTY_PARTNER_ASSESSMENT,
  dplReview: EMPTY_DPL_REVIEW,
  gradeSettings: EMPTY_GRADE_SETTINGS,

  createdAt: '',
  updatedAt: '',
  submittedAt: '',
}

export function getEmptyProposal() {
  return {
    ...EMPTY_PROPOSAL,
    activities: [],
  }
}

export function getEmptyClaim() {
  return {
    ...EMPTY_CLAIM,
    activities: [],
  }
}

export function getEmptyPartnerAssessment() {
  return {
    ...EMPTY_PARTNER_ASSESSMENT,
    scores: [],
  }
}

export function getEmptyDplReview() {
  return {
    ...EMPTY_DPL_REVIEW,
    scores: [],
  }
}

export function getEmptyGradeSettings() {
  return { ...EMPTY_GRADE_SETTINGS }
}

export function getEmptyInternship() {
  return {
    ...EMPTY_INTERNSHIP,
    proposal: getEmptyProposal(),
    claim: getEmptyClaim(),
    partnerAssessment: getEmptyPartnerAssessment(),
    dplReview: getEmptyDplReview(),
    gradeSettings: getEmptyGradeSettings(),
  }
}

export function loadInternship() {
  try {
    const savedData = window.localStorage.getItem(STORAGE_KEY)

    if (!savedData) {
      return getEmptyInternship()
    }

    const parsedData = JSON.parse(savedData)

    return {
      ...getEmptyInternship(),
      ...parsedData,

      proposal: {
        ...getEmptyProposal(),
        ...(parsedData.proposal || {}),
        activities: Array.isArray(parsedData.proposal?.activities)
          ? parsedData.proposal.activities
          : [],
      },

      claim: {
        ...getEmptyClaim(),
        ...(parsedData.claim || {}),
        activities: Array.isArray(parsedData.claim?.activities)
          ? parsedData.claim.activities
          : [],
      },

      partnerAssessment: {
        ...getEmptyPartnerAssessment(),
        ...(parsedData.partnerAssessment || {}),
        scores: Array.isArray(parsedData.partnerAssessment?.scores)
          ? parsedData.partnerAssessment.scores
          : [],
      },

      dplReview: {
        ...getEmptyDplReview(),
        ...(parsedData.dplReview || {}),
        scores: Array.isArray(parsedData.dplReview?.scores)
          ? parsedData.dplReview.scores
          : [],
      },

      gradeSettings: {
        ...getEmptyGradeSettings(),
        ...(parsedData.gradeSettings || {}),
      },
    }
  } catch (error) {
    console.error('Gagal membaca data magang:', error)
    return getEmptyInternship()
  }
}

export function saveInternship(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Gagal menyimpan data magang:', error)
    return false
  }
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || 'Status Tidak Diketahui'
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return '-'
  }

  const date = new Date(`${dateValue}T00:00:00`)

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return 'Belum ditentukan'
  }

  return `${formatDate(startDate)}–${formatDate(endDate)}`
}