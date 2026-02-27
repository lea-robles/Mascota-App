// 1. Importamos Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 2. CONFIGURACIÓN
const SUPABASE_URL = 'https://wqpbuthbafenkaxwiant.supabase.co'
const SUPABASE_KEY = 'sb_publishable_BocZ5OOpGKdHEJo14i1zLA_Nvqrwe5Q'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// REFERENCIAS DEL DOM
const btnLogin = document.getElementById('btn-login');
const selectProvincia = document.getElementById('select-provincia');
const selectCiudad = document.getElementById('select-ciudad');
const formProvincia = document.getElementById('form-provincia');
const formCiudad = document.getElementById('form-ciudad');
const lista = document.getElementById('lista-mascotas');
const acciones = document.getElementById('actions');
const btnMostrarForm = document.getElementById('btn-mostrar-formulario');
const divFormulario = document.getElementById('formulario-reporte');
const btnEnviar = document.getElementById('btn-enviar-reporte');
const divFiltros = document.getElementById('filters');

// Referencias del Chat Flotante
const ventanaChat = document.getElementById('ventana-chat');
const chatMensajes = document.getElementById('chat-mensajes');
const inputMensaje = document.getElementById('input-mensaje');
const btnEnviarMensaje = document.getElementById('btn-enviar-mensaje');
const chatTitulo = document.getElementById('chat-titulo');

// Bandeja y Mis Posts
const btnBandeja = document.getElementById('btn-bandeja');
const popoverBandeja = document.getElementById('popover-bandeja');
const listaChats = document.getElementById('lista-chats');
const notifCount = document.getElementById('notif-count');
const btnMisPosts = document.getElementById('btn-mis-posts');

// Modal de Edición
const modalEditar = document.getElementById('modal-editar');
const editNombre = document.getElementById('edit-nombre');
const editBarrio = document.getElementById('edit-barrio');
const editEstado = document.getElementById('edit-estado');
const btnGuardarCambios = document.getElementById('btn-guardar-cambios');

let mascotasCargadas = [];
let chatReceptor = "";
let chatPublicacionId = null;
let postEnEdicionId = null;

// --- LOGICA DE AUTENTICACIÓN ---

async function gestionarLogin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await supabase.auth.signOut();
        window.location.reload();
    } else {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    }
}

async function comprobarUsuario() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const nombre = session.user.user_metadata.full_name;
        btnLogin.textContent = `Salir (${nombre})`;
        btnLogin.classList.add('logged-in');
        if(btnBandeja) btnBandeja.classList.remove('hidden');
        if(btnMisPosts) btnMisPosts.classList.remove('hidden');
        cargarBandejaEntrada();
    } else {
        btnLogin.textContent = "Ingresar con Google";
        btnLogin.classList.remove('logged-in');
        if(btnBandeja) btnBandeja.classList.add('hidden');
        if(btnMisPosts) btnMisPosts.classList.add('hidden');
    }
}

btnLogin.addEventListener('click', gestionarLogin);

// --- FUNCIONES GLOBALES (Window) ---

window.cerrarChat = () => {
    ventanaChat.classList.add('hidden');
    chatPublicacionId = null;
};

window.abrirEditor = (id, nombre, barrio, estado) => {
    postEnEdicionId = id;
    editNombre.value = nombre;
    editBarrio.value = barrio;
    editEstado.value = estado;
    modalEditar.style.display = 'flex';
};

window.cerrarModalEdicion = () => {
    modalEditar.style.display = 'none';
};

window.eliminarPost = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta publicación? La publicación se borrará pero los mensajes se conservarán.")) {
        
        const { error } = await supabase
            .from('publicaciones')
            .delete() // <--- Ahora sí funcionará sin errores
            .eq('id', id);

        if (error) {
            console.error("Error al eliminar:", error.message);
            alert("No se pudo eliminar: " + error.message);
            return;
        }

        // Borrado visual: quitamos la tarjeta de la pantalla
        const tarjeta = document.getElementById(`post-${id}`);
        if (tarjeta) {
            tarjeta.remove();
            alert("Publicación eliminada correctamente.");
        }
    }
};

