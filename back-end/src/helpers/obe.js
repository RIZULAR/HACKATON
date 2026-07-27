/**
 * Helper Perhitungan Nilai & Pemetaan Kurikulum Berbasis Outcome-Based Education (OBE)
 */

function getLetterGrade(score) {
  const numericScore = Number(score);
  if (isNaN(numericScore)) return '-';

  if (numericScore >= 80) return 'A';
  if (numericScore >= 70) return 'B';
  if (numericScore >= 60) return 'C';
  if (numericScore >= 50) return 'D';
  return 'E';
}

function calculateFinalScore(
  partnerScore,
  dplScore,
  partnerWeight = 60,
  dplWeight = 40
) {
  const pScore = Number(partnerScore) || 0;
  const dScore = Number(dplScore) || 0;
  const pWeight = Number(partnerWeight) || 60;
  const dWeight = Number(dplWeight) || 40;

  const totalWeight = pWeight + dWeight;
  if (totalWeight === 0) return 0;

  const result = (pScore * pWeight + dScore * dWeight) / totalWeight;
  return Math.round(result * 10) / 10;
}

function calculateGradeSummary(rows = []) {
  const completedRows = rows.filter(
    (row) => row.finalScore !== null && row.finalScore !== undefined
  );

  if (completedRows.length === 0) {
    return {
      totalCredits: 0,
      averageScore: null,
      letterGrade: '-',
    };
  }

  const totalCredits = completedRows.reduce(
    (total, row) => total + Number(row.credits || 0),
    0
  );

  const weightedTotal = completedRows.reduce(
    (total, row) => total + Number(row.finalScore) * Number(row.credits || 0),
    0
  );

  const averageScore =
    totalCredits > 0
      ? Math.round((weightedTotal / totalCredits) * 10) / 10
      : Math.round(
          (completedRows.reduce(
            (total, row) => total + Number(row.finalScore),
            0
          ) /
            completedRows.length) *
            10
        ) / 10;

  return {
    totalCredits,
    averageScore,
    letterGrade: getLetterGrade(averageScore),
  };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCourseRecommendations(activityDescription, courseCatalog = []) {
  const normalizedActivity = normalizeText(activityDescription);

  if (!normalizedActivity || !Array.isArray(courseCatalog)) {
    return [];
  }

  return courseCatalog
    .map((course) => {
      const keywords = Array.isArray(course.keywords) ? course.keywords : [];
      const matchedKeywords = keywords.filter((keyword) =>
        normalizedActivity.includes(normalizeText(keyword))
      );

      return {
        ...course,
        matchedKeywords,
        score: matchedKeywords.length,
      };
    })
    .filter((course) => course.score > 0)
    .sort((firstCourse, secondCourse) => {
      if (secondCourse.score !== firstCourse.score) {
        return secondCourse.score - firstCourse.score;
      }
      return String(firstCourse.name).localeCompare(String(secondCourse.name));
    });
}

module.exports = {
  getLetterGrade,
  calculateFinalScore,
  calculateGradeSummary,
  normalizeText,
  findCourseRecommendations,
};
