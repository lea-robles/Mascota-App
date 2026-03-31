/**
 * ⚡ Performance Optimizer
 * Debounce, throttle, lazy loading, etc.
 */
export const PerformanceOptimizer = {
  /**
   * Debounce: Ejecuta función después de N ms sin llamadas
   * Útil para: search, resize, input
   * @param {Function} fn - Función a ejecutar
   * @param {number} delayMs - Delay en ms
   * @returns {Function} Función debounceada
   */
  debounce(fn, delayMs = 500) {
    let timeoutId = null;

    return function (...args) {
      // Cancelar timeout anterior
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Crear nuevo timeout
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        timeoutId = null;
      }, delayMs);
    };
  },

  /**
   * Throttle: Ejecuta función máximo cada N ms
   * Útil para: scroll, resize, mousemove
   * @param {Function} fn - Función a ejecutar
   * @param {number} delayMs - Delay mínimo entre ejecuciones
   * @returns {Function} Función throttleada
   */
  throttle(fn, delayMs = 500) {
    let lastRun = 0;
    let timeoutId = null;

    return function (...args) {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun;

      if (timeSinceLastRun >= delayMs) {
        fn.apply(this, args);
        lastRun = now;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fn.apply(this, args);
          lastRun = Date.now();
        }, delayMs - timeSinceLastRun);
      }
    };
  },

  /**
   * Lazy Loading con Intersection Observer
   * Carga elementos cuando están visibles en viewport
   * @param {string} selector - Selector CSS de elementos
   * @param {Function} loadCallback - Función callback cuando es visible
   * @param {object} options - Opciones de Intersection Observer
   */
  setupLazyLoading(selector, loadCallback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '100px', // Empieza a cargar 100px antes de ser visible
      threshold: 0.01
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Validar soporte
    if (!('IntersectionObserver' in window)) {
      console.warn('[PerformanceOptimizer] Intersection Observer no soportado');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadCallback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, mergedOptions);

    // Observar todos los elementos
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });

    return observer;
  },

  /**
   * Mide performance de una función
   * @param {string} label - Nombre de la métrica
   * @param {Function} fn - Función a medir
   * @param {number} iterations - Cuántas veces ejecutar
   * @returns {object} {avg, min, max, total}
   */
  measurePerformance(label, fn, iterations = 1) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    const result = {
      label,
      iterations,
      times,
      avg: (times.reduce((a, b) => a + b) / times.length).toFixed(2),
      min: Math.min(...times).toFixed(2),
      max: Math.max(...times).toFixed(2),
      total: times.reduce((a, b) => a + b).toFixed(2)
    };

    console.log(`[PERF] ${label}: ${result.avg}ms (avg) | ${result.min}ms (min) | ${result.max}ms (max)`);
    return result;
  },

  /**
   * Solicita Animation Frame (para animaciones smooth)
   * @param {Function} callback - Función a ejecutar en frame siguiente
   */
  requestAnimationFrame(callback) {
    if (window.requestAnimationFrame) {
      return window.requestAnimationFrame(callback);
    } else {
      // Fallback para navegadores antiguos
      return setTimeout(callback, 1000 / 60);
    }
  },

  /**
   * Cancela Animation Frame
   * @param {number} id - ID del frame request
   */
  cancelAnimationFrame(id) {
    if (window.cancelAnimationFrame) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  },

  /**
   * Carga imágenes de forma asincrónica
   * @param {string} src - URL de la imagen
   * @returns {Promise} Resuelve cuando está cargada
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * Obtiene información del navegador/dispositivo
   */
  getDeviceInfo() {
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      network: navigator.connection?.effectiveType || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      online: navigator.onLine,
      userAgent: navigator.userAgent
    };
  },

  /**
   * Monitorea cambios en la conexión
   * @param {Function} callback - Se llama cuando cambia la conexión
   */
  watchNetworkStatus(callback) {
    callback(navigator.onLine ? 'online' : 'offline');

    window.addEventListener('online', () => {
      console.log('[NETWORK] Online');
      callback('online');
    });

    window.addEventListener('offline', () => {
      console.log('[NETWORK] Offline');
      callback('offline');
    });
  }
};
