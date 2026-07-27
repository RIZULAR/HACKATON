const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ WARN: SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY/SECRET_KEY belum diatur di file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