window.borrarConversacionVisual = async (emisor, publicacionId) => {
    const confirmar = confirm("¿Ocultar esta conversación de tu cuenta? Se mantendrá en la base de datos por seguridad.");
    if (confirmar) {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { error } = await supabase
            .from('mensajes')
            .update({ oculto_para_receptor: true })
            .eq('receptor', session.user.email)
            .eq('emisor', emisor)
            .eq('publicacion_id', publicacionId);

        if (!error) {
            alert("Conversación ocultada.");
            cargarBandejaEntrada();
        }
    }
};

// --- GESTIÓN DE MIS PUBLICACIONES ---

btnMisPosts.addEventListener('click', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('autor_email', session.user.email)
        .order('id', { ascending: false });

    if (error) return;

    lista.innerHTML = `<h2 style="grid-column: 1/-1; color: #2c3e50; margin-top: 10px;">Mis Reportes</h2>`;
    divFiltros.classList.add('hidden');
    
    if (data.length === 0) {
        lista.innerHTML += `<p class="msg">No tienes publicaciones aún.</p>`;
        return;
    }

    data.forEach(m => {
        const colorEstado = m.estado === 'Perdido' ? '#e74c3c' : '#2ecc71';
        lista.innerHTML += `
            <div class="card" id="post-${m.id}">
                <div class="badge" style="background-color: ${colorEstado}">${m.estado}</div>
                <img src="${m.foto || 'https://via.placeholder.com/400x250'}" alt="Mascota">
                <div class="card-content">
                    <h3>${m.nombre}</h3>
                    <p><strong>Zona:</strong> ${m.barrio}</p>
                    <p><strong>Genero:</strong> ${m.genero} </p>
                    <div class="card-actions">
                        <button onclick="window.abrirEditor(${m.id}, '${m.nombre}', '${m.barrio}', '${m.estado}')" class="btn-contact chat">Editar Datos</button>
                        <button onclick="window.eliminarPost(${m.id})" class="btn-contact mail" style="background:#e74c3c">Eliminar</button>
                    </div>
                </div>
            </div>`;
    });
});

btnGuardarCambios.addEventListener('click', async () => {
    const { error } = await supabase
        .from('publicaciones')
        .update({
            nombre: editNombre.value,
            barrio: editBarrio.value,
            estado: editEstado.value
        })
        .eq('id', postEnEdicionId);

    if (!error) {
        alert("Actualizado correctamente");
        window.cerrarModalEdicion();
        btnMisPosts.click(); 
    }
});

// --- LÓGICA DEL CHAT Y BANDEJA ---

window.abrirChatInterno = async (emailDueño, nombreMascota, publicacionId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    chatReceptor = emailDueño;
    chatPublicacionId = publicacionId;
    chatTitulo.innerText = `Chat por ${nombreMascota}`;
    ventanaChat.classList.remove('hidden');
    popoverBandeja.classList.add('hidden');

    await supabase
        .from('mensajes')
        .update({ leido: true })
        .eq('publicacion_id', publicacionId)
        .eq('receptor', session.user.email);

    cargarBandejaEntrada(); 
    cargarMensajes();
};

