// gemini-chat/src/app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  function handleSucesso(token: string) {
    localStorage.setItem("ingressos_token", token);
    router.push("/");
  }

  return <LoginForm onSucesso={handleSucesso} />;
}
