"use client";

import { useState } from "react";
import { fechaCorta, lunesDe, semanaDelPlan } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { CONSEJOS, DIAS, FASES, OBJETIVO, REGLA_DOBLE_PROGRESION, textoDescanso, textoSeries, type ClaveDia } from "@/lib/plan";
import { useTema, type Preferencia } from "@/lib/tema";
import { Boton, cx, Encabezado, Segmentos, Tarjeta } from "../ui";

export function VistaPlan() {
  const { ajustes, hoy } = useDatos();
  const [dia, setDia] = useState<ClaveDia>("A");
  const semana = ajustes.inicioPlan ? semanaDelPlan(ajustes.inicioPlan, hoy) : null;
  const elegido = DIAS.find((d) => d.clave === dia)!;

  return (
    <>
      <Encabezado sobre="Hipertrofia · 12 semanas · 3 días" titulo="Plan" />
      <div className="grid grid-cols-1 gap-4">
        <Tarjeta>
          <p className="text-[15px] leading-snug">{OBJETIVO}</p>
          <p className="mt-2 text-[14px] text-tinta-suave">
            Dejá al menos un día de descanso entre sesiones. Las series indicadas son efectivas: no incluyen calentamiento.
          </p>
        </Tarjeta>

        <Tarjeta>
          <Segmentos etiqueta="Día del plan" opciones={DIAS.map((d) => [d.clave, `Día ${d.clave}`] as [ClaveDia, string])} valor={dia} onCambiar={setDia} />
          <h2 className="mt-4 text-[20px] font-bold">{elegido.titulo}</h2>
          <p className="text-[14px] text-tinta-suave">Prioridad: {elegido.prioridad}</p>
          <ol className="mt-3 grid gap-0">
            {elegido.ejercicios.map((e, i) => (
              <li key={e.clave} className="grid grid-cols-[1.5rem_1fr_auto] gap-x-2 border-t border-linea py-3 first:border-t-0">
                <span className="cifras text-[15px] text-tinta-tenue">{i + 1}.</span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">{e.nombre}</span>
                  <span className="block text-[13px] text-tinta-suave">{e.enfoque}</span>
                </span>
                <span className="cifras text-right text-[14px]">
                  <span className="block font-semibold">{textoSeries(e)}</span>
                  <span className="block text-tinta-suave">{textoDescanso(e)}</span>
                </span>
              </li>
            ))}
          </ol>
        </Tarjeta>

        <Tarjeta>
          <h2 className="text-[17px] font-bold">Progresión en 12 semanas</h2>
          <ol className="mt-3 grid gap-3">
            {FASES.map((f) => {
              const actual = semana !== null && semana >= f.desde && semana <= f.hasta;
              return (
                <li
                  key={f.desde}
                  className={cx("rounded-2xl p-3", actual ? "bg-acento-suave ring-1 ring-acento/40" : "")}
                  aria-current={actual ? "step" : undefined}
                >
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-semibold">{f.objetivo}</span>
                    <span className="cifras shrink-0 text-[13px] text-tinta-suave">
                      {f.desde === f.hasta ? `Semana ${f.desde}` : `Semanas ${f.desde}–${f.hasta}`}
                      {actual ? " · ahora" : ""}
                    </span>
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-tinta-suave">{f.indicaciones}</p>
                </li>
              );
            })}
          </ol>
        </Tarjeta>

        <Tarjeta>
          <h2 className="text-[17px] font-bold">Regla de doble progresión</h2>
          <p className="mt-1 text-[15px] leading-snug">{REGLA_DOBLE_PROGRESION}</p>
          <p className="mt-2 text-[14px] text-tinta-suave">
            Mientras entrenás, cada ejercicio te dice si toca subir el peso o sumar repeticiones, mirando tu última sesión. Sube 2,5 kg en lo pesado y 1 kg en
            lo liviano: si tu máquina o tus mancuernas saltan distinto, usá el más cercano.
          </p>
        </Tarjeta>

        <Tarjeta>
          <h2 className="text-[17px] font-bold">Técnica, recuperación y nutrición</h2>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-[15px] leading-snug">
            {CONSEJOS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Tarjeta>

        <Ajustes />
      </div>
    </>
  );
}

function Ajustes() {
  const { ajustes, hoy, guardarAjustes, salir } = useDatos();
  const [tema, setTema] = useTema();
  const [fecha, setFecha] = useState(ajustes.inicioPlan ?? lunesDe(hoy));

  return (
    <Tarjeta className="grid gap-5">
      <h2 className="text-[17px] font-bold">Ajustes</h2>

      <div className="grid gap-2">
        <p className="text-[15px] font-semibold">Inicio del plan</p>
        <p className="text-[14px] text-tinta-suave">
          {ajustes.inicioPlan ? `La semana 1 empezó el lunes ${fechaCorta(ajustes.inicioPlan, hoy)}.` : "Todavía no elegiste cuándo arranca."} Para arrancar
          otro ciclo, poné una fecha nueva: los entrenamientos anteriores no cambian.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            aria-label="Fecha de inicio del plan"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="h-11 rounded-xl border border-linea bg-campo px-3 text-[16px] text-tinta"
          />
          <Boton
            variante="suave"
            className="h-11"
            disabled={!fecha || lunesDe(fecha) === ajustes.inicioPlan}
            onClick={() => guardarAjustes({ inicioPlan: lunesDe(fecha) })}
          >
            Guardar
          </Boton>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-[15px] font-semibold">Tema</p>
        <Segmentos<Preferencia>
          etiqueta="Tema"
          opciones={[
            ["auto", "Automático"],
            ["claro", "Claro"],
            ["oscuro", "Oscuro"],
          ]}
          valor={tema}
          onCambiar={setTema}
        />
        <p className="text-[13px] text-tinta-tenue">Automático: oscuro de 18:00 a 7:00 (hora de Argentina). Se guarda en este dispositivo.</p>
      </div>

      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-[15px] font-semibold">Sonido al terminar el descanso</span>
          <span className="block text-[13px] text-tinta-tenue">También vibra, si el teléfono lo permite.</span>
        </span>
        <input
          type="checkbox"
          checked={ajustes.sonido}
          onChange={(e) => guardarAjustes({ sonido: e.target.checked })}
          className="size-6 accent-[var(--color-acento)]"
        />
      </label>

      {salir && (
        <Boton variante="secundario" onClick={salir}>
          Cerrar sesión
        </Boton>
      )}
    </Tarjeta>
  );
}
