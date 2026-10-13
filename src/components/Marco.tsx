"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { reloj, useDescanso } from "@/lib/descanso";
import { useDatos } from "@/lib/gym";
import { IconoHistorial, IconoHoy, IconoPanel, IconoPlan, IconoProgreso, Pesa } from "./iconos";
import { cx } from "./ui";

const SECCIONES = [
  { ruta: "/", nombre: "Hoy", Icono: IconoHoy },
  { ruta: "/historial", nombre: "Historial", Icono: IconoHistorial },
  { ruta: "/progreso", nombre: "Progreso", Icono: IconoProgreso },
  { ruta: "/plan", nombre: "Plan", Icono: IconoPlan },
  { ruta: "/panel", nombre: "Panel", Icono: IconoPanel },
];

/**
 * El armazón: barra lateral en la compu, barra inferior en el celular.
 * Mientras se entrena, la barra inferior se esconde para dejar lugar.
 */
export function Marco({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const { sesiones } = useDatos();
  const enCurso = sesiones.find((s) => s.estado === "en_curso");
  const entrenando = ruta === "/entrenar";
  const activa = (r: string) => (r === "/" ? ruta === "/" || ruta === "/entrenar" : ruta.startsWith(r));

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <nav aria-label="Secciones" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 px-4 py-6 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-3">
          <span className="grid size-10 place-items-center rounded-xl bg-acento text-sobre-acento">
            <Pesa className="size-6" />
          </span>
          <span className="text-[20px] font-bold tracking-tight">GYM</span>
        </Link>
        {SECCIONES.map(({ ruta: r, nombre, Icono }) => (
          <Link
            key={r}
            href={r}
            aria-current={activa(r) ? "page" : undefined}
            className={cx(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors",
              activa(r) ? "bg-acento-suave text-acento" : "text-tinta-suave hover:bg-tinta/5",
            )}
          >
            <Icono className="size-5" />
            {nombre}
            {r === "/" && enCurso && <span className="ml-auto size-2 rounded-full bg-acento" aria-label="Entrenamiento en curso" />}
          </Link>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        <main
          className={cx(
            "mx-auto w-full max-w-3xl px-4 pt-[max(env(safe-area-inset-top),1rem)] lg:px-8 lg:pt-8 lg:pb-16",
            entrenando ? "pb-40" : "pb-44 lg:pb-16",
          )}
        >
          <AvisoPendientes />
          {children}
        </main>
      </div>

      <BarraDescanso conNavegacion={!entrenando} />

      {!entrenando && (
        <nav
          aria-label="Secciones"
          className="cristal fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-30 flex rounded-[26px] px-1 py-1 lg:hidden"
        >
          {SECCIONES.map(({ ruta: r, nombre, Icono }) => (
            <Link
              key={r}
              href={r}
              aria-current={activa(r) ? "page" : undefined}
              className={cx(
                "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-semibold transition-colors",
                activa(r) ? "text-acento" : "text-tinta-tenue",
              )}
            >
              <Icono className="size-6" />
              {nombre}
              {r === "/" && enCurso && (
                <span className="absolute top-2 right-[calc(50%-18px)] size-2 rounded-full bg-acento" aria-label="Entrenamiento en curso" />
              )}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Si algo no se pudo guardar (sin conexión), lo dice y deja reintentar. Nunca se da por guardado. */
function AvisoPendientes() {
  const { pendientes, reintentar } = useDatos();
  if (pendientes === 0) return null;
  return (
    <div role="status" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-rojo/10 px-4 py-3 text-[14px] text-rojo">
      <span>{pendientes === 1 ? "Hay 1 cambio sin guardar" : `Hay ${pendientes} cambios sin guardar`}. Se reintenta solo al volver la conexión.</span>
      <button type="button" onClick={reintentar} className="shrink-0 rounded-full bg-rojo px-3 py-1.5 font-semibold text-white">
        Reintentar
      </button>
    </div>
  );
}

/** El temporizador flotante: se ve en cualquier pantalla mientras corre. */
function BarraDescanso({ conNavegacion }: { conNavegacion: boolean }) {
  const { descanso, restante, terminado, sumar, saltar } = useDescanso();
  if (!descanso) return null;
  const avance = descanso.total > 0 ? 1 - restante / descanso.total : 1;

  return (
    <div
      role="timer"
      aria-live={terminado ? "assertive" : "off"}
      className={cx(
        "cristal fixed inset-x-3 z-40 mx-auto max-w-md animate-aparecer overflow-hidden rounded-[24px] lg:right-8 lg:bottom-8 lg:left-auto lg:w-96",
        conNavegacion ? "bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+4.75rem)]" : "bottom-[max(env(safe-area-inset-bottom),0.75rem)]",
        terminado && "ring-2 ring-acento",
      )}
    >
      <div className="h-1 bg-acento-suave">
        <div className="h-full bg-acento transition-[width] duration-300 ease-linear" style={{ width: `${Math.min(100, avance * 100)}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-tinta-suave">{terminado ? "¡Listo! A la próxima serie" : `Descanso · ${descanso.etiqueta}`}</p>
          <p className="cifras text-[30px] leading-none font-bold tracking-tight" aria-label={terminado ? "Descanso terminado" : `Faltan ${restante} segundos`}>
            {terminado ? "0:00" : reloj(restante)}
          </p>
        </div>
        {!terminado && (
          <>
            <button
              type="button"
              onClick={() => sumar(-15)}
              className="cristal-leve h-11 rounded-full px-3 text-[15px] font-semibold"
              aria-label="Restar 15 segundos"
            >
              −15
            </button>
            <button
              type="button"
              onClick={() => sumar(15)}
              className="cristal-leve h-11 rounded-full px-3 text-[15px] font-semibold"
              aria-label="Sumar 15 segundos"
            >
              +15
            </button>
          </>
        )}
        <button type="button" onClick={saltar} className="h-11 rounded-full bg-acento px-4 text-[15px] font-semibold text-sobre-acento">
          {terminado ? "OK" : "Saltar"}
        </button>
      </div>
    </div>
  );
}
