const { supabaseClient } = require('../lib/supabaseClient');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'AUTH_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) return response(null, error);
    return response({ message: 'Signed out successfully' });
  } catch (err) {
    return response(null, err);
  }
}

async function getSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) return response(null, error);
    return response(data?.session || null);
  } catch (err) {
    return response(null, err);
  }
}

async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) return response(null, error);
    return response(data?.user || null);
  } catch (err) {
    return response(null, err);
  }
}

async function getCurrentProfile() {
  try {
    const { data: user, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user?.user) return response(null, userError || new Error('No active user session'));

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .maybeSingle();

    if (profileError) return response(null, profileError);
    return response(profile);
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  getCurrentProfile,
};
