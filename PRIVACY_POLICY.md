# 🔐 Política de Privacidad - Mascota App

**Fecha de efectividad:** Enero 2024  
**Última actualización:** Enero 2024

## 1. Información que Recopilamos

### 1.1 Información Proporcionada por el Usuario
- **Cuenta:** Email, nombre, foto de perfil (vía Google OAuth)
- **Publicaciones:** Tipo de mascota, género, estado, fotos, provincia, ciudad, barrio
- **Contacto:** Teléfono y dirección (solo visible para usuarios autenticados)

### 1.2 Información Automática
- Dirección IP
- Tipo de navegador y dispositivo
- Ubicación aproximada (de GeoRef API)
- Datos de interacción (posts visto, mensajes enviados, conversaciones)

## 2. Cómo Usamos tu Información

### 2.1 Propósitos Principales
- Conectar dueños de mascotas perdidas/encontradas
- Facilitar mensajería privada entre usuarios
- Mostrar publicaciones relevantes por ubicación
- Mejorar la seguridad y prevenir fraude
- Enviar notificaciones de mensajes nuevos

### 2.2 NO Hacemos
- ❌ Venta de datos a terceros
- ❌ Marketing sin consentimiento previo
- ❌ Compartir teléfono/dirección sin tu autorización
- ❌ Perfiles públicos de usuarios no deseados

## 3. Protección de Datos

### 3.1 Medidas de Seguridad
- Encriptación SSL/TLS en tránsito
- Base de datos PostgreSQL asegurada en Supabase
- Autenticación vía Google OAuth (no almacenamos contraseñas)
- Row Level Security (RLS) en todas las tablas

### 3.2 Retención de Datos
- Posts activos: Indefinido hasta que el usuario los elimine
- Posts eliminados: Soft delete (mantenidos 90 días para recuperación)
- Mensajes: Mantenidos indefinido mientras exista la conversación
- Logs de acceso: 30 días

## 4. Derechos GDPR

### 4.1 Derecho de Data Subject
Tienes derecho a:

#### 📥 Acceso (Data Portability)
- Descargar todos tus datos en JSON
- Incluye: perfil, posts, conversaciones, mensajes
- **Cómo:** Dashboard → Configuración → "Descargar mis datos"
- Tiempo de respuesta: 24 horas

#### 🗑️ Eliminación (Right to be Forgotten)
- Solicitar eliminación permanente de tu cuenta
- Grace period: 30 días (por si accidental)
- Confirmación requerida por email
- Después de 30 días: hard delete de todos los datos
- **Cómo:** Dashboard → Configuración → "Solicitar eliminación de datos"

#### ✏️ Rectificación
- Editar tu perfil directamente en la app
- Cambiar foto, nombre, contacto disponible

#### 📋 Restricción del Procesamiento
- Contacta a [privacy@mascota-app.com](mailto:privacy@mascota-app.com) para pausar procesamiento

## 5. Terceros y Integraciones

### 5.1 Servicios que Usamos
| Servicio | Propósito | Ubicación |
|----------|-----------|-----------|
| Google OAuth | Autenticación | USA |
| Supabase | Base de datos | USA (AWS) |
| GeoRef API | Datos geográficos | Argentina |

### 5.2 Transferencias Internacionales
- Google, Supabase: cumplimiento GDPR vía Standard Contractual Clauses
- Tus datos pueden estar en USA, procesados bajo protecciones internacionales

## 6. Consentimiento

### 6.1 Análitica (Opcional)
Al registrarse, puedes optar por:
- ✅ Análitica anónima de uso (predeterminado: DESACTIVADO)
- ✅ Notificaciones por email (predeterminado: ACTIVADO)

### 6.2 Cambiar Preferencias
- Dashboard → Configuración → "Opciones de privacidad"
- Retira consentimiento en cualquier momento

## 7. Cookies

Usamos:
- **Esencial:** Auth token (Supabase)
- **Funcional:** Preferencias de ubicación
- **Ninguna** cookie de marketing

## 8. Menores de Edad

- Requisito mínimo: 13 años (COPPA USA) / 16 años (GDPR)
- Padres/tutores pueden solicitar acceso/eliminación
- Contacta: [parents@mascota-app.com](mailto:parents@mascota-app.com)

## 9. Responsable de Datos

**Mascota App**  
- Contacto de Privacidad: [privacy@mascota-app.com](mailto:privacy@mascota-app.com)
- Dirección: [Tu dirección legal aquí]
- Responsable: [Tu nombre]

## 10. Ejercer Tus Derechos

Para ejercer cualquier derecho bajo GDPR:

1. **Envía solicitud a:** [privacy@mascota-app.com](mailto:privacy@mascota-app.com)
2. **Incluye:** 
   - Tu email registrado
   - Tipo de solicitud (acceso/eliminación/rectificación)
   - Firma digital si es posible
3. **Plazo respuesta:** 30 días hábiles
4. **Sin costo:** Solicitud anual

## 11. Cambios a Esta Política

- Te notificaremos vía email de cambios materiales
- Cambios entran en vigor tras 30 días de notificación
- Uso continuado = aceptación de nuevos términos

## 12. Contacto

**¿Preguntas sobre tu privacidad?**

Mascota App Equipo de Privacidad  
📧 [privacy@mascota-app.com](mailto:privacy@mascota-app.com)  
🌐 [www.mascota-app.com/privacy](https://www.mascota-app.com/privacy)  
⚖️ Autoridad Local de Protección de Datos

---

✅ **Última revisión:** Enero 2024  
✅ **Cumplimiento:** GDPR, PD (Argentina), CCPA
