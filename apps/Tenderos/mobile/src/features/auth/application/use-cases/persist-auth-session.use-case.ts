import type { AuthSessionRepository } from "../ports/auth-session-repository";

export function createPersistAuthSessionUseCase(sessionRepository: AuthSessionRepository) {
  return function persistAuthSession(stored: Awaited<ReturnType<AuthSessionRepository["load"]>>) {
    return sessionRepository.save(stored);
  };
}
