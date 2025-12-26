// Mobile client entry point for player check-in.
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { getOrCreatePlayerId } from '../common/player';
import { listenActiveSessionId } from '../common/session';
import { ensurePlayerTeam } from '../common/teamAssignment';
import { TEAM_COLORS } from '../common/constants';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const teamIdEl = byId<HTMLParagraphElement>('team-id');
const statusEl = byId<HTMLParagraphElement>('status');
const appEl = byId<HTMLElement>('app');
const readyScreenEl = byId<HTMLElement>('ready-screen');

let currentSessionId: string | null = null;

const updateStatus = (text: string) => {
  statusEl.textContent = text;
};

const showReadyScreen = (teamId: number) => {
  const teamColor = TEAM_COLORS[teamId] ?? '#102432';
  document.documentElement.style.setProperty('--team-color', teamColor);
  appEl.classList.add('hidden');
  readyScreenEl.classList.remove('hidden');
};

listenActiveSessionId(db, async (sessionId) => {
  sessionIdEl.textContent = sessionId ?? 'Waiting...';

  if (!sessionId) {
    teamIdEl.textContent = '-';
    updateStatus('Waiting for host to start a cohort.');
    appEl.classList.remove('hidden');
    readyScreenEl.classList.add('hidden');
    currentSessionId = null;
    return;
  }

  if (sessionId === currentSessionId) {
    return;
  }

  currentSessionId = sessionId;
  updateStatus('Assigning team...');
  appEl.classList.remove('hidden');
  readyScreenEl.classList.add('hidden');

  try {
    const playerId = getOrCreatePlayerId();
    const teamId = await ensurePlayerTeam(db, sessionId, playerId);
    teamIdEl.textContent = `Team ${teamId + 1}`;
    updateStatus('Ready');
    window.requestAnimationFrame(() => showReadyScreen(teamId));
  } catch (error) {
    console.error(error);
    teamIdEl.textContent = '-';
    updateStatus('Unable to join session.');
  }
});
