import { supabase } from '../api/supabaseClient.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export const AuthService = {
    async login() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.login');
        }
    },

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.logout');
        }
    },

    async getCurrentUser() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session?.user || null;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.getCurrentUser');
        }
    },

    async signInWithGoogle() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.signInWithGoogle');
        }
    },

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.signOut');
        }
    },

    /**
     * Valida email, contraseña y aceptación de términos
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña (mínimo 6 caracteres)
     * @param {boolean} termsChecked - Si aceptó términos y condiciones
     * @returns {Object} {valid: true} si es correcto, lanza error si no
     */
    validateSignUp(email, password, termsChecked) {
        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                const err = new Error("Email inválido");
                err.status = 400;
                throw err;
            }

            if (!password || password.length < 6) {
                const err = new Error("La contraseña debe tener al menos 6 caracteres");
                err.status = 400;
                throw err;
            }

            if (termsChecked !== true) {
                const err = new Error("Debes aceptar los términos y condiciones");
                err.status = 400;
                throw err;
            }

            return { valid: true, message: "Validación exitosa" };
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.validateSignUp');
        }
    },

    // ============= FUNCIONES GDPR =============

    /**
     * 📥 GDPR Data Portability: Exporta todos los datos del usuario
     * @param {string} userId - ID del usuario a exportar
     * @returns {Object} - Datos completos del usuario (perfil, posts, conversaciones)
     */
    async exportUserData(userId) {
        try {
            if (!userId) {
                const err = new Error('userId es requerido');
                err.status = 400;
                throw err;
            }

            const user = await this.getCurrentUser();
            if (!user || user.id !== userId) {
                const err = new Error("No autorizado para acceder a estos datos");
                err.status = 403;
                throw err;
            }

            // Obtener perfil del usuario
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Obtener todos los posts del usuario
            const { data: userPosts, error: postsError } = await supabase
                .from('publicaciones')
                .select('*')
                .eq('autor_email', user.email)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // Obtener todas las conversaciones
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (convError) console.warn('Warning obtener conversaciones:', convError);

            // Compilar datos exportables
            const exportData = {
                exportedAt: new Date().toISOString(),
                userData: {
                    profile: userProfile || {},
                    totalPosts: userPosts?.length || 0,
                    totalConversations: conversations?.length || 0
                },
                posts: userPosts || [],
                conversations: conversations || []
            };

            return exportData;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.exportUserData');
        }
    },

    /**
     * 🗑️ GDPR Right to be Forgotten: Solicita eliminación de datos (30 días de gracia)
     * @param {string} userId - ID del usuario
     * @returns {Object} - Confirmación de solicitud con fecha de eliminación programada
     */
    async requestDataDeletion(userId) {
        try {
            if (!userId) {
                const err = new Error('userId es requerido');
                err.status = 400;
                throw err;
            }

            const user = await this.getCurrentUser();
            if (!user || user.id !== userId) {
                const err = new Error("No autorizado para solicitar eliminación");
                err.status = 403;
                throw err;
            }

            const currentDate = new Date();
            const deletionDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días

            // 1. Obtener backup de datos antes de eliminar
            const userDataBackup = await this.exportUserData(userId);

            // 2. Guardar backup en tabla de auditoría (si existe)
            try {
                await supabase
                    .from('deleted_user_backups')
                    .insert({
                        user_id: userId,
                        user_data: userDataBackup,
                        requested_at: currentDate.toISOString(),
                        scheduled_deletion_date: deletionDate.toISOString(),
                        status: 'pending'
                    });
            } catch (backupError) {
                console.warn('No se pudo guardar backup (tabla no existe):', backupError);
            }

            // 3. Marcar usuario como "deletion_pending"
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    deletion_pending: true,
                    deletion_requested_at: currentDate.toISOString(),
                    scheduled_deletion_at: deletionDate.toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 4. Anonimizar posts actuales
            const { error: anonymizeError } = await supabase
                .from('publicaciones')
                .update({
                    nombre: 'Usuario eliminado',
                    descripcion: 'Este reporte ha sido anonimizado a solicitud del usuario.',
                    autor_email: null,
                    telefono: null,
                    direccion: null
                })
                .eq('autor_email', user.email);

            if (anonymizeError) console.warn('Warning anonimizar posts:', anonymizeError);

            return {
                success: true,
                message: `Solicitud de eliminación registrada. Tu cuenta será eliminada completamente el ${deletionDate.toLocaleDateString('es-AR')}`,
                deletionDate: deletionDate.toISOString(),
                daysToDelete: 30
            };
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.requestDataDeletion');
        }
    }
};