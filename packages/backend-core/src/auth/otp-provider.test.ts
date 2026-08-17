import assert from "node:assert/strict";
import test from "node:test";
import { createResendOtpProvider, OtpProviderError } from "./otp-provider.js";

test("Resend OTP adapter sends the email request without logging", async () => {
  let request: RequestInit | undefined;
  const provider = createResendOtpProvider({
    apiKey: "secret",
    from: "noreply@example.test",
    timeoutMs: 100,
    fetchImpl: async (_url, init) => {
      request = init;
      return new Response(null, { status: 202 });
    },
  });
  await provider.sendOtp("person@example.test", "123456");
  assert.equal(request?.method, "POST");
  assert.equal(request?.headers && new Headers(request.headers).get("authorization"), "Bearer secret");
  assert.deepEqual(JSON.parse(String(request?.body)), {
    from: "noreply@example.test",
    to: ["person@example.test"],
    subject: "Tu código de verificación de Savanhi",
    html: "<p>Tu código de verificación de Savanhi es <strong>123456</strong>.</p>",
    text: "Tu código de verificación de Savanhi es 123456.",
  });
});

test("Resend OTP adapter maps timeout and upstream failures", async () => {
  const timeoutProvider = createResendOtpProvider({
    apiKey: "secret",
    from: "noreply@example.test",
    timeoutMs: 1,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))),
  });
  await assert.rejects(() => timeoutProvider.sendOtp("a@example.test", "123456"), (error: unknown) => error instanceof OtpProviderError && error.kind === "timeout");

  const upstreamProvider = createResendOtpProvider({
    apiKey: "secret",
    from: "noreply@example.test",
    timeoutMs: 100,
    fetchImpl: async () => new Response(null, { status: 503 }),
  });
  await assert.rejects(() => upstreamProvider.sendOtp("a@example.test", "123456"), (error: unknown) => error instanceof OtpProviderError && error.kind === "upstream" && error.status === 503);
});
