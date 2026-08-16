import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";
import type { StoredAuthSession } from "../../domain/auth.types";

type LogoutAuthDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createLogoutAuthUseCase({
  remoteRepository,
  sessionRepository,
}: LogoutAuthDeps) {
  return async function logoutAuth(stored: StoredAuthSession | null) {
    if (stored) {
      await remoteRepository
        .logout({
          accessToken: stored.session.accessToken,
          refreshToken: stored.session.refreshToken,
        })
        .catch(() => undefined);
    }

    await sessionRepository.save(null);
  };
}
