import { supabase } from '../api/supabaseClient.js';

export const AuthService = {
    async login() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    }
};