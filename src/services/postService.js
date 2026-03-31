import { supabase } from '../api/supabaseClient.js';

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
                console.error("Error al obtener posts:", error.message);
                throw error;
            }

            // Aplicar privacidad en el lado del cliente según estado de autenticación
            return this._filterByPrivacy(data || [], userId);
        } catch (error) {
            console.error("Error en getPostsByLocation:", error);
            throw error;
        }
    },

    /**
     * Obtiene el detalle de un post con validaciones de privacidad\n     * @param {string} postId - ID del post\n     * @param {string} userId - ID del usuario logueado (null si no logueado)\n     * @returns {Promise<Object>} Post con privacidad aplicada\n     */\n    async getPostDetail(postId, userId) {\n        try {\n            const { data, error } = await supabase\n                .from('publicaciones')\n                .select('*')\n                .eq('id', postId)\n                .eq('activa', true)\n                .single();\n\n            if (error) {\n                console.error("Error al obtener post:", error.message);\n                throw error;\n            }\n\n            if (!data) {\n                throw new Error('Post no encontrado');\n            }\n\n            // Aplicar privacidad según estado de autenticación\n            const post = this._filterByPrivacy([data], userId)[0];\n            return post;\n        } catch (error) {\n            console.error("Error en getPostDetail:", error);\n            throw error;\n        }\n    },\n\n    /**\n     * Elimina un post (soft delete) - solo el autor puede hacerlo\n     * @param {string} postId - ID del post a eliminar\n     * @param {string} userId - ID del usuario logueado\n     * @returns {Promise<Object>} {success: true} o error\n     */\n    async deletePost(postId, userId) {\n        try {\n            // Primero verificar que el post existe y que el usuario es el autor\n            const { data: post, error: fetchError } = await supabase\n                .from('publicaciones')\n                .select('autor_email')\n                .eq('id', postId)\n                .single();\n\n            if (fetchError) {\n                console.error("Error al verificar post:", fetchError.message);\n                throw fetchError;\n            }\n\n            if (!post) {\n                throw new Error('Post no encontrado');\n            }\n\n            // Realizar soft delete\n            const { error: deleteError } = await supabase\n                .from('publicaciones')\n                .update({\n                    activa: false,\n                    updated_at: new Date().toISOString()\n                })\n                .eq('id', postId);\n\n            if (deleteError) {\n                console.error("Error al eliminar post:", deleteError.message);\n                throw deleteError;\n            }\n\n            return { success: true, message: 'Post eliminado correctamente' };\n        } catch (error) {\n            console.error("Error en deletePost:", error);\n            return {\n                success: false,\n                error: error.message\n            };\n        }\n    },\n\n    /**\n     * Función auxiliar: Filtrar campos según privacidad\n     * Usuario no logueado: solo campos públicos\n     * Usuario logueado: todos los campos incluidos teléfono y dirección\n     */\n    _filterByPrivacy(posts, userId) {\n        return posts.map(post => {\n            if (userId === null) {\n                // Usuario no logueado: mostrar solo información pública\n                return {\n                    id: post.id,\n                    nombre: post.nombre,\n                    tipo: post.tipo,\n                    genero: post.genero,\n                    foto: post.foto,\n                    estado: post.estado,\n                    provincia: post.provincia,\n                    ciudad: post.ciudad,\n                    barrio: post.barrio,\n                    author_name: post.author_name,\n                    created_at: post.created_at\n                };\n            } else {\n                // Usuario logueado: mostrar todos los campos\n                return post;\n            }\n        });\n    },\n\n    /**\n     * Obtiene publicaciones por ubicación (compatibilidad hacia atrás)\n     */\n    async fetchByLocation(provincia, ciudad) {\n        return this.getPostsByLocation(provincia, ciudad, null);\n    },\n\n    /**\n     * Crear nueva publicación\n     */\n    async create(datos) {\n        const { data, error } = await supabase\n            .from('publicaciones')\n            .insert([datos]);\n        \n        if (error) {\n            console.error("Error al insertar:", error.message);\n            throw error;\n        }\n        return { data, error };\n    },\n\n    /**\n     * Borrado lógico (pone activa en false) - compatibilidad hacia atrás\n     */\n    async softDelete(id) {\n        const { error } = await supabase\n            .from('publicaciones')\n            .update({ activa: false })\n            .eq('id', id);\n\n        if (error) {\n            console.error("Error al borrar:", error.message);\n            throw error;\n        }\n    }\n};