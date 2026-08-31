"use client";

import { useEffect, useState } from "react";
import "./loading.css";

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

  const progresso = (etapaAtual / ETAPAS.length) * 100;

  return (
    <div className="tela-carregando">
      <div className="blocos-progresso">
        {ETAPAS.map((_, i) => (
          <span
            key={i}
            className={`bloco ${i < etapaAtual ? "concluido" : ""}`}
          />
        ))}
      </div>

      <h1 className="titulo-carregando">Só um instante</h1>
      <p className="subtitulo-carregando">
        Estamos deixando tudo pronto para você conversar.
      </p>

      <ul className="lista-etapas">
        {ETAPAS.map((etapa, i) => (
          <li
            key={etapa}
            className={`etapa ${i === etapaAtual ? "em-curso" : ""}`}
          >
            <span
              className={`marcador ${
                i < etapaAtual ? "pronto" : i === etapaAtual ? "curso" : ""
              }`}
            />
            <span className="texto-etapa">{etapa}</span>
            <span className="status-etapa">
              {i < etapaAtual
                ? "pronto"
                : i === etapaAtual
                  ? "agora"
                  : "em fila"}
            </span>
          </li>
        ))}
      </ul>

      <div className="barra-progresso">
        <div className="barra-preenchida" style={{ width: `${progresso}%` }} />
      </div>
    </div>
  );
}
