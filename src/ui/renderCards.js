export const RenderCards = {
    draw(contenedor, publicaciones, currentUser) {
        if (publicaciones.length === 0) {
            contenedor.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <i class="fas fa-paw text-gray-200 text-6xl mb-4"></i>
                    <p class="text-gray-500 font-medium">No hay mascotas publicadas en esta zona.</p>
                </div>`;
            return;
        }

        // Para compatibilidad con código que pasa userEmail
        const userEmail = typeof currentUser === 'string' ? currentUser : currentUser?.email;
        const userId = typeof currentUser === 'object' ? currentUser?.id : null;

        contenedor.innerHTML = publicaciones.map(p => {
            // Usar la primera foto del array o un placeholder
            const imagenUrl = (p.foto && p.foto.length > 0) ? p.foto[0] : 'https://via.placeholder.com/400x300?text=Sin+Foto';
            const colorEstado = p.estado === 'Perdido' ? 'bg-red-500' : 'bg-green-500';

            // Verificar si es el autor del post
            const esAutor = p.autor_email === userEmail;
            
            // Verificar si ya hay conversación activa
            const tieneConversacionActiva = window.GlobalState?.activeConversation && 
                                           p.autor_id && 
                                           window.GlobalState.activeConversation.includes(p.autor_id);

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
                        <div class="flex gap-2 items-center">
                            ${!esAutor && userId ? `
                                <button 
                                    onclick="window.contactarAutor('${p.id}', '${p.autor_id}', '${p.nombre}')"
                                    class="contactar-btn bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tieneConversacionActiva ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${tieneConversacionActiva ? 'disabled' : ''}
                                    title="Envía un mensaje al dueño de esta mascota"
                                >
                                    <i class="fas fa-envelope"></i> Contactar
                                </button>
                            ` : !userId && !esAutor ? `
                                <button 
                                    onclick="window.showHome()"
                                    class="contactar-btn bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    title="Inicia sesión para contactar"
                                >
                                    <i class="fas fa-envelope"></i> Contactar
                                </button>
                            ` : ''}
                            ${esAutor ? `
                                <button 
                                    onclick="window.eliminarPublicacion('${p.id}')" 
                                    class="text-red-400 hover:text-red-600 transition-colors"
                                    title="Eliminar publicación"
                                >
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');

        // Agregar estilos para animación del botón
        this.injectStyles();
    },

    /**
     * Inyecta estilos CSS para el botón de contactar
     */
    injectStyles() {
        // Verificar si ya existen los estilos
        if (document.getElementById('contactar-styles')) return;

        const style = document.createElement('style');
        style.id = 'contactar-styles';
        style.textContent = `
            .contactar-btn {
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .contactar-btn:hover:not(:disabled) {
                background-color: #388E3C !important;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transform: translateY(-2px);
            }

            .contactar-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .contactar-btn i {
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }
};

/**
 * Manejar el click en botón "Contactar"
 * @param {string} postId - ID del post
 * @param {string} autorId - ID del autor
 * @param {string} nombreMascota - Nombre de la mascota (para referencia)
 */
window.contactarAutor = async (postId, autorId, nombreMascota) => {
    try {
        // Verificar que usuario esté logueado
        if (!window.GlobalState?.currentUser?.id) {
            window.UI?.notify("Inicia sesión para contactar", "warning");
            return;
        }

        const currentUserId = window.GlobalState.currentUser.id;

        // No permitir que usuario contacte a sí mismo
        if (currentUserId === autorId) {
            window.UI?.notify("No puedes contactarte a ti mismo", "warning");
            return;
        }

        // Mostrar loader
        const btnContactar = event?.target.closest('.contactar-btn');
        const textoOriginal = btnContactar?.innerHTML;
        if (btnContactar) {
            btnContactar.disabled = true;
            btnContactar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cargando...`;
        }

        // Crear conversación (evita duplicados automáticamente)
        const conversation = await window.ChatService.createConversation(currentUserId, autorId);

        if (!conversation || !conversation.id) {
            throw new Error('No se pudo crear la conversación');
        }

        // Guardar en estado global
        window.GlobalState.activeConversation = conversation.id;

        // Notificar éxito
        window.UI?.notify(`✅ Chat iniciado con el dueño de ${nombreMascota}`, "success");

        // Redirigir al chat
        setTimeout(() => {
            window.showChat(conversation.id);
        }, 500);

    } catch (error) {
        console.error('Error al contactar autor:', error);
        window.UI?.notify("Error al iniciar el chat. Intenta nuevamente.", "error");
        
        // Restaurar botón si hay error
        const btnContactar = event?.target.closest('.contactar-btn');
        if (btnContactar) {
            btnContactar.disabled = false;
            btnContactar.innerHTML = `<i class="fas fa-envelope"></i> Contactar`;
        }
    }
};
