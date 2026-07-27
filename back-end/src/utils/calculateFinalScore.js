function getLetterGrade(score) {
  const numericScore = Number(score);
  if (isNaN(numericScore)) return '-';

  if (numericScore >= 80) return 'A';
  if (numericScore >= 70) return 'B';
  if (numericScore >= 60) return 'C';
  if (numericScore >= 50) return 'D';
  return 'E';
}

/**
 * Utility Perhitungan Preview Nilai Akhir OBE.
 * 
 * CATATAN PENTING:
 * - Utility ini HANYA digunakan sebagai pembantu/preview di backend.
 * - Kebenaran final tetap dihitung dan disimpan oleh RPC/database PostgreSQL.
 * - Bobot bersifat dinamis dan ditentukan oleh Kaprodi via database/RPC (default 70 Mitra / 30 DPL).
 */
function calculateFinalScore(
  partnerScore,
  dplScore,
  partnerWeight = 70,
  dplWeight = 30
) {
  const pScore = Number(partnerScore);
  const dScore = Number(dplScore);
  const pWeight = Number(partnerWeight);
  const dWeight = Number(dplWeight);

  // Validasi tipe data numerik
  if (isNaN(pScore) || isNaN(dScore) || isNaN(pWeight) || isNaN(dWeight)) {
    throw new Error('❌ VALIDASI SKOR GAGAL: Seluruh parameter skor dan bobot harus berupa angka numerik.');
  }

  // Validasi rentang 0 - 100
  if (pScore < 0 || pScore > 100) {
    throw new Error(`❌ VALIDASI SKOR GAGAL: partnerScore (${pScore}) harus berada pada rentang 0–100.`);
  }

  if (dScore < 0 || dScore > 100) {
    throw new Error(`❌ VALIDASI SKOR GAGAL: dplScore (${dScore}) harus berada pada rentang 0–100.`);
  }

  if (pWeight < 0 || pWeight > 100) {
    throw new Error(`❌ VALIDASI BOBOT GAGAL: partnerWeight (${pWeight}) harus berada pada rentang 0–100.`);
  }

  if (dWeight < 0 || dWeight > 100) {
    throw new Error(`❌ VALIDASI BOBOT GAGAL: dplWeight (${dWeight}) harus berada pada rentang 0–100.`);
  }

  // Validasi total bobot wajib tepat 100
  const totalWeight = Math.round((pWeight + dWeight) * 100) / 100;
  if (totalWeight !== 100) {
    throw new Error(`❌ VALIDASI BOBOT GAGAL: Jumlah partnerWeight (${pWeight}) dan dplWeight (${dWeight}) wajib tepat 100 (Total saat ini: ${totalWeight}).`);
  }

  // Rumus: (partnerScore × partnerWeight / 100) + (dplScore × dplWeight / 100)
  const finalScore = (pScore * pWeight / 100) + (dScore * dWeight / 100);

  // Dibulatkan maksimal dua angka desimal
  return Math.round(finalScore * 100) / 100;
}

module.exports = {
  getLetterGrade,
  calculateFinalScore,
};
