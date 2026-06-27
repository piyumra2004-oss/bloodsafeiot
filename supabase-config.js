// ============================================================
// SUPABASE CONFIGURATION - BLOODSAFE IoT
// ============================================================

// Your Supabase credentials
const SUPABASE_URL = 'https://jqdnxrmulgndvcotnfmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zeKhPNaF8ApBtD2J6ktD1w_sS6k-QZH';

// Create the Supabase client using the global supabase object from the CDN
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized!');
console.log('🔗 URL:', SUPABASE_URL);
