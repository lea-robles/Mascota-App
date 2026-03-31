import { supabase } from '../api/supabaseClient.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export const ChatService = {
    async sendMessage(emisor, receptor, contenido, publicacionId) {
        try {
            if (!emisor || !receptor) {
                const err = new Error('Emisor y receptor son requeridos');
                err.status = 400;
                throw err;
            }

            if (!contenido || !contenido.trim()) {
                const err = new Error('El mensaje no puede estar vacío');
                err.status = 400;
                throw err;
            }

            const { error } = await supabase.from('mensajes').insert([{ 
                emisor, 
                receptor, 
                contenido: contenido.trim(), 
                publicacion_id: publicacionId,
                leido: false
            }]);

            if (error) throw error;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ChatService.sendMessage');
        }
    },

    /**
     * Suscripción Realtime a nuevos mensajes
     * @param {string} publicacionId - ID de la publicación asociada
     * @param {Function} callback - Callback cuando llega nuevo mensaje
     * @returns {Object} Subscription object para unsubscribirse later
     */
    subscribeToMessages(publicacionId, callback) {
        try {
            if (!publicacionId) {
                const err = new Error('publicacionId es requerido');
                err.status = 400;
                throw err;
            }

            return supabase
                .channel('chat-publico')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `publicacion_id=eq.${publicacionId}` },
                    (payload) => callback(payload.new)
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[ChatService] Suscrito a chat para post ${publicacionId}`);
                    }
                });
        } catch (error) {
            throw ErrorHandler.handle(error, 'ChatService.subscribeToMessages');
        }
    },

    /**
     * Obtiene el historial de mensajes de una conversación
     * @param {string} conversationId - UUID de la conversación
     * @returns {Promise<Array>} Array de mensajes ordenados por fecha ascendente
     */
    async getMessageHistory(conversationId) {
        try {
            if (!conversationId) {
                const err = new Error('conversationId es requerido');
                err.status = 400;
                throw err;
            }

            const { data, error } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, message, created_at, read')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw ErrorHandler.handle(error, 'ChatService.getMessageHistory');
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
            throw ErrorHandler.handle(error, 'ChatService.markAsRead');
        }
    },

    /**
     * Crea o retorna una conversación existente entre dos usuarios
     * Evita crear duplicados ordenando IDs
     * @param {string} userId1 - ID del primer usuario
     * @param {string} userId2 - ID del segundo usuario
     * @returns {Promise<Object>} {id, user1_id, user2_id, created_at, last_message_at}
     */
    async createConversation(userId1, userId2) {
        try {
            if (!userId1 || !userId2) {
                const err = new Error('userId1 y userId2 son requeridos');
                err.status = 400;
                throw err;
            }

            if (userId1 === userId2) {
                const err = new Error('No puedes crear conversación contigo mismo');
                err.status = 400;
                throw err;
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
            throw ErrorHandler.handle(error, 'ChatService.createConversation');
        }
    }
};