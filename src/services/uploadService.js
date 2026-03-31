import { supabase } from '../api/supabaseClient.js';

export const UploadService = {
    // Convierte cualquier imagen a WebP livianito antes de subir
    async convertToWebp(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
                };
            };
        });
    },

    async uploadImages(files) {
        const uploadPromises = Array.from(files).map(async (file) => {
            const webpBlob = await this.convertToWebp(file);
            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `reportes/${fileName}`;

            const { data, error } = await supabase.storage
                .from('mascotas')
                .upload(filePath, webpBlob, { contentType: 'image/webp' });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('mascotas')
                .getPublicUrl(filePath);

            return publicUrl;
        });

        return Promise.all(uploadPromises);
    }
};