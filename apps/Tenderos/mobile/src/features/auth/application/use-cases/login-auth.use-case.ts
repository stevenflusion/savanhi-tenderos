import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";

import { toStoredAuthSession } from "./auth-session.utils";

type LoginAuthDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createLoginAuthUseCase({
  remoteRepository,
  sessionRepository,
}: LoginAuthDeps) {
  return async function loginAuth(email: string, password: string) {
    const result = await remoteRepository.login(email, password);
    if (!result.ok || !result.user || !result.session) return null;

    const stored = toStoredAuthSession(result.user, result.session);
    await sessionRepository.save(stored);
    return stored;
  };
}
