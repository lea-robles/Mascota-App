/**
 * 🛡️ Global Error Handler - Manejo centralizado de errores
 * Normaliza errores, logs seguros, mensajes usuario-friendly
 */
export const ErrorHandler = {
  /**
   * Normaliza cualquier error a formato consistente
   * @param {Error|Object} error - Error a manejar
   * @param {string} context - Contexto (nombre función/servicio)
   * @returns {Object} Error estandarizado {status, message, context, timestamp}
   */
  handle(error, context = 'Unknown') {
    const normalizedError = {
      status: error?.status || error?.code || 500,
      message: error?.message || error?.error_description || 'Error desconocido',
      context: context,
      timestamp: new Date().toISOString()
    };

    // Log seguro (sin tokens/passwords)
    this._logSecurely(normalizedError);
    
    return normalizedError;
  },

  /**
   * Log seguro sin exponer datos sensibles
   */
  _logSecurely(error) {
    const isDev = !window.location.hostname.includes('localhost') ? false : true;
    if (isDev) {
      console.error(`[${error.context}] ${error.status} - ${error.message}`, {
        timestamp: error.timestamp,
        context: error.context
      });
    }
  },

  /**
   * Obtiene mensaje amigable según código HTTP
   * @param {number|string} status - Código HTTP o tipo de error
   * @returns {string} Mensaje traducido para el usuario
   */
  getUserMessage(status) {
    const messages = {
      400: 'Por favor verifica tus datos',
      401: 'Tu sesión expiró. Inicia sesión nuevamente',
      403: 'No tienes permisos para realizar esta acción',
      404: 'El recurso no fue encontrado',
      429: 'Estás haciendo demasiadas solicitudes. Intenta en unos segundos',
      500: 'Error del servidor. Intenta más tarde',
      'NETWORK': 'Problemas de conexión. Verifica tu internet',
      'TIMEOUT': 'La solicitud tardó demasiado. Intenta nuevamente'
    };
    return messages[status] || messages[500];
  },

  /**
   * Retry logic para network errors
   * @param {Function} fn - Función async a reintentar
   * @param {number} maxAttempts - Máximo de intentos (default: 3)
   * @param {number} delayMs - Delay entre intentos en ms (default: 1000)
   * @returns {Promise} Resultado de la función
   */
  async retry(fn, maxAttempts = 3, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isNetworkError = 
          error.message?.includes('network') || 
          error.message?.includes('fetch') ||
          error.message?.includes('Failed to fetch') ||
          !navigator.onLine;
        
        // Si no es error de red o es el último intento, lanzar
        if (!isNetworkError || attempt === maxAttempts) {
          throw error;
        }
        
        console.warn(`[RETRY] Intento ${attempt}/${maxAttempts} en ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    
    throw lastError;
  },

  /**
   * Wrapper for async functions with error handling
   * @param {Function} fn - Función async a ejecutar
   * @param {string} errorContext - Contexto para logs
   * @param {boolean} retry - Si debe reintentar en network errors
   * @returns {Promise} Resultado o error normalizado
   */
  async wrap(fn, errorContext, retry = true) {
    try {
      if (retry) {
        return await this.retry(fn);
      } else {
        return await fn();
      }
    } catch (error) {
      const normalizedError = this.handle(error, errorContext);
      // Relanzar con formato normalizado
      const err = new Error(normalizedError.message);
      err.status = normalizedError.status;
      err.context = normalizedError.context;
      throw err;
    }
  }
};
