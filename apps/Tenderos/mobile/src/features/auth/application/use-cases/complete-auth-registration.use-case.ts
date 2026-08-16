import type { AuthUser } from "@repo/api-contracts";

import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";
import type { StoredAuthSession } from "../../domain/auth.types";

type CompleteAuthRegistrationDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createCompleteAuthRegistrationUseCase({
  remoteRepository,
  sessionRepository,
}: CompleteAuthRegistrationDeps) {
  return async function completeAuthRegistration(stored: StoredAuthSession | null) {
    if (!stored) {
      return { success: false, error: "Sesión no encontrada." };
    }

    const result = await remoteRepository.completeRegistration({
      user: stored.user,
      onboardingDraft: stored.onboardingDraft,
      accessToken: stored.session.accessToken,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const nextUser = {
      ...stored.user,
      fullName: result.data.fullName,
    } satisfies AuthUser;

    const nextStored = {
      ...stored,
      user: nextUser,
      onboardingDraft: null,
    } satisfies StoredAuthSession;

    await sessionRepository.save(nextStored);

    return { success: true, user: nextUser, data: result.data };
  };
}
