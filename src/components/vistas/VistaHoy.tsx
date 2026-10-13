"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorDeDatos } from "@/lib/datos/repositorio";
import { diasEntre, fechaCorta, fechaRelativa, horaLocal, lunesDe, semanaDelPlan, sumarDias } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { DIAS, dia, diaQueSigue, faseDeSemana, SEMANAS_DEL_PLAN, SESIONES_POR_SEMANA, textoSeries, type ClaveDia } from "@/lib/plan";
import { formatoKg, leerNumero } from "@/lib/progreso";
import { IconoFlecha, Pesa } from "../iconos";
import { Boton, cx, Encabezado, Tarjeta } from "../ui";
import { tituloDeSesion } from "./VistaEntrenar";

export function VistaHoy() {
  const { hoy, sesiones } = useDatos();
  const enCurso = sesiones.find((s) => s.estado === "en_curso");
  const [diaSemana] = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(new Date(`${hoy}T12:00:00Z`)).split(" ");

  return (
    <>
      <Encabezado sobre={`${diaSemana} ${fechaCorta(hoy)}`} titulo="Hoy" />
      <div className="grid grid-cols-1 gap-4">
        <EstadoDelPlan />
        {enCurso ? (
          <Tarjeta className="border-acento/40">
            <p className="text-[13px] font-semibold tracking-wide text-acento uppercase">En curso</p>
            <h2 className="mt-1 text-[22px] font-bold">{tituloDeSesion(enCurso)}</h2>
            <p className="mt-1 text-[15px] text-tinta-suave">
              Empezó {enCurso.fecha === hoy ? "hoy" : fechaRelativa(enCurso.fecha, hoy).toLowerCase()} a las {horaLocal(enCurso.inicio)}.
            </p>
            <Link href="/entrenar" className="mt-4 flex h-12 items-center justify-center rounded-full bg-acento text-[17px] font-semibold text-sobre-acento">
              Seguir entrenando
            </Link>
          </Tarjeta>
        ) : (
          <QueToca />
        )}
        <EstaSemana />
        <PesoCorporal />
      </div>
    </>
  );
}

function EstadoDelPlan() {
  const { ajustes, hoy, guardarAjustes } = useDatos();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(lunesDe(hoy));

  if (!ajustes.inicioPlan) {
    return (
      <Tarjeta>
        <h2 className="text-[17px] font-bold">¿Cuándo arrancás el plan de 12 semanas?</h2>
        <p className="mt-1 text-[15px] text-tinta-suave">Con la fecha de inicio te digo en qué semana y fase estás. La semana va de lunes a domingo.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid grid-cols-1 gap-1 text-[13px] text-tinta-suave">
            Semana 1 empieza el
            <input
              type="date"
              value={fecha}
              max={sumarDias(hoy, 28)}
              onChange={(e) => setFecha(e.target.value)}
              className="h-11 rounded-xl border border-linea bg-campo px-3 text-[16px] text-tinta"
            />
          </label>
          <Boton onClick={() => fecha && guardarAjustes({ inicioPlan: lunesDe(fecha) })} className="h-11">
            Guardar
          </Boton>
        </div>
      </Tarjeta>
    );
  }

  const semana = semanaDelPlan(ajustes.inicioPlan, hoy);
  const fase = faseDeSemana(semana);

  if (semana < 1) {
    return (
      <Tarjeta>
        <p className="text-[15px] text-tinta-suave">
          El plan arranca el lunes {fechaCorta(ajustes.inicioPlan, hoy)}: faltan {diasEntre(hoy, ajustes.inicioPlan)} días.
        </p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">{semana <= SEMANAS_DEL_PLAN ? `Semana ${semana} de ${SEMANAS_DEL_PLAN}` : "Plan terminado"}</h2>
        {fase && <span className="text-[14px] font-semibold text-acento">{fase.objetivo}</span>}
      </div>
      <div className="mt-3 flex gap-1" role="img" aria-label={`Semana ${Math.min(semana, SEMANAS_DEL_PLAN)} de ${SEMANAS_DEL_PLAN}`}>
        {Array.from({ length: SEMANAS_DEL_PLAN }, (_, i) => (
          <span key={i} className={cx("h-2 flex-1 rounded-full", i + 1 < semana ? "bg-acento" : i + 1 === semana ? "bg-acento/60" : "bg-tinta/10")} />
        ))}
      </div>
      {fase ? (
        <>
          <button type="button" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto} className="mt-3 text-[14px] font-semibold text-tinta-suave">
            {abierto ? "Ocultar indicaciones" : "Ver indicaciones de la semana"}
          </button>
          {abierto && <p className="mt-1 text-[15px] leading-snug">{fase.indicaciones}</p>}
        </>
      ) : (
        <p className="mt-3 text-[15px] text-tinta-suave">
          Completaste las 12 semanas. Compará con la primera semana en Progreso, o cambiá la fecha de inicio en Plan para arrancar otro ciclo.
        </p>
      )}
    </Tarjeta>
  );
}

