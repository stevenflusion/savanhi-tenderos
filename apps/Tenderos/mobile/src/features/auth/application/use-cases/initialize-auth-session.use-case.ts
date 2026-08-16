import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";

import {
  SESSION_REFRESH_MARGIN_MS,
  toStoredAuthSession,
  withOnboardingDraft,
} from "./auth-session.utils";

type InitializeAuthSessionDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createInitializeAuthSessionUseCase({
  remoteRepository,
  sessionRepository,
}: InitializeAuthSessionDeps) {
  return async function initializeAuthSession() {
    const stored = await sessionRepository.load();
    if (!stored) return null;

    const expiresSoon =
      !stored.session.expiresAt ||
      stored.session.expiresAt - Date.now() < SESSION_REFRESH_MARGIN_MS;

    if (!expiresSoon) return stored;

    const refreshed = stored.session.refreshToken
      ? await remoteRepository.refreshSession(stored.session.refreshToken)
      : null;

    if (!refreshed) {
      await sessionRepository.save(null);
      return null;
    }

    const nextStored = withOnboardingDraft(
      toStoredAuthSession(stored.user, refreshed),
      stored.onboardingDraft,
    );
    await sessionRepository.save(nextStored);
    return nextStored;
  };
}
