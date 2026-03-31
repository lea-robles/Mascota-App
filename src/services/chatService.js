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
    },

    /**
     * Obtiene el historial de mensajes de una conversación
     * @param {string} conversationId - UUID de la conversación
     * @returns {Promise<Array>} Array de mensajes ordenados por fecha ascendente
     */
    async getMessageHistory(conversationId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, message, created_at, read')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching message history:', error);
            throw error;
        }
    },

    /**
     * Marca mensajes como leídos
     * @param {Array<string>} messageIds - Array de IDs de mensajes
     * @returns {Promise<Object>} {success: true, updated_count: N}
     */
    async markAsRead(messageIds) {
        try {
            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                return { success: true, updated_count: 0 };
            }

            const { data, error } = await supabase
                .from('messages')
                .update({ read: true })
                .in('id', messageIds)
                .select('id');

            if (error) throw error;

            return {
                success: true,
                updated_count: data?.length || 0
            };
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    },

    /**
     * Crea o retorna una conversación existente entre dos usuarios
     * Evita crear duplicados
     * @param {string} userId1 - ID del primer usuario
     * @param {string} userId2 - ID del segundo usuario
     * @returns {Promise<Object>} {id, user1_id, user2_id, created_at, last_message_at}
     */
    async createConversation(userId1, userId2) {
        try {
            // Validar que los IDs sean diferentes
            if (userId1 === userId2) {
                throw new Error('Cannot create conversation with the same user');
            }

            // Ordenar IDs para evitar duplicados
            const [user_a, user_b] = [userId1, userId2].sort();

            // Buscar conversación existente
            const { data: existingConversation, error: searchError } = await supabase
                .from('conversations')
                .select('id, user1_id, user2_id, created_at, last_message_at')
                .or(`and(user1_id.eq.${user_a},user2_id.eq.${user_b}),and(user1_id.eq.${user_b},user2_id.eq.${user_a})`)
                .limit(1)
                .single();

            if (existingConversation) {
                return existingConversation;
            }

            // Si no existe, crear nueva conversación
            const { data: newConversation, error: createError } = await supabase
                .from('conversations')
                .insert([{
                    user1_id: user_a,
                    user2_id: user_b,
                    created_at: new Date().toISOString(),
                    last_message_at: new Date().toISOString()
                }])
                .select('id, user1_id, user2_id, created_at, last_message_at')
                .single();

            if (createError) throw createError;
            return newConversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }
};