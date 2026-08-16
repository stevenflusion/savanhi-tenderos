import type { AuthRemoteRepository } from "../ports/auth-remote-repository";
import type { AuthSessionRepository } from "../ports/auth-session-repository";

import { toStoredAuthSession } from "./auth-session.utils";

type VerifyAuthOtpDeps = {
  remoteRepository: AuthRemoteRepository;
  sessionRepository: AuthSessionRepository;
};

export function createVerifyAuthOtpUseCase({
  remoteRepository,
  sessionRepository,
}: VerifyAuthOtpDeps) {
  return async function verifyAuthOtp(email: string, code: string) {
    const result = await remoteRepository.verifyOtp(email, code);
    if (!result.success || !result.user || !result.session) {
      return {
        success: result.success,
        isNewUser: result.isNewUser,
        error: result.error,
      };
    }

    const stored = toStoredAuthSession(result.user, result.session);
    await sessionRepository.save(stored);

    return {
      success: true,
      isNewUser: result.isNewUser,
      stored,
    };
  };
}
