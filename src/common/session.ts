// Session lifecycle helpers: create, watch, and seed cohort data.
import {
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  type Database,
  type DataSnapshot,
  type Unsubscribe
} from 'firebase/database';
import { ACTIVE_SESSION_ID_PATH, ROUND_SECONDS, TEAM_COUNT } from './constants';

export type SessionSeed = {
  createdAt: object;
  phase: 'lobby' | 'round' | 'post-round' | 'game-over';
  roundNumber: number;
  roundSeconds: number;
  teamCounts: Record<string, number>;
};

export const buildEmptyTeamCounts = () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < TEAM_COUNT; i += 1) {
    counts[i.toString()] = 0;
  }
  return counts;
};

export const buildSessionSeed = (): SessionSeed => ({
  createdAt: serverTimestamp(),
  phase: 'lobby',
  roundNumber: 0,
  roundSeconds: ROUND_SECONDS,
  teamCounts: buildEmptyTeamCounts()
});

export const listenActiveSessionId = (
  db: Database,
  onChange: (sessionId: string | null) => void
): Unsubscribe => {
  const activeRef = ref(db, ACTIVE_SESSION_ID_PATH);
  return onValue(activeRef, (snapshot: DataSnapshot) => {
    onChange(snapshot.val() ?? null);
  });
};

export const setActiveSessionId = async (db: Database, sessionId: string) => {
  await set(ref(db, ACTIVE_SESSION_ID_PATH), sessionId);
};

export const createSession = async (db: Database) => {
  const sessionRef = push(ref(db, 'sessions'));
  const sessionId = sessionRef.key;
  if (!sessionId) {
    throw new Error('Failed to generate session ID');
  }
  await set(sessionRef, buildSessionSeed());
  await setActiveSessionId(db, sessionId);
  return sessionId;
};
