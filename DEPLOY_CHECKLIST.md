# 📋 Deploy Checklist - Mascota App

**Objetivo:** Validar que la app es production-ready antes de publicar

---

## ✅ PRE-DEPLOY (Esta Fase)

### 1. Error Handling & Robustness
- [x] ErrorHandler.js creado (centralizado)
- [x] AuthService: try/catch + error normalization
- [x] ChatService: try/catch + error normalization
- [x] PostService: try/catch + error normalization
- [ ] UploadService: try/catch + error normalization (PENDIENTE)
- [ ] GeoService: try/catch + error normalization (PENDIENTE)
- [ ] Retry logic para network failures (app.js)
- [ ] Toast notifications para errores HTTP 400/401/403/404/429/500

### 2. Security Policies
- [x] RLS_POLICIES.sql creado
- [ ] Ejecutar SQL en Supabase dashboard (PENDIENTE)
- [ ] Validar RLS bloquea acceso no autorizado
- [x] GDPR compliance functions creadas (export/delete)
- [x] Privacy filtering en posts (públicos vs autenticados)
- [ ] Rate limiting en API calls (PENDIENTE)

### 3. Performance & Optimization
- [ ] Lazy loading con Intersection Observer (PENDIENTE)
- [ ] localStorage caching (30min TTL) (PENDIENTE)
- [ ] Debounce en search inputs (PENDIENTE)
- [ ] Image optimization (WebP conversion)
- [ ] Bundle size check (< 200KB)
- [ ] Load time < 3 segundos en conexión 4G

### 4. Frontend Polish
- [ ] Modal terms actualizado con privacy policy link
- [ ] GDPR buttons: "Descargar datos" + "Solicitar eliminación"
- [ ] Mobile responsiveness en todos los views
- [ ] Testing en browsers: Chrome, Firefox, Safari, Edge
- [ ] Testing en mobile devices: iOS, Android

### 5. Database & Backend
- [ ] Supabase RLS policies ejecutadas
- [ ] Backup automático configurado
- [ ] .env variables configuradas (API URLs, keys)
- [ ] CORS whitelist actualizado
- [ ] Email service testado (si aplica)

---

## 🚀 DEPLOY (Próxima Fase)

### 6. Pre-Flight Checks (24h antes)
- [ ] Código git mergeado a main y tagged (v1.0.0)
- [ ] Todos los tests pasando (si existen)
- [ ] Zero console errors en DevTools
- [ ] Staging deployment exitoso
- [ ] Backup de producción actual creado

### 7. Deploy Steps (En Orden)
1. **Supabase Dashboard → SQL Editor**
   - [ ] Ejecutar RLS_POLICIES.sql
   - [ ] Validar no hay errors
   - [ ] Confirmar políticas están activas

2. **Environment Variables**
   - [ ] .env.production actualizado
   - [ ] Supabase URL correcta
   - [ ] API keys rotadas
   - [ ] Secrets no en git

3. **Frontend Deploy**
   - [ ] Build minificado
   - [ ] Static files a CDN (si aplica)
   - [ ] Cache busting activado
   - [ ] SSL certificate válido

4. **DNS & Networking**
   - [ ] A record pointing a hosting correcto
   - [ ] SSL/TLS certificado válido (Let's Encrypt)
   - [ ] CORS headers configurados
   - [ ] Rate limiting activado en origen

5. **Monitoring Setup**
   - [ ] Error tracking (Sentry o similar)
   - [ ] Uptime monitoring
   - [ ] Performance metrics (Google Analytics)
   - [ ] Log aggregation (CloudWatch o Datadog)

---

## ✔️ POST-DEPLOY (Primeras 72h)

### 8. Smoke Tests
**Ejecutar en orden:**

#### Test 1: Signup + Create Post
- [ ] Ir a home page
- [ ] Click "Crear Cuenta"
- [ ] Sign with Google
- [ ] Autorizar app
- [ ] Redirect a dashboard
- [ ] Click botón "Crear Publicación"
- [ ] Llenar form: tipo, género, foto
- [ ] Submit - redirecciona a feed
- [ ] Nuevo post aparece en el top

#### Test 2: Chat & Messaging
- [ ] Navegar a feed
- [ ] Click "Contactar" en un post
- [ ] Crear conversación
- [ ] Enviar mensaje
- [ ] Mensaje aparece en timeline
- [ ] Marcar como leído (✓✓)
- [ ] Recibir respuesta realtime

#### Test 3: RLS Security
- [ ] Abrir DevTools → Network
- [ ] Intentar query manual a `publicaciones` table
- [ ] Validar que RLS bloquea acceso directo
- [ ] Verificar teléfono/dirección oculto para no-autenticados

### 9. Monitoring (Primeras 72h)
- [ ] Revisar logs cada hora
- [ ] Threshold de errores: < 0.1% tasa de error
- [ ] Tiempo respuesta API: < 500ms (p95)
- [ ] Uptime: > 99.9%
- [ ] CPU/RAM en Supabase: < 70%

### 10. User Communication
- [ ] Email a beta testers con link de producción
- [ ] Post en redes sociales (si aplica)
- [ ] Documentación de soporte actualizada
- [ ] Email de soporte activo: [support@mascota-app.com](mailto:support@mascota-app.com)

---

## 🐛 Rollback Plan (Si es necesario)

1. **Identificar el problema:** 
   - Error rate > 1%? → Rollback
   - Down time > 5min? → Rollback
   - Data loss? → Rollback

2. **Rollback Steps:**
   ```bash
   # Supabase: Restaurar backup previo
   # Frontend: Revert a versión anterior `git revert <commit>`
   # Re-deploy versión estable
   # Notificar usuarios: "Actualizando sistema, 5 min downtime"
   ```

3. **Post-Mortem:**
   - [ ] Investigar root cause
   - [ ] Crear issues en GitHub
   - [ ] Actualizar testing para prevenir

---

## 📊 Métricas Post-Deploy (Monitorear)

| Métrica | Target | Alerta |
|---------|--------|--------|
| Uptime | > 99.9% | < 99.5% |
| Error Rate | < 0.1% | > 1% |
| Load Time | < 3s | > 5s |
| API Latency | < 200ms | > 500ms |
| Bundle Size | < 200KB | > 300KB |
| CPU (Supabase) | < 50% | > 80% |
| DB Connections | < 10 | > 20 |
| User Growth | Monitor | N/A |

---

## 📝 Sign-Off

- [ ] **Developer:** ___________________  Fecha: ____
- [ ] **QA Lead:** ___________________  Fecha: ____
- [ ] **Product Manager:** ___________________  Fecha: ____
- [ ] **Infrastructure:** ___________________  Fecha: ____

---

**Notas:**
- Este checklist es iterativo - actualizar según lo aprendemos
- Cada deploy futuro reutiliza este checklist
- Documentar cualquier desviación
- Celebrar 🎉 cuando se complete exitosamente
