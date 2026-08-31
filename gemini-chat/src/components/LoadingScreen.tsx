"use client";

import { useEffect, useState } from "react";

const ETAPAS = [
  "Reconhecendo sua conta",
  "Conferindo quanto você pode gastar",
  "Buscando os eventos de hoje",
  "Abrindo sua conversa",
];

interface LoadingScreenProps {
  onConcluido: () => void;
}

export default function LoadingScreen({ onConcluido }: LoadingScreenProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);

  useEffect(() => {
    if (etapaAtual >= ETAPAS.length) {
      onConcluido();
      return;
    }
    const timer = setTimeout(() => setEtapaAtual((n) => n + 1), 500);
    return () => clearTimeout(timer);
  }, [etapaAtual, onConcluido]);

  return (
    <div className="ig-tela-carregando">
      <div className="ig-carregando">
        <div className="ig-carregando__blocos">
          {ETAPAS.map((_, i) => (
            <span
              key={i}
              className={`ig-carregando__bloco ${
                i < etapaAtual
                  ? "ig-carregando__bloco--feito"
                  : i === etapaAtual
                    ? "ig-carregando__bloco--agora"
                    : ""
              }`}
            />
          ))}
        </div>

        <h1
          style={{
            font: "var(--t-t2)",
            letterSpacing: "var(--track-titulo)",
            marginTop: "var(--e-6)",
          }}
        >
          Só um instante
        </h1>
        <p
          style={{
            font: "var(--t-corpo)",
            color: "var(--c-tinta-70)",
            marginTop: "var(--e-2)",
          }}
        >
          Estamos deixando tudo pronto para você conversar.
        </p>

        <div className="ig-etapas" aria-live="polite">
          {ETAPAS.map((etapa, i) => {
            const estado =
              i < etapaAtual ? "feita" : i === etapaAtual ? "agora" : "espera";
            return (
              <div key={etapa} className={`ig-etapa ig-etapa--${estado}`}>
                <span className="ig-etapa__marca" />
                <span className="ig-etapa__nome">{etapa}</span>
                <span className="ig-etapa__estado">
                  {estado === "feita"
                    ? "pronto"
                    : estado === "agora"
                      ? "agora"
                      : "em fila"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
