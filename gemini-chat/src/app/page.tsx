"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "../components/LoadingScreen";
import ChatWindow from "../components/ChatWindow";
import { buscarPerfil } from "../services/api";
import type { Usuario } from "../types";

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("ingressos_token");
    if (!salvo) {
      router.push("/login");
      return;
    }
    setToken(salvo);
    buscarPerfil(salvo)
      .then(setUsuario)
      .catch(() => router.push("/login"));
  }, [router]);

  if (!token || !usuario) return null;

  if (!pronto) {
    return <LoadingScreen onConcluido={() => setPronto(true)} />;
  }

  return <ChatWindow token={token} usuario={usuario} onUsuarioAtualizado={setUsuario} />;
}