async function cargarBandejaEntrada() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
        .from('mensajes')
        .select('emisor, contenido, publicacion_id, leido, oculto_para_receptor, publicaciones(nombre)')
        .eq('receptor', session.user.email)
        .eq('oculto_para_receptor', false)
        .order('created_at', { ascending: false });

    if (error || !data) return;

    listaChats.innerHTML = "";
    const vistos = new Set();
    let noLeidos = 0;

    data.forEach(msg => {
        if (!msg.leido) noLeidos++;

        const idUnico = `${msg.emisor}-${msg.publicacion_id}`;
        if (!vistos.has(idUnico)) {
            vistos.add(idUnico);
            const item = document.createElement('div');
            item.className = 'item-chat';
            item.innerHTML = `
                <div class="info-chat" onclick="window.abrirChatInterno('${msg.emisor}', '${msg.publicaciones?.nombre || 'Mascota'}', ${msg.publicacion_id})">
                    <h4>${msg.publicaciones?.nombre || 'Mascota'} ${msg.leido ? '' : '🔵'}</h4>
                    <p><strong>De:</strong> ${msg.emisor.split('@')[0]}</p>
                    <p style="font-size: 0.75rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${msg.contenido}</p>
                </div>
                <button onclick="event.stopPropagation(); window.borrarConversacionVisual('${msg.emisor}', ${msg.publicacion_id})" 
                        style="background:none; border:none; color:#e74c3c; cursor:pointer; padding:5px;">
                    <i class="fas fa-eye-slash"></i>
                </button>
            `;
            listaChats.appendChild(item);
        }
    });

    if (noLeidos > 0) {
        notifCount.textContent = noLeidos;
        notifCount.classList.remove('hidden');
    } else {
        notifCount.classList.add('hidden');
    }
}

// --- GEORREF Y RENDER ---

async function cargarProvincias(elemento) {
    try {
        const response = await fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=nombre");
        const data = await response.json();
        const provincias = data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre));
        elemento.innerHTML = '<option value="">Selecciona Provincia...</option>';
        provincias.forEach(p => { elemento.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`; });
    } catch (e) {}
}

async function cargarLocalidades(nombreProvincia, elementoCiudad) {
    if (!nombreProvincia) return;
    try {
        const response = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${nombreProvincia}&campos=nombre&max=1000`);
        const data = await response.json();
        const municipios = data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        elementoCiudad.innerHTML = '<option value="">Selecciona Ciudad...</option>';
        municipios.forEach(m => { elementoCiudad.innerHTML += `<option value="${m.nombre}">${m.nombre}</option>`; });
        elementoCiudad.disabled = false;
    } catch (e) {}
}

function renderizarTarjetas(datosAMostrar) {
    lista.innerHTML = "";
    if (datosAMostrar.length === 0) {
        lista.innerHTML = `<p class="msg">No hay reportes aquí.</p>`;
        return;
    }
    datosAMostrar.forEach((m) => {
        const colorEstado = m.estado === 'Perdido' ? '#e74c3c' : '#2ecc71';
        let botonesHTML = m.permite_chat ? `<button onclick="window.abrirChatInterno('${m.autor_email}', '${m.nombre}', ${m.id})" class="btn-contact chat"><i class="fas fa-comments"></i> Chat App</button>` : '';
        if (m.telefono) botonesHTML += `<a href="https://wa.me/${m.telefono.replace(/\D/g,'')}" target="_blank" class="btn-contact wa">WhatsApp</a>`;

        lista.innerHTML += `
            <div class="card">
                <div class="badge" style="background-color: ${colorEstado}">${m.estado}</div>
                <img src="${m.foto || 'https://via.placeholder.com/400x250'}" alt="Mascota">
                <div class="card-content">
                    <h3>${m.nombre} <small>(${m.tipo})</small></h3>
                    <p><strong>Zona:</strong> ${m.barrio}</p>
                    <p><strong>Genero:</strong> ${m.genero} </p>
                    <div class="card-actions">${botonesHTML}</div>
                </div>
            </div>`;
    });
}

// Eventos de Bandeja
document.addEventListener('click', (e) => {
    if (popoverBandeja && !popoverBandeja.contains(e.target) && e.target !== btnBandeja) popoverBandeja.classList.add('hidden');
});
if(btnBandeja) btnBandeja.addEventListener('click', (e) => { e.stopPropagation(); popoverBandeja.classList.toggle('hidden'); });

