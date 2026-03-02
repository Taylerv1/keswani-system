import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error([
        "Missing Supabase environment variables. Create a .env file in the server/ folder and set:",
        "  SUPABASE_URL=your-supabase-url",
        "  SUPABASE_ANON_KEY=your-anon-key",
        "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
        "Example: see server/.env.example",
    ].join("\n"));
}

// Public client — used for auth operations (login, password reset)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — used for privileged operations (create users, manage auth)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
