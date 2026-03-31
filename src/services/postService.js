import { supabase } from '../api/supabaseClient.js';

export const PostService = {
    // 1. Obtener publicaciones (de momento trae todo, luego filtramos)
    async fetchByLocation(provincia, ciudad) {
        const { data, error } = await supabase
            .from('publicaciones')
            .select('*')
            .eq('activa', true) // Solo mostrar las que no fueron borradas
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error en Supabase:", error.message);
            throw error;
        }
        return data || [];
    },

    // 2. Crear nueva publicación (la que usa el formulario con fotos)
    async create(datos) {
        const { data, error } = await supabase
            .from('publicaciones')
            .insert([datos]);
        
        if (error) {
            console.error("Error al insertar:", error.message);
            throw error;
        }
        return { data, error };
    },

    // 3. Borrado lógico (pone activa en false)
    async softDelete(id) {
        const { error } = await supabase
            .from('publicaciones')
            .update({ activa: false })
            .eq('id', id);

        if (error) {
            console.error("Error al borrar:", error.message);
            throw error;
        }
    }
};