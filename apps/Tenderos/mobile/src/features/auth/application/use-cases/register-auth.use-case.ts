import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";

import { toStoredAuthSession } from "./auth-session.utils";

type RegisterAuthDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createRegisterAuthUseCase({
  remoteRepository,
  sessionRepository,
}: RegisterAuthDeps) {
  return async function registerAuth(name: string, email: string, password: string) {
    const result = await remoteRepository.register({ name, email, password });
    if (!result.ok || !result.user || !result.session) return null;

    const stored = toStoredAuthSession(result.user, result.session);
    await sessionRepository.save(stored);
    return stored;
  };
}
