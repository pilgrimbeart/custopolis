// Team assignment using a Firebase transaction for fairness under concurrency.
import {
  get,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  type Database
} from 'firebase/database';
import { TEAM_COUNT } from './constants';
import { buildEmptyTeamCounts } from './session';

const normalizeCounts = (value: unknown) => {
  const base = buildEmptyTeamCounts();
  if (!value || typeof value !== 'object') {
    return base;
  }
  const record = value as Record<string, number>;
  for (let i = 0; i < TEAM_COUNT; i += 1) {
    const key = i.toString();
    if (typeof record[key] === 'number' && Number.isFinite(record[key])) {
      base[key] = record[key];
    }
  }
  return base;
};

const pickTeamId = (counts: Record<string, number>) => {
  let bestTeam = 0;
  let bestCount = Number.POSITIVE_INFINITY;
  for (let i = 0; i < TEAM_COUNT; i += 1) {
    const count = counts[i.toString()] ?? 0;
    if (count < bestCount) {
      bestCount = count;
      bestTeam = i;
    }
  }
  return bestTeam;
};

export const ensurePlayerTeam = async (
  db: Database,
  sessionId: string,
  playerId: string
) => {
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  const existing = await get(playerRef);
  if (existing.exists() && typeof existing.val()?.teamId === 'number') {
    return existing.val().teamId as number;
  }

  let assignedTeamId: number | null = null;
  const countsRef = ref(db, `sessions/${sessionId}/teamCounts`);
  const result = await runTransaction(countsRef, (current: unknown) => {
    const normalized = normalizeCounts(current);
    assignedTeamId = pickTeamId(normalized);
    normalized[assignedTeamId.toString()] += 1;
    return normalized;
  });

  if (!result.committed || assignedTeamId === null) {
    throw new Error('Team assignment transaction failed');
  }

  await set(playerRef, {
    teamId: assignedTeamId,
    joinedAt: serverTimestamp()
  });

  return assignedTeamId;
};
