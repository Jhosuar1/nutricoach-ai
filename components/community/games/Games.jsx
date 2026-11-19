"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Footprints, Medal, RotateCcw, Timer, Zap } from "lucide-react";
import { primary } from "../controls";
import "./games.css";

const distance = 100;
const stride = 5;
const limit = 15;
const initial = { phase: "idle", meters: 0, elapsed: 0, reaction: null };

function formatSeconds(seconds) {
  return seconds.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " s";
}

export default function Games({ userId }) {
  const [race, setRace] = useState(initial);
  const [best, setBest] = useState(null);
  const live = useRef(initial);
  const timer = useRef(null);
  const started = useRef(0);
  const bestKey = `nutricoach-sprint-best:${userId}`;

  useEffect(() => {
    try {
      const value = Number(localStorage.getItem(bestKey));
      setBest(Number.isFinite(value) && value > 0 && value <= limit ? value : null);
    } catch {
      setBest(null);
    }
  }, [bestKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (race.phase !== "running") return;
    const ticker = setInterval(() => {
      if (live.current.phase !== "running") return;
      const elapsed = Math.min(limit, (performance.now() - started.current) / 1000);
      update({ ...live.current, elapsed, phase: elapsed >= limit ? "timeout" : "running" });
    }, 50);
    return () => clearInterval(ticker);
  }, [race.phase]);

  function update(next) {
    live.current = next;
    setRace(next);
  }

  function run() {
    const current = live.current;
    if (current.phase === "waiting") {
      clearTimeout(timer.current);
      update({ ...initial, phase: "false" });
      return;
    }
    if (current.phase === "running") {
      const elapsed = (performance.now() - started.current) / 1000;
      if (elapsed >= limit) {
        update({ ...current, phase: "timeout", elapsed: limit });
        return;
      }
      const meters = Math.min(distance, current.meters + stride);
      const reaction = current.reaction ?? Math.round(elapsed * 1000);
      const finished = meters === distance;
      update({ phase: finished ? "finished" : "running", meters, elapsed, reaction });
      if (finished && (best === null || elapsed < best)) {
        setBest(elapsed);
        try { localStorage.setItem(bestKey, String(elapsed)); } catch {}
      }
      return;
    }

    update({ ...initial, phase: "waiting" });
    timer.current = setTimeout(() => {
      started.current = performance.now();
      update({ ...initial, phase: "running" });
    }, 1200 + Math.random() * 1800);
  }

  const ready = race.phase === "waiting";
  const running = race.phase === "running";
  const finished = race.phase === "finished";
  const medal = race.elapsed < 5 ? "Oro" : race.elapsed < 8 ? "Plata" : "Bronce";
  const call = {
    idle: "Preparar carrera",
    waiting: "Espera la salida",
    running: "Corre",
    finished: "Volver a correr",
    false: "Intentar de nuevo",
    timeout: "Intentar de nuevo",
  }[race.phase];
  const message = {
    idle: "Espera la señal y toca repetidamente para llegar a la meta.",
    waiting: "En sus marcas…",
    running: "¡Ya!",
    finished: `Medalla de ${medal.toLowerCase()}`,
    false: "Salida en falso. Espera a que aparezca «¡Ya!».",
    timeout: "Se acabó el tiempo. Vuelve a intentarlo.",
  }[race.phase];

  return <section className="sprint-game" aria-labelledby="sprint-title">
    <header className="sprint-header">
      <div>
        <p className="sprint-discipline"><Flag size={15} aria-hidden="true" /> Atletismo</p>
        <h2 id="sprint-title">Sprint 100 m</h2>
      </div>
      <div className="sprint-best">
        <Medal size={20} aria-hidden="true" />
        <span>Mejor marca <strong>{best === null ? "—" : formatSeconds(best)}</strong></span>
      </div>
    </header>

    <div className="sprint-scene" aria-hidden="true">
      <div className="sprint-stands" />
      <div className="sprint-track">
        <div className="sprint-lane"><span className="sprint-marker sprint-competitor" style={{ left: `${Math.min(96, race.elapsed * 9)}%` }}>Rival</span></div>
        <div className="sprint-lane sprint-player"><span className="sprint-marker sprint-you" style={{ left: `${race.meters * .96}%` }}><Footprints size={16} /> Tú</span></div>
        <div className="sprint-lane"><span className="sprint-marker sprint-competitor" style={{ left: `${Math.min(96, race.elapsed * 7)}%` }}>Rival</span></div>
        <div className="sprint-finish" />
      </div>
      <div className="sprint-scale"><span>0 m</span><span>50 m</span><span>100 m</span></div>
    </div>

    <div className="sprint-controls">
      <div className="sprint-readouts">
        <div><Timer size={17} aria-hidden="true" /><span>Tiempo <strong>{formatSeconds(race.elapsed)}</strong></span></div>
        <div><Flag size={17} aria-hidden="true" /><span>Distancia <strong>{race.meters} m</strong></span></div>
        <div><Zap size={17} aria-hidden="true" /><span>Reacción <strong>{race.reaction === null ? "—" : `${race.reaction} ms`}</strong></span></div>
      </div>
      <p className={`sprint-status ${running ? "sprint-go" : ""}`} role="status">{message}</p>
      <button type="button" className={`${primary} sprint-action ${ready ? "sprint-wait" : ""} ${running ? "sprint-active" : ""}`}
        onClick={run} onKeyDown={event => {
          if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault();
        }}>
        {finished || race.phase === "false" || race.phase === "timeout" ? <RotateCcw size={19} /> : <Footprints size={19} />} {call}
      </button>
    </div>
  </section>;
}
