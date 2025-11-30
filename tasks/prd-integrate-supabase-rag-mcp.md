# PRD: Integración de Supabase y RAG en crac-mcp

## Introduction/Overview

El servidor MCP (Model Context Protocol) `crac-mcp` actualmente solo expone herramientas básicas (`hello`, `get-info`) sin capacidad de búsqueda de contexto. Este PRD describe la integración de Supabase y RAG (Retrieval-Augmented Generation) para permitir que el MCP busque contexto relevante del monorepo de forma invisible y genere prompts estructurados para agentes de desarrollo.

**Problema que resuelve:**

- Los agentes de desarrollo necesitan contexto del monorepo (tecnología, estructura, convenciones) para implementar tareas correctamente
- Actualmente no hay forma de buscar y recuperar este contexto de manera semántica
- Los usuarios deben proporcionar contexto manualmente o los agentes trabajan sin información relevante

**Objetivo:**
Integrar acceso directo a Supabase en `crac-mcp` para buscar contexto usando RAG, permitiendo que el MCP genere prompts estructurados con información relevante del monorepo de forma transparente para el usuario.

## Goals

1. **Integración de Supabase:** Conectar `crac-mcp` directamente con la base de datos de `rag-playground` para búsquedas de contexto
2. **Parser de comandos:** Implementar un parser que extraiga tool, scope y requirements de comandos en lenguaje natural
3. **Búsqueda semántica:** Realizar búsquedas de contexto usando embeddings y similitud coseno
4. **Generación de prompts:** Crear prompts estructurados que incluyan contexto relevante para agentes de desarrollo
5. **Transparencia:** Mantener la búsqueda de contexto invisible para el usuario final

## User Stories

1. **Como desarrollador**, quiero usar comandos en lenguaje natural como "dev rac implementa la nueva sección booking-search" y que el MCP automáticamente busque contexto relevante del monorepo para generar un prompt estructurado.

2. **Como agente de desarrollo**, quiero recibir prompts que incluyan contexto sobre la tecnología, estructura de carpetas y convenciones del proyecto para implementar tareas correctamente.

3. **Como arquitecto de software**, quiero que el MCP busque automáticamente ejemplos similares, patrones arquitectónicos y convenciones cuando se solicita una tarea de desarrollo.

## Functional Requirements

### FR1: Dependencias y Configuración

1.1. El sistema debe agregar `@supabase/supabase-js` como dependencia
1.2. El sistema debe agregar `@google/generative-ai` como dependencia
1.3. El sistema debe requerir las siguientes variables de entorno:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
  1.4. El sistema debe validar que todas las variables de entorno requeridas estén presentes al iniciar

### FR2: Parser de Comandos

2.1. El sistema debe parsear comandos en lenguaje natural y extraer:

- **Tool:** `dev`, `test`, `refactor`, `fix`, `update` (o variantes)
- **Scope:** `rac`, `partners`, `global`, `web`, `mobile`, `suppliers`, `notifications`, `queues`
- **Requirements:** El resto del comando después de extraer tool y scope
  2.2. El sistema debe usar valores por defecto si no se detectan tool o scope:
- Tool por defecto: `dev`
- Scope por defecto: `global`
  2.3. El parser debe ser case-insensitive
  2.4. El parser debe manejar comandos sin tool o scope explícitos

### FR3: Cliente Gemini para Embeddings

3.1. El sistema debe implementar un cliente Gemini que genere embeddings usando el modelo `text-embedding-004`
3.2. El sistema debe validar que el embedding generado tenga 768 dimensiones
3.3. El sistema debe manejar errores de la API de Gemini de forma apropiada
3.4. El sistema debe retornar embeddings como arrays de números

### FR4: Búsqueda de Contexto en Supabase

4.1. El sistema debe conectarse a Supabase usando las credenciales de servicio
4.2. El sistema debe usar la función RPC `match_dev_contexts` para búsquedas de similitud
4.3. El sistema debe realizar múltiples búsquedas en paralelo para diferentes aspectos:

- Tecnología y stack (apps: [scope, "global"], scopes: ["architecture", "introduction"])
- Estructura de carpetas (apps: [scope, "global"], scopes: ["architecture", "routing"])
- Convenciones de código (apps: [scope, "global"], scopes: ["style-guide", "architecture"])
- Ejemplos similares (apps: [scope, "global"], scopes: ["tasks-examples", "core"])
  4.4. El sistema debe combinar los resultados de las búsquedas en un objeto estructurado
  4.5. El sistema debe manejar errores de Supabase y proporcionar mensajes descriptivos

### FR5: Generación de Prompts Estructurados

5.1. El sistema debe generar un prompt de sistema que incluya:

- Contexto técnico (tecnología y stack)
- Estructura del proyecto
- Convenciones de código
- Principios de desarrollo (SOLID, Clean Code)
  5.2. El sistema debe generar un prompt de usuario que incluya:
- La tarea específica (tool + requirements)
- Ejemplos similares si están disponibles
- Instrucciones para seguir convenciones
  5.3. El sistema debe retornar el prompt en formato compatible con MCP (messages array)
  5.4. El sistema debe incluir metadata del contexto en el prompt (app, scope, distance)

### FR6: Integración con MCP

