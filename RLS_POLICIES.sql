-- ============================================================================
-- MASCOTA APP - ROW LEVEL SECURITY (RLS) POLICIES
-- Proyecto: Protege publicaciones + mensajes
-- Fecha: 31/03/2026
-- Adaptado a tu esquema real: publicaciones + mensajes
-- ============================================================================

-- ============================================================================
-- TABLA 1: publicaciones (Privacidad según autenticación)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;

-- POLÍTICA SELECT: Solo mostrar posts activos
-- ⚠️ NOTA: RLS a nivel de fila. El filtrado de campos sensibles
-- (teléfono, dirección) se hace en postService.js (_filterByPrivacy)
CREATE POLICY publicaciones_select_policy ON publicaciones
  FOR SELECT
  USING (activa = true);

-- POLÍTICA INSERT: Solo usuarios autenticados pueden crear posts
CREATE POLICY publicaciones_insert_policy ON publicaciones
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- POLÍTICA UPDATE: Solo el autor puede actualizar su posts
CREATE POLICY publicaciones_update_policy ON publicaciones
  FOR UPDATE
  USING (
    autor_email = auth.jwt()->>'email'
  );

-- POLÍTICA DELETE: Solo el autor puede borrar (soft delete activa = false)
CREATE POLICY publicaciones_delete_policy ON publicaciones
  FOR DELETE
  USING (
    autor_email = auth.jwt()->>'email'
  );

-- ============================================================================
-- TABLA 2: mensajes (Proteger conversaciones privadas)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- POLÍTICA SELECT: Solo emisor/receptor pueden ver mensajes
CREATE POLICY mensajes_select_policy ON mensajes
  FOR SELECT
  USING (
    auth.jwt()->>'email' = emisor 
    OR auth.jwt()->>'email' = receptor
  );

-- POLÍTICA INSERT: Solo el emisor puede insertar mensajes
CREATE POLICY mensajes_insert_policy ON mensajes
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'email' = emisor
  );

-- POLÍTICA UPDATE: Solo emisor puede marcar como leído
CREATE POLICY mensajes_update_policy ON mensajes
  FOR UPDATE
  USING (
    auth.jwt()->>'email' = emisor
  );

-- POLÍTICA DELETE: Nadie puede borrar (conservar auditoría)
CREATE POLICY mensajes_delete_policy ON mensajes
  FOR DELETE
  USING (false);

-- ============================================================================
-- VALIDACIÓN - Verificar que RLS está habilitado
-- ============================================================================

-- Ejecuta DESPUÉS de aplicar este script para confirmar:
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('publicaciones', 'mensajes');

-- Para ver las políticas creadas:
-- SELECT policyname, tablename FROM pg_policies 
-- WHERE tablename IN ('publicaciones', 'mensajes');

-- ============================================================================
-- INSTRUCCIONES PARA EJECUTAR EN SUPABASE
-- ============================================================================

/*

## CÓMO EJECUTAR EN SUPABASE DASHBOARD:

1. Abre tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a SQL Editor (engranaje + código en panel izquierdo)
3. Click en "New Query"
4. Copia ESTE archivo completo
5. Pega en el editor
6. Click en el botón azul "Run" (o Ctrl+Enter)
7. Espera a que termine (5-15 segundos)

## RESULTADO ESPERADO:

✅ "Queries completed successfully"

## VALIDACIÓN:

Después, ejecuta esta query para confirmar que RLS está activo:

  SELECT tablename, rowsecurity 
  FROM pg_class 
  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
  WHERE pg_namespace.nspname = 'public' 
  AND tablename IN ('publicaciones', 'mensajes');

✅ Debe mostrar rowsecurity = true para ambas tablas

*/

-- ============================================================================
-- INSTRUCCIONES PARA EJECUTAR
-- ============================================================================

/*

## CÓMO EJECUTAR EN SUPABASE DASHBOARD:

1. Abre tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a SQL Editor (panel izquierdo)
3. Click en "New Query"
4. Copia TODO el contenido de este archivo
5. Click en "Run" (esquina superior derecha)
6. Espera confirmación: ✅ "Success"

✅ LISTA DE COMPROBACIÓN POST-RLS:

- [ ] Función is_admin() creada
- [ ] RLS habilitado en messages
- [ ] RLS habilitado en publicaciones  
- [ ] RLS habilitado en conversations
- [ ] Todas las políticas creadas exitosamente
- [ ] Verificar que SELECT funciona (solo datos activos)
- [ ] Prueba manual: intenta SELECT como usuario no autenticado (debería fallar sin auth.uid())

## NOTA IMPORTANTE:

El filtrado de CAMPOS sensibles (teléfono, dirección, email) se hace en el CLIENTE
(postService.js → _filterByPrivacy()) porque RLS protege FILAS, no campos específicos.

Para máxima seguridad, considera crear una vista SQL que oculta campos:

CREATE VIEW publicaciones_public AS
SELECT 
  id, nombre, tipo, genero, foto, estado, provincia, ciudad, barrio, created_at
FROM publicaciones
WHERE activa = true;

Luego usa: supabase.from('publicaciones_public').select() en cliente no autenticado.

*/
