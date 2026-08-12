// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL = 'https://jqdnxrmulgndvcotnfmu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zeKhPNaF8ApBtD2J6ktD1w_sS6k-QZH';

// Create supabase client - using the global supabaseClient from CDN
const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log to confirm
console.log('✅ Supabase client initialized!');
console.log('✅ supabase.from available:', typeof supabase.from === 'function');
