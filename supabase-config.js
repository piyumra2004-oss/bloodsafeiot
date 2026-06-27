
// SUPABASE CONFIGURATION - BLOODSAFE IoT

// Your Supabase credentials
const SUPABASE_URL = 'https://jqdnxrmulgndvcotnfmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zeKhPNaF8ApBtD2J6ktD1w_sS6k-QZH';

// Create Supabase client with a DIFFERENT variable name
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized!');
