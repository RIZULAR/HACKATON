const { supabase } = require('../lib/supabase');
const { calculateGradeSummary, calculateFinalScore } = require('../helpers/obe');
const { CONVERSION_STATUS } = require('../constants/status');

/**
 * Service Usulan & Klaim Konversi Nilai OBE
 */

async function getConversionProposal(internshipId) {
  const { data, error } = await supabase
    .from('conversion_proposals')
    .select('*, details:conversion_proposal_details(*)')
    .eq('internship_id', internshipId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getConversionClaim(internshipId) {
  const { data, error } = await supabase
    .from('conversion_claims')
    .select('*, details:conversion_claim_details(*)')
    .eq('internship_id', internshipId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function submitConversionClaim(internshipId, claimPayload) {
  const payload = {
    internship_id: internshipId,
    certificate_url: claimPayload.certificateUrl || null,
    logbook_url: claimPayload.logbookUrl || null,
    report_url: claimPayload.reportUrl || null,
    status: CONVERSION_STATUS.KLAIM_SUBMITTED,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('conversion_claims')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function computeFinalConversion(internshipId, partnerWeight = 60, dplWeight = 40) {
  // Query data penilaian mitra & DPL
  const { data: partnerScore } = await supabase
    .from('partner_assessments')
    .select('*')
    .eq('internship_id', internshipId)
    .maybeSingle();

  const { data: dplReview } = await supabase
    .from('dpl_reviews')
    .select('*')
    .eq('internship_id', internshipId)
    .maybeSingle();

  const { data: claim } = await getConversionClaim(internshipId);

  const courseScores = (claim?.details || []).map((detail) => {
    const pScore = partnerScore?.scores?.[detail.course_code] || null;
    const dScore = dplReview?.scores?.[detail.course_code] || null;

    const finalScore =
      pScore !== null && dScore !== null
        ? calculateFinalScore(pScore, dScore, partnerWeight, dplWeight)
        : null;

    return {
      courseCode: detail.course_code,
      courseName: detail.course_name,
      credits: detail.credits,
      partnerScore: pScore,
      dplScore: dScore,
      finalScore,
    };
  });

  const summary = calculateGradeSummary(courseScores);

  return {
    internshipId,
    courseScores,
    summary,
  };
}

module.exports = {
  getConversionProposal,
  getConversionClaim,
  submitConversionClaim,
  computeFinalConversion,
};
