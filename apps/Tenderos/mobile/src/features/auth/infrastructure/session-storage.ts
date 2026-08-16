import * as SecureStore from "expo-secure-store";

import type { AuthSessionRepository } from "../application/ports/auth-session-repository";
import type {
  AuthOnboardingDraft,
  LegacyStoredAuthSession,
  StoredAuthSession,
} from "../domain/auth.types";

export const AUTH_SESSION_STORAGE_KEY = "savanhi-mobile-session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractOnboardingDraft(
  user: LegacyStoredAuthSession["user"],
): AuthOnboardingDraft | null {
  const onboardingDraft = {
    storeName: user.storeName,
    address: user.address,
    latitude: user.latitude,
    longitude: user.longitude,
    photos: user.photos,
    paymentMethod: user.paymentMethod,
  } satisfies AuthOnboardingDraft;

  return Object.values(onboardingDraft).some((value) => value !== undefined)
    ? onboardingDraft
    : null;
}

function normalizeStoredAuthSession(value: unknown): StoredAuthSession | null {
  if (!isRecord(value) || !isRecord(value.session) || !isRecord(value.user)) {
    return null;
  }

	const legacy = value as LegacyStoredAuthSession;
	const {
		storeName: _storeName,
		address: _address,
		latitude: _latitude,
		longitude: _longitude,
		photos: _photos,
		paymentMethod: _paymentMethod,
		...nextUser
	} = legacy.user;

  const onboardingDraft = "onboardingDraft" in value
    ? ((value as StoredAuthSession).onboardingDraft ?? null)
    : extractOnboardingDraft(legacy.user);

	return {
		user: nextUser,
    session: legacy.session,
    onboardingDraft,
  } satisfies StoredAuthSession;
}

export async function persistAuthSession(value: StoredAuthSession | null) {
  if (value) {
    await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, JSON.stringify(value));
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}

export async function loadAuthSession(): Promise<StoredAuthSession | null> {
  const raw = await SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeStoredAuthSession(JSON.parse(raw));
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function createSecureStoreAuthSessionRepository(): AuthSessionRepository {
  return {
    load: loadAuthSession,
    save: persistAuthSession,
  };
}
