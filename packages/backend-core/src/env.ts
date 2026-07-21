import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BackendEnv } from "./types/env.js";

function loadEnvFiles(startDir = process.cwd()): void {
  const envFiles: string[] = [];
  let currentDir = startDir;

  // Walk UP from cwd to root, collecting .env files
  while (true) {
    const envFile = join(currentDir, ".env");
    if (existsSync(envFile)) envFiles.push(envFile);

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Load from ROOT down to cwd, so cwd's .env loads LAST and wins
  for (const envFile of envFiles.reverse()) {
    dotenv.config({ path: envFile, override: true });
  }
}

loadEnvFiles();

function parsePort(rawPort: string | undefined, defaultPort: number): number {
  const parsedPort = Number(rawPort ?? defaultPort);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("Invalid PORT value. It must be a positive integer.");
  }
  return parsedPort;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readRequiredEnvAlias(primaryName: string, fallbackName: string): string {
  const value = process.env[primaryName] ?? process.env[fallbackName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${primaryName} or ${fallbackName}`);
  }
  return value;
}

function parseOrigins(rawOrigins: string | undefined): string[] {
  if (!rawOrigins) return [];
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createEnv({
  serviceName,
  defaultPort,
}: {
  serviceName: string;
  defaultPort: number;
}): BackendEnv {
  return {
    serviceName,
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsePort(process.env.PORT, defaultPort),
    allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
    supabaseUrl: readRequiredEnv("SUPABASE_URL"),
    supabaseAnonKey: readRequiredEnvAlias("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"),
    supabaseServiceRoleKey: readRequiredEnvAlias("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
    authJwtSecret: readRequiredEnv("AUTH_JWT_SECRET"),
  };
}
