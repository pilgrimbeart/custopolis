// Mobile client entry point for player check-in.
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { getOrCreatePlayerId } from '../common/player';
import { listenActiveSessionId } from '../common/session';
import { ensurePlayerTeam } from '../common/teamAssignment';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const teamIdEl = byId<HTMLParagraphElement>('team-id');
const statusEl = byId<HTMLParagraphElement>('status');

let currentSessionId: string | null = null;

const updateStatus = (text: string) => {
  statusEl.textContent = text;
};

listenActiveSessionId(db, async (sessionId) => {
  sessionIdEl.textContent = sessionId ?? 'Waiting...';

  if (!sessionId) {
    teamIdEl.textContent = '-';
    updateStatus('Waiting for host to start a cohort.');
    currentSessionId = null;
    return;
  }

  if (sessionId === currentSessionId) {
    return;
  }

  currentSessionId = sessionId;
  updateStatus('Assigning team...');

  try {
    const playerId = getOrCreatePlayerId();
    const teamId = await ensurePlayerTeam(db, sessionId, playerId);
    teamIdEl.textContent = `Team ${teamId + 1}`;
    updateStatus('Ready');
  } catch (error) {
    console.error(error);
    teamIdEl.textContent = '-';
    updateStatus('Unable to join session.');
  }
});
