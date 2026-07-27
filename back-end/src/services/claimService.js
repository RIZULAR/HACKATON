const { supabaseClient } = require('../lib/supabaseClient');
const { CLAIM_STATUSES } = require('../constants/claimStatuses');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'CLAIM_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function createClaim(proposalId) {
  try {
    const { data: proposal } = await supabaseClient
      .from('conversion_proposals')
      .select('internship_id')
      .eq('id', proposalId)
      .single();

    const payload = {
      proposal_id: proposalId,
      internship_id: proposal?.internship_id || null,
      status: CLAIM_STATUSES.DRAFT,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from('conversion_claims')
      .insert([payload])
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function updateClaimActivity(claimActivityId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('claim_activities')
      .update(payload)
      .eq('id', claimActivityId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function addClaimEvidence(claimActivityId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('claim_evidences')
      .insert([{ claim_activity_id: claimActivityId, ...payload }])
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function validateClaimDocuments(claimId) {
  try {
    const { data: claim, error } = await supabaseClient
      .from('conversion_claims')
      .select('certificate_url, logbook_url, report_url')
      .eq('id', claimId)
      .maybeSingle();

    if (error) return response(null, error);

    const hasCertificate = Boolean(claim?.certificate_url);
    const hasLogbook = Boolean(claim?.logbook_url);
    const hasReport = Boolean(claim?.report_url);

    const isValid = hasCertificate && hasLogbook && hasReport;

    return response({
      isValid,
      documents: { hasCertificate, hasLogbook, hasReport },
    });
  } catch (err) {
    return response(null, err);
  }
}

async function submitClaim(claimId) {
  try {
    const { data, error } = await supabaseClient
      .from('conversion_claims')
      .update({
        status: CLAIM_STATUSES.SUBMITTED,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getClaimDetail(claimId) {
  try {
    const { data, error } = await supabaseClient
      .from('conversion_claims')
      .select('*, details:conversion_claim_details(*)')
      .eq('id', claimId)
      .maybeSingle();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  createClaim,
  updateClaimActivity,
  addClaimEvidence,
  validateClaimDocuments,
  submitClaim,
  getClaimDetail,
};
