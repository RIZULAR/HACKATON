import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import {
  MITRA_DEMO_TOKEN,
  formatDateRange,
  getStatusLabel,
  loadInternship,
  saveInternship,
  getAllInternships,
} from '../data/internshipStore.js'
import {
  fetchInternshipFromSupabase,
  saveInternshipToSupabase,
  isSupabaseConfigured,
  sendReviewEmail,
} from '../data/supabaseSync.js'

const DEFAULT_LEARNING_OBJECTIVES = [
  {
    id: 1,
    title: 'Mampu menerapkan soft skills',
    competency:
      'Peserta memahami konsep dan dapat menerapkan Time Scheduling, Critical/Design Thinking, Effective Communication, dan Digital Branding.',
    hours: 20,
    defaultScore: 95,
  },
  {
    id: 2,
    title: 'Memahami pengembangan web',
    competency:
      'Peserta dapat menjelaskan peran HTML, CSS, dan JavaScript dalam pengembangan web.',
    hours: 120,
    defaultScore: 95,
  },
  {
    id: 3,
    title: 'Mampu menggunakan Git dan GitLab',
    competency:
      'Peserta dapat melakukan commit, branch, dan merge dalam Git serta menggunakan GitLab secara efektif.',
    hours: 120,
    defaultScore: 100,
  },
  {
    id: 4,
    title: 'Memahami arsitektur MERN',
    competency:
      'Peserta dapat menjelaskan fungsi masing-masing komponen: MongoDB, Express.js, React.js, dan Node.js.',
    hours: 100,
    defaultScore: 100,
  },
  {
    id: 5,
    title: 'Mampu membuat backend dengan Node.js dan Express.js',
    competency:
      'Peserta dapat mengimplementasikan routing, middleware, dan pengelolaan database dalam aplikasi backend.',
    hours: 120,
    defaultScore: 100,
  },
  {
    id: 6,
    title: 'Mampu membuat UI dinamis dengan React.js',
    competency:
      'Peserta dapat merancang dan mengembangkan antarmuka pengguna menggunakan state, props, dan komponen.',
    hours: 120,
    defaultScore: 100,
  },
  {
    id: 7,
    title: 'Mampu mendesain responsif dan interaktif',
    competency:
      'Peserta dapat menerapkan desain responsif menggunakan CSS dan interaksi pengguna dengan JavaScript.',
    hours: 90,
    defaultScore: 100,
  },
  {
    id: 8,
    title: 'Memahami keamanan web',
    competency:
      'Peserta dapat mengidentifikasi ancaman keamanan dan menerapkan praktik keamanan dasar pada aplikasi web.',
    hours: 90,
    defaultScore: 100,
  },
  {
    id: 9,
    title:
      'Final Project: Mampu mengembangkan aplikasi menggunakan MERN Stack',
    competency:
      'Peserta dapat merancang, mengembangkan, dan mendokumentasikan aplikasi web fungsional berbasis MERN.',
    hours: 120,
    defaultScore: 90,
  },
]

export function calculateGradeFromScore(score) {
  const num = Number(score)
  if (num >= 80) return 'A'
  if (num >= 70) return 'B'
  if (num >= 60) return 'C'
  if (num >= 40) return 'D'
  return 'E'
}

export function calculateWeightedFinalScore(items) {
  let totalHours = 0
  let weightedScore = 0

  items.forEach((item) => {
    const hours = Number(item.hours) || 0
    const score = Number(item.score) || 0
    totalHours += hours
    weightedScore += score * hours
  })

  if (totalHours === 0) return 0
  const result = weightedScore / totalHours
  return Math.round(result * 100) / 100
}

function createInitialLOScores(internship) {
  const existingScores = internship.partnerAssessment?.learningObjectives

  return DEFAULT_LEARNING_OBJECTIVES.map((lo) => {
    const saved = existingScores?.find((item) => item.id === lo.id)
    return {
      id: lo.id,
      title: lo.title,
      competency: lo.competency,
      hours: lo.hours,
      score: saved?.score !== undefined ? saved.score : lo.defaultScore,
    }
  })
}

