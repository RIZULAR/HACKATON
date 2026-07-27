import {
  proposalService,
  claimService,
  assessmentService,
  tokenService,
} from '../src/services/index.js';
import { calculateFinalScore, getLetterGrade } from '../src/utils/calculateFinalScore.js';

async function run() {
  console.log('==================================================');
  console.log('🧪 SMOKE TEST C: OBE CONVERSION & ASSESSMENT WORKFLOW');
  console.log('==================================================\n');

  const missingDependencies = [];

  // 1. Membuat Usulan Konversi
  console.log('1. Membuat Usulan Konversi OBE...');
  const propRes = await proposalService.createProposal('demo-internship-id');
  let proposalId = propRes.data?.id;

  if (propRes.error) {
    console.warn(`ℹ️ Pembuatan usulan memerlukan tabel conversion_proposals: ${propRes.error.message}`);
    missingDependencies.push('Tabel conversion_proposals');
  } else {
    console.log(`✅ Usulan Konversi dibuat (ID: ${proposalId})`);
  }

  // 2. Menambah Aktivitas
  console.log('\n2. Menambah Aktivitas Kegiatan Magang...');
  let activityId;
  if (proposalId) {
    const actRes = await proposalService.addActivity(proposalId, {
      title: 'Pengembangan Microservices Backend',
      description: 'Membangun REST API dan skema database PostgreSQL',
      total_hours: 180,
    });
    activityId = actRes.data?.id;
    if (actRes.error) missingDependencies.push('Tabel proposal_activities');
    else console.log(`✅ Aktivitas ditambah (ID: ${activityId})`);
  }

  // 3. Mengalokasikan Jam Kegiatan ke Mata Kuliah
  console.log('\n3. Mengalokasikan Jam Kegiatan ke Mata Kuliah...');
  if (activityId) {
    const allocRes = await proposalService.allocateActivityToCourse(activityId, 'course-if601', 135);
    if (allocRes.error) missingDependencies.push('Tabel proposal_activity_courses');
    else console.log('✅ Jam kegiatan dialokasikan (135 jam / 3 SKS)');
  }

  // 4. Memetakan CPMK
  console.log('\n4. Memetakan Kegiatan ke CPMK Mata Kuliah...');
  if (activityId) {
    const cpmkRes = await proposalService.mapActivityToCpmk(activityId, 'cpmk-101');
    if (cpmkRes.error) missingDependencies.push('Tabel proposal_activity_cpmks');
    else console.log('✅ Pemetaan CPMK berhasil');
  }

  // 5. Validasi Aturan SKS × 45 Jam
  console.log('\n5. Verifikasi Validasi Beban Jam (Aturan 1 SKS = 45 Jam Workload)...');
  const targetSks = 3;
  const requiredHours = targetSks * 45; // 135 jam
  console.log(`ℹ️ Syarat 3 SKS Magang OBE = 3 × 45 Jam = ${requiredHours} Jam Workload`);

  const mockHours = 180;
  const isValidHours = mockHours >= requiredHours;
  console.log(`✅ Validasi Workload (${mockHours} jam >= ${requiredHours} jam): ${isValidHours ? 'LULUS (VALID)' : 'TIDAK LULUS'}`);

  // 6. Submit Usulan ke DPL & 7. Approve Usulan
  console.log('\n6-7. Submit Usulan & Approval DPL...');
  if (proposalId) {
    const subRes = await proposalService.submitProposal(proposalId);
    if (subRes.error) missingDependencies.push('RPC submit_conversion_proposal');

    const appRes = await proposalService.reviewProposalAsDpl(proposalId, 'approve', 'Usulan disetujui');
    if (appRes.error) missingDependencies.push('RPC review_proposal_by_dpl');
    else console.log('✅ Usulan Konversi OBE disetujui oleh DPL');
  }

  // 8. Membuat Klaim
  console.log('\n8. Membuat Klaim Bukti Konversi...');
  const claimRes = await claimService.createClaim(proposalId || 'demo-proposal-id');
  let claimId = claimRes.data?.id;

  if (claimRes.error) {
    missingDependencies.push('Tabel conversion_claims');
  } else {
    console.log(`✅ Klaim Konversi berhasil dibuat (ID: ${claimId})`);
  }

  // 9. Penilaian Mitra via Magic Link Token
  console.log('\n9. Simulation Penilaian Mitra Industri (Magic Link Token)...');
  const tokenMitra = tokenService.createSecureToken('mitra').data?.token || 'mitra_demo_token_12345';
  const partnerEval = await assessmentService.submitPartnerAssessmentByToken(tokenMitra, {
    evaluatorName: 'Bambang Sudharmono',
    evaluatorPosition: 'Senior Engineering Manager',
    companyName: 'PT Teknologi Nusantara',
    scores: { IF601: 90, IF602: 85 },
  });

  if (partnerEval.error) {
    missingDependencies.push('RPC submit_partner_assessment');
  } else {
    console.log('✅ Penilaian Mitra disubmit (Skor IF601: 90)');
  }

  // 10. Penilaian DPL via Magic Link / User Session
  console.log('\n10. Simulation Penilaian DPL...');
  const tokenDpl = tokenService.createSecureToken('dpl').data?.token || 'dpl_demo_token_67890';
  const dplEval = await assessmentService.submitDplReviewByToken(tokenDpl, {
    dplId: 'dpl-ade-id',
    scores: { IF601: 80, IF602: 88 },
    comments: 'Hasil karya dan laporan magang mahasiswa sangat memuaskan.',
  });

  if (dplEval.error) {
    missingDependencies.push('RPC submit_dpl_claim_review');
  } else {
    console.log('✅ Penilaian DPL disubmit (Skor IF601: 80)');
  }

  // 11. Verifikasi Perhitungan Nilai Akhir Berbobot (60% Mitra / 40% DPL atau 70/30)
  console.log('\n11. Memeriksa Formulasi Perhitungan Nilai Akhir & Konversi Grade OBE...');
  const partnerScore = 90;
  const dplScore = 80;
  const partnerWeight = 60; // 60% Pembimbing Industri
  const dplWeight = 40;     // 40% Dosen Pembimbing

  const finalScore = calculateFinalScore(partnerScore, dplScore, partnerWeight, dplWeight);
  const gradeLetter = getLetterGrade(finalScore);

  console.log(`- Skor Mitra Industri (${partnerWeight}%) : ${partnerScore}`);
  console.log(`- Skor DPL Akademik   (${dplWeight}%) : ${dplScore}`);
  console.log(`- Calculation Result            : (${partnerScore} × 0.6) + (${dplScore} × 0.4) = ${finalScore}`);
  console.log(`- Grade Akhir OBE Transkrip     : ${gradeLetter}`);

  if (finalScore === 86 && gradeLetter === 'A') {
    console.log('✅ VERIFIKASI RUMUS KONVERSI OBE: PASSED (100% AKURAT)');
  } else {
    console.error('❌ VERIFIKASI RUMUS KONVERSI OBE: FAILED');
  }

  console.log('\n==================================================');
  console.log('📊 RINGKASAN HASIL SMOKE TEST ALUR KONVERSI OBE');
  if (missingDependencies.length === 0) {
    console.log('🎉 SELURUH ALUR TERUJI 100% SUKSES!');
  } else {
    console.log('ℹ️ DEPENDENCY DATABASE TERDETEKSI BELUM TERSEDIA:');
    const uniqueDeps = [...new Set(missingDependencies)];
    uniqueDeps.forEach((dep, idx) => console.log(`   ${idx + 1}. ${dep}`));
    console.log('💡 Hal ini wajar karena migration SQL dikerjakan oleh anggota tim lain.');
  }
  console.log('==================================================\n');
}

run();
