import { supabaseClient } from '../src/lib/supabaseClient.js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

const EXPECTED_TABLES = [
  'profiles',
  'internship_applications',
  'internship_status_history',
  'courses',
  'course_cpmks',
  'conversion_proposals',
  'proposal_activities',
  'proposal_activity_courses',
  'proposal_activity_cpmks',
  'conversion_claims',
  'claim_activities',
  'claim_evidences',
  'partner_assessments',
  'dpl_reviews',
  'review_tokens',
  'final_conversion_results',
  'notifications',
  'audit_logs',
];

const EXPECTED_RPCS = [
  'create_internship_draft',
  'submit_internship_application',
  'faculty_review_internship',
  'kaprodi_finalize_internship',
  'validate_proposal_hours',
  'submit_conversion_proposal',
  'review_proposal_by_dpl',
  'submit_partner_assessment',
  'submit_dpl_claim_review',
  'finalize_conversion_result',
  'get_faculty_dashboard_summary',
  'get_kaprodi_dashboard_summary',
];

const BUCKET_NAME = 'internship-documents';

async function run() {
  console.log('==================================================');
  console.log('DATABASE CONTRACT CHECK');
  console.log('==================================================\n');

  const client = supabaseAdmin || supabaseClient;

  // 1. Memeriksa Tabel
  for (const tableName of EXPECTED_TABLES) {
    try {
      const { error } = await client.from(tableName).select('id').limit(1);
      if (!error) {
        console.log(`[OK] ${tableName}`);
      } else if (
        error.code === '42P01' ||
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        console.log(`[MISSING] ${tableName}`);
      } else {
        console.log(`[OK] ${tableName}`);
      }
    } catch {
      console.log(`[MISSING] ${tableName}`);
    }
  }

  // 2. Memeriksa RPC
  for (const rpcName of EXPECTED_RPCS) {
    try {
      const { error } = await client.rpc(rpcName, {});
      if (!error || (error && !error.message.includes('Could not find the function'))) {
        console.log(`[OK] RPC ${rpcName}`);
      } else {
        console.log(`[MISSING] RPC ${rpcName}`);
      }
    } catch {
      console.log(`[MISSING] RPC ${rpcName}`);
    }
  }

  // 3. Memeriksa Storage Bucket
  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    const hasBucket = (buckets || []).some((b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME);

    if (!error && hasBucket) {
      console.log(`[OK] Bucket ${BUCKET_NAME}`);
    } else {
      console.log(`[MISSING] Bucket ${BUCKET_NAME}`);
    }
  } catch {
    console.log(`[MISSING] Bucket ${BUCKET_NAME}`);
  }

  console.log('\n==================================================');
  console.log('📌 Laporan ini dapat diserahkan ke anggota tim migration.');
  console.log('==================================================\n');
}

run();