function QueToca() {
  const router = useRouter();
  const { sesiones, hoy, iniciarSesion, recargar } = useDatos();
  const completadas = sesiones.filter((s) => s.estado === "completada");
  const ultimaDelPlan = completadas.find((s) => s.dia !== "libre");
  const sugerido = diaQueSigue(ultimaDelPlan && ultimaDelPlan.dia !== "libre" ? ultimaDelPlan.dia : null);
  const [elegido, setElegido] = useState<ClaveDia | "libre">(sugerido);
  const [empezando, setEmpezando] = useState(false);
  const [error, setError] = useState("");
  const hoyYa = completadas.some((s) => s.fecha === hoy);
  const ayer = completadas.some((s) => s.fecha === sumarDias(hoy, -1));

  async function empezar() {
    setEmpezando(true);
    setError("");
    try {
      await iniciarSesion(elegido);
      router.push("/entrenar");
    } catch (fallo) {
      setEmpezando(false);
      if (fallo instanceof ErrorDeDatos && fallo.yaHayEnCurso) {
        setError("Ya hay un entrenamiento en curso (quizás lo empezaste en otro dispositivo). Actualizo la pantalla.");
        setTimeout(recargar, 1500);
      } else setError("No pude empezar el entrenamiento: revisá la conexión y probá de nuevo.");
    }
  }

  const plan = elegido === "libre" ? null : dia(elegido);

  return (
    <Tarjeta>
      <p className="text-[13px] font-semibold tracking-wide text-tinta-suave uppercase">{elegido === sugerido ? "Te toca" : "Elegiste"}</p>
      <h2 className="mt-1 text-[24px] leading-tight font-bold">{plan ? `Día ${plan.clave} · ${plan.titulo}` : "Entrenamiento libre"}</h2>
      <p className="mt-1 text-[15px] text-tinta-suave">{plan ? plan.prioridad : "Sin plan: agregás los ejercicios que hagas."}</p>

      <div className="mt-4">
        <p className="mb-2 text-[13px] text-tinta-suave">{elegido === sugerido ? "¿Otro día?" : `Lo que sigue en la rotación es el día ${sugerido}.`}</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Día a entrenar">
          {[...DIAS.map((d) => d.clave), "libre" as const].map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === elegido}
              onClick={() => setElegido(c)}
              className={cx(
                "h-10 flex-1 rounded-full text-[15px] font-semibold transition-colors",
                c === elegido ? "bg-acento text-sobre-acento" : "cristal-leve text-tinta-suave",
              )}
            >
              {c === "libre" ? "Libre" : c}
            </button>
          ))}
        </div>
      </div>

      {plan && (
        <ol className="mt-4 grid gap-1.5">
          {plan.ejercicios.map((e, i) => (
            <li key={e.clave} className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="min-w-0">
                <span className="cifras mr-2 text-tinta-tenue">{i + 1}.</span>
                {e.nombre}
              </span>
              <span className="cifras shrink-0 text-[14px] text-tinta-suave">{textoSeries(e)}</span>
            </li>
          ))}
        </ol>
      )}

      {(hoyYa || ayer) && (
        <p className="mt-4 rounded-2xl bg-acento-suave px-3.5 py-2.5 text-[14px] leading-snug">
          {hoyYa ? "Ya entrenaste hoy." : "Entrenaste ayer."} El plan recomienda dejar al menos un día de descanso entre sesiones cuando se pueda.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[14px] text-rojo">
          {error}
        </p>
      )}
      <Boton className="mt-4 w-full" onClick={empezar} disabled={empezando}>
        <Pesa className="size-5" /> {empezando ? "Empezando…" : plan ? `Empezar día ${plan.clave}` : "Empezar libre"}
      </Boton>
    </Tarjeta>
  );
}

