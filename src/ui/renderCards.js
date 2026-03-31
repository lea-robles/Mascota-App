export const RenderCards = {
    draw(contenedor, publicaciones, userEmail) {
        if (publicaciones.length === 0) {
            contenedor.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <i class="fas fa-paw text-gray-200 text-6xl mb-4"></i>
                    <p class="text-gray-500 font-medium">No hay mascotas publicadas en esta zona.</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = publicaciones.map(p => {
            // Usar la primera foto del array o un placeholder
            const imagenUrl = (p.foto && p.foto.length > 0) ? p.foto[0] : 'https://via.placeholder.com/400x300?text=Sin+Foto';
            const colorEstado = p.estado === 'Perdido' ? 'bg-red-500' : 'bg-green-500';

            return `
            <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group">
                <div class="relative h-48 overflow-hidden">
                    <img src="${imagenUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <span class="absolute top-3 left-3 ${colorEstado} text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        ${p.estado || 'Reporte'}
                    </span>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">${p.nombre}</h3>
                            <p class="text-gray-500 text-sm flex items-center gap-1">
                                <i class="fas fa-map-marker-alt text-gray-400"></i> ${p.barrio || 'Zona'}, ${p.ciudad}
                            </p>
                        </div>
                        <span class="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                            ${p.tipo}
                        </span>
                    </div>
                    
                    <div class="mt-4 flex gap-2">
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">${p.genero}</span>
                    </div>

                    <div class="mt-6 flex justify-between items-center">
                        <button class="text-indigo-600 font-bold text-sm hover:underline">Ver detalles</button>
                        ${p.autor_email === userEmail ? `
                            <button onclick="window.eliminarPublicacion('${p.id}')" class="text-red-400 hover:text-red-600 transition-colors">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `}).join('');
    }
};