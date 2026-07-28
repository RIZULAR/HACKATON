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
  mainDocuments: {
    logbook: null,
    report: null,
    certificate: null,
    supporting: null,
  },
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

  proposalDocument: {
    name: 'Proposal_Magang_Disetujui.pdf',
    size: '1.2 MB',
    url: '#',
    type: 'application/pdf',
    uploadedAt: new Date().toISOString(),
  },
  acceptanceDocument: {
    name: 'Surat_Penerimaan_LoA_Mitra.pdf',
    size: '850 KB',
    url: '#',
    type: 'application/pdf',
    uploadedAt: new Date().toISOString(),
  },

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
  let activeUser = null
  if (typeof window !== 'undefined') {
    try {
      activeUser = JSON.parse(window.localStorage.getItem('active_user_session') || 'null')
    } catch (e) {
      console.error(e)
    }
  }

  return {
    ...EMPTY_INTERNSHIP,
    studentName: activeUser?.full_name || activeUser?.fullName || 'Nadia Putri Ramadhani',
    studentId: activeUser?.nim || '22.11.4321',
    studentEmail: activeUser?.email || 'nadia.demo@mahasiswa.ac.id',
    studyProgram: activeUser?.study_program || activeUser?.studyProgram || 'Informatika',
    semester: activeUser?.semester || '7',
    proposal: getEmptyProposal(),
    claim: getEmptyClaim(),
    partnerAssessment: getEmptyPartnerAssessment(),
    dplReview: getEmptyDplReview(),
    gradeSettings: getEmptyGradeSettings(),
  }
}

export function loadInternship(studentId = null) {
  try {
    let targetNim = studentId
    if (!targetNim && typeof window !== 'undefined') {
      const activeSession = JSON.parse(window.localStorage.getItem('active_user_session') || 'null')
      targetNim = activeSession?.nim
    }

    const userKey = targetNim ? `${STORAGE_KEY}_${targetNim}` : STORAGE_KEY
    let savedData = window.localStorage.getItem(userKey)

    // Fallback to default STORAGE_KEY for demo user
    if (!savedData && (!targetNim || targetNim === '22.11.4321')) {
      savedData = window.localStorage.getItem(STORAGE_KEY)
    }

    if (!savedData) {
      return getEmptyInternship()
    }

    const parsedData = JSON.parse(savedData)

    // If data belongs to a different student and not demo, return fresh empty state
    if (targetNim && parsedData.studentId && parsedData.studentId !== targetNim && targetNim !== '22.11.4321') {
      return getEmptyInternship()
    }

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
        mainDocuments: {
          logbook: null,
          report: null,
          certificate: null,
          supporting: null,
          ...(parsedData.claim?.mainDocuments || {}),
        },
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
    if (!data) return false
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (data.studentId) {
      window.localStorage.setItem(`${STORAGE_KEY}_${data.studentId}`, JSON.stringify(data))
    }

    // Keep master list of all student submissions for Admin Dashboard
    let all = []
    try {
      all = JSON.parse(window.localStorage.getItem('all_internships') || '[]')
    } catch (e) {
      all = []
    }

    if (data.studentId || data.id || data.studentName) {
      const existingIndex = all.findIndex(
        (item) => (data.id && item.id === data.id) || (data.studentId && item.studentId === data.studentId)
      )
      if (existingIndex >= 0) {
        const existing = all[existingIndex]
        // Do not downgrade a submitted application to an empty draft without partnerName
        if (existing.status !== 'DRAFT_PENGAJUAN' && data.status === 'DRAFT_PENGAJUAN' && !data.partnerName) {
          all[existingIndex] = { ...data, ...existing }
        } else {
          all[existingIndex] = { ...existing, ...data }
        }
      } else {
        all.push(data)
      }
      window.localStorage.setItem('all_internships', JSON.stringify(all))
    }
    return true
  } catch (error) {
    console.error('Gagal menyimpan data magang:', error)
    return false
  }
}

export function getAllInternships() {
  try {
    const list = JSON.parse(window.localStorage.getItem('all_internships') || '[]')
    const collectedMap = new Map()

    const mergeItem = (item) => {
      if (!item) return
      const studentId = item.studentId || item.id
      if (!studentId) return

      const existing = collectedMap.get(studentId)
      if (!existing) {
        collectedMap.set(studentId, item)
      } else {
        // Prioritize submitted application over empty draft
        const isExistingSubmitted = existing.status && existing.status !== 'DRAFT_PENGAJUAN'
        const isItemSubmitted = item.status && item.status !== 'DRAFT_PENGAJUAN'

        if (isItemSubmitted && !isExistingSubmitted) {
          collectedMap.set(studentId, item)
        } else if (isItemSubmitted && isExistingSubmitted) {
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
          const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0
          if (itemTime >= existingTime) {
            collectedMap.set(studentId, item)
          }
        } else if (!isExistingSubmitted && !isItemSubmitted) {
          if (item.partnerName && !existing.partnerName) {
            collectedMap.set(studentId, item)
          }
        }
      }
    }

    list.forEach(mergeItem)

    if (typeof window !== 'undefined') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(`${STORAGE_KEY}_`)) {
          try {
            const item = JSON.parse(window.localStorage.getItem(key) || 'null')
            mergeItem(item)
          } catch (e) {
            console.error(e)
          }
        }
      }
    }

    const result = Array.from(collectedMap.values())
    if (result.length > 0) {
      return result
    }

    const single = loadInternship()
    return single && (single.id || single.studentName) ? [single] : []
  } catch (error) {
    console.error(error)
    return []
  }
}

export function generateUniqueInternshipId(studentId = '') {
  try {
    const all = getAllInternships()
    const existingIds = new Set()
    all.forEach((item) => {
      if (item?.id) existingIds.add(item.id)
      if (item?.bimaId) existingIds.add(item.bimaId)
    })

    const nimClean = (studentId || '').replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)
    let candidate = `MAG-2026-${nimClean}`
    let counter = 1

    while (existingIds.has(candidate)) {
      candidate = `MAG-2026-${nimClean}-${counter}`
      counter++
    }

    return candidate
  } catch (error) {
    console.error(error)
    return `MAG-2026-${Date.now().toString().slice(-4)}`
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