import { AuthService } from './services/authService.js';
import { PostService } from './services/postService.js';
import { UploadService } from './services/uploadService.js';
import { GeoService } from './services/geoService.js';
import { ChatService } from './services/chatService.js';
import { UI } from './ui/notifications.js';
import { RenderCards } from './ui/renderCards.js';
import { CacheManager } from './utils/cacheManager.js';
import { PerformanceOptimizer } from './utils/performanceOptimizer.js';

// ============================================
// 🌍 ESTADO GLOBAL LIMPIO
// ============================================

const GlobalState = {
  currentUser: null,
  selectedLocation: {
    provincia: null,
    ciudad: null
  },
  activeConversation: null,
  archivosTemporales: []
};

// ============================================
// 🔐 VALIDACIÓN DE ENTRADA
// ============================================

const ValidationRules = {
  // Email: RFC 5322 simplificado
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Teléfono: Argentina +54 con 9-10 dígitos
  phone: /^\+?54\d{9,10}$/,
  
  // Dirección: mínimo 10 caracteres
  address: {
    minLength: 10,
    test: (value) => value && value.trim().length >= 10
  },
  
  // Nombre: mínimo 3 caracteres
  name: {
    minLength: 3,
    test: (value) => value && value.trim().length >= 3
  }
};

/**
 * Valida un campo de formulario según su tipo
 * @param {string} value - Valor a validar
 * @param {string} fieldType - Tipo: 'email', 'phone', 'address', 'name'
 * @returns {object} { valid: boolean, message: string }
 */
window.validateFormField = (value, fieldType) => {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Este campo es requerido' };
  }

  switch (fieldType) {
    case 'email':
      if (!ValidationRules.email.test(value)) {
        return { valid: false, message: 'Email inválido' };
      }
      return { valid: true, message: '' };

    case 'phone':
      if (!ValidationRules.phone.test(value.replace(/\s/g, ''))) {
        return {
          valid: false,
          message: 'Teléfono inválido. Usa formato: +54 seguido de 9-10 dígitos'
        };
      }
      return { valid: true, message: '' };

    case 'address':
      if (!ValidationRules.address.test(value)) {
        return {
          valid: false,
          message: `La dirección debe tener al menos ${ValidationRules.address.minLength} caracteres`
        };
      }
      return { valid: true, message: '' };

    case 'name':
      if (!ValidationRules.name.test(value)) {
        return {
          valid: false,
          message: `El nombre debe tener al menos ${ValidationRules.name.minLength} caracteres`
        };
      }
      return { valid: true, message: '' };

    default:
      return { valid: true, message: '' };
  }
};

/**
 * Valida un formulario completo antes de enviarlo
 * @param {object} fields - { email: '', phone: '', address: '', ...}
 * @returns {boolean} True si todo es válido
 */
const validateForm = (fields) => {
  const validations = [];
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const result = window.validateFormField(value, fieldName);
    if (!result.valid) {
      validations.push(result.message);
    }
  }

  if (validations.length > 0) {
    validations.forEach(msg => UI.notify(msg, "error"));
    return false;
  }

  return true;
};

// ============================================
// 🗺️ ACTUALIZAR ESTADO DE UBICACIÓN
// ============================================

/**
 * Actualiza la ubicación seleccionada en el estado global
 */
window.updateLocationState = (provincia, ciudad) => {
  GlobalState.selectedLocation.provincia = provincia;
  GlobalState.selectedLocation.ciudad = ciudad;
};

/**
 * ⚡ Aplica filtro de zona con debounce (debería ser llamado por botón cambiar)
 * Invalida cache anterior y recarga posts
 */
const aplicarFiltroZonaFn = async () => {
  // Invalidar todos los caches anteriorespara forzar reload
  CacheManager.invalidateAll();
  
  // Recargar dashboard
  await window.showDashboard();
  
  UI.notify("✅ Filtro aplicado", "success");
};

// ⚡ Crear versión debounceda
window.aplicarFiltroZona = PerformanceOptimizer.debounce(aplicarFiltroZonaFn, 300);

