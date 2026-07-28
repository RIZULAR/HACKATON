import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { getCourseByCode } from '../data/conversionMaster.js'
import {
  DPL_DEMO_TOKEN,
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

function getClaimedCourseCodes(internship) {
  const courseCodes = internship.claim.activities.flatMap(
    (activity) => activity.selectedCourseCodes || [],
  )

  return [...new Set(courseCodes)]
}

function createInitialScores(internship, courseCodes) {
  return courseCodes.map((courseCode) => {
    const existingScore = internship.dplReview.scores.find(
      (item) => item.courseCode === courseCode,
    )

    return {
      courseCode,
      score: existingScore?.score ?? '',
      comment: existingScore?.comment ?? '',
    }
  })
}

function DplReview() {
  const { token } = useParams()

  const [internship, setInternship] = useState(() => loadInternship())
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  const courseCodes = useMemo(
    () => getClaimedCourseCodes(internship),
    [internship],
  )

  const [reviewerName, setReviewerName] = useState(
    internship.dplReview.reviewerName || internship.dplName || '',
  )

  const [scores, setScores] = useState(() =>
    createInitialScores(internship, courseCodes),
  )

  const [generalComment, setGeneralComment] = useState(
    internship.dplReview.generalComment || '',
  )

  const [revisionNote, setRevisionNote] = useState(
    internship.dplReview.revisionNote || '',
  )

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchInternshipFromSupabase()
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
          setReviewerName(remoteData.dplReview?.reviewerName || remoteData.dplName || '')
          setScores(createInitialScores(remoteData, getClaimedCourseCodes(remoteData)))
          setGeneralComment(remoteData.dplReview?.generalComment || '')
          setRevisionNote(remoteData.dplReview?.revisionNote || '')
        }
      }
    }
    loadData()
  }, [])

  const tokenValid = token === DPL_DEMO_TOKEN

  const isProposalMode =
    internship.status === 'MENUNGGU_VALIDASI_USULAN' ||
    internship.status === 'DRAFT_USULAN' ||
    internship.status === 'PERLU_REVISI_USULAN'

  const partnerSubmitted = Boolean(
    internship.partnerAssessment.submittedAt,
  )

  const reviewSubmitted = Boolean(internship.dplReview.submittedAt)

  const reviewAvailable = isProposalMode || (
    partnerSubmitted &&
    (internship.status === 'MENUNGGU_REVIEW_DPL' ||
      reviewSubmitted ||
      internship.status === 'SIAP_FINALISASI' ||
      internship.status === 'PERLU_REVISI_KLAIM' ||
      internship.status === 'SELESAI')
  )

  function handleScoreChange(courseCode, field, value) {
    setScores((currentScores) =>
      currentScores.map((item) =>
        item.courseCode === courseCode
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )

    setErrors((currentErrors) => ({
      ...currentErrors,
      [`${courseCode}.${field}`]: '',
    }))

    setMessage('')
  }

  function validateReview(requireRevisionNote = false) {
    const nextErrors = {}

    if (!reviewerName.trim()) {
      nextErrors.reviewerName = 'Nama DPL wajib diisi.'
    }

    scores.forEach((item) => {
      const numericScore = Number(item.score)

      if (
        item.score === '' ||
        Number.isNaN(numericScore) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        nextErrors[`${item.courseCode}.score`] =
          'Nilai harus berada pada rentang 0–100.'
      }

      if (!item.comment.trim()) {
        nextErrors[`${item.courseCode}.comment`] =
          'Komentar akademik wajib diisi.'
      }
    })

    if (requireRevisionNote && !revisionNote.trim()) {
      nextErrors.revisionNote =
        'Catatan revisi wajib diisi.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  function getReviewData(decision, submittedAt) {
    return {
      token: DPL_DEMO_TOKEN,
      reviewerName: reviewerName.trim(),
      scores: scores.map((item) => ({
        courseCode: item.courseCode,
        score: Number(item.score),
        comment: item.comment.trim(),
      })),
      generalComment: generalComment.trim(),
      decision,
      revisionNote:
        decision === 'REVISION_REQUESTED'
          ? revisionNote.trim()
          : '',
      submittedAt,
    }
  }

  function handleApprove() {
    if (!validateReview(false)) {
      setMessage('Periksa kembali data review yang belum lengkap.')
      return
    }

    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'SIAP_FINALISASI',
      claim: {
        ...internship.claim,
        revisionNote: '',
      },
      dplReview: getReviewData('APPROVED', currentTime),
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      setMessage('Review DPL gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setErrors({})
    setMessage('Review DPL berhasil dikirim dan klaim disetujui.')
  }

  function handleRequestRevision() {
    if (!validateReview(true)) {
      setMessage('Lengkapi nilai, komentar, dan catatan revisi.')
      return
    }

    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'PERLU_REVISI_KLAIM',
      claim: {
        ...internship.claim,
        revisionNote: revisionNote.trim(),
        updatedAt: currentTime,
      },
      dplReview: getReviewData(
        'REVISION_REQUESTED',
        currentTime,
      ),
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      setMessage('Permintaan revisi klaim gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setErrors({})
    setMessage(
      'Permintaan revisi berhasil dikirim kepada mahasiswa.',
    )
  }


  function handleApproveProposal() {
    const currentTime = new Date().toISOString()
    const updatedData = {
      ...internship,
      status: 'MAGANG_TERVERIFIKASI',
      proposal: {
        ...internship.proposal,
        status: 'approved',
        approvedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      setMessage('Persetujuan usulan gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setMessage('Usulan konversi berhasil disetujui. Mahasiswa dapat memulai program magang.')
  }

  function handleRejectOrRevisionProposal(note) {
    const currentTime = new Date().toISOString()
    const updatedData = {
      ...internship,
      status: 'PERLU_REVISI_USULAN',
      proposal: {
        ...internship.proposal,
        status: 'revision',
        revisionNote: note,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      setMessage('Keputusan revisi gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
    }

    setInternship(updatedData)
    setMessage('Usulan konversi dikembalikan ke mahasiswa untuk revisi.')
  }

  if (!tokenValid) {
    return (
      <MessagePage
        title="Token tidak valid"
        description="Tautan review DPL tidak ditemukan atau tidak berlaku."
      />
    )
  }

  if (!internship.id) {
    return (
      <MessagePage
        title="Data magang tidak ditemukan"
        description="Belum terdapat pengajuan magang yang dapat direview."
      />
    )
  }

  if (!isProposalMode && !partnerSubmitted) {
    return (
      <MessagePage
        title="Review DPL belum tersedia"
        description="DPL dapat melakukan review setelah Mitra selesai memberikan penilaian."
      />
    )
  }


  if (!reviewAvailable) {
    return (
      <MessagePage
        title="Review DPL belum dapat dilakukan"
        description={`Status proses saat ini adalah ${getStatusLabel(
          internship.status,
        )}.`}
      />
    )
  }
  if (isProposalMode) {
    const isProposalSubmitted = internship.proposal?.status === 'approved'
    const isProposalRevision = internship.status === 'PERLU_REVISI_USULAN'

    return (
      <main className="min-h-screen bg-slate-50 font-sans antialiased">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20">
              <FileIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F97316]">
                  Review DPL &middot; Proposal Usulan
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] animate-pulse" />
              </div>
                <h1 className="mt-0.5 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                  Persetujuan Usulan Konversi Magang
                </h1>
                <p className="mt-0.5 text-sm text-slate-400">
                  Mahasiswa: {internship.studentName} ({internship.studentId})
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
          {message && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm font-semibold text-emerald-800">
              {message}
            </div>
          )}

          {/* Student Info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
              Detail Magang & Mitra
            </h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mitra Lapangan</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">{internship.partnerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Posisi Magang</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">{internship.position}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Periode Magang</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">
                  {formatDateRange(internship.startDate, internship.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Dosen DPL</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">{reviewerName}</dd>
              </div>
            </dl>
          </section>

          {/* Proposed Activities Mapping */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">
              Rencana Aktivitas & Rekomendasi SKS
            </h2>
            <div className="space-y-6">
              {internship.proposal?.activities?.map((activity, idx) => (
                <div key={activity.id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900">Aktivitas {idx + 1}</h3>
                    <span className="rounded-full bg-[#F3E8FF] text-[#7C3AED] px-3 py-1 text-xs font-semibold">
                      {activity.estimatedHours} Jam Kerja
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 leading-6">{activity.description}</p>
                  
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Kuliah Konversi:</p>
                    {activity.selectedCourseCodes?.map(code => {
                      const course = getCourseByCode(code)
                      return (
                        <div key={code} className="inline-flex items-center rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 mr-2">
                          {code} - {course?.name} ({course?.credits} SKS)
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DPL Decision Form */}
          {internship.proposal?.status !== 'approved' && internship.status !== 'PERLU_REVISI_USULAN' && internship.status !== 'MAGANG_TERVERIFIKASI' ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">
                Keputusan DPL
              </h2>
              <div>
                <label className="text-sm font-semibold text-slate-800">Umpan Balik / Catatan DPL</label>
                <textarea
                  rows="4"
                  id="proposalComment"
                  placeholder="Masukkan saran perbaikan jika meminta revisi, atau komentar umum..."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF]"
                />
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const note = document.getElementById('proposalComment')?.value || ''
                    if (!note.trim()) {
                      alert('Harap isi catatan revisi terlebih dahulu.')
                      return
                    }
                    handleRejectOrRevisionProposal(note)
                  }}
                  className="rounded-xl border border-orange-300 bg-white px-5 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                >
                  Minta Perbaikan Usulan
                </button>

                <button
                  type="button"
                  onClick={handleApproveProposal}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Setujui Usulan Konversi
                </button>
              </div>
            </section>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 font-bold text-lg">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900">Keputusan Telah Dikirim</h3>
              <p className="mt-2 text-sm text-slate-500">
                Usulan konversi magang ini saat ini berstatus: <strong className="text-slate-700">{getStatusLabel(internship.status)}</strong>.
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20">
              <FileIcon className="h-5 w-5" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F97316]">
                  Review DPL &middot; Tanpa Login
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] animate-pulse" />
              </div>

              <h1 className="mt-0.5 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                Review Akademik Klaim Konversi
              </h1>

              <p className="mt-0.5 text-sm text-slate-400">
                ID Magang: {internship.id} &middot; Mahasiswa: {internship.studentName}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 self-start sm:self-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Kembali
            </Link>

            <span
              className={`w-fit rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                reviewSubmitted
                  ? internship.dplReview.decision === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'bg-red-50 text-red-700 font-bold'
                  : 'bg-amber-50 text-amber-700 font-bold'
              }`}
            >
              {reviewSubmitted
                ? internship.dplReview.decision === 'APPROVED'
                  ? 'Klaim Disetujui'
                  : 'Revisi Diminta'
                : 'Menunggu Review DPL'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
              message.includes('berhasil')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Informasi Mahasiswa dan Magang
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Data pengajuan yang terhubung dengan klaim konversi.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.77-.57-.37-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Penilaian Mitra
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Nilai Mitra digunakan sebagai bahan pertimbangan review akademik.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InfoItem
              label="Nama Penilai"
              value={internship.partnerAssessment.reviewerName}
            />

            <InfoItem
              label="Jabatan"
              value={internship.partnerAssessment.reviewerPosition}
            />
          </div>

          {internship.partnerAssessment.generalComment && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Komentar Umum Mitra
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {internship.partnerAssessment.generalComment}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Identitas DPL
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                DPL melakukan review akademik tanpa membuat akun.
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <label className="text-sm font-semibold text-slate-800">
              Nama DPL
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              type="text"
              value={reviewerName}
              disabled={reviewSubmitted}
              onChange={(event) => {
                setReviewerName(event.target.value)
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  reviewerName: '',
                }))
                setMessage('')
              }}
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                errors.reviewerName
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
              }`}
            />

            {errors.reviewerName && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {errors.reviewerName}
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Review per Mata Kuliah
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Bandingkan usulan, realisasi, bukti, dan nilai Mitra.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {scores.map((item) => {
              const course = getCourseByCode(item.courseCode)

              return (
                <CourseReviewCard
                  key={item.courseCode}
                  course={course}
                  item={item}
                  errors={errors}
                  disabled={reviewSubmitted}
                  claimActivities={internship.claim.activities}
                  partnerAssessment={internship.partnerAssessment}
                  onChange={handleScoreChange}
                />
              )
            })}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-7">
            <label className="text-sm font-semibold text-slate-800">
              Komentar Umum DPL
            </label>

            <textarea
              rows="5"
              value={generalComment}
              disabled={reviewSubmitted}
              onChange={(event) => {
                setGeneralComment(event.target.value)
                setMessage('')
              }}
              placeholder="Berikan kesimpulan akademik terhadap klaim mahasiswa."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {!reviewSubmitted && (
            <>
              <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5">
                <label className="text-sm font-bold text-red-800">
                  Catatan Revisi Klaim
                </label>

                <p className="mt-1 text-xs text-red-700">
                  Wajib diisi apabila DPL memilih Minta Revisi.
                </p>

                <textarea
                  rows="4"
                  value={revisionNote}
                  onChange={(event) => {
                    setRevisionNote(event.target.value)
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      revisionNote: '',
                    }))
                    setMessage('')
                  }}
                  placeholder="Contoh: Tambahkan bukti pengujian untuk aktivitas integrasi API."
                  className={`mt-3 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-4 ${
                    errors.revisionNote
                      ? 'border-red-400 focus:ring-red-100'
                      : 'border-red-200 focus:border-red-500 focus:ring-red-100'
                  }`}
                />

                {errors.revisionNote && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {errors.revisionNote}
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  Minta Revisi Klaim
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Setujui Klaim
                </button>
              </div>
            </>
          )}

          {reviewSubmitted && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-bold text-emerald-900">
                Review DPL telah disimpan
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-700">
                Keputusan:{' '}
                <strong>
                  {internship.dplReview.decision === 'APPROVED'
                    ? 'Klaim disetujui dan siap difinalisasi'
                    : 'Mahasiswa diminta memperbaiki klaim'}
                </strong>
              </p>

              {internship.dplReview.revisionNote && (
                <p className="mt-3 text-sm leading-6 text-emerald-700">
                  Catatan: {internship.dplReview.revisionNote}
                </p>
              )}
            </div>
          )}
        </section>


      </div>
    </main>
  )
}

function CourseReviewCard({
  course,
  item,
  errors,
  disabled,
  claimActivities,
  partnerAssessment,
  onChange,
}) {
  const relatedActivities = claimActivities.filter((activity) =>
    activity.selectedCourseCodes.includes(item.courseCode),
  )

  const partnerScore = partnerAssessment.scores.find(
    (scoreItem) => scoreItem.courseCode === item.courseCode,
  )

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            {course?.code}
          </p>

          <h3 className="mt-1 font-bold text-slate-900">
            {course?.name || item.courseCode}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {course?.cpmk}
          </p>
        </div>

        <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {course?.credits || 0} SKS
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {relatedActivities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-2xl bg-slate-50 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Usulan
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {activity.proposalDescription}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Klaim Realisasi
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              {activity.actualDescription}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Durasi {activity.actualHours} jam
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {activity.achievement}
            </p>

            {activity.differenceExplanation && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Penjelasan Perbedaan
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  {activity.differenceExplanation}
                </p>
              </div>
            )}

            {activity.evidence && (
              <a
                href={activity.evidence.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9]"
              >
                Buka bukti: {activity.evidence.name}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Nilai Mitra
        </p>

        <p className="mt-2 text-2xl font-bold text-blue-900">
          {partnerScore?.score ?? '-'}
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          {partnerScore?.comment || 'Tidak ada komentar.'}
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[180px_1fr]">
        <div>
          <label className="text-sm font-semibold text-slate-800">
            Nilai DPL 0–100
          </label>

          <input
            type="number"
            min="0"
            max="100"
            value={item.score}
            disabled={disabled}
            onChange={(event) =>
              onChange(item.courseCode, 'score', event.target.value)
            }
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 disabled:bg-slate-100 ${
              errors[`${item.courseCode}.score`]
                ? 'border-red-300 focus:ring-red-100'
                : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
            }`}
          />

          {errors[`${item.courseCode}.score`] && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {errors[`${item.courseCode}.score`]}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800">
            Komentar Akademik
          </label>

          <textarea
            rows="4"
            value={item.comment}
            disabled={disabled}
            onChange={(event) =>
              onChange(item.courseCode, 'comment', event.target.value)
            }
            placeholder="Jelaskan kesesuaian capaian dengan CPMK."
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 disabled:bg-slate-100 ${
              errors[`${item.courseCode}.comment`]
                ? 'border-red-300 focus:ring-red-100'
                : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
            }`}
          />

          {errors[`${item.courseCode}.comment`] && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {errors[`${item.courseCode}.comment`]}
            </p>
          )}
        </div>
      </div>
    </article>
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

function MessagePage({ title, description }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 p-6 overflow-hidden">
      {/* Decorative blurred background blobs */}
      <span className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-[#7C3AED]/10 blur-3xl" />
      <span className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-[#F97316]/10 blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-xl shadow-slate-100 backdrop-blur-md">
        {/* Warning Icon wrapper */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-red-200 text-red-500 shadow-sm">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="mt-6 text-xl font-bold text-slate-800 tracking-tight leading-tight">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 font-medium">
          {description}
        </p>


      </div>
    </main>
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



export default DplReview