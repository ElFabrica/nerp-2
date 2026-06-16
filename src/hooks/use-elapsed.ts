"use client";

import { useEffect, useState } from "react";

// Relógio que recalcula "agora" a cada segundo, para o tempo decorrido subir
// suave entre os pollings (5s) sem nenhuma ida ao servidor.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

// Tempo decorrido desde uma data ISO no formato mm:ss.
export function formatElapsed(createdAtIso: string, now: number) {
  const ms = Math.max(0, now - new Date(createdAtIso).getTime());
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