// ============================================
// 🧭 FUNCIONES DE NAVEGACIÓN (VISTAS PRINCIPALES)
// ============================================

/**
 * Muestra la vista de Bienvenida (Login/Signup)
 */
window.showHome = () => {
  const viewWelcome = document.getElementById('view-welcome');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewChat = document.getElementById('view-chat');
  const viewPostDetail = document.getElementById('view-post-detail');
  const viewInbox = document.getElementById('view-inbox');

  viewWelcome?.classList.remove('hidden');
  viewDashboard?.classList.add('hidden');
  viewChat?.classList.add('hidden');
  viewPostDetail?.classList.add('hidden');
  viewInbox?.classList.add('hidden');

  GlobalState.activeConversation = null;
};

/**
 * Muestra el Dashboard (Feed de posts según ubicación seleccionada)
 */
window.showDashboard = async () => {
  const viewWelcome = document.getElementById('view-welcome');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewChat = document.getElementById('view-chat');
  const viewPostDetail = document.getElementById('view-post-detail');
  const viewInbox = document.getElementById('view-inbox');

  viewWelcome?.classList.add('hidden');
  viewDashboard?.classList.remove('hidden');
  viewChat?.classList.add('hidden');
  viewPostDetail?.classList.add('hidden');
  viewInbox?.classList.add('hidden');

  // Mostrar nombre del usuario
  const labelNombre = document.getElementById('user-name');
  if (labelNombre && GlobalState.currentUser) {
    labelNombre.innerText = GlobalState.currentUser.user_metadata?.full_name || 'Usuario';
  }

  try {
    // Obtener ubicación seleccionada
    const provSelect = document.getElementById('filter-provincia');
    const provincia =provSelect?.options[provSelect.selectedIndex]?.text || GlobalState.selectedLocation.provincia;
    const ciudad = document.getElementById('filter-ciudad')?.value || GlobalState.selectedLocation.ciudad;

    // Actualizar estado
    window.updateLocationState(provincia, ciudad);

    // ⚡ Cache key: provincia+ciudad
    const cacheKey = `posts_${provincia}_${ciudad}`;
    
    // Intentar obtener del cache primero
    let publicaciones = CacheManager.get(cacheKey);
    
    if (publicaciones) {
      console.log(`[CACHE HIT] Posts para ${provincia}/${ciudad} cargados del cache`);
    } else {
      console.log(`[CACHE MISS] Cargando posts desde Supabase...`);
      // Cargar desde Supabase y cachear
      publicaciones = await PostService.fetchByLocation(provincia, ciudad, GlobalState.currentUser?.id);
      CacheManager.set(cacheKey, publicaciones, 30 * 60 * 1000); // 30 min TTL
    }

    const contenedor = document.getElementById('container-publicaciones');
    
    if (contenedor && GlobalState.currentUser) {
      RenderCards.draw(contenedor, publicaciones, GlobalState.currentUser);
    }
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    UI.notify("Error al cargar las publicaciones", "error");
  }
};

/**
 * Muestra el detalle de una conversación de chat
 * @param {string} conversationId - ID de la conversación
 */
window.showChat = (conversationId) => {
  const viewWelcome = document.getElementById('view-welcome');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewChat = document.getElementById('view-chat');
  const viewPostDetail = document.getElementById('view-post-detail');
  const viewInbox = document.getElementById('view-inbox');

  viewWelcome?.classList.add('hidden');
  viewDashboard?.classList.add('hidden');
  viewChat?.classList.remove('hidden');
  viewPostDetail?.classList.add('hidden');
  viewInbox?.classList.add('hidden');

  GlobalState.activeConversation = conversationId;

  // Aquí se cargaría el historial del chat (FASE 1a)
  console.log(`Cargando chat: ${conversationId}`);
};

/**
 * Muestra el detalle de una publicación específica
 * @param {string} postId - ID de la publicación
 */
