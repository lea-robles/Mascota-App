/**
 * 📦 Cache Manager - localStorage con TTL
 * Mejora performance cachando posts por 30 minutos
 */
export const CacheManager = {
  // TTL: 30 minutos en milisegundos
  DEFAULT_TTL: 30 * 60 * 1000,

  /**
   * Guarda dato en cache con timestamp
   * @param {string} key - Clave de identificación
   * @param {any} data - Datos a guardar
   * @param {number} ttl - Tiempo de vida en ms (default: 30 min)
   */
  set(key, data, ttl = this.DEFAULT_TTL) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`mascota_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`[CacheManager] Error guardando cache para ${key}:`, error);
    }
  },

  /**
   * Obtiene dato del cache si no ha expirado
   * @param {string} key - Clave de identificación
   * @returns {any|null} Datos si son válidos, null si expiró o no existe
   */
  get(key) {
    try {
      const cached = localStorage.getItem(`mascota_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();
      const age = now - timestamp;

      // Si expiró, eliminar
      if (age > ttl) {
        this.invalidate(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn(`[CacheManager] Error leyendo cache para ${key}:`, error);
      return null;
    }
  },

  /**
   * Invalida (elimina) un cache específico
   * @param {string} key - Clave a eliminar
   */
  invalidate(key) {
    try {
      localStorage.removeItem(`mascota_cache_${key}`);
    } catch (error) {
      console.warn(`[CacheManager] Error invalidando cache:`, error);
    }
  },

  /**
   * Invalida todos los caches de la app
   */
  invalidateAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mascota_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn(`[CacheManager] Error invalidando todos los caches:`, error);
    }
  },

  /**
   * Obtiene tamaño total de cache en KB
   */
  getSize() {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mascota_cache_')) {
          size += localStorage.getItem(key).length;
        }
      });
      return (size / 1024).toFixed(2);
    } catch (error) {
      return '0.00';
    }
  }
};
