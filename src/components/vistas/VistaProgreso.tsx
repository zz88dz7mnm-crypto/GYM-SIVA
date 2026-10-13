"use client";

import { useMemo, useState } from "react";
import { fechaCorta, fechaRelativa } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { ejerciciosDelPlan, SESIONES_POR_SEMANA } from "@/lib/plan";
import { esValida, formatoKg, formatoVolumen, historiaDeEjercicio, semanas } from "@/lib/progreso";
import { GraficoBarras, GraficoLinea, TablaDeDatos } from "../Grafico";
import { IconoTrofeo } from "../iconos";
import { Encabezado, Segmentos, Tarjeta, Vacio, cx } from "../ui";

type Metrica = "pesoMax" | "maximoEstimado" | "volumen";

const METRICAS: [Metrica, string][] = [
  ["pesoMax", "Peso máximo"],
  ["maximoEstimado", "1RM estimado"],
  ["volumen", "Volumen"],
];

const EXPLICACION: Record<Metrica, string> = {
  pesoMax: "El peso más alto que moviste en cada sesión.",
  maximoEstimado:
    "Cuánto podrías levantar una vez, estimado con la fórmula de Epley a partir de tu mejor serie. Sirve para comparar sesiones con distintas repeticiones.",
  volumen: "Kilos × repeticiones, sumando todas las series hechas del ejercicio en la sesión.",
};

/** Los ejercicios con datos, primero los del plan en su orden; después los agregados a mano. */
export function useEjerciciosConDatos() {
  const { series } = useDatos();
  return useMemo(() => {
    const conteo = new Map<string, { nombre: string; series: number }>();
    for (const s of series) {
      if (!esValida(s)) continue;
      const c = conteo.get(s.ejercicio) ?? { nombre: s.ejercicioNombre, series: 0 };
      c.series += 1;
      conteo.set(s.ejercicio, c);
    }
    const delPlan = ejerciciosDelPlan().map((e) => ({ clave: e.clave, nombre: e.nombre, conDatos: conteo.has(e.clave) }));
    const extras = [...conteo.entries()]
      .filter(([clave]) => !delPlan.some((e) => e.clave === clave))
      .map(([clave, c]) => ({ clave, nombre: c.nombre, conDatos: true }));
    return [...delPlan, ...extras];
  }, [series]);
}

export function VistaProgreso() {
  return (
    <>
      <Encabezado titulo="Progreso" />
      <div className="grid grid-cols-1 gap-4">
        <ProgresoDeEjercicio />
        <Constancia />
        <PesoCorporal />
      </div>
    </>
  );
}

