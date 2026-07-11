"use client";

import { FormEvent, useState } from "react";
import { useLoginForm } from "../../hooks/use-login-form";

function inputClassName(hasError: boolean): string {
  const base =
    "w-full h-12 placeholder:text-gray-600 rounded-full border shadow px-4 transition";
  const focus = "focus:ring-2 focus:ring-offset-1";

  if (hasError) {
    return `${base} border-rose-300 focus:border-rose-500 focus:ring-rose-200`;
  }

  return `${base} border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${focus}`;
}

export function LoginForm() {
  const {
    credentials,
    errors,
    status,
    message,
    canSubmit,
    onChange,
    onBlur,
    onSubmit,
  } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onSubmit();
  }

  const savanhiIdErrorId = "savanhiId-error";
  const passwordErrorId = "password-error";
  const formMessageId = "form-message";

  return (
    <section className="p-4">
      <form className="space-y-4" onSubmit={handleSubmit} aria-describedby={message ? formMessageId : undefined}>
        {/* SavanhID field */}
        <div className="w-full px-36">
          <div className="relative">
            <input
              autoComplete="username"
              autoFocus={typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches}
              className={inputClassName(Boolean(errors.savanhiId))}
              onChange={(event) => onChange("savanhiId", event.target.value)}
              onBlur={() => onBlur("savanhiId")}
              placeholder="SavanhID"
              type="text"
              value={credentials.savanhiId}
              aria-invalid={Boolean(errors.savanhiId) || undefined}
              aria-describedby={errors.savanhiId ? savanhiIdErrorId : undefined}
            />
          </div>
          {errors.savanhiId ? (
            <p id={savanhiIdErrorId} className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.savanhiId}
            </p>
          ) : null}
        </div>

        {/* Password field */}
        <div className="w-full px-36">
          <div className="relative">
            <input
              autoComplete="current-password"
              className={`${inputClassName(Boolean(errors.password))} pr-12`}
              onChange={(event) => onChange("password", event.target.value)}
              onBlur={() => onBlur("password")}
              placeholder="Contraseña"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              aria-invalid={Boolean(errors.password) || undefined}
              aria-describedby={errors.password ? passwordErrorId : undefined}
            />
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password ? (
            <p id={passwordErrorId} className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.password}
            </p>
          ) : null}
        </div>

        {/* Submit button */}
        <div className="w-full px-36">
          <button
            className="cursor-pointer flex items-center justify-between px-4 w-full rounded-full h-12 bg-black text-white"
            disabled={!canSubmit}
            type="submit"
          >
            <p>{status === "submitting" ? "Validando..." : "Iniciar sesión"}</p>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="#fff"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>

        {/* Contact link */}
        <button className="underline ml-64 text-gray-600 text-sm text-center pt-8" type="button">
          Contactarse con Savanhi
        </button>
      </form>

      {/* Status message */}
      {message ? (
        <p
          id={formMessageId}
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
