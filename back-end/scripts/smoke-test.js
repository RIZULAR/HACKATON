const { ROLES, ALL_ROLES } = require('../src/constants/roles');
const { INTERNSHIP_STATUS, CONVERSION_STATUS } = require('../src/constants/status');
const {
  getLetterGrade,
  calculateFinalScore,
  calculateGradeSummary,
  findCourseRecommendations,
} = require('../src/helpers/obe');
const { generateAccessToken, generatePublicAssessmentUrl } = require('../src/helpers/token');
const { supabase } = require('../src/lib/supabase');

async function runSmokeTest() {
  console.log('==================================================');
  console.log('🧪 RUNNING BACKEND SMOKE TEST (OBE HACKATHON SYSTEM)');
  console.log('==================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Roles & Constants Test
  assert(ALL_ROLES.length === 5, 'Dukungan 5 Role System (Mahasiswa, DPL, Fakultas, Kaprodi, Mitra)');
  assert(ROLES.MAHASISWA === 'mahasiswa', 'Role Mahasiswa valid');
  assert(ROLES.DPL === 'dpl', 'Role DPL valid');
  assert(ROLES.FAKULTAS === 'fakultas', 'Role Fakultas valid');
  assert(ROLES.KAPRODI === 'kaprodi', 'Role Kaprodi valid');
  assert(ROLES.MITRA === 'mitra', 'Role Mitra valid');

  // 2. Status Constants Test
  assert(INTERNSHIP_STATUS.SUBMITTED === 'submitted', 'Status Internship valid');
  assert(CONVERSION_STATUS.KLAIM_SUBMITTED === 'klaim_submitted', 'Status Klaim Konversi valid');

  // 3. OBE Grade Calculation Test
  assert(getLetterGrade(85) === 'A', 'Grade 85 = A');
  assert(getLetterGrade(75) === 'B', 'Grade 75 = B');
  assert(getLetterGrade(65) === 'C', 'Grade 65 = C');

  const finalScore = calculateFinalScore(90, 80, 60, 40); // (90*0.6) + (80*0.4) = 54 + 32 = 86
  assert(finalScore === 86, 'Kalkulasi nilai bobot 60% Mitra + 40% DPL (90 & 80 = 86)');

  const summary = calculateGradeSummary([
    { finalScore: 85, credits: 3 },
    { finalScore: 75, credits: 3 },
  ]);
  assert(summary.averageScore === 80, 'Rata-rata IPK SKS berbobot valid (80)');
  assert(summary.letterGrade === 'A', 'Predikat rata-rata A');

  // 4. Keyword Matching Test
  const mockCatalog = [
    { code: 'IF601', name: 'RPL', keywords: ['dashboard', 'ui', 'react'] },
    { code: 'IF602', name: 'Web', keywords: ['endpoint', 'express'] },
  ];
  const recs = findCourseRecommendations('Saya membuat UI dashboard dengan React', mockCatalog);
  assert(recs.length > 0 && recs[0].code === 'IF601', 'Pencocokan kata kunci aktivitas ke CPMK/Mata Kuliah valid');

  // 5. Token Generator Test (No-login assessment)
  const token = generateAccessToken('mitra');
  assert(token.startsWith('mitra_'), 'Token generator format valid');

  const publicUrl = generatePublicAssessmentUrl('http://localhost:5173', token, 'mitra');
  assert(publicUrl.includes('/assessment?role=mitra&token=mitra_'), 'Public assessment URL valid');

  // 6. Supabase Connection Test
  console.log('\n🔄 Checking Supabase connection...');
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (!error) {
      console.log('✅ [PASS] Supabase Database Connection & Profile table ready');
    } else {
      console.log(`ℹ️ Supabase merespons (Pesan: ${error.message})`);
    }
  } catch (err) {
    console.warn('⚠️ Supabase test warning:', err.message);
  }

  console.log('\n==================================================');
  console.log(`📊 SMOKE TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================');
}

runSmokeTest();
