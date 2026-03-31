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
    },

    async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Valida email, contraseña y aceptación de términos
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña (mínimo 6 caracteres)
     * @param {boolean} termsChecked - Si aceptó términos y condiciones
     * @returns {Object} {valid: true} si es correcto, lanza error si no
     */
    validateSignUp(email, password, termsChecked) {
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new Error("Email inválido");
        }

        // Validar contraseña (mínimo 6 caracteres)
        if (!password || password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres");
        }

        // Validar términos
        if (termsChecked !== true) {
            throw new Error("Debes aceptar los términos y condiciones");
        }

        return { valid: true, message: "Validación exitosa" };
    }
};