// gemini-chat/src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { login, registrar } from "../services/api";
import "./login.css";

const CATEGORIAS = ["show", "teatro", "festival", "esporte"];

interface LoginFormProps {
  onSucesso: (token: string) => void;
}

export default function LoginForm({ onSucesso }: LoginFormProps) {
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const token =
        modo === "login"
          ? await login(username, senha)
          : await registrar(username, senha);
      onSucesso(token);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : modo === "login"
            ? "Usuário ou senha não conferem."
            : "Não foi possível criar sua conta.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function alternarModo() {
    setModo((m) => (m === "login" ? "cadastro" : "login"));
    setErro(null);
  }

  return (
    <div className="tela-login">
      <div className="painel-marca">
        <span className="selo-marca">Ingressos</span>
        <h1 className="frase-marca">
          Fale o que você quer ver. A gente resolve o resto.
        </h1>
        <div className="chips-categorias">
          {CATEGORIAS.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="painel-form">
        <h2 className="titulo-form">
          {modo === "login" ? "Entrar na sua conta" : "Criar sua conta"}
        </h2>
        <p className="subtitulo-form">
          {modo === "login"
            ? "Seu valor disponível já vem configurado na conta."
            : "Sua conta já começa com R$ 500,00 disponíveis para gastar."}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="rotulo" htmlFor="username">
            Usuário
          </label>
          <input
            id="username"
            type="text"
            placeholder="ex: pedro"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="linha-rotulo">
            <label className="rotulo" htmlFor="senha">
              Senha
            </label>
            <button
              type="button"
              className="link-discreto"
              onClick={() => setMostrarSenha((v) => !v)}
            >
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && <p className="mensagem-erro">{erro}</p>}

          <button
            type="submit"
            className="botao-primario"
            disabled={carregando}
          >
            {carregando
              ? modo === "login"
                ? "Entrando..."
                : "Criando conta..."
              : modo === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <p className="alternar-modo">
          {modo === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            className="link-discreto"
            onClick={alternarModo}
          >
            {modo === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
