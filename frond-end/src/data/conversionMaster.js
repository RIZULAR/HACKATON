import MK_DATA from './mk.json'

export const CONVERSION_MASTER = MK_DATA.map((item) => {
  const nameKeywords = item.nama.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  return {
    code: item.kode,
    name: item.nama,
    credits: item.sks,
    cpmk: item.cpmk.join(' '),
    keywords: [item.kode.toLowerCase(), item.nama.toLowerCase(), ...nameKeywords],
  }
})

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