const { supabaseClient } = require('../lib/supabaseClient');
const { calculateFinalScore, getLetterGrade } = require('../utils/calculateFinalScore');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'ASSESSMENT_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function getPartnerAssessmentByToken(token) {
  try {
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('assessment_tokens')
      .select('*, internship:internship_applications(*)')
      .eq('token', token)
      .eq('role', 'mitra')
      .eq('is_used', false)
      .maybeSingle();

    if (tokenError) return response(null, tokenError);
    if (!tokenData) return response(null, new Error('Token penilaian Mitra tidak ditemukan atau telah digunakan'));

    return response(tokenData);
  } catch (err) {
    return response(null, err);
  }
}

async function submitPartnerAssessmentByToken(token, payload) {
  try {
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('assessment_tokens')
      .select('*')
      .eq('token', token)
      .eq('role', 'mitra')
      .eq('is_used', false)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return response(null, tokenError || new Error('Token penilaian tidak valid'));
    }

    const { data, error } = await supabaseClient
      .from('partner_assessments')
      .upsert({
        internship_id: tokenData.internship_id,
        evaluator_name: payload.evaluatorName,
        evaluator_position: payload.evaluatorPosition,
        company_name: payload.companyName,
        scores: payload.scores,
        comments: payload.comments || '',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return response(null, error);

    // Tandai token terpakai
    await supabaseClient
      .from('assessment_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getDplReviewByToken(token) {
  try {
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('assessment_tokens')
      .select('*, internship:internship_applications(*)')
      .eq('token', token)
      .eq('role', 'dpl')
      .eq('is_used', false)
      .maybeSingle();

    if (tokenError) return response(null, tokenError);
    if (!tokenData) return response(null, new Error('Token review DPL tidak ditemukan atau telah digunakan'));

    return response(tokenData);
  } catch (err) {
    return response(null, err);
  }
}

async function submitDplReviewByToken(token, payload) {
  try {
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('assessment_tokens')
      .select('*')
      .eq('token', token)
      .eq('role', 'dpl')
      .eq('is_used', false)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return response(null, tokenError || new Error('Token review DPL tidak valid'));
    }

    const { data, error } = await supabaseClient
      .from('dpl_reviews')
      .upsert({
        internship_id: tokenData.internship_id,
        dpl_id: payload.dplId || null,
        scores: payload.scores,
        comments: payload.comments || '',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return response(null, error);

    await supabaseClient
      .from('assessment_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getFinalResult(claimId) {
  try {
    const { data: claim, error: claimError } = await supabaseClient
      .from('conversion_claims')
      .select('*, details:conversion_claim_details(*)')
      .eq('id', claimId)
      .maybeSingle();

    if (claimError) return response(null, claimError);
    if (!claim) return response(null, new Error('Claim tidak ditemukan'));

    const { data: partner } = await supabaseClient
      .from('partner_assessments')
      .select('*')
      .eq('internship_id', claim.internship_id)
      .maybeSingle();

    const { data: dpl } = await supabaseClient
      .from('dpl_reviews')
      .select('*')
      .eq('internship_id', claim.internship_id)
      .maybeSingle();

    const courseResults = (claim.details || []).map((item) => {
      const pScore = partner?.scores?.[item.course_code] || 0;
      const dScore = dpl?.scores?.[item.course_code] || 0;
      const finalScore = calculateFinalScore(pScore, dScore, 60, 40);
      return {
        courseCode: item.course_code,
        courseName: item.course_name,
        credits: item.credits,
        partnerScore: pScore,
        dplScore: dScore,
        finalScore,
        letterGrade: getLetterGrade(finalScore),
      };
    });

    return response({
      claimId,
      internshipId: claim.internship_id,
      courseResults,
    });
  } catch (err) {
    return response(null, err);
  }
}

async function finalizeResult(claimId) {
  try {
    const resultResponse = await getFinalResult(claimId);
    if (resultResponse.error) return resultResponse;

    const { data, error } = await supabaseClient
      .from('conversion_claims')
      .update({
        status: 'finalized',
        finalized_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) return response(null, error);
    return response({ claim: data, result: resultResponse.data });
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  getPartnerAssessmentByToken,
  submitPartnerAssessmentByToken,
  getDplReviewByToken,
  submitDplReviewByToken,
  getFinalResult,
  finalizeResult,
};
