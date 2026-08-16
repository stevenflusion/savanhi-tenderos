export type BackendEnv = {
  serviceName: string;
  nodeEnv: string;
  port: number;
  allowedOrigins: string[];
  databaseUrl: string;
  authJwtSecret: string;
  authJwtIssuer: string;
  authJwtAudience: string;
  trustProxy: boolean;
  otpProvider: "development" | "external";
  otpDevCode?: string;
  otpExternal?: {
    url: string;
    apiKey: string;
    from: string;
    timeoutMs: number;
  };
  rateLimits: {
    api: number;
    login: number;
    register: number;
    otpRequest: number;
    otpVerify: number;
    refresh: number;
  };
};
