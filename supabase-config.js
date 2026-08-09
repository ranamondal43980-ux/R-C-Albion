// --- SUPABASE CONFIG ---
// The publishable/anon key below is SAFE to expose publicly.
// It can only INSERT bug reports (per Row Level Security policy),
// never read them. Only an authenticated admin login can read reports.

const SUPABASE_URL = "https://npltnakxijdfrdaxgsyp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DXIqYks87YFLqySqoD05Pg_q8SgTypE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
