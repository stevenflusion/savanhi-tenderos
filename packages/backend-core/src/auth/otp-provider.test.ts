import assert from "node:assert/strict";
import test from "node:test";
import { createExternalOtpProvider, OtpProviderError } from "./otp-provider.js";

test("external OTP adapter sends the Resend email request without logging", async () => {
  let request: RequestInit | undefined;
  const provider = createExternalOtpProvider({
    url: "https://provider.test/send",
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
    to: "person@example.test",
    subject: "Your Savanhi verification code",
    html: "<p>Your Savanhi verification code is <strong>123456</strong>.</p>",
    text: "Your Savanhi verification code is 123456.",
  });
});

test("external OTP adapter maps timeout and upstream failures", async () => {
  const timeoutProvider = createExternalOtpProvider({
    url: "https://provider.test/send",
    apiKey: "secret",
    from: "noreply@example.test",
    timeoutMs: 1,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))),
  });
  await assert.rejects(() => timeoutProvider.sendOtp("a@example.test", "123456"), (error: unknown) => error instanceof OtpProviderError && error.kind === "timeout");

  const upstreamProvider = createExternalOtpProvider({
    url: "https://provider.test/send",
    apiKey: "secret",
    from: "noreply@example.test",
    timeoutMs: 100,
    fetchImpl: async () => new Response(null, { status: 503 }),
  });
  await assert.rejects(() => upstreamProvider.sendOtp("a@example.test", "123456"), (error: unknown) => error instanceof OtpProviderError && error.kind === "upstream" && error.status === 503);
});
