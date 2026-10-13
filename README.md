# GYM

Gestión y métricas de entrenamiento. Es la fase 1 del ecosistema SIVA (ver la especificación maestra): una app propia, con su repo, su despliegue y su PWA, que comparte con FIA el proyecto de Supabase y la cuenta de usuario.

Trae cargado el plan de hipertrofia de 12 semanas (días A, B y C). Mientras entrenás:

- cargás kilos y repeticiones por serie; con ✓ se guarda al instante,
- cada ejercicio sugiere subir el peso o sumar repeticiones (doble progresión),
- al marcar una serie arranca el descanso del ejercicio, con sonido y vibración al terminar.

Después, el progreso: peso máximo, 1RM estimado y volumen por ejercicio, constancia semanal, récords y peso corporal. `/panel` es el tablero para la compu.

## Cómo está armado

- `src/lib/plan.ts`: el plan (ejercicios, series, descansos, fases). Fijo, en código.
- `src/lib/progreso.ts`: las cuentas (historia por ejercicio, doble progresión, semanas, récords). Código puro, con pruebas.
- `src/lib/datos/`: acceso a la base (Supabase) y una versión en memoria para pruebas y demo.
- `src/lib/gym.tsx`: el estado de la app. Guarda cada cambio al momento; si falla, lo deja pendiente y lo reintenta (los ids los genera la app, así un reintento no duplica).
- `src/lib/descanso.tsx`: el temporizador. Guarda la hora de fin, no los segundos: sobrevive a recargas y a cambiar de pantalla.
- `src/components/`: las pantallas (`/`, `/entrenar`, `/historial`, `/progreso`, `/plan`, `/panel`).
- `supabase/schema.sql`: tablas `gym_*`, permisos (RLS) y auditoría. No toca nada de FIA.
- `docs/CONTRATO.md`: qué datos expone GYM para SIVA y las demás apps.

## Desarrollo

```bash
npm install
npm run dev
```

`http://localhost:3000/demo` abre la app con cuatro semanas de entrenamientos inventados, sin iniciar sesión ni tocar la base (solo en desarrollo).

```bash
npm test
npm run lint
```

## Puesta en marcha

1. **Base:** en Supabase (el mismo proyecto de FIA) → SQL Editor → pegar `supabase/schema.sql` completo → Run. Se puede correr más de una vez.
2. **Vercel:** Add New → Project → importar este repo → Deploy. No hace falta cargar variables: `.env` trae la URL y la clave pública de Supabase (las mismas de FIA). Nunca va ahí una clave secreta.
3. **iPhone:** abrir la dirección en Safari → Compartir → Agregar a pantalla de inicio. Se entra con el mismo email y contraseña de FIA.

## Límites conocidos

- El aviso de fin de descanso suena solo con la app abierta. Con el teléfono bloqueado el temporizador sigue contando, pero iOS no deja sonar a una página web: al volver se ve que terminó. Mientras entrenás, la app pide mantener la pantalla prendida.
- El tema (claro, oscuro o automático) se guarda por dispositivo.
- Los aumentos sugeridos son 2,5 kg (de 20 kg para arriba) o 1 kg. Si tu equipo salta distinto, usá el más cercano.
