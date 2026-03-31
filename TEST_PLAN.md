# 🧪 Test Plan - Mascota App

**Objetivo:** Validar que características críticas funcionan end-to-end  
**Nivel:** Smoke tests (no automatizado, manual)  
**Ambiente:** Staging/Production

---

## 📋 Test Case 1: Signup + Create Post (Critical)

### Objetivo
Verificar que un usuario nuevo puede registrarse y crear un reporte.

### Pasos
1. Ir a `https://mascota-app.com` (home page)
2. Click en "Ingresar con Google"
3. Completar Google OAuth flow
4. Ser redirigido a dashboard
5. Seleccionar provincia/ciudad
6. Click en "+ Nuevo Reporte"
7. Llenar formulario:
   - Estado: Perdido / Encontrado
   - Nombre: "Perro Manchado"
   - Provincia: Buenos Aires
   - Ciudad: La Plata
   - Barrio: Centro
   - Tipo: Perro
   - Género: Macho
   - Teléfono: +54 249 XXXXXXXX
   - Fotos: 1-3 imágenes
8. Click "Publicar Reporte"
9. Redireccionar a dashboard y ver nuevo post en el top

### Criterios de Éxito
- ✅ Google OAuth flow completa sin errores
- ✅ Dashboard carga posts segundo usuario
- ✅ Nuevo post aparece inmediatamente
- ✅ Foto se convierte a WebP
- ✅ Toast "✅ ¡Mascota reportada con éxito!" aparece

### Casos de Error (Negativos)
| Error | Acción | Resultado Esperado |
|-------|--------|-------------------|
| No seleccionar provincia | Click submit | Toast: "Datos incompletos" |
| Teléfono mal formato | Click submit | Toast: "Teléfono inválido" |
| No añadir foto | Click submit | Toast: "Debes añadir al menos una foto" |
| Large file (>5MB) | Submit | Toast: "Archivo muy grande. Máximo: 5MB" |

---

## 💬 Test Case 2: Chat & Realtime Messaging (Critical)

### Objetivo
Verificar que dos usuarios pueden chatear en realtime.

### Pasos Previos
- User A y User B registrados y logueados (diferentes ventanas/dispositivos)
- Al menos 1 post creado por User A visible en dashboard de User B

### Pasos
1. **User B:** Ve post de User A
2. **User B:** Click en "Contactar"
3. **User B:** Se crea conversación y abre chat
4. **User B:** Escribe mensaje: "¿Sigue perdida?"
5. **User B:** Press Enter o click enviar
6. **User A (different window):** Actualiza página o espera notificación
7. **User A:** Ve nuevo mensaje de User B
8. **User A:** Responde: "Sí, aparecieron hace 2h jara"
9. **User B:** Ve respuesta en realtime (sin recargar)
10. **User B:** Ve checkmark doble (✓✓) en mensaje de A

### Criterios de Éxito
- ✅ Conversación se crea sin duplicados
- ✅ Mensaje enviado aparece en timeline User B
- ✅ Mensaje llegó a User A (realtime)
- ✅ Timestamp está correcto
- ✅ Read receipts (✓✓) funcionan
- ✅ No hay lag visible (< 2s)

### Tests de Estrés
| Escenario | Conducta |
|-----------|----------|
| Enviar 10 mensajes rápido | Todos llegan en orden |
| Perder conexión y reconectar | Sincroniza automáticamente |
| Logout mientras chatea | Deja de recibir mensajes |

---

## 🔒 Test Case 3: RLS Security & Privacy (Critical)

### Objetivo
Verificar que Row Level Security bloquea acceso no autorizado y teléfono/dirección se ocultan.

### Pasos
1. Abrir DevTools (F12) → Network/Console
2. Abrir aplicación logueado como User A
3. Crear un post con:
   - Teléfono: +54 249 1234567
   - Dirección: Calle Falsa 123, La Plata
4. Logout
5. **Abierto sin autenticar:** Ir a dashboard
6. Ver post de User A
7. Inspeccionar elemento del post → verificar HTML
8. **No debe contener:**
   - Teléfono (✓ correcto si oculto)
   - Dirección (✓ correcto si oculto)
9. **Logueado nuevamente:** Ver el mismo post
10. Teléfono y dirección **DEBEN ser visibles**

### Criterios de RLS
- ✅ Sin autenticar: No puedes query tabla `publicaciones` directamente
- ✅ Autenticado: Puedes ver solo posts `activa=true`
- ✅ No puedes ver `teléfono`/`dirección` en posts ajenos sin RLS
- ✅ `_filterByPrivacy()` en PostService aplica segunda capa

### CLI Test (Supabase Dashboard)
```sql
-- Este query DEBE fallar sin autenticar:
SELECT * FROM publicaciones;
-- Error: new row violates row-level security policy

-- Este debe funcionar solo si auth.uid() = autor:
SELECT telefono, direccion FROM publicaciones WHERE id = '...';
```

---

## ⚡ Test Case 4: Performance Benchmarks

### Objetivo
Validar que la app cumple targets de performance.

### Métricas
| Métrica | Target | Herramienta |
|---------|--------|-------------|
| Time to Interactive (TTI) | < 3s | Chrome DevTools |
| Bundle Size | < 200KB | Network tab |
| API Latency (p95) | < 200ms | Network tab |
| Image Load (WebP) | < 500ms | Network tab |

