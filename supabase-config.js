// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const supabaseUrl = 'https://jqdnxrmulgndvcotnfmu.supabase.co';
const supabaseKey = 'sb_publishable_zeKhPNaF8ApBtD2J6ktD1w_sS6k-QZH';

// Initialize Supabase client
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase connected!');
