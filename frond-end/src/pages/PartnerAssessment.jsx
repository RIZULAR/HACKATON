import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { getCourseByCode } from '../data/conversionMaster.js'
import {
  MITRA_DEMO_TOKEN,
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  saveInternshipToSupabase,
  isSupabaseConfigured,
  sendReviewEmail,
} from '../data/supabaseSync.js'

function getClaimedCourseCodes(internship) {
  const courseCodes = internship.claim.activities.flatMap(
    (activity) => activity.selectedCourseCodes || [],
  )

  return [...new Set(courseCodes)]
}

function createInitialScores(internship, courseCodes) {
  return courseCodes.map((courseCode) => {
    const existingScore = internship.partnerAssessment.scores.find(
      (item) => item.courseCode === courseCode,
    )

    return {
      courseCode,
      score: existingScore?.score ?? '',
      comment: existingScore?.comment ?? '',
    }
  })
}

function PartnerAssessment() {
  const { token } = useParams()

  const [internship, setInternship] = useState(() => loadInternship())
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  const courseCodes = useMemo(
    () => getClaimedCourseCodes(internship),
    [internship],
  )

  const [reviewerName, setReviewerName] = useState(
    internship.partnerAssessment.reviewerName ||
      internship.partnerSupervisor ||
      '',
  )

  const [reviewerPosition, setReviewerPosition] = useState(
    internship.partnerAssessment.reviewerPosition ||
      'Pembimbing Lapangan',
  )

  const [scores, setScores] = useState(() =>
    createInitialScores(internship, courseCodes),
  )

  const [generalComment, setGeneralComment] = useState(
    internship.partnerAssessment.generalComment || '',
  )

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchInternshipFromSupabase()
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
          setReviewerName(remoteData.partnerAssessment?.reviewerName || remoteData.partnerSupervisor || '')
          setReviewerPosition(remoteData.partnerAssessment?.reviewerPosition || 'Pembimbing Lapangan')
          setScores(createInitialScores(remoteData, getClaimedCourseCodes(remoteData)))
          setGeneralComment(remoteData.partnerAssessment?.generalComment || '')
        }
      }
    }
    loadData()
  }, [])

  const tokenValid = token === MITRA_DEMO_TOKEN
  const assessmentSubmitted = Boolean(
    internship.partnerAssessment.submittedAt,
  )

  const assessmentAvailable =
    internship.status === 'MENUNGGU_PENILAIAN_MITRA' ||
    assessmentSubmitted

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

  function validateAssessment() {
    const nextErrors = {}

    if (!reviewerName.trim()) {
      nextErrors.reviewerName = 'Nama penilai wajib diisi.'
    }

    if (!reviewerPosition.trim()) {
      nextErrors.reviewerPosition = 'Jabatan penilai wajib diisi.'
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
          'Komentar penilaian wajib diisi.'
      }
    })

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!validateAssessment()) {
      setMessage('Periksa kembali data penilaian yang belum lengkap.')
      return
    }

    const currentTime = new Date().toISOString()

    const updatedData = {
      ...internship,
      status: 'MENUNGGU_REVIEW_DPL',
      partnerAssessment: {
        token: MITRA_DEMO_TOKEN,
        reviewerName: reviewerName.trim(),
        reviewerPosition: reviewerPosition.trim(),
        scores: scores.map((item) => ({
          ...item,
          score: Number(item.score),
          comment: item.comment.trim(),
        })),
        generalComment: generalComment.trim(),
        submittedAt: currentTime,
      },
      updatedAt: currentTime,
    }

    if (!saveInternship(updatedData)) {
      setMessage('Penilaian Mitra gagal disimpan.')
      return
    }

    if (isSupabaseConfigured) {
      saveInternshipToSupabase(updatedData).catch(err => console.error("Supabase sync failed:", err))
      // Trigger DPL review email automatically since Mitra has finished!
      sendReviewEmail({
        type: 'dpl_claim_review',
        recipientEmail: 'dpl.ade@amikom.ac.id',
        recipientName: updatedData.dplName || 'Ade Putranto, M.Kom.',
        studentName: updatedData.studentName || 'Nadia Putri Ramadhani',
        reviewUrl: `${window.location.origin}/dpl/DPL_DEMO_TOKEN`
      }).then(res => {
        if (res && res.previewMode) {
          console.log(`%c[EMAIL SIMULATOR] Link Review Klaim Akhir DPL: ${window.location.origin}/dpl/DPL_DEMO_TOKEN`, "color: #7C3AED; font-weight: bold; font-size: 14px;");
        }
      })
    }

    setInternship(updatedData)
    setMessage('Penilaian Mitra berhasil dikirim dan DPL telah dinotifikasi.')
  }

  if (!tokenValid) {
    return <InvalidTokenPage />
  }

  if (!internship.id) {
    return (
      <MessagePage
        title="Data magang tidak ditemukan"
        description="Belum terdapat pengajuan magang yang dapat dinilai."
      />
    )
  }

  if (!assessmentAvailable) {
    return (
      <MessagePage
        title="Penilaian belum tersedia"
        description={`Status proses saat ini adalah ${getStatusLabel(
          internship.status,
        )}. Penilaian Mitra baru dapat dilakukan setelah mahasiswa mengirim klaim.`}
      />
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
                  Penilaian Mitra &middot; Tanpa Login
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] animate-pulse" />
              </div>

              <h1 className="mt-0.5 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                Penilaian Kinerja Mahasiswa
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
                assessmentSubmitted
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'bg-amber-50 text-amber-700 font-bold animate-pulse'
              }`}
            >
              {assessmentSubmitted ? 'Penilaian Dikirim' : 'Menunggu Penilaian'}
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
                Pastikan identitas berikut sesuai sebelum memberikan nilai.
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

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
        >
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Identitas Penilai
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Isi identitas pembimbing yang memberikan penilaian.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              label="Nama Penilai"
              value={reviewerName}
              error={errors.reviewerName}
              disabled={assessmentSubmitted}
              onChange={(event) => {
                setReviewerName(event.target.value)
                setErrors((current) => ({
                  ...current,
                  reviewerName: '',
                }))
              }}
            />

            <FormField
              label="Jabatan"
              value={reviewerPosition}
              error={errors.reviewerPosition}
              disabled={assessmentSubmitted}
              onChange={(event) => {
                setReviewerPosition(event.target.value)
                setErrors((current) => ({
                  ...current,
                  reviewerPosition: '',
                }))
              }}
            />
          </div>

          <div className="mt-9 border-t border-slate-100 pt-7">
            <h2 className="text-lg font-bold text-slate-900">
              Nilai per Mata Kuliah
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Berikan nilai 0–100 berdasarkan performa mahasiswa selama
              magang.
            </p>

            <div className="mt-6 space-y-6">
              {scores.map((item) => {
                const course = getCourseByCode(item.courseCode)

                return (
                  <CourseAssessmentCard
                    key={item.courseCode}
                    course={course}
                    item={item}
                    errors={errors}
                    disabled={assessmentSubmitted}
                    claimActivities={internship.claim.activities}
                    onChange={handleScoreChange}
                  />
                )
              })}
            </div>
          </div>

          <div className="mt-9 border-t border-slate-100 pt-7">
            <label
              htmlFor="generalComment"
              className="text-sm font-semibold text-slate-800"
            >
              Komentar Umum
            </label>

            <textarea
              id="generalComment"
              rows="5"
              value={generalComment}
              disabled={assessmentSubmitted}
              onChange={(event) => setGeneralComment(event.target.value)}
              placeholder="Berikan komentar umum mengenai kinerja mahasiswa."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {!assessmentSubmitted && (
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                className="rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] cursor-pointer"
              >
                Kirim Penilaian Mitra
              </button>
            </div>
          )}

          {assessmentSubmitted && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-bold text-emerald-900">
                Penilaian berhasil disimpan
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-700">
                Data telah dikunci dan proses dilanjutkan ke review DPL.
              </p>
            </div>
          )}
        </form>


      </div>
    </main>
  )
}

function CourseAssessmentCard({
  course,
  item,
  errors,
  disabled,
  claimActivities,
  onChange,
}) {
  const relatedActivities = claimActivities.filter((activity) =>
    activity.selectedCourseCodes.includes(item.courseCode),
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

      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Realisasi yang Diklaim
        </p>

        <div className="mt-3 space-y-4">
          {relatedActivities.map((activity) => (
            <div key={activity.id}>
              <p className="text-sm font-semibold text-slate-900">
                {activity.actualDescription}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Durasi {activity.actualHours} jam
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activity.achievement}
              </p>

              {activity.evidence && (
                <a
                  href={activity.evidence.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Buka bukti: {activity.evidence.name}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[180px_1fr]">
        <div>
          <label className="text-sm font-semibold text-slate-800">
            Nilai 0–100
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
            Komentar
          </label>

          <textarea
            rows="4"
            value={item.comment}
            disabled={disabled}
            onChange={(event) =>
              onChange(item.courseCode, 'comment', event.target.value)
            }
            placeholder="Jelaskan dasar pemberian nilai."
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

function FormField({ label, value, error, disabled, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <input
        type="text"
        value={value}
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

function InvalidTokenPage() {
  return (
    <MessagePage
      title="Token tidak valid"
      description="Tautan penilaian tidak ditemukan atau sudah tidak berlaku."
    />
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



export default PartnerAssessment