export default function PartnerAssessment() {
  const { token } = useParams()

  const [internship, setInternship] = useState(() => {
    const all = getAllInternships()
    const found = all.find(
      (item) =>
        item.bimaId === token ||
        item.studentId === token ||
        item.id === token ||
        item.partnerToken === token,
    )
    return found || loadInternship()
  })
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  const [reviewerName, setReviewerName] = useState(
    internship.partnerAssessment?.reviewerName ||
      internship.partnerSupervisor ||
      '',
  )

  const [reviewerPosition, setReviewerPosition] = useState(
    internship.partnerAssessment?.reviewerPosition || 'Pembimbing Lapangan',
  )

  const [loScores, setLoScores] = useState(() =>
    createInitialLOScores(internship),
  )

  const [generalComment, setGeneralComment] = useState(
    internship.partnerAssessment?.generalComment || '',
  )

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchInternshipFromSupabase()
        if (remoteData) {
          setInternship(remoteData)
          saveInternship(remoteData)
          setReviewerName(
            remoteData.partnerAssessment?.reviewerName ||
              remoteData.partnerSupervisor ||
              '',
          )
          setReviewerPosition(
            remoteData.partnerAssessment?.reviewerPosition ||
              'Pembimbing Lapangan',
          )
          setLoScores(createInitialLOScores(remoteData))
          setGeneralComment(remoteData.partnerAssessment?.generalComment || '')
        }
      }
    }
    loadData()
  }, [])

  const tokenValid =
    Boolean(token) &&
    (token === MITRA_DEMO_TOKEN ||
      token === internship.bimaId ||
      token === internship.studentId ||
      token === internship.id ||
      token === internship.partnerToken ||
      Boolean(internship.id))

  const assessmentSubmitted = Boolean(
    internship.partnerAssessment?.submittedAt,
  )

  const assessmentAvailable =
    internship.status === 'MENUNGGU_PENILAIAN_MITRA' || assessmentSubmitted

  const finalScore = useMemo(
    () => calculateWeightedFinalScore(loScores),
    [loScores],
  )
  const finalGrade = useMemo(
    () => calculateGradeFromScore(finalScore),
    [finalScore],
  )

  function handleScoreChange(id, value) {
    setLoScores((prev) =>
      prev.map((item) => (item.id === id ? { ...item, score: value } : item)),
    )
    setErrors((prev) => ({ ...prev, [id]: '' }))
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

    loScores.forEach((item) => {
      const num = Number(item.score)
      if (
        item.score === '' ||
        Number.isNaN(num) ||
        num < 0 ||
        num > 100
      ) {
        nextErrors[item.id] = 'Nilai 0–100.'
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
        token: token || MITRA_DEMO_TOKEN,
        reviewerName: reviewerName.trim(),
        reviewerPosition: reviewerPosition.trim(),
        overallScore: finalScore,
        averageScore: finalScore,
        grade: finalGrade,
        learningObjectives: loScores.map((item) => ({
          ...item,
          score: Number(item.score),
        })),
        scores: loScores.map((item) => ({
          activityId: `lo-${item.id}`,
          title: item.title,
          score: Number(item.score),
          comment: `LO #${item.id} (${item.hours} jam)`,
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
      saveInternshipToSupabase(updatedData).catch((err) =>
        console.error('Supabase sync failed:', err),
      )

      sendReviewEmail({
        type: 'dpl_claim_review',
        recipientEmail: 'dpl.ade@amikom.ac.id',
        recipientName: updatedData.dplName || 'Ade Putranto, M.Kom.',
        studentName: updatedData.studentName || 'Nadia Putri Ramadhani',
        reviewUrl: `${window.location.origin}/dpl/${updatedData.bimaId || updatedData.id || 'DPL_DEMO_TOKEN'}`,
      }).then((res) => {
        if (res && res.previewMode) {
          console.log(
            `%c[EMAIL SIMULATOR] Link Review DPL: ${window.location.origin}/dpl/${updatedData.bimaId || updatedData.id || 'DPL_DEMO_TOKEN'}`,
            'color: #7C3AED; font-weight: bold; font-size: 14px;',
          )
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
    <main className="min-h-screen bg-slate-50 font-sans antialiased pb-12">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20">
              <FileIcon className="h-5 w-5" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F97316]">
                  Penilaian Mitra Industri &middot; Learning Objectives (LO)
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] animate-pulse" />
              </div>

              <h1 className="mt-0.5 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                Form Penilaian Capaian Pembelajaran (LO)
              </h1>

              <p className="mt-0.5 text-sm text-slate-400">
                ID Magang: {internship.bimaId || internship.id} &middot; Mahasiswa:{' '}
                {internship.studentName}
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Informasi Mahasiswa dan Program Magang
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Data identitas resmi mahasiswa magang yang dinilai.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Nama Mahasiswa" value={internship.studentName} />
            <InfoItem label="NIM" value={internship.studentId} />
            <InfoItem label="Program Studi" value={internship.studyProgram} />
            <InfoItem label="Perusahaan / Mitra" value={internship.partnerName} />
            <InfoItem label="Posisi Magang" value={internship.position} />
            <InfoItem
              label="Periode Magang"
              value={formatDateRange(internship.startDate, internship.endDate)}
            />
          </dl>
        </section>

        {/* Live Calculation Score Summary Banner */}
        <section className="mt-6 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Kalkulasi Nilai Akhir Mitra (Weighted Final Score)
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  {finalScore.toFixed(2)}
                </span>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide border ${
                    finalGrade === 'A'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : finalGrade === 'B'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  Grade {finalGrade}
                </span>
              </div>
              <p className="mt-2 text-xs text-purple-200/80">
                Nilai akhir dihitung otomatis berdasarkan bobot jam kerja setiap Learning Objective (LO).
              </p>
            </div>

            {/* Konversi Nilai Table Legend */}
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-xs backdrop-blur-md">
              <p className="font-bold text-purple-200 border-b border-white/10 pb-1.5 mb-2">
                Skema Konversi Nilai:
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-purple-100">
                <div><span className="font-bold text-white">Grade A:</span> 80 – 100</div>
                <div><span className="font-bold text-white">Grade B:</span> 70 – 79</div>
                <div><span className="font-bold text-white">Grade C:</span> 60 – 69</div>
                <div><span className="font-bold text-white">Grade D:</span> 40 – 59</div>
                <div><span className="font-bold text-white">Grade E:</span> &lt; 40</div>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"
        >
          {/* Identity Section */}
          <div className="border-b border-slate-100 pb-6 flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Identitas Supervisor / Penilai Mitra
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Isi nama dan jabatan pembimbing industri yang memberikan penilaian.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              label="Nama Penilai / Supervisor"
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
              label="Jabatan di Perusahaan"
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

          {/* Learning Objectives Table */}
          <div className="mt-9 border-t border-slate-100 pt-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Learning Objectives & Capaian Kompetensi (LO)
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Berikan nilai 0–100 untuk setiap indikator capaian kompetensi peserta magang.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Learning Objective</th>
                    <th className="py-3.5 px-4 min-w-[320px]">Tingkat Kompetensi</th>
                    <th className="py-3.5 px-4 w-20 text-center">Jam</th>
                    <th className="py-3.5 px-4 w-28 text-center">Nilai (0-100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loScores.map((lo, idx) => (
                    <tr
                      key={lo.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-4 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {lo.title}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs leading-relaxed">
                        {lo.competency}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        {lo.hours}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={lo.score}
                          disabled={assessmentSubmitted}
                          onChange={(e) =>
                            handleScoreChange(lo.id, e.target.value)
                          }
                          className={`w-20 rounded-lg border text-center font-bold px-2 py-1.5 text-sm outline-none transition focus:ring-2 ${
                            errors[lo.id]
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-slate-300 focus:border-[#7C3AED] focus:ring-[#F3E8FF]'
                          } disabled:bg-slate-100`}
                        />
                        {errors[lo.id] && (
                          <p className="text-[10px] text-red-500 font-semibold mt-1">
                            {errors[lo.id]}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Comment */}
          <div className="mt-9 border-t border-slate-100 pt-7">
            <label
              htmlFor="generalComment"
              className="text-sm font-semibold text-slate-800"
            >
              Catatan & Komentar Umum Supervisor Mitra
            </label>

            <textarea
              id="generalComment"
              rows="4"
              value={generalComment}
              disabled={assessmentSubmitted}
              onChange={(event) => setGeneralComment(event.target.value)}
              placeholder="Berikan ulasan umum mengenai kinerja, etika, dan apresiasi terhadap peserta magang..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {!assessmentSubmitted && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              <div className="text-sm text-slate-500">
                Nilai Akhir: <strong className="text-slate-900 font-bold">{finalScore.toFixed(2)}</strong> ({finalGrade})
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#7C3AED] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] cursor-pointer shadow-lg shadow-[#7C3AED]/20"
              >
                Simpan & Kirim Penilaian Mitra
              </button>
            </div>
          )}

          {assessmentSubmitted && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-bold text-emerald-900">
                Penilaian Learning Objectives Berhasil Disimpan
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-700">
                Final Score: <strong>{finalScore.toFixed(2)} (Grade {finalGrade})</strong>. Data telah dikunci dan berhasil dikirimkan ke DPL.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

function FormField({ label, value, error, disabled, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800">
        {label} <span className="text-red-500">*</span>
      </label>

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#F3E8FF] disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 font-bold text-slate-900">{value || '-'}</dd>
    </div>
  )
}

function InvalidTokenPage() {
  return (
    <MessagePage
      title="Token penilaian tidak valid"
      description="Gunakan link resmi yang dikirimkan oleh sistem untuk mengisi penilaian."
    />
  )
}

function MessagePage({ title, description }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#7C3AED]/20 transition hover:bg-[#6D28D9]"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  )
}

function FileIcon(props) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function ArrowLeftIcon(props) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  )
}