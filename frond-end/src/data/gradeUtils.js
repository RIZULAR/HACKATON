import { getCourseByCode } from './conversionMaster.js'

export function getLetterGrade(score) {
  const numericScore = Number(score)

  if (numericScore >= 80) return 'A'
  if (numericScore >= 70) return 'B'
  if (numericScore >= 60) return 'C'
  if (numericScore >= 50) return 'D'

  return 'E'
}

export function calculateFinalScore(
  partnerScore,
  dplScore,
  partnerWeight,
  dplWeight,
) {
  const result =
    (Number(partnerScore) * Number(partnerWeight)) / 100 +
    (Number(dplScore) * Number(dplWeight)) / 100

  return Math.round(result * 10) / 10
}

export function getClaimedCourseCodes(internship) {
  const courseCodes =
    internship.claim?.activities?.flatMap(
      (activity) => activity.selectedCourseCodes || [],
    ) || []

  return [...new Set(courseCodes)]
}

export function buildGradeRows(
  internship,
  partnerWeight,
  dplWeight,
) {
  const courseCodes = getClaimedCourseCodes(internship)

  return courseCodes.map((courseCode) => {
    const course = getCourseByCode(courseCode)

    const partnerAssessment =
      internship.partnerAssessment?.scores?.find(
        (item) => item.courseCode === courseCode,
      )

    const dplAssessment = internship.dplReview?.scores?.find(
      (item) => item.courseCode === courseCode,
    )

    const partnerScore = partnerAssessment?.score
    const dplScore = dplAssessment?.score

    const scoresAvailable =
      partnerScore !== undefined &&
      partnerScore !== '' &&
      dplScore !== undefined &&
      dplScore !== ''

    const finalScore = scoresAvailable
      ? calculateFinalScore(
          partnerScore,
          dplScore,
          partnerWeight,
          dplWeight,
        )
      : null

    return {
      courseCode,
      courseName: course?.name || courseCode,
      credits: course?.credits || 0,
      cpmk: course?.cpmk || '',
      partnerScore:
        partnerScore === undefined ? null : Number(partnerScore),
      dplScore: dplScore === undefined ? null : Number(dplScore),
      partnerComment: partnerAssessment?.comment || '',
      dplComment: dplAssessment?.comment || '',
      finalScore,
      letterGrade:
        finalScore === null ? '-' : getLetterGrade(finalScore),
    }
  })
}

export function calculateGradeSummary(rows) {
  const completedRows = rows.filter(
    (row) => row.finalScore !== null,
  )

  if (completedRows.length === 0) {
    return {
      totalCredits: 0,
      averageScore: null,
      letterGrade: '-',
    }
  }

  const totalCredits = completedRows.reduce(
    (total, row) => total + Number(row.credits || 0),
    0,
  )

  const weightedTotal = completedRows.reduce(
    (total, row) =>
      total + row.finalScore * Number(row.credits || 0),
    0,
  )

  const averageScore =
    totalCredits > 0
      ? Math.round((weightedTotal / totalCredits) * 10) / 10
      : Math.round(
          (completedRows.reduce(
            (total, row) => total + row.finalScore,
            0,
          ) /
            completedRows.length) *
            10,
        ) / 10

  return {
    totalCredits,
    averageScore,
    letterGrade: getLetterGrade(averageScore),
  }
}