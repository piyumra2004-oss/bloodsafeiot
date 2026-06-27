// ============================================================
// SUPABASE CONFIGURATION - BLOODSAFE IoT
// ============================================================

// Configuration
const SUPABASE_URL = 'https://jqdnxrmulgndvcotnfmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zeKhPNaF8ApBtD2J6ktD1w_sS6k-QZH';

// Create Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized!');
