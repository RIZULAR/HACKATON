const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

let supabaseAdmin = null;

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getAdminClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      '❌ ERROR: Variabel SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diatur di file .env untuk mengakses Supabase Admin Client.'
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return supabaseAdmin;
}

module.exports = {
  supabaseAdmin,
  getAdminClient,
};
