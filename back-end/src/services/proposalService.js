const { supabaseClient } = require('../lib/supabaseClient');
const { PROPOSAL_STATUSES } = require('../constants/proposalStatuses');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'PROPOSAL_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function createProposal(internshipId) {
  try {
    const payload = {
      internship_id: internshipId,
      status: PROPOSAL_STATUSES.DRAFT,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseClient
      .from('conversion_proposals')
      .insert([payload])
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function addActivity(proposalId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('proposal_activities')
      .insert([{ proposal_id: proposalId, ...payload }])
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function updateActivity(activityId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('proposal_activities')
      .update(payload)
      .eq('id', activityId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function removeActivity(activityId) {
  try {
    const { data, error } = await supabaseClient
      .from('proposal_activities')
      .delete()
      .eq('id', activityId)
      .select();

    if (error) return response(null, error);
    return response({ message: 'Activity removed successfully', deleted: data });
  } catch (err) {
    return response(null, err);
  }
}

async function allocateActivityToCourse(activityId, courseId, allocatedHours) {
  try {
    const { data, error } = await supabaseClient
      .from('proposal_activity_allocations')
      .upsert({
        activity_id: activityId,
        course_id: courseId,
        allocated_hours: Number(allocatedHours) || 0,
      })
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function mapActivityToCpmk(activityId, cpmkId) {
  try {
    const { data, error } = await supabaseClient
      .from('proposal_activity_cpmk_mappings')
      .upsert({
        activity_id: activityId,
        cpmk_id: cpmkId,
      })
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function validateProposalHours(proposalId) {
  try {
    const { data: activities, error } = await supabaseClient
      .from('proposal_activities')
      .select('id, total_hours')
      .eq('proposal_id', proposalId);

    if (error) return response(null, error);

    const totalHours = (activities || []).reduce(
      (sum, item) => sum + Number(item.total_hours || 0),
      0
    );

    const isValid = totalHours >= 500; // Contoh threshold SKS magang
    return response({ totalHours, isValid, requiredHours: 500 });
  } catch (err) {
    return response(null, err);
  }
}

async function submitProposal(proposalId) {
  try {
    const { data, error } = await supabaseClient
      .from('conversion_proposals')
      .update({
        status: PROPOSAL_STATUSES.WAITING_DPL,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getProposalDetail(proposalId) {
  try {
    const { data, error } = await supabaseClient
      .from('conversion_proposals')
      .select('*, details:conversion_proposal_details(*), activities:proposal_activities(*)')
      .eq('id', proposalId)
      .maybeSingle();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function reviewProposalAsDpl(proposalId, decision, note = '') {
  try {
    const nextStatus = decision === 'approve'
      ? PROPOSAL_STATUSES.APPROVED
      : PROPOSAL_STATUSES.REVISION;

    const { data, error } = await supabaseClient
      .from('conversion_proposals')
      .update({
        status: nextStatus,
        notes: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  createProposal,
  addActivity,
  updateActivity,
  removeActivity,
  allocateActivityToCourse,
  mapActivityToCpmk,
  validateProposalHours,
  submitProposal,
  getProposalDetail,
  reviewProposalAsDpl,
};
