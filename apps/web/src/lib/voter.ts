const VOTER_KEY = 'voter_key';

export function getOrCreateVoterKey() {
  if (typeof window === 'undefined') return null;
  const existing = window.localStorage.getItem(VOTER_KEY);
  if (existing) return existing;
  const key =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ??
    `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(VOTER_KEY, key);
  return key;
}

