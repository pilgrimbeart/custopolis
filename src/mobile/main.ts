// Mobile client entry point for player check-in.
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { getOrCreatePlayerId } from '../common/player';
import { listenActiveSessionId } from '../common/session';
import { ensurePlayerTeam } from '../common/teamAssignment';
import { CUSTOMERS_PER_TEAM, ROUND_SECONDS, TEAM_COLORS } from '../common/constants';
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const teamIdEl = byId<HTMLParagraphElement>('team-id');
const statusEl = byId<HTMLParagraphElement>('status');
const appEl = byId<HTMLElement>('app');
const readyScreenEl = byId<HTMLElement>('ready-screen');
const readyTextEl = byId<HTMLParagraphElement>('ready-text');
const roundScreenEl = byId<HTMLElement>('round-screen');
const roundTitleEl = byId<HTMLHeadingElement>('round-title');
const roundClockEl = byId<HTMLParagraphElement>('round-clock');
const customerListEl = byId<HTMLElement>('customer-list');
const actionEducateEl = byId<HTMLButtonElement>('action-educate');
const actionOfferEl = byId<HTMLButtonElement>('action-offer');
const actionFixEl = byId<HTMLButtonElement>('action-fix');

let currentSessionId: string | null = null;
let currentRound: number | null = null;
let roundStartedAt: number | null = null;
let currentPhase = '-';
let lastPhase = '-';
let offsetUnsubscribe: Unsubscribe | null = null;
let sessionUnsubscribe: Unsubscribe | null = null;
let timerId: number | null = null;
let serverOffsetMs = 0;
let selectedCustomerIndex: number | null = null;
let assignedTeamId: number | null = null;
const customerImgUrl = new URL('../common/assets/generic_customer.png', import.meta.url).toString();

const updateStatus = (text: string) => {
  statusEl.textContent = text;
};

const showReadyScreen = (teamId: number) => {
  const teamColor = TEAM_COLORS[teamId] ?? '#102432';
  document.documentElement.style.setProperty('--team-color', teamColor);
  readyTextEl.textContent = `TEAM ${teamId + 1} READY`;
  appEl.classList.add('hidden');
  readyScreenEl.classList.remove('hidden');
  roundScreenEl.classList.add('hidden');
};

const showRoundScreen = () => {
  appEl.classList.add('hidden');
  readyScreenEl.classList.add('hidden');
  roundScreenEl.classList.remove('hidden');
};

const showLobbyScreen = () => {
  appEl.classList.remove('hidden');
  readyScreenEl.classList.add('hidden');
  roundScreenEl.classList.add('hidden');
};

const formatRemaining = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const updateRoundClock = () => {
  if (!roundStartedAt) {
    roundClockEl.textContent = formatRemaining(ROUND_SECONDS * 1000);
    return;
  }
  const nowMs = Date.now() + serverOffsetMs;
  const remainingMs = roundStartedAt + ROUND_SECONDS * 1000 - nowMs;
  roundClockEl.textContent = formatRemaining(remainingMs);
};

const setTimerActive = (active: boolean) => {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
  if (active) {
    updateRoundClock();
    timerId = window.setInterval(updateRoundClock, 250);
  }
};

const updateRoundVisibility = () => {
  const isRound = /^round-\d+$/.test(currentPhase);
  if (isRound) {
    showRoundScreen();
    setTimerActive(!!roundStartedAt);
  } else {
    setTimerActive(false);
    if (assignedTeamId !== null) {
      showReadyScreen(assignedTeamId);
    } else {
      showLobbyScreen();
    }
  }
};

const updateActionButtons = () => {
  const enabled = selectedCustomerIndex !== null;
  actionEducateEl.disabled = !enabled;
  actionOfferEl.disabled = !enabled;
  actionFixEl.disabled = !enabled;
};

const buildCustomerList = () => {
  customerListEl.innerHTML = '';
  for (let i = 0; i < CUSTOMERS_PER_TEAM; i += 1) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'customer-card';
    const img = document.createElement('img');
    img.src = customerImgUrl;
    img.alt = 'Customer';
    const label = document.createElement('span');
    label.textContent = `Customer ${i + 1}`;
    card.appendChild(img);
    card.appendChild(label);
    card.addEventListener('click', () => {
      selectedCustomerIndex = i;
      document.querySelectorAll('.customer-card').forEach((node) => {
        node.classList.remove('selected');
      });
      card.classList.add('selected');
      updateActionButtons();
    });
    customerListEl.appendChild(card);
  }
};

buildCustomerList();
updateActionButtons();

listenActiveSessionId(db, async (sessionId) => {
  sessionIdEl.textContent = sessionId ?? 'Waiting...';

  if (!sessionId) {
    teamIdEl.textContent = '-';
    updateStatus('Waiting for host to start a cohort.');
    showLobbyScreen();
    currentSessionId = null;
    return;
  }

  if (sessionId === currentSessionId) {
    return;
  }

  currentSessionId = sessionId;
  updateStatus('Assigning team...');
  showLobbyScreen();

  try {
    const playerId = getOrCreatePlayerId();
    const teamId = await ensurePlayerTeam(db, sessionId, playerId);
    assignedTeamId = teamId;
    teamIdEl.textContent = `Team ${teamId + 1}`;
    updateStatus('Ready');
    window.requestAnimationFrame(() => showReadyScreen(teamId));
  } catch (error) {
    console.error(error);
    teamIdEl.textContent = '-';
    updateStatus('Unable to join session.');
  }
});

listenActiveSessionId(db, (sessionId) => {
  if (sessionUnsubscribe) {
    sessionUnsubscribe();
    sessionUnsubscribe = null;
  }
  if (offsetUnsubscribe) {
    offsetUnsubscribe();
    offsetUnsubscribe = null;
  }
  if (!sessionId) {
    currentPhase = '-';
    currentRound = null;
    roundStartedAt = null;
    setTimerActive(false);
    return;
  }

  sessionUnsubscribe = onValue(ref(db, `sessions/${sessionId}`), (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    currentPhase = data?.phase ?? '-';
    if (currentPhase !== lastPhase) {
      selectedCustomerIndex = null;
      document.querySelectorAll('.customer-card').forEach((node) => {
        node.classList.remove('selected');
      });
      updateActionButtons();
      lastPhase = currentPhase;
    }
    currentRound = typeof data?.currentRound === 'number' ? data.currentRound : null;
    roundStartedAt = typeof data?.roundStartedAt === 'number' ? data.roundStartedAt : null;
    if (currentRound) {
      roundTitleEl.textContent = `Round ${currentRound}`;
    } else {
      const match = currentPhase.match(/^round-(\d+)$/);
      roundTitleEl.textContent = match ? `Round ${match[1]}` : 'Round';
    }
    updateRoundClock();
    updateRoundVisibility();
  });

  offsetUnsubscribe = onValue(ref(db, '.info/serverTimeOffset'), (snapshot: DataSnapshot) => {
    serverOffsetMs = typeof snapshot.val() === 'number' ? snapshot.val() : 0;
    updateRoundClock();
  });
});
