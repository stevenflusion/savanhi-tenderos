export type OtpProvider = {
  sendOtp(email: string, code: string): Promise<void>;
};

export type ResendOtpProviderConfig = {
  apiKey: string;
  from: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export class OtpProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: "configuration" | "timeout" | "upstream" | "network",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OtpProviderError";
  }
}

export function createDevelopmentOtpProvider(): OtpProvider {
  return {
    async sendOtp() {
      /* Deliberately no console logging of OTPs. */
    },
  };
}

export function createResendOtpProvider(
  config: ResendOtpProviderConfig,
): OtpProvider {
  return {
    async sendOtp(email, code) {
      if (!config.apiKey || !config.from || config.timeoutMs <= 0) {
        throw new OtpProviderError(
          "La configuración de Resend está incompleta.",
          "configuration",
        );
      }

      const fetchImpl = config.fetchImpl ?? fetch;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: config.from,
            to: [email],
            subject: "Tu código de verificación de Savanhi",
            html: `<p>Tu código de verificación de Savanhi es <strong>${code}</strong>.</p>`,
            text: `Tu código de verificación de Savanhi es ${code}.`,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new OtpProviderError(
            "Resend rechazó el envío del correo.",
            "upstream",
            response.status,
          );
        }
      } catch (error) {
        if (error instanceof OtpProviderError) throw error;
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          throw new OtpProviderError(
            "Resend tardó demasiado en responder.",
            "timeout",
          );
        }
        throw new OtpProviderError(
          "No se pudo conectar con Resend.",
          "network",
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