### Pasos
1. **Lighthouse Audit** (Chrome DevTools)
   - Click ⋮ → More tools → Lighthouse
   - Run audit: Performance, Best Practices
   - Target score: > 85
   - Screenshot de resultados

2. **Network Profiling**
   - Open Network tab
   - Reload page (Cmd/Ctrl+Shift+R hard refresh)
   - Medir tiempo total load
   - Verificar bundle.js < 200KB
   - Verificar CSS < 50KB

3. **API Latency**
   - Network tab → Fetch posts
   - Medir tiempo respuesta `/publicaciones`
   - Debe ser < 200ms (p95)

### Performance Targets
```
✅ Good:
- TTI < 2s
- Bundle < 150KB
- API latency < 100ms
- CLS < 0.1

⚠️ Acceptable:
- TTI < 3s
- Bundle < 200KB
- API latency < 300ms
- CLS < 0.15

❌ Needs Improvement:
- TTI > 3s
- Bundle > 200KB
- API latency > 300ms
```

---

## 📱 Test Case 5: Mobile Responsiveness

### Objetivo
Validar que la app es usable en móviles.

### Dispositivos
- [ ] iPhone 12 (iOS 15+)
- [ ] Samsung Galaxy A12 (Android 11+)
- [ ] Tablet (iPad Pro 11")

### Tests por Dispositivo
1. **Orientación Portrait**
   - Dashboard se ve completo
   - Posts se apilan en 1 columna
   - Botones "Contactar" son clickeables (min 44x44px)
   - Inputs son accesibles

2. **Orientación Landscape**
   - Layout se ajusta a 2 columnas
   - No hay overflow horizontal
   - Título sigue visible

3. **Chat en Móvil**
   - Input botón de envío visible
   - Timeline scrollea smooth
   - Teclado virtual no cubre botón send

### Criterios CSS
- [ ] Mobile-first breakpoints (@media max-width: 640px)
- [ ] Touch targets > 44x44px
- [ ] Font size > 16px (no zoom forzado)
- [ ] Viewport meta tag está set

---

## 🌐 Test Case 6: Browser Compatibility

### Objetivo
Validar que app funciona en múltiples navegadores.

### Browsers
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | ✅ REQUIRED |
| Firefox | 121+ | ✅ REQUIRED |
| Safari | 17+ | ✅ REQUIRED |
| Edge | 120+ | ✅ REQUIRED |

### Tests por Browser
- [ ] Home page carga completa
- [ ] Google OAuth flow funciona
- [ ] Dashboard muestra posts
- [ ] Chat realtime funciona
- [ ] Fotos se cargan (WebP)
- [ ] Console sin errores critical

### Fallback Checks
- [ ] Si WebP no soportado → fallback a JPEG
- [ ] Si `fetch` no soportado → usar polyfill
- [ ] Si `localStorage` no disponible → cache en memoria

---

## 🔐 Test Case 7: GDPR Compliance

### Objetivo
Validar que funciones de privacidad de usuario funcionan.

### Pasos
1. **Export User Data**
   - Dashboard → Settings (engranaje)
   - Click "Descargar mis datos"
   - Confirmar descarga
   - Abrir JSON descargado
   - Validar contiene: perfil, posts, conversaciones
   - ✅ Archivo debe tener timestamp actual

2. **Request Data Deletion**
   - Click "Solicitar eliminación"
   - Confirmar en modal
   - Ingresar email para validar identidad
   - ✅ Toast: "Solicitud registrada. Eliminación en 30 días"
   - ✅ Sin autenticar: Datos aún visibles (grace period)
   - ✅ Después de 30 días: Datos hard-deleted (manual validation)

### Bug Prevention
- [ ] No puedo solicitar eliminación 2x (idempotente)
- [ ] Datos exportados no contienen info sensitiva (passwords, tokens)
- [ ] Legal puede auditar deletion_pending records

---

## 📊 Test Results Template

```
Test Case: _______________
Date: _______________
Tester: _______________
Browser/Device: _______________

Results:
- ✅ Paso 1 OK
- ✅ Paso 2 OK
- ❌ Paso 3 FALLÓ: [describe]
- ⏭️  Paso 4 SKIPPED: [razón]

Issues Found:
1. [Descripción]
2. [Descripción]

Performance Metrics:
- TTI: ___ ms
- Bundle: ___ KB
- API Latency: ___ ms

Sign-Off:
QA: _____________  Date: _____
DEV: _____________  Date: _____
```

---

## 🚀 Deployment Sign-Off

**Checklist Final:**
- [ ] Test 1 (Signup) pasó en Chrome, Firefox, Safari
- [ ] Test 2 (Chat) pasó realtime con 2 usuarios
- [ ] Test 3 (RLS) bloquea acceso no autorizado
- [ ] Test 4 (Performance) cumple targets
- [ ] Test 5 (Mobile) responsive en iPhone + Android
- [ ] Test 6 (Browsers) compatibilidad verificada
- [ ] Test 7 (GDPR) funciones de privacidad OK
- [ ] **Zero console errors** (F12 console)
- [ ] **Supabase RLS ejecutado** en production
- [ ] **Monitoring activo** (error tracking, uptime)

---

**Status:** 🟡 Ready for Testing  
**Owner:** QA Team  
**Last Updated:** Enero 2024