function ProgresoDeEjercicio() {
  const { sesiones, series, hoy } = useDatos();
  const ejercicios = useEjerciciosConDatos();
  const [clave, setClave] = useState(() => ejercicios.find((e) => e.conDatos)?.clave ?? ejercicios[0].clave);
  const [metrica, setMetrica] = useState<Metrica>("pesoMax");
  const [tabla, setTabla] = useState(false);

  const historia = useMemo(() => historiaDeEjercicio(sesiones, series, clave), [sesiones, series, clave]);
  const formato = metrica === "volumen" ? formatoVolumen : formatoKg;
  const puntos = historia.map((p) => ({
    etiqueta: fechaCorta(p.fecha, hoy),
    valor: p[metrica],
    detalle: `Mejor: ${formatoKg(p.pesoMax)} × ${p.repsConPesoMax} · ${p.series} series`,
  }));
  const record = historia.reduce<(typeof historia)[number] | null>((m, p) => (!m || p.pesoMax > m.pesoMax ? p : m), null);
  const primero = historia[0];
  const ultimo = historia.at(-1);
  const cambio = primero && ultimo && historia.length > 1 ? Math.round((ultimo[metrica] - primero[metrica]) * 10) / 10 : null;

  return (
    <Tarjeta>
      <label htmlFor="ejercicio" className="text-[13px] font-semibold text-tinta-suave">
        Ejercicio
      </label>
      <select
        id="ejercicio"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-linea bg-campo px-3 text-[17px] font-semibold text-tinta outline-none focus:border-acento"
      >
        {ejercicios.map((e) => (
          <option key={e.clave} value={e.clave}>
            {e.nombre}
            {e.conDatos ? "" : " (sin registros)"}
          </option>
        ))}
      </select>

      <div className="mt-4">
        <Segmentos etiqueta="Qué medir" opciones={METRICAS} valor={metrica} onCambiar={setMetrica} />
      </div>
      <p className="mt-2 text-[13px] text-tinta-tenue">{EXPLICACION[metrica]}</p>

      {historia.length === 0 ? (
        <Vacio titulo="Sin registros" texto="Todavía no hay series hechas de este ejercicio en entrenamientos terminados." />
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[13px] text-tinta-suave">Último</dt>
              <dd className="cifras text-[24px] font-bold tracking-tight">{formato(ultimo![metrica])}</dd>
              {cambio !== null && (
                <dd className={cx("cifras text-[13px] font-semibold", cambio > 0 ? "text-verde" : cambio < 0 ? "text-rojo" : "text-tinta-suave")}>
                  {cambio > 0 ? "▲ +" : cambio < 0 ? "▼ " : ""}
                  {cambio === 0 ? "Igual" : formato(cambio)} desde el {fechaCorta(primero!.fecha, hoy)}
                </dd>
              )}
            </div>
            {record && (
              <div>
                <dt className="flex items-center gap-1 text-[13px] text-tinta-suave">
                  <IconoTrofeo className="size-4 text-acento" /> Récord de peso
                </dt>
                <dd className="cifras text-[24px] font-bold tracking-tight">{formatoKg(record.pesoMax)}</dd>
                <dd className="cifras text-[13px] text-tinta-suave">
                  × {record.repsConPesoMax} · {fechaRelativa(record.fecha, hoy).toLowerCase()}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            <GraficoLinea puntos={puntos} formato={formato} nombre={`${METRICAS.find((m) => m[0] === metrica)![1]} por sesión`} />
          </div>
          <button type="button" onClick={() => setTabla((t) => !t)} aria-expanded={tabla} className="mt-2 text-[14px] font-semibold text-acento">
            {tabla ? "Ocultar tabla" : "Ver como tabla"}
          </button>
          {tabla && (
            <TablaDeDatos
              className="mt-2"
              titulo="Historia del ejercicio"
              columnas={["Fecha", "Mejor serie", "1RM est.", "Volumen"]}
              filas={[...historia]
                .reverse()
                .map((p) => [
                  fechaCorta(p.fecha, hoy),
                  `${formatoKg(p.pesoMax)} × ${p.repsConPesoMax}`,
                  formatoKg(p.maximoEstimado),
                  formatoVolumen(p.volumen),
                ])}
            />
          )}
        </>
      )}
    </Tarjeta>
  );
}

function Constancia() {
  const { sesiones, series, hoy } = useDatos();
  const lista = useMemo(() => semanas(sesiones, series, hoy, 12), [sesiones, series, hoy]);
  const [vista, setVista] = useState<"sesiones" | "volumen">("sesiones");
  const conDatos = lista.some((s) => s.sesiones > 0);
  const cumplidas = lista.filter((s) => s.sesiones >= SESIONES_POR_SEMANA).length;

  return (
    <Tarjeta>
      <h2 className="text-[17px] font-bold">Últimas 12 semanas</h2>
      <div className="mt-3">
        <Segmentos
          etiqueta="Qué ver por semana"
          opciones={[
            ["sesiones", "Entrenamientos"],
            ["volumen", "Volumen"],
          ]}
          valor={vista}
          onCambiar={setVista}
        />
      </div>
      {conDatos ? (
        <>
          <p className="mt-3 text-[15px] text-tinta-suave">
            {vista === "sesiones"
              ? `Llegaste a ${SESIONES_POR_SEMANA} entrenamientos en ${cumplidas} de las 12 semanas.`
              : "Kilos × repeticiones de todas las series hechas en la semana."}
          </p>
          <div className="mt-3">
            <GraficoBarras
              nombre={vista === "sesiones" ? "Entrenamientos por semana" : "Volumen por semana"}
              barras={lista.map((s) => ({
                etiqueta: fechaCorta(s.lunes, hoy),
                valor: vista === "sesiones" ? s.sesiones : s.volumen,
                detalle: vista === "sesiones" ? `Semana del ${fechaCorta(s.lunes, hoy)}` : `${s.sesiones} entrenamientos`,
              }))}
              formato={vista === "sesiones" ? (n) => `${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}` : formatoVolumen}
              objetivo={vista === "sesiones" ? SESIONES_POR_SEMANA : undefined}
            />
          </div>
        </>
      ) : (
        <Vacio titulo="Sin registros" texto="Cuando termines entrenamientos, acá vas a ver cuántos hacés por semana." />
      )}
    </Tarjeta>
  );
}

function PesoCorporal() {
  const { pesos, hoy, borrarPeso } = useDatos();
  const [editar, setEditar] = useState(false);
  const primero = pesos[0];
  const ultimo = pesos.at(-1);

  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">Peso corporal</h2>
        {pesos.length > 0 && (
          <button type="button" onClick={() => setEditar((e) => !e)} className="text-[14px] font-semibold text-acento">
            {editar ? "Listo" : "Editar"}
          </button>
        )}
      </div>
      {pesos.length === 0 ? (
        <Vacio titulo="Sin registros" texto="Anotá tu peso desde Hoy para ver cómo cambia." />
      ) : (
        <>
          {primero && ultimo && pesos.length > 1 && (
            <p className="cifras mt-1 text-[15px] text-tinta-suave">
              {formatoKg(ultimo.kg)} ahora · {ultimo.kg - primero.kg >= 0 ? "+" : ""}
              {formatoKg(Math.round((ultimo.kg - primero.kg) * 10) / 10)} desde el {fechaCorta(primero.fecha, hoy)}
            </p>
          )}
          <div className="mt-3">
            <GraficoLinea
              nombre="Peso corporal"
              alto={170}
              formato={formatoKg}
              puntos={pesos.map((p) => ({ etiqueta: fechaCorta(p.fecha, hoy), valor: p.kg }))}
            />
          </div>
          {editar && (
            <ul className="mt-3 grid gap-1">
              {[...pesos].reverse().map((p) => (
                <li key={p.fecha} className="flex items-center justify-between border-t border-linea py-1.5 text-[15px]">
                  <span className="cifras">
                    {fechaRelativa(p.fecha, hoy)} · {formatoKg(p.kg)}
                  </span>
                  <button
                    type="button"
                    onClick={() => borrarPeso(p.fecha)}
                    className="text-[14px] font-semibold text-rojo"
                    aria-label={`Borrar el peso del ${fechaCorta(p.fecha, hoy)}`}
                  >
                    Borrar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tarjeta>
  );
}
