import { formatDateRange } from '../data/internshipStore.js'

function StudentResultTab({ internship }) {
  const result = internship.result

  if (!result?.courses?.length) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Hasil belum tersedia
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Hasil konversi akan tersedia setelah Prodi melakukan finalisasi.
        </p>
      </section>
    )
  }

  function handlePrint() {
    window.print()
  }

  function handleDownloadCsv() {
    const csvRows = [
      ['HASIL KONVERSI NILAI MAGANG'],
      [],
      ['ID Magang', internship.id],
      ['Nama Mahasiswa', internship.studentName],
      ['NIM', internship.studentId],
      ['Program Studi', internship.studyProgram],
      ['Mitra', internship.partnerName],
      ['Posisi', internship.position],
      [
        'Periode',
        formatDateRange(internship.startDate, internship.endDate),
      ],
      [],
      ['Bobot Mitra', `${internship.gradeSettings.partnerWeight}%`],
      ['Bobot DPL', `${internship.gradeSettings.dplWeight}%`],
      [],
      [
        'Kode Mata Kuliah',
        'Mata Kuliah',
        'SKS',
        'Nilai Mitra',
        'Nilai DPL',
        'Nilai Akhir',
        'Nilai Huruf',
      ],
      ...result.courses.map((course) => [
        course.courseCode,
        course.courseName,
        course.credits,
        course.partnerScore,
        course.dplScore,
        course.finalScore,
        course.letterGrade,
      ]),
      [],
      ['Total SKS', result.totalCredits],
      ['Rata-rata Nilai', result.averageScore],
      ['Nilai Huruf', result.letterGrade],
      ['Difinalisasi Oleh', result.finalizedBy],
      ['Waktu Finalisasi', formatDateTime(result.finalizedAt)],
    ]

    const csvContent =
      '\uFEFFsep=;\n' +
      csvRows
        .map((row) => row.map(escapeCsvValue).join(';'))
        .join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const downloadUrl = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')

    downloadLink.href = downloadUrl
    downloadLink.download = `hasil-konversi-${internship.id}.csv`

    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #hasil-konversi-print,
            #hasil-konversi-print * {
              visibility: visible;
            }

            #hasil-konversi-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              padding: 24px;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <section
        id="hasil-konversi-print"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Hasil Konversi Nilai Magang
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {internship.id}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sistem Konversi Magang Berbasis Outcome-Based Education
            </p>
          </div>

          <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            Proses Selesai
          </span>
        </div>

        <section className="mt-7">
          <h3 className="font-bold text-slate-900">
            Identitas Mahasiswa
          </h3>

          <dl className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="mt-8 border-t border-slate-100 pt-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="font-bold text-slate-900">
                Hasil Mata Kuliah
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Nilai akhir telah dikunci oleh Program Studi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                Bobot Mitra {internship.gradeSettings.partnerWeight}%
              </span>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                Bobot DPL {internship.gradeSettings.dplWeight}%
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
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
                {result.courses.map((course) => (
                  <tr
                    key={course.courseCode}
                    className="border-b border-slate-100"
                  >
                    <td className="py-5">
                      <p className="font-bold text-slate-900">
                        {course.courseCode}
                      </p>

                      <p className="mt-1 text-slate-500">
                        {course.courseName}
                      </p>
                    </td>

                    <td className="py-5 font-semibold text-slate-700">
                      {course.credits}
                    </td>

                    <td className="py-5 font-semibold text-slate-700">
                      {course.partnerScore}
                    </td>

                    <td className="py-5 font-semibold text-slate-700">
                      {course.dplScore}
                    </td>

                    <td className="py-5 text-lg font-bold text-indigo-700">
                      {course.finalScore}
                    </td>

                    <td className="py-5">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                        {course.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Konversi"
            value={`${result.totalCredits} SKS`}
          />

          <SummaryCard
            label="Rata-rata Nilai"
            value={result.averageScore}
          />

          <SummaryCard
            label="Nilai Huruf"
            value={result.letterGrade}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-emerald-900">
            Hasil telah difinalisasi
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Difinalisasi oleh {result.finalizedBy} pada{' '}
            {formatDateTime(result.finalizedAt)}.
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Hasil ini merupakan keputusan akhir konversi mata kuliah
            berdasarkan penilaian Mitra dan review akademik DPL.
          </p>
        </section>

        <div className="no-print mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cetak Hasil
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Ekspor CSV
          </button>
        </div>
      </section>
    </>
  )
}

function escapeCsvValue(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return '-'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
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

export default StudentResultTab