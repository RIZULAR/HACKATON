const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  console.warn(
    '⚠️ WARNING: SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY belum diisi pada file .env'
  );
}

const supabaseClient = createClient(supabaseUrl || '', publishableKey || '');

module.exports = {
  supabaseClient,
  supabase: supabaseClient,
};
