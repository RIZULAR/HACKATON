const { supabase } = require('../lib/supabase');

/**
 * Service Dashboard Monitoring untuk Kaprodi & Fakultas
 */

async function getDashboardSummary() {
  const { data: applications, error: appError } = await supabase
    .from('internship_applications')
    .select('id, status, created_at');

  if (appError) throw appError;

  const { data: claims, error: claimError } = await supabase
    .from('conversion_claims')
    .select('id, status');

  if (claimError) throw claimError;

  const totalApplications = applications?.length || 0;
  const statusCounts = (applications || []).reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const totalClaims = claims?.length || 0;

  return {
    totalApplications,
    statusCounts,
    totalClaims,
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  getDashboardSummary,
};
