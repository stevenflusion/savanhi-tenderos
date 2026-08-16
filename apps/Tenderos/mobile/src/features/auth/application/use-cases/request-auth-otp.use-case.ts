import type { AuthRemoteRepository } from "../ports/auth-remote-repository";

export function createRequestAuthOtpUseCase(remoteRepository: AuthRemoteRepository) {
  return function requestAuthOtp(email: string) {
    return remoteRepository.requestOtp(email);
  };
}
