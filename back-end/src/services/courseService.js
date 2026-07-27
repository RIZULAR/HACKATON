const { supabaseClient } = require('../lib/supabaseClient');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'COURSE_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function getCourses() {
  try {
    const { data, error } = await supabaseClient
      .from('courses')
      .select('*, cpmks(*)')
      .order('code', { ascending: true });

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function getCourseById(courseId) {
  try {
    const { data, error } = await supabaseClient
      .from('courses')
      .select('*, cpmks(*)')
      .eq('id', courseId)
      .maybeSingle();

    if (error) return response(null, error);
    return response(data);
  } catch (err) {
    return response(null, err);
  }
}

async function getCourseCpmks(courseId) {
  try {
    const { data, error } = await supabaseClient
      .from('cpmks')
      .select('*')
      .eq('course_id', courseId);

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

async function searchCourses(keyword) {
  try {
    const term = String(keyword || '').trim();
    if (!term) return getCourses();

    const { data, error } = await supabaseClient
      .from('courses')
      .select('*, cpmks(*)')
      .or(`name.ilike.%${term}%,code.ilike.%${term}%`);

    if (error) return response(null, error);
    return response(data || []);
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  getCourses,
  getCourseById,
  getCourseCpmks,
  searchCourses,
};