function EstaSemana() {
  const { sesiones, hoy } = useDatos();
  const lunes = lunesDe(hoy);
  const deLaSemana = sesiones.filter((s) => s.estado === "completada" && s.fecha >= lunes && s.fecha <= sumarDias(lunes, 6)).reverse();
  const cantidad = deLaSemana.length;

  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">Esta semana</h2>
        <span className="cifras text-[15px] font-semibold">
          {cantidad} de {SESIONES_POR_SEMANA}
        </span>
      </div>
      <div className="mt-3 flex gap-2" role="img" aria-label={`${cantidad} de ${SESIONES_POR_SEMANA} entrenamientos esta semana`}>
        {Array.from({ length: Math.max(SESIONES_POR_SEMANA, cantidad) }, (_, i) => (
          <span key={i} className={cx("h-2.5 flex-1 rounded-full", i < cantidad ? "bg-verde" : "bg-tinta/10")} />
        ))}
      </div>
      {cantidad > 0 ? (
        <ul className="mt-3 grid gap-1">
          {deLaSemana.map((s) => (
            <li key={s.id}>
              <Link href={`/historial#${s.id}`} className="flex items-center justify-between gap-3 py-1 text-[15px]">
                <span>{tituloDeSesion(s)}</span>
                <span className="flex items-center gap-1 text-[14px] text-tinta-suave">
                  {fechaRelativa(s.fecha, hoy)} <IconoFlecha className="size-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[15px] text-tinta-suave">Todavía no entrenaste esta semana.</p>
      )}
    </Tarjeta>
  );
}

function PesoCorporal() {
  const { pesos, hoy, guardarPeso } = useDatos();
  const deHoy = pesos.find((p) => p.fecha === hoy);
  const ultimo = pesos.at(-1);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">Peso corporal</h2>
        {ultimo && (
          <span className="cifras text-[15px] text-tinta-suave">
            {formatoKg(ultimo.kg)} · {fechaRelativa(ultimo.fecha, hoy).toLowerCase()}
          </span>
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const kg = leerNumero(texto);
          if (kg === null || kg <= 20 || kg >= 400) {
            setError("Escribí tu peso en kilos, por ejemplo 76,5.");
            return;
          }
          guardarPeso({ fecha: hoy, kg });
          setTexto("");
          setError("");
        }}
      >
        <label htmlFor="peso-hoy" className="sr-only">
          Peso de hoy en kilos
        </label>
        <input
          id="peso-hoy"
          inputMode="decimal"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={deHoy ? `Hoy: ${String(deHoy.kg).replace(".", ",")} kg` : "Peso de hoy (kg)"}
          className="cifras h-11 min-w-0 flex-1 rounded-xl border border-linea bg-campo px-3 text-[16px] outline-none focus:border-acento focus:ring-2 focus:ring-acento/20"
        />
        <Boton type="submit" variante="suave" className="h-11">
          {deHoy ? "Corregir" : "Anotar"}
        </Boton>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-rojo">
          {error}
        </p>
      )}
      <p className="mt-2 text-[13px] text-tinta-tenue">
        Pesate en condiciones parecidas (por ejemplo, a la mañana). El plan ajusta calorías por el promedio semanal.
      </p>
    </Tarjeta>
  );
}