6.1. El sistema debe registrar un nuevo prompt MCP llamado `dev-task`
6.2. El prompt `dev-task` debe aceptar un argumento `command` (string)
6.3. El prompt `dev-task` debe retornar un array de mensajes con role `system` y `user`
6.4. El sistema debe manejar errores y retornar mensajes de error apropiados si algo falla
6.5. El sistema debe mantener las herramientas existentes (`hello`, `get-info`) sin cambios

### FR7: Estructura de Archivos

7.1. El sistema debe crear la siguiente estructura de directorios:

- `src/parser/command-parser.ts`
- `src/rag/gemini-client.ts`
- `src/rag/context-searcher.ts`
- `src/prompts/prompt-builder.ts`
  7.2. Cada módulo debe exportar las funciones/clases necesarias
  7.3. El código debe seguir principios SOLID y Clean Code

## Non-Goals (Out of Scope)

1. **API REST para rag-playground:** No se creará una API REST intermedia. El acceso será directo a Supabase.
2. **Interfaz de usuario:** No se requiere UI para esta funcionalidad. Todo es transparente para el usuario.
3. **Gestión de embeddings:** No se implementará la creación o actualización de embeddings. Solo búsqueda.
4. **Caché de búsquedas:** La implementación de caché queda fuera del alcance inicial.
5. **Rate limiting:** No se implementará rate limiting en esta fase.
6. **Múltiples modelos de embeddings:** Solo se soportará Gemini `text-embedding-004`.
7. **Búsqueda en múltiples bases de datos:** Solo se usará la base de datos de `rag-playground`.

## Design Considerations

No aplica - esta es una funcionalidad backend sin interfaz de usuario.

## Technical Considerations

### Dependencias

- **@supabase/supabase-js:** Versión `^2.47.10` (compatible con rag-playground)
- **@google/generative-ai:** Versión `^0.21.0` (compatible con rag-playground)
- **zod:** Ya existe en el proyecto, se usará para validación de esquemas

### Base de Datos

- Se usará la misma base de datos que `rag-playground`
- Se requiere acceso con `SUPABASE_SERVICE_ROLE_KEY` para operaciones de lectura
- La función RPC `match_dev_contexts` debe existir en Supabase (ya está en `supabase-setup.sql`)

### Arquitectura

- **Parser:** Módulo independiente que parsea comandos naturales
- **RAG:** Módulo que maneja búsquedas semánticas (Gemini + Supabase)
- **Prompts:** Módulo que construye prompts estructurados
- **MCP:** Integración final que registra el prompt en el servidor MCP

### Consideraciones de Rendimiento

- Las búsquedas se realizan en paralelo para diferentes aspectos del contexto
- Cada búsqueda puede generar múltiples llamadas a Gemini (una por query)
- Se debe considerar el tiempo de respuesta total (Gemini API + Supabase)

### Manejo de Errores

- Validar variables de entorno al iniciar
- Manejar errores de API de Gemini con mensajes descriptivos
- Manejar errores de Supabase (RPC no encontrada, conexión fallida, etc.)
- Proporcionar fallbacks cuando sea posible

### Seguridad

- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor (nunca exponer al cliente)
- Validar que las credenciales estén presentes antes de inicializar clientes
- No loguear credenciales o información sensible

## Success Metrics

1. **Funcionalidad:** El prompt `dev-task` puede ser invocado con comandos en lenguaje natural y retorna prompts estructurados
2. **Precisión:** El parser extrae correctamente tool, scope y requirements en al menos 90% de los casos de prueba
3. **Contexto relevante:** Las búsquedas RAG retornan contexto relevante (distance < 0.4) en al menos 80% de las búsquedas
4. **Rendimiento:** El tiempo total de generación de prompt (parse + búsquedas + construcción) es menor a 5 segundos en promedio
5. **Confiabilidad:** El sistema maneja errores apropiadamente sin crashear el servidor MCP

## Open Questions

1. **Fallback behavior:** ¿Qué hacer si la función RPC `match_dev_contexts` no existe? ¿Implementar fallback o fallar con error claro? No implementar fallback, solo fallar con error claro.
2. **Límites de búsqueda:** ¿Cuántos resultados (topK) buscar para cada aspecto del contexto? maximo 2 resultados por aspecto ¿Es configurable? No, es configurable.
3. **Caché:** ¿Deberíamos implementar caché de embeddings de queries frecuentes en una fase futura? Si, sería interesante para mejorar el rendimiento.
4. **Logging:** ¿Qué nivel de logging necesitamos para debugging? Si, loguear queries, resultados, tokens, tiempos.
5. **Validación de scope:** ¿Deberíamos validar que el scope existe en la tabla `dev_apps` antes de buscar? Podemos validarlo y si no existe, quizas podemos retornarle un mensaje claro con la lista de scopes disponibles.
6. **Múltiples scopes:** ¿Soportar múltiples scopes en un solo comando? no, solo soportará un solo scope por comando. (ej: "dev rac partners implementa...")

## Implementation Notes

- El código debe seguir las convenciones existentes en `crac-mcp`
- Usar TypeScript estricto
- Exportar tipos/interfaces necesarios
- Documentar funciones públicas con JSDoc
- Mantener compatibilidad con el código existente
