import { supabase } from '../api/supabaseClient.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export const PostService = {
    /**
     * Obtiene publicaciones por ubicación con validaciones de privacidad
     * @param {string} province - Provincia
     * @param {string} city - Ciudad
     * @param {string} userId - ID del usuario logueado (null si no logueado)
     * @returns {Promise<Array>} Posts con privacidad aplicada
     */
    async getPostsByLocation(province, city, userId) {
        try {
            // Query público - siempre excluye posts borrados
            let query = supabase
                .from('publicaciones')
                .select('*')
                .eq('activa', true)
                .order('created_at', { ascending: false });

            // Si se proporciona provincia/ciudad, se filtran
            if (province) query = query.eq('provincia', province);
            if (city) query = query.eq('ciudad', city);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Aplicar privacidad en el lado del cliente según estado de autenticación
            return this._filterByPrivacy(data || [], userId);
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.getPostsByLocation');
        }
    },

    /**
     * Obtiene el detalle de un post con validaciones de privacidad
     * @param {string} postId - ID del post
     * @param {string} userId - ID del usuario logueado (null si no logueado)
     * @returns {Promise<Object>} Post con privacidad aplicada
     */
    async getPostDetail(postId, userId) {
        try {
            if (!postId) {
                const err = new Error('postId es requerido');
                err.status = 400;
                throw err;
            }

            const { data, error } = await supabase
                .from('publicaciones')
                .select('*')
                .eq('id', postId)
                .eq('activa', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const err = new Error('Post no encontrado');
                    err.status = 404;
                    throw err;
                }
                throw error;
            }

            if (!data) {
                const err = new Error('Post no encontrado');
                err.status = 404;
                throw err;
            }

            // Aplicar privacidad según estado de autenticación
            const post = this._filterByPrivacy([data], userId)[0];
            return post;
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.getPostDetail');
        }
    },

    /**
     * Elimina un post (soft delete) - solo el autor puede hacerlo
     * @param {string} postId - ID del post a eliminar
     * @param {string} userId - ID del usuario logueado
     * @returns {Promise<Object>} {success: true} o error
     */
    async deletePost(postId, userId) {
        try {
            if (!postId || !userId) {
                const err = new Error('postId y userId son requeridos');
                err.status = 400;
                throw err;
            }

            // Primero verificar que el post existe y que el usuario es el autor
            const { data: post, error: fetchError } = await supabase
                .from('publicaciones')
                .select('autor_email')
                .eq('id', postId)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    const err = new Error('Post no encontrado');
                    err.status = 404;
                    throw err;
                }
                throw fetchError;
            }

            if (!post) {
                const err = new Error('Post no encontrado');
                err.status = 404;
                throw err;
            }

            // Realizar soft delete
            const { error: deleteError } = await supabase
                .from('publicaciones')
                .update({
                    activa: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId);

            if (deleteError) {
                throw deleteError;
            }

            return { success: true, message: 'Post eliminado correctamente' };
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.deletePost');
        }
    },

    /**
     * Función auxiliar: Filtrar campos según privacidad
     * Usuario no logueado: solo campos públicos
     * Usuario logueado: todos los campos incluidos teléfono y dirección
     */
    _filterByPrivacy(posts, userId) {
        return posts.map(post => {
            if (userId === null) {
                // Usuario no logueado: mostrar solo información pública
                return {
                    id: post.id,
                    nombre: post.nombre,
                    tipo: post.tipo,
                    genero: post.genero,
                    foto: post.foto,
                    estado: post.estado,
                    provincia: post.provincia,
                    ciudad: post.ciudad,
                    barrio: post.barrio,
                    author_name: post.author_name,
                    created_at: post.created_at
                };
            } else {
                // Usuario logueado: mostrar todos los campos
                return post;
            }
        });
    },

    /**
     * Obtiene publicaciones por ubicación (compatibilidad hacia atrás)
     */
    async fetchByLocation(provincia, ciudad) {
        try {
            return this.getPostsByLocation(provincia, ciudad, null);
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.fetchByLocation');
        }
    },

    /**
     * Crear nueva publicación
     */
    async create(datos) {
        try {
            if (!datos || !datos.nombre || !datos.tipo) {
                const err = new Error('Datos de publicación incompletos');
                err.status = 400;
                throw err;
            }

            const { data, error } = await supabase
                .from('publicaciones')
                .insert([datos]);
            
            if (error) {
                throw error;
            }
            return { data, error: null };
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.create');
        }
    },

    /**
     * Borrado lógico (pone activa en false)
     */
    async softDelete(id) {
        try {
            if (!id) {
                const err = new Error('ID de publicación requerido');
                err.status = 400;
                throw err;
            }

            const { error } = await supabase
                .from('publicaciones')
                .update({ activa: false })
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (error) {
            throw ErrorHandler.handle(error, 'PostService.softDelete');
        }
    }
};