window.showPostDetail = (postId) => {
  const viewWelcome = document.getElementById('view-welcome');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewChat = document.getElementById('view-chat');
  const viewPostDetail = document.getElementById('view-post-detail');
  const viewInbox = document.getElementById('view-inbox');

  viewWelcome?.classList.add('hidden');
  viewDashboard?.classList.add('hidden');
  viewChat?.classList.add('hidden');
  viewPostDetail?.classList.remove('hidden');
  viewInbox?.classList.add('hidden');

  // Aquí se cargarían los detalles del post (autor, ubicación, botón contactar)
  console.log(`Cargando detalle de post: ${postId}`);
};

/**
 * Muestra la Bandeja de Entrada (lista de conversaciones activas)
 */
window.showInbox = () => {
  const viewWelcome = document.getElementById('view-welcome');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewChat = document.getElementById('view-chat');
  const viewPostDetail = document.getElementById('view-post-detail');
  const viewInbox = document.getElementById('view-inbox');

  viewWelcome?.classList.add('hidden');
  viewDashboard?.classList.add('hidden');
  viewChat?.classList.add('hidden');
  viewPostDetail?.classList.add('hidden');
  viewInbox?.classList.remove('hidden');

  GlobalState.activeConversation = null;

  // Aquí se cargaría la lista de conversaciones
  console.log('Cargando bandeja de entrada');
};

// ============================================
// 📤 FUNCIÓN CRÍTICA: ELIMINAR PUBLICACIÓN
// ============================================

/**
 * Elimina una publicación (soft delete)
 * @param {string} postId - ID de la publicación a eliminar
 */
window.eliminarPublicacion = async (postId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
    return;
  }

  try {
    UI.showLoading(true);
    
    // Usar softDelete de PostService
    await PostService.softDelete(postId);
    
    UI.notify("✅ Publicación eliminada correctamente", "success");
    
    // Refrescar el feed
    setTimeout(() => window.showDashboard(), 500);
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    UI.notify("❌ Error al eliminar la publicación. Intenta nuevamente.", "error");
  } finally {
    UI.showLoading(false);
  }
};

// ============================================
// 🔐 AUTENTICACIÓN
// ============================================

window.loginConGoogle = async () => {
  try {
    UI.showLoading(true);
    await AuthService.signInWithGoogle();
    GlobalState.currentUser = await AuthService.getCurrentUser();
    if (GlobalState.currentUser) {
      await inicializarUbicaciones();
      window.showDashboard();
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    UI.notify("Error al iniciar sesión con Google", "error");
  } finally {
    UI.showLoading(false);
  }
};

window.logout = async () => {
  try {
    await AuthService.signOut();
    GlobalState.currentUser = null;
    GlobalState.activeConversation = null;
    window.location.reload();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    UI.notify("Error al cerrar sesión", "error");
  }
};

// ============================================
// 📝 GESTIÓN DEL MODAL DE PUBLICACIÓN
// ============================================

window.abrirModal = () => {
  document.getElementById('modal-publicar')?.classList.remove('hidden');
};

window.cerrarModal = () => {
  document.getElementById('modal-publicar')?.classList.add('hidden');
  document.getElementById('form-publicar')?.reset();
  GlobalState.archivosTemporales = [];
  actualizarVistaPrevia();
};

/**
 * Agrega fotos temporales y actualiza la vista previa
 */
document.getElementById('input-fotos')?.addEventListener('change', (e) => {
  const nuevosFiles = Array.from(e.target.files);
  GlobalState.archivosTemporales = [
    ...GlobalState.archivosTemporales,
    ...nuevosFiles
  ];
  actualizarVistaPrevia();
});

/**
 * Actualiza la vista previa de fotos en el formulario
 */
function actualizarVistaPrevia() {
  const preview = document.getElementById('preview-fotos');
  if (!preview) return;

  preview.innerHTML = '';

  GlobalState.archivosTemporales.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = "relative group h-20";
    div.innerHTML = `
      <img src="${url}" class="w-full h-full object-cover rounded-xl border">
      <button type="button" onclick="window.quitarFoto(${index})" 
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
        &times;
      </button>
    `;
    preview.appendChild(div);
  });
}

/**
 * Remueve una foto de la lista temporal
 */
window.quitarFoto = (index) => {
  GlobalState.archivosTemporales.splice(index, 1);
  actualizarVistaPrevia();
};

// ============================================
// 🌍 INICIALIZACIÓN DE UBICACIONES
// ============================================

async function inicializarUbicaciones() {
  try {
    const provincias = await GeoService.obtenerProvincias();
    
    // Llenar selectores
    const combosProv = [
      document.getElementById('filter-provincia'),
      document.getElementById('select-provincia')
    ];
    const combosCiu = [
      document.getElementById('filter-ciudad'),
      document.getElementById('select-ciudad')
    ];

    const opcionesProv = provincias
      .map(p => `<option value="${p.id}">${p.nombre}</option>`)
      .join('');

    combosProv.forEach(c => {
      if (c) c.innerHTML = opcionesProv;
    });

    // ⚡ Crear función debounceda para cargar ciudades
    const cargarCiudadesDebounceada = PerformanceOptimizer.debounce(async (provinciaId, index) => {
      try {
        const municipios = await GeoService.obtenerMunicipios(provinciaId);
        const opcionesCiu = municipios
          .map(m => `<option value="${m.nombre}">${m.nombre}</option>`)
          .join('');
        if (combosCiu[index]) {
          combosCiu[index].innerHTML = opcionesCiu;
        }
      } catch (error) {
        console.error('Error al cargar ciudades:', error);
      }
    }, 300); // 300ms delay

    // Evento para cargar ciudades dinámicamente
    combosProv.forEach((c, index) => {
      c?.addEventListener('change', (e) => {
        // Usar debounce para evitar múltiples requests
        cargarCiudadesDebounceada(e.target.value, index);
      });
      c?.dispatchEvent(new Event('change'));
    });
  } catch (error) {
    console.error('Error al inicializar ubicaciones:', error);
  }
}

// ============================================
// 📋 ENVÍO DE PUBLICACIÓN (REPORTE)
// ============================================

document.getElementById('form-publicar')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validar que haya fotos
  if (GlobalState.archivosTemporales.length === 0) {
    return UI.notify("⚠️ Debes añadir al menos una foto", "error");
  }

  // Recopilar datos del formulario
  const nombre = document.getElementById('input-nombre')?.value || '';
  const telefono = document.getElementById('input-telefono')?.value || '';
  const barrio = document.getElementById('input-barrio')?.value || '';

  // Validar campos críticos
  const fieldsToValidate = {
    name: nombre,
    phone: telefono,
    address: barrio
  };

  if (!validateForm(fieldsToValidate)) {
    return; // Las validaciones mostran mensajes de error
  }

  try {
    UI.showLoading(true);
    UI.notify("📤 Procesando publicación...");

    // Subir imágenes
    const urls = await UploadService.uploadImages(GlobalState.archivosTemporales);

    // Preparar datos de la publicación
    const provSelect = document.getElementById('select-provincia');
    const nuevaMascota = {
      nombre: nombre,
      tipo: document.getElementById('select-tipo')?.value || '',
      genero: document.getElementById('select-genero')?.value || '',
      provincia: provSelect?.options[provSelect.selectedIndex]?.text || '',
      ciudad: document.getElementById('select-ciudad')?.value || '',
      barrio: barrio || "Sin especificar",
      foto: urls,
      estado: document.querySelector('input[name="estado"]:checked')?.value || 'perdido',
      autor_email: GlobalState.currentUser?.email || '',
      activa: true,
      permite_chat: true,
      telefono: telefono
    };

    // Crear publicación
    const { error } = await PostService.create(nuevaMascota);
    if (error) throw error;

    UI.notify("✅ ¡Mascota reportada con éxito!", "success");
    window.cerrarModal();
    
    // Refrescar feed
    setTimeout(() => window.showDashboard(), 500);
  } catch (error) {
    console.error('Error al publicar:', error);
    UI.notify("❌ Error al publicar. Intenta nuevamente.", "error");
  } finally {
    UI.showLoading(false);
  }
});