async function cargarMensajes() {
    if (!chatPublicacionId) return;
    
    // CAMBIO: Usamos 'mensajes' en lugar de 'messages_full'
    const { data, error } = await supabase
        .from('mensajes') 
        .select('*')
        .eq('publicacion_id', chatPublicacionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error al cargar:", error.message);
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    chatMensajes.innerHTML = "";
    
    if(data) {
        data.forEach(msg => {
            const esMio = msg.emisor === session.user.email;
            // Creamos el elemento para evitar errores de concatenación
            const div = document.createElement('div');
            div.className = `mensaje ${esMio ? 'mio' : 'otro'}`;
            div.innerHTML = `<p>${msg.contenido}</p>`;
            chatMensajes.appendChild(div);
        });
    }
    chatMensajes.scrollTop = chatMensajes.scrollHeight;
}

// Función original mejorada
btnEnviarMensaje.addEventListener('click', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const texto = inputMensaje.value.trim();
    
    if (!texto || !session) return;

    // Limpiamos el input inmediatamente para mejor experiencia de usuario
    inputMensaje.value = "";

    const { error } = await supabase.from('mensajes').insert([{ 
        emisor: session.user.email, 
        receptor: chatReceptor, 
        contenido: texto, 
        publicacion_id: chatPublicacionId, 
        leido: false,
        oculto_para_receptor: false
    }]);

    if (error) {
        console.error("Error al enviar:", error.message);
        return;
    }

    cargarMensajes();
});

// NUEVO: Escuchar la tecla Enter en el input
inputMensaje.addEventListener('keydown', (e) => {
    // Si presiona Enter y NO está presionando Shift (por si luego quieres permitir saltos de línea)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Evita que el Enter haga un salto de línea en el input
        btnEnviarMensaje.click(); // Dispara la función de arriba
    }
});

async function escucharMascotas(provincia, ciudad) {
    const { data } = await supabase.from('publicaciones').select('*').eq('provincia', provincia).eq('ciudad', ciudad).eq('activa', true).order('id', { ascending: false });
    mascotasCargadas = data || [];
    divFiltros.classList.toggle('hidden', mascotasCargadas.length === 0);
    renderizarTarjetas(mascotasCargadas);
}

// --- EVENTOS INICIALES ---
cargarProvincias(selectProvincia);
cargarProvincias(formProvincia);
comprobarUsuario();

selectProvincia.addEventListener('change', (e) => cargarLocalidades(e.target.value, selectCiudad));
selectCiudad.addEventListener('change', (e) => { if(e.target.value) { acciones.classList.remove('hidden'); escucharMascotas(selectProvincia.value, e.target.value); }});
formProvincia.addEventListener('change', (e) => cargarLocalidades(e.target.value, formCiudad));
btnMostrarForm.addEventListener('click', () => divFormulario.classList.toggle('hidden'));

btnEnviar.addEventListener('click', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const campos = {
        nombre: document.getElementById('nombre-mascota').value,
        tipo: document.getElementById('tipo-mascota').value,
        genero: document.getElementById('genero-mascota').value,
        barrio: document.getElementById('barrio-mascota').value,
        estado: document.getElementById('estado-mascota').value,
        foto: document.getElementById('foto-link').value,
        provincia: formProvincia.value,
        ciudad: formCiudad.value,
        telefono: document.getElementById('telefono-mascota').value,
        permite_chat: document.getElementById('permite-chat').checked,
        autor_email: session.user.email,
        activa: true
    };
    const { error } = await supabase.from('publicaciones').insert([campos]);
    if (!error) { alert("¡Publicado!"); location.reload(); }
});

// Realtime
supabase.channel('mensajes-live').on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, (payload) => {
    if (payload.new && payload.new.publicacion_id === chatPublicacionId) cargarMensajes();
    cargarBandejaEntrada();
}).subscribe();