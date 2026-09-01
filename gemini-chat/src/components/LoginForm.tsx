"use client";

import { useState } from "react";
import { login, registrar } from "../services/api";

const CATEGORIAS = ["show", "teatro", "festival", "esporte"];

interface LoginFormProps {
  onSucesso: (token: string) => void;
}

export default function LoginForm({ onSucesso }: LoginFormProps) {
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
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
          ? await login(email, senha)
          : await registrar(email, senha);
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
    <div className="ig-tela-login">
      <div className="ig-marca-painel">
        <div className="ig-quadro-marca" />
        <p className="ig-marca-painel__chamada">
          Fale o que você quer ver. A gente resolve o resto.
        </p>
        <div
          className="ig-escrita__atalhos"
          style={{ marginTop: "var(--e-5)" }}
        >
          {CATEGORIAS.map((c) => (
            <span key={c} className="ig-chip">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="ig-tela-login__form-col">
        <h2
          style={{
            font: "var(--t-t3)",
            letterSpacing: "var(--track-titulo)",
            margin: 0,
          }}
        >
          {modo === "login" ? "Entrar na sua conta" : "Criar sua conta"}
        </h2>
        <p
          style={{
            font: "var(--t-corpo)",
            color: "var(--c-acao)",
            marginTop: "var(--e-2)",
            marginBottom: "var(--e-6)",
          }}
        >
          {modo === "login"
            ? "Seu valor disponível já vem configurado na conta."
            : "Sua conta já começa com R$ 500,00 disponíveis para gastar."}
        </p>

        <form className="ig-form" onSubmit={handleSubmit}>
          <label>
            <div className="ig-campo__rotulo">
              <span>Usuário</span>
            </div>
            <input
              className="ig-campo__entrada"
              type="text"
              placeholder="ex: pedro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <div className="ig-campo__rotulo">
              <span>Senha</span>
              <span
                className="ig-campo__acao"
                onClick={() => setMostrarSenha((v) => !v)}
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </span>
            </div>
            <input
              className="ig-campo__entrada"
              type={mostrarSenha ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            {erro && <p className="ig-campo__erro">{erro}</p>}
          </label>

          <button
            type="submit"
            className="ig-botao ig-botao--principal ig-botao--bloco"
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

        <p
          style={{
            font: "var(--t-corpo)",
            textAlign: "center",
            marginTop: "var(--e-4)",
          }}
        >
          {modo === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <span
            className="ig-campo__acao"
            onClick={alternarModo}
            style={{ cursor: "pointer" }}
          >
            {modo === "login" ? "Criar conta" : "Entrar"}
          </span>
        </p>
      </div>
    </div>
  );
}