// ============================================
// 🎯 GESTIÓN DE MODAL DE TÉRMINOS
// ============================================

let termsAccepted = false;

function inicializarModalTerminos() {
  const checkbox = document.getElementById('termsCheckbox');
  const acceptBtn = document.getElementById('acceptTermsBtn');
  const rejectBtn = document.getElementById('rejectTermsBtn');

  // Habilitar botón de aceptar solo si checkbox está marcado
  checkbox?.addEventListener('change', (e) => {
    acceptBtn.disabled = !e.target.checked;
  });

  // Aceptar términos
  acceptBtn?.addEventListener('click', () => {
    termsAccepted = true;
    cerrarModalTerminos();
  });

  // Rechazar términos
  rejectBtn?.addEventListener('click', () => {
    termsAccepted = false;
    cerrarModalTerminos();
    checkbox.checked = false;
    UI.notify("Debes aceptar los términos para continuar", "error");
  });
}

function mostrarModalTerminos() {
  document.getElementById('termsModal')?.classList.remove('hidden');
}

function cerrarModalTerminos() {
  document.getElementById('termsModal')?.classList.add('hidden');
  document.getElementById('termsCheckbox').checked = false;
  document.getElementById('acceptTermsBtn').disabled = true;
}

// ============================================
// � CONFIGURACIÓN & GDPR
// ============================================

/**
 * Abre modal de configuración (privacidad y GDPR)
 */
window.abrirConfiguracion = () => {
  document.getElementById('configModal')?.classList.remove('hidden');
};

/**
 * Cierra modal de configuración
 */
window.cerrarConfiguracion = () => {
  document.getElementById('configModal')?.classList.add('hidden');
};

/**
 * 📥 GDPR: Exporta todos los datos del usuario en JSON
 */
window.exportarMisDatos = async () => {
  if (!confirm('Se descargará un archivo con todos tus datos. ¿Deseas continuar?')) {
    return;
  }

  try {
    UI.showLoading(true);
    UI.notify("📥 Preparando tus datos...", "info");

    const userData = await AuthService.exportUserData(GlobalState.currentUser.id);
    
    // Crear archivo JSON y descargar
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mascota-app-datos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    window.cerrarConfiguracion();
    UI.notify("✅ Datos descargados exitosamente", "success");
  } catch (error) {
    console.error('Error exportando datos:', error);
    UI.notify(`❌ Error: ${error.message}`, "error");
  } finally {
    UI.showLoading(false);
  }
};

/**
 * 🗑️ GDPR: Solicita eliminación de datos (30 días de gracia)
 */
window.solicitarEliminacion = async () => {
  if (!confirm('Esto solicitará la eliminación de tu cuenta y todos tus datos en 30 días. ¿Estás seguro?')) {
    return;
  }

  const confirmEmail = prompt('Por favor, escribe tu email para confirmar:');
  if (!confirmEmail || confirmEmail !== GlobalState.currentUser.email) {
    UI.notify("❌ Email incorrecto. Operación cancelada.", "error");
    return;
  }

  try {
    UI.showLoading(true);
    UI.notify("🗑️ Procesando solicitud de eliminación...", "info");

    const result = await AuthService.requestDataDeletion(GlobalState.currentUser.id);
    
    window.cerrarConfiguracion();
    UI.notify(result.message, "warning");
    
    // Logout automático después de solicitar eliminación
    setTimeout(() => {
      window.logout();
    }, 3000);
  } catch (error) {
    console.error('Error solicitando eliminación:', error);
    UI.notify(`❌ Error: ${error.message}`, "error");
  } finally {
    UI.showLoading(false);
  }
};

// ============================================
// �🚀 INICIO DE LA APP
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  UI.showLoading(true);
  try {
    GlobalState.currentUser = await AuthService.getCurrentUser();
    if (GlobalState.currentUser) {
      await inicializarUbicaciones();
      window.showDashboard();
    } else {
      window.showHome();
    }
  } catch (error) {
    console.error('Error al inicializar app:', error);
  } finally {
    UI.showLoading(false);
    inicializarModalTerminos();
  }
});
