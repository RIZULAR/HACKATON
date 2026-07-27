const { supabaseClient } = require('../lib/supabaseClient');
const { INTERNSHIP_STATUSES } = require('../constants/internshipStatuses');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'INTERNSHIP_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function createDraft(payload) {
  try {
    const draftPayload = {
      ...payload,
      status: INTERNSHIP_STATUSES.DRAFT,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .insert([draftPayload])
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function updateDraft(applicationId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('status', INTERNSHIP_STATUSES.DRAFT)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function submitApplication(applicationId) {
  try {
    // Gunakan RPC jika tersedia
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('submit_internship_application', {
      app_id: applicationId,
    });

    if (!rpcError) return response(rpcData);

    // Fallback update status jika RPC belum dibuat
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .update({ status: INTERNSHIP_STATUSES.SUBMITTED, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getMyApplications() {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function getApplicationDetail(applicationId) {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .select('*, student:profiles!student_id(*), dpl:profiles!dpl_id(*)')
      .eq('id', applicationId)
      .maybeSingle();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getFacultyPendingApplications() {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .select('*, student:profiles!student_id(*)')
      .eq('status', INTERNSHIP_STATUSES.SUBMITTED)
      .order('created_at', { ascending: true });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function reviewAsFaculty(applicationId, decision, note = '') {
  try {
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('review_application_faculty', {
      app_id: applicationId,
      decision,
      note,
    });

    if (!rpcError) return response(rpcData);

    const nextStatus = decision === 'approve'
      ? INTERNSHIP_STATUSES.WAITING_KAPRODI
      : INTERNSHIP_STATUSES.FACULTY_REVISION;

    const { data, error } = await supabaseClient
      .from('internship_applications')
      .update({ status: nextStatus, notes: note, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getKaprodiPendingApplications() {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .select('*, student:profiles!student_id(*)')
      .eq('status', INTERNSHIP_STATUSES.WAITING_KAPRODI)
      .order('created_at', { ascending: true });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function finalizeAsKaprodi(applicationId, decision, assignedDplId = null, note = '') {
  try {
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('finalize_application_kaprodi', {
      app_id: applicationId,
      decision,
      dpl_id: assignedDplId,
      note,
    });

    if (!rpcError) return response(rpcData);

    const nextStatus = decision === 'approve'
      ? INTERNSHIP_STATUSES.APPROVED
      : INTERNSHIP_STATUSES.KAPRODI_REVISION;

    const { data, error } = await supabaseClient
      .from('internship_applications')
      .update({
        status: nextStatus,
        dpl_id: assignedDplId,
        notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getAssignedInternshipsForDpl() {
  try {
    const { data, error } = await supabaseClient
      .from('internship_applications')
      .select('*, student:profiles!student_id(*)')
      .order('updated_at', { ascending: false });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function getAvailableDplDirectory() {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email, nip')
      .eq('role', 'dpl');

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function getStatusHistory(applicationId) {
  try {
    const { data, error } = await supabaseClient
      .from('application_status_history')
      .select('*')
      .eq('internship_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  createDraft,
  updateDraft,
  submitApplication,
  getMyApplications,
  getApplicationDetail,
  getFacultyPendingApplications,
  reviewAsFaculty,
  getKaprodiPendingApplications,
  finalizeAsKaprodi,
  getAssignedInternshipsForDpl,
  getAvailableDplDirectory,
  getStatusHistory,
};
