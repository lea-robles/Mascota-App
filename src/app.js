import { AuthService } from './services/authService.js';
import { PostService } from './services/postService.js';
import { UploadService } from './services/uploadService.js';
import { GeoService } from './services/geoService.js';
import { UI } from './ui/notifications.js';
import { RenderCards } from './ui/renderCards.js';

let currentUser = null;
let archivosTemporales = []; // Para manejar múltiples fotos y eliminarlas antes de subir

// --- ACCIONES GLOBALES ---
window.loginConGoogle = async () => {
    try { await AuthService.signInWithGoogle(); } catch (e) { UI.notify("Error al iniciar sesión", "error"); }
};

window.logout = async () => {
    await AuthService.signOut();
    window.location.reload();
};

window.abrirModal = () => document.getElementById('modal-publicar')?.classList.remove('hidden');

window.cerrarModal = () => {
    document.getElementById('modal-publicar')?.classList.add('hidden');
    document.getElementById('form-publicar')?.reset();
    archivosTemporales = [];
    actualizarVistaPrevia();
};

// --- FILTROS DE ZONA GLOBAL ---
window.aplicarFiltroZona = () => mostrarDashboard();

async function inicializarUbicaciones() {
    try {
        const provincias = await GeoService.obtenerProvincias();
        // Llenar selectores (del filtro y del modal)
        const combosProv = [document.getElementById('filter-provincia'), document.getElementById('select-provincia')];
        const combosCiu = [document.getElementById('filter-ciudad'), document.getElementById('select-ciudad')];

        const opcionesProv = provincias.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
        combosProv.forEach(c => { if(c) c.innerHTML = opcionesProv; });

        // Evento para cargar ciudades dinámicamente
        combosProv.forEach((c, index) => {
            c.addEventListener('change', async (e) => {
                const municipios = await GeoService.obtenerMunicipios(e.target.value);
                const opcionesCiu = municipios.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('');
                if(combosCiu[index]) combosCiu[index].innerHTML = opcionesCiu;
            });
            c.dispatchEvent(new Event('change'));
        });
    } catch (e) { console.error("GeoError:", e); }
}

// --- GESTIÓN DE FOTOS ---
document.getElementById('input-fotos')?.addEventListener('change', (e) => {
    const nuevosFiles = Array.from(e.target.files);
    archivosTemporales = [...archivosTemporales, ...nuevosFiles];
    actualizarVistaPrevia();
});

function actualizarVistaPrevia() {
    const preview = document.getElementById('preview-fotos');
    if (!preview) return;
    preview.innerHTML = '';
    
    archivosTemporales.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const div = document.createElement('div');
        div.className = "relative group h-20";
        div.innerHTML = `
            <img src="${url}" class="w-full h-full object-cover rounded-xl border">
            <button type="button" onclick="window.quitarFoto(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                &times;
            </button>
        `;
        preview.appendChild(div);
    });
}

window.quitarFoto = (index) => {
    archivosTemporales.splice(index, 1);
    actualizarVistaPrevia();
};

// --- INICIO DE LA APP ---
document.addEventListener('DOMContentLoaded', async () => {
    UI.showLoading(true);
    try {
        currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
            await inicializarUbicaciones();
            mostrarDashboard();
        } else {
            mostrarBienvenida();
        }
    } catch (error) { console.error(error); } 
    finally { UI.showLoading(false); }
});

function mostrarBienvenida() {
    document.getElementById('view-welcome')?.classList.remove('hidden');
    document.getElementById('view-dashboard')?.classList.add('hidden');
}

async function mostrarDashboard() {
    document.getElementById('view-welcome')?.classList.add('hidden');
    document.getElementById('view-dashboard')?.classList.remove('hidden');
    
    const labelNombre = document.getElementById('user-name');
    if (labelNombre) labelNombre.innerText = currentUser.user_metadata.full_name;

    try {
        const provSelect = document.getElementById('filter-provincia');
        const provincia = provSelect.options[provSelect.selectedIndex].text;
        const ciudad = document.getElementById('filter-ciudad').value;

        const publicaciones = await PostService.fetchByLocation(provincia, ciudad);
        const contenedor = document.getElementById('container-publicaciones');
        if (contenedor) RenderCards.draw(contenedor, publicaciones, currentUser.email);
    } catch (e) { UI.notify("Error al cargar datos", "error"); }
}

// --- ENVÍO DE REPORTE ---
document.getElementById('form-publicar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (archivosTemporales.length === 0) return UI.notify("Añade al menos una foto", "error");

    try {
        UI.showLoading(true);
        UI.notify("Procesando reporte...");

        const urls = await UploadService.uploadImages(archivosTemporales);
        
        const provSelect = document.getElementById('select-provincia');
        const nuevaMascota = {
            nombre: document.getElementById('input-nombre').value,
            tipo: document.getElementById('select-tipo').value,
            genero: document.getElementById('select-genero').value,
            provincia: provSelect.options[provSelect.selectedIndex].text,
            ciudad: document.getElementById('select-ciudad').value,
            barrio: document.getElementById('input-barrio').value || "Sin especificar",
            foto: urls,
            estado: document.querySelector('input[name="estado"]:checked').value,
            autor_email: currentUser.email,
            activa: true,
            permite_chat: true,
            telefono: document.getElementById('input-telefono').value || ""
        };

        const { error } = await PostService.create(nuevaMascota);
        if (error) throw error;

        UI.notify("¡Mascota reportada con éxito!", "success");
        cerrarModal();
        setTimeout(() => mostrarDashboard(), 500);
    } catch (error) {
        UI.notify("Error al publicar", "error");
    } finally {
        UI.showLoading(false);
    }
});