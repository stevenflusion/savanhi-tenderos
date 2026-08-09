"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { loginUseCase } from "../../application/auth/login-use-case";
import { validateField } from "../../domain/auth/validation";
import type { LoginCredentials, LoginValidationErrors } from "../../domain/auth/credentials";

type LoginStatus = "idle" | "submitting" | "success" | "error";

const INITIAL_CREDENTIALS: LoginCredentials = {
  savanhiId: "",
  password: "",
};

export function useLoginForm() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>(INITIAL_CREDENTIALS);
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      credentials.savanhiId.trim().length > 0 &&
      credentials.password.length > 0 &&
      status !== "submitting"
    );
  }, [credentials, status]);

  function onChange(field: keyof LoginCredentials, value: string) {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
    if (message) setMessage("");
  }

  function onBlur(field: keyof LoginCredentials) {
    const error = validateField(field, credentials[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  async function onSubmit() {
    setStatus("submitting");
    setMessage("");

    const result = await loginUseCase(credentials);

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("error");
      setMessage(result.message ?? "Verifica tus datos e intenta de nuevo.");
      return;
    }

    setStatus("success");
    setMessage(`Bienvenido, ${result.userName}.`);
    await router.push(result.nextRoute);
  }

  return {
    credentials,
    errors,
    status,
    message,
    canSubmit,
    onChange,
    onBlur,
    onSubmit,
  };
}
