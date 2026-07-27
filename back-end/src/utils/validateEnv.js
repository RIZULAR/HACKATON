require('dotenv').config();

function validateEnv(requiredKeys = ['SUPABASE_URL'], throwOnError = false) {
  const missing = requiredKeys.filter((key) => !process.env[key]);

  const hasAnonKey = Boolean(
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  if (!hasAnonKey) {
    missing.push('SUPABASE_PUBLISHABLE_KEY (atau SUPABASE_ANON_KEY)');
  }

  if (missing.length > 0) {
    const errorMsg = `❌ ERROR: Variabel environment wajib berikut belum diatur di file .env:\n   - ${missing.join('\n   - ')}\n💡 Silakan lengkapi file .env berdasarkan petunjuk di .env.example`;
    
    if (throwOnError) {
      throw new Error(errorMsg);
    } else {
      console.error(errorMsg);
      return false;
    }
  }

  return true;
}

function requireAdminEnv() {
  const hasAdminKey = Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!hasAdminKey) {
    throw new Error(
      '❌ ERROR: Operasi ini membutuhkan SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY pada file .env'
    );
  }

  return true;
}

module.exports = {
  validateEnv,
  requireAdminEnv,
};
