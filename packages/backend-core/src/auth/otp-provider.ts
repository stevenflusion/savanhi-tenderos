export type OtpProvider = {
  sendOtp(email: string, code: string): Promise<void>;
};

export type ExternalOtpProviderConfig = {
  url: string;
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

export function createExternalOtpProvider(
  config: ExternalOtpProviderConfig,
): OtpProvider {
  return {
    async sendOtp(email, code) {
      if (!config.url || !config.apiKey || !config.from || config.timeoutMs <= 0) {
        throw new OtpProviderError(
          "External OTP provider configuration is incomplete.",
          "configuration",
        );
      }

      const fetchImpl = config.fetchImpl ?? fetch;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await fetchImpl(config.url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: config.from,
            to: email,
            subject: "Your Savanhi verification code",
            html: `<p>Your Savanhi verification code is <strong>${code}</strong>.</p>`,
            text: `Your Savanhi verification code is ${code}.`,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new OtpProviderError(
            "External OTP provider rejected the request.",
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
            "External OTP provider timed out.",
            "timeout",
          );
        }
        throw new OtpProviderError(
          "External OTP provider could not be reached.",
          "network",
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
