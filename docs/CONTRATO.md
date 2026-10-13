# Contrato de datos de GYM

GYM es dueño de los entrenamientos (especificación maestra, 3.4). Este documento dice qué expone, para que SIVA y AICA lo consuman sin copiar datos ni saltarse sus reglas (4.3).

## Tablas

Todas en el esquema `public`, con RLS: cada usuario autenticado ve y modifica solo sus filas. Las fechas `fecha` son días locales de Argentina; los instantes (`inicio`, `fin`, `creado_en`, `actualizado_en`) están en UTC.

| Tabla | Qué guarda | Clave |
|---|---|---|
| `gym_sesiones` | Un entrenamiento: `dia` (A, B, C o libre), `fecha`, `inicio`, `fin`, `estado`, `semana` del plan, `notas` | `id` (uuid generado por la app) |
| `gym_series` | Una serie: `sesion_id`, `ejercicio` (clave estable), `ejercicio_nombre`, `numero`, `kg`, `reps`, `hecha` | `id` (uuid generado por la app) |
| `gym_peso_corporal` | Peso por día | `usuario_id` + `fecha` |
| `gym_ajustes` | `inicio_plan` (lunes de la semana 1), `sonido` | `usuario_id` |
| `gym_auditoria` | Ediciones y borrados de sesiones ya terminadas y de sus series (antes y después) | `id` |

### Estados de una sesión

- `en_curso`: se está entrenando. Hay como máximo una por usuario (índice único).
- `completada`: terminada. **Solo estas cuentan en las métricas.**
- `cancelada`: reservado; hoy la app descarta borrando.

Una serie cuenta solo si `hecha = true`, con `kg` y `reps` cargados. Una sesión planificada en una agenda (RHA) no es una sesión de GYM: GYM registra lo que se entrenó, no lo que se planeó (8.3).

## Métricas (definiciones)

- **Volumen**: suma de `kg × reps` de las series que cuentan.
- **Peso máximo** de un ejercicio en una sesión: el `kg` más alto entre sus series que cuentan.
- **1RM estimado**: Epley, `kg × (1 + reps / 30)`, la mejor serie de la sesión.
- **Constancia**: sesiones `completada` por semana (lunes a domingo, por `fecha`), contra el objetivo de 3.
- **Récord**: una sesión mueve más peso en un ejercicio que cualquier sesión completada anterior. La primera vez que se hace un ejercicio no es récord.

Las fórmulas están en `src/lib/progreso.ts`, con pruebas.

## Para consumidores (SIVA, AICA)

- **Leer**: con la sesión del usuario (clave pública + RLS), sin claves de servicio.
- **No escribir** en tablas `gym_*` desde otra app. Si AICA necesita registrar un entrenamiento, lo hará a través de una operación de GYM que se definirá en su fase, con la misma validación.
- Si la consulta falla, mostrar GYM como "no disponible", nunca como "sin entrenamientos" (2.2).
- La referencia a una actividad de agenda (RHA) se agregará cuando exista RHA (fase 3), con un identificador estable para evitar duplicados.
