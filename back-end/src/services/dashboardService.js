const { supabaseClient } = require('../lib/supabaseClient');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'DASHBOARD_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function getFacultyDashboardSummary(filters = {}) {
  try {
    const { data: applications, error } = await supabaseClient
      .from('internship_applications')
      .select('id, status, created_at');

    if (error) return response(null, error);

    const summary = (applications || []).reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return response({
      total: applications?.length || 0,
      summary,
      filters,
    });
  } catch (err) {
    return response(null, err);
  }
}

async function getKaprodiDashboardSummary(filters = {}) {
  try {
    const { data: applications, error: appError } = await supabaseClient
      .from('internship_applications')
      .select('id, status, dpl_id');

    if (appError) return response(null, appError);

    const { data: claims, error: claimError } = await supabaseClient
      .from('conversion_claims')
      .select('id, status');

    if (claimError) return response(null, claimError);

    return response({
      totalApplications: applications?.length || 0,
      assignedDplCount: (applications || []).filter((a) => a.dpl_id).length,
      totalClaims: claims?.length || 0,
      filters,
    });
  } catch (err) {
    return response(null, err);
  }
}

async function getPartnerStatistics(filters = {}) {
  try {
    const { data, error } = await supabaseClient
      .from('partner_assessments')
      .select('id, company_name, submitted_at');

    if (error) return response(null, error);

    const companySummary = (data || []).reduce((acc, item) => {
      const company = item.company_name || 'Lainnya';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});

    return response({
      totalAssessments: data?.length || 0,
      companySummary,
      filters,
    });
  } catch (err) {
    return response(null, err);
  }
}

async function getDplWorkloadStatistics(filters = {}) {
  try {
    const { data: dpls, error: dplError } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'dpl');

    if (dplError) return response(null, dplError);

    const { data: applications, error: appError } = await supabaseClient
      .from('internship_applications')
      .select('id, dpl_id')
      .not('dpl_id', 'is', null);

    if (appError) return response(null, appError);

    const workloadMap = (applications || []).reduce((acc, app) => {
      acc[app.dpl_id] = (acc[app.dpl_id] || 0) + 1;
      return acc;
    }, {});

    const dplWorkloads = (dpls || []).map((dpl) => ({
      dplId: dpl.id,
      fullName: dpl.full_name,
      assignedCount: workloadMap[dpl.id] || 0,
    }));

    return response({
      totalDpls: dpls?.length || 0,
      dplWorkloads,
      filters,
    });
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  getFacultyDashboardSummary,
  getKaprodiDashboardSummary,
  getPartnerStatistics,
  getDplWorkloadStatistics,
};
