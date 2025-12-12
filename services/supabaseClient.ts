
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a valid client if credentials exist, otherwise a safe dummy
const createSupabaseClient = () => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) {
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('Supabase credentials missing or invalid. Using mock client.');
        // Return a proxy that logs errors instead of crashing
        return {
            from: () => ({
                select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
                insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
                delete: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
            }),
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured (Mock Mode)' } }),
                signUp: () => Promise.resolve({ error: { message: 'Supabase not configured (Mock Mode)' } }),
                signOut: () => Promise.resolve({ error: null }),
            }
        } as any;
    }
};

export const supabase = createSupabaseClient();
