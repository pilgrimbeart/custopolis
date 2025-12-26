// Player identity stored locally to avoid duplicate assignments within a session.
const STORAGE_KEY = 'custopolis-player-id';

export const getOrCreatePlayerId = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, created);
  return created;
};
