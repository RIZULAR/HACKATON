import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getCourseByCode } from '../data/conversionMaster.js'
import {
  MITRA_DEMO_TOKEN,
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
} from '../data/internshipStore.js'

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

    setInternship(updatedData)
    setMessage('Penilaian Mitra berhasil dikirim.')
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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Penilaian Mitra Tanpa Login
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Penilaian Kinerja Mahasiswa
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Token terhubung dengan ID Magang {internship.id}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                assessmentSubmitted
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {assessmentSubmitted
                ? 'Penilaian Telah Dikirim'
                : 'Menunggu Penilaian'}
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Informasi Mahasiswa dan Magang
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pastikan identitas berikut sesuai sebelum memberikan nilai.
            </p>
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
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Identitas Penilai
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Isi identitas pembimbing yang memberikan penilaian.
            </p>
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {!assessmentSubmitted && (
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
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

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Kembali ke halaman demo
          </Link>
        </div>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
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
                  className="mt-3 inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-800"
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
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
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
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
          !
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          Kembali ke Halaman Demo
        </Link>
      </div>
    </main>
  )
}

export default PartnerAssessment