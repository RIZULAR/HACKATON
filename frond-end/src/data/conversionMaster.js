export const CONVERSION_MASTER = [
  {
    code: 'IF601',
    name: 'Rekayasa Perangkat Lunak',
    credits: 3,
    cpmk:
      'Mampu merancang dan mengembangkan perangkat lunak sesuai kebutuhan pengguna.',
    keywords: [
      'analisis kebutuhan',
      'dashboard',
      'antarmuka',
      'pengembangan aplikasi',
      'perangkat lunak',
      'desain sistem',
      'ui',
      'ux',
    ],
  },
  {
    code: 'IF602',
    name: 'Pemrograman Web Lanjut',
    credits: 3,
    cpmk:
      'Mampu mengimplementasikan aplikasi web yang terintegrasi dengan layanan backend.',
    keywords: [
      'react',
      'rest api',
      'integrasi api',
      'frontend',
      'pengujian web',
      'website',
      'aplikasi web',
      'endpoint',
      'javascript',
    ],
  },
]

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findCourseRecommendations(activityDescription) {
  const normalizedActivity = normalizeText(activityDescription)

  if (!normalizedActivity) {
    return []
  }

  return CONVERSION_MASTER.map((course) => {
    const matchedKeywords = course.keywords.filter((keyword) =>
      normalizedActivity.includes(normalizeText(keyword)),
    )

    return {
      ...course,
      matchedKeywords,
      score: matchedKeywords.length,
    }
  })
    .filter((course) => course.score > 0)
    .sort((firstCourse, secondCourse) => {
      if (secondCourse.score !== firstCourse.score) {
        return secondCourse.score - firstCourse.score
      }

      return firstCourse.name.localeCompare(secondCourse.name)
    })
}

export function getCourseByCode(courseCode) {
  return (
    CONVERSION_MASTER.find((course) => course.code === courseCode) || null
  )
}