# Protocolo de Desarrollo: MascotaApp

## 1. Contexto y Objetivos
- **Nombre:** MascotaApp.
- **Propósito:** Red social de mascotas con foco en seguridad, recuperación de mascotas perdidas y mensajería persistente.
- **Estado Actual:** App iniciada. Finalizar Posts, Chat tipo Facebook y Auth Legal.

## 2. Reglas de Negocio y Lógica (Prioridad Alta)
- **Gestión de Posts & Mascotas Perdidas:**
    - Permitir subida múltiple de imágenes (Carrusel responsivo).
    - El autor es el único que puede aplicar "Borrado Lógico" a su post.
    - **Privacidad de Datos Sensibles:** Números de teléfono y direcciones solo son visibles para usuarios que hayan iniciado sesión.
- **Sistema de Chat Completo (Estilo Facebook):**
    - Mensajería en tiempo real con historial persistente.
    - Acceso al chat desde: 1) Bandeja de entrada general. 2) Botón "Contactar" en posts de mascotas.
    - **Seguridad y Persistencia:** Los chats NO se eliminan de la base de datos (Nube) por auditoría y seguridad, incluso si el usuario limpia su vista.
- **Autenticación y Marco Legal:**
    - Registro vía Email/Password y Google Auth.
    - **Consentimiento Explícito:** Al registrarse, el usuario debe marcar un Checkbox aceptando los "Términos y Condiciones".
    - **Cláusula de Retención:** Informar explícitamente que las conversaciones se registran y conservan por motivos de seguridad personal y moderación.

## 3. Estándares Técnicos y Mejores Prácticas
- **Frontend & UX/UI:**
    - React + Hooks. Diseño Mobile First.
    - **Paleta:** Verdes (primario), Blanco (fondo), Gris (textos/bordes).
    - Los términos legales deben aparecer en un modal o link durante el registro.
- **Ciberseguridad & Legal:**
    - Protección de datos (GDPR/Ley de Protección de Datos Personales).
    - Los SMS/Chats deben estar protegidos por reglas de base de datos para que solo el emisor y receptor (y el admin por seguridad) tengan acceso.
    - Validación de identidad antes de mostrar información de contacto en mascotas perdidas.

## 4. Instrucciones para el Agente IA
- Al crear el formulario de registro, incluye obligatoriamente el checkbox de aceptación de términos legales.
- Asegúrate de que el botón "Contactar" en un post redirija al hilo de chat correspondiente.
- Respeta la paleta de verdes en la interfaz del chat y los modales legales.
- Si crees necesario preguntarme o recomendarme algo hacelo prioridad.