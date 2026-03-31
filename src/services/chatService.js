import { supabase } from '../api/supabaseClient.js';

export const ChatService = {
    async sendMessage(emisor, receptor, contenido, publicacionId) {
        // Práctica de Seguridad: Validación básica antes de enviar
        if (!contenido.trim()) return;

        const { error } = await supabase.from('mensajes').insert([{ 
            emisor, 
            receptor, 
            contenido: contenido.trim(), 
            publicacion_id: publicacionId,
            leido: false
        }]);

        if (error) throw error;
    },

    // Suscripción Realtime (Mejorada)
    subscribeToMessages(publicacionId, callback) {
        return supabase
            .channel('chat-publico')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `publicacion_id=eq.${publicacionId}` },
                (payload) => callback(payload.new)
            )
            .subscribe();
    }
};