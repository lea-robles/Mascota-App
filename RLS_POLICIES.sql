-- ============================================================================
-- MASCOTA APP - ROW LEVEL SECURITY (RLS) POLICIES
-- Proyecto: Mensajería segura + Posts con privacidad
-- Fecha: 31/03/2026
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN HELPER: Verificar si usuario es ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id AND raw_user_meta_data ? 'role' 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TABLA: messages (Proteger conversaciones privadas)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- POLÍTICA SELECT: Solo sender/receiver/admin pueden ver mensajes
CREATE POLICY messages_select_policy ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR is_admin(auth.uid())
  );

-- POLÍTICA INSERT: Solo el sender puede insertar mensajes
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- POLÍTICA UPDATE: Solo el sender puede marcar como leído (read status)
CREATE POLICY messages_update_policy ON messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id
  );

-- POLÍTICA DELETE: Admin puede borrar si es necesario (auditoría)
CREATE POLICY messages_delete_policy ON messages
  FOR DELETE
  USING (
    is_admin(auth.uid())
  );

-- ============================================================================
-- 3. TABLA: publicaciones (Privacidad según autenticación)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;

-- POLÍTICA SELECT: Autenticados ven TODO, No autenticados ven solo campos públicos
-- ⚠️ NOTA: RLS a nivel de fila permite ver las filas. El filtrado de CAMPOS
-- se hace en postService.js (_filterByPrivacy) y en app.js
CREATE POLICY publicaciones_select_policy ON publicaciones
  FOR SELECT
  USING (activa = true);  -- Solo mostrar posts activos

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
-- 4. TABLA: conversations (Proteger listado de conversaciones)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- POLÍTICA SELECT: Solo los dos usuarios en la conversación + admin
CREATE POLICY conversations_select_policy ON conversations
  FOR SELECT
  USING (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id 
    OR is_admin(auth.uid())
  );

-- POLÍTICA INSERT: Solo usuarios autenticados pueden iniciar conversaciones
CREATE POLICY conversations_insert_policy ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id
  );

-- POLÍTICA UPDATE: Solo los participantes pueden actualizar (ej: ocultar conversación)
CREATE POLICY conversations_update_policy ON conversations
  FOR UPDATE
  USING (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id
  );

-- POLÍTICA DELETE: Prohibir eliminación (conservar por auditoría)
CREATE POLICY conversations_delete_policy ON conversations
  FOR DELETE
  USING (false);

-- ============================================================================
-- VALIDACIÓN - Verificar que RLS está habilitado
-- ============================================================================

-- Ejecuta esto para confirmar después de aplicar:
-- SELECT tablename, rowlevelSecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('messages', 'publicaciones', 'conversations');

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
