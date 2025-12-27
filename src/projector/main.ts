// Projector client entry point for shared display.
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import QRCode from 'qrcode';
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { listenActiveSessionId } from '../common/session';
import { CUSTOMERS_PER_TEAM, ROUND_SECONDS, TEAM_COLORS, TEAM_COUNT } from '../common/constants';
import { INTRODUCTION_TEXT } from './content';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const sessionPhaseEl = byId<HTMLParagraphElement>('session-phase');
const statusEl = byId<HTMLParagraphElement>('status');
const mobileUrlEl = byId<HTMLParagraphElement>('mobile-url');
const qrCanvas = byId<HTMLCanvasElement>('qr-canvas');
const teamCountsEl = byId<HTMLUListElement>('team-counts');
const qrStackEl = byId<HTMLElement>('qr-stack');
const introPanelEl = byId<HTMLElement>('intro-panel');
const introTextEl = byId<HTMLElement>('intro-text');
const roundScreenEl = byId<HTMLElement>('round-screen');
const roundTitleEl = byId<HTMLHeadingElement>('round-title');
const roundClockEl = byId<HTMLParagraphElement>('round-clock');
const teamGridEl = byId<HTMLElement>('team-grid');

let sessionUnsubscribe: Unsubscribe | null = null;
let countsUnsubscribe: Unsubscribe | null = null;
let offsetUnsubscribe: Unsubscribe | null = null;
let timerId: number | null = null;
let serverOffsetMs = 0;
let roundStartedAt: number | null = null;
let currentRound: number | null = null;
let currentPhase = '-';

const baseUrl = import.meta.env.BASE_URL;
const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL;
const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const defaultBaseUrl = publicBaseUrl
  ? normalizeBaseUrl(publicBaseUrl)
  : new URL(baseUrl, window.location.origin).toString();
const mobileUrl = new URL('mobile/', defaultBaseUrl).toString();
const customerImgUrls = Array.from({ length: 25 }, (_, index) =>
  new URL(`../common/assets/customer_image_${String(index + 1).padStart(2, '0')}.png`, import.meta.url).toString()
);

mobileUrlEl.textContent = mobileUrl;
QRCode.toCanvas(qrCanvas, mobileUrl, {
  width: 280,
  margin: 2,
  color: {
    dark: '#f5f7ff',
    light: '#0b1020'
  }
}).catch((error: unknown) => {
  console.error(error);
});

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

const updatePhaseVisibility = () => {
  const isIntroduction = currentPhase === 'introduction';
  const isRound = currentPhase === 'round';

  document.body.classList.toggle('with-backdrop', !isRound);
  introPanelEl.classList.toggle('hidden', !isIntroduction);
  roundScreenEl.classList.toggle('hidden', !isRound);
  qrStackEl.classList.toggle('hidden', isRound);
  setTimerActive(isRound && !!roundStartedAt);
};

const bindSession = (sessionId: string | null) => {
  sessionIdEl.textContent = sessionId ?? 'Not set';
  sessionPhaseEl.textContent = '-';
  currentPhase = '-';
  roundStartedAt = null;
  currentRound = null;

  if (sessionUnsubscribe) {
    sessionUnsubscribe();
    sessionUnsubscribe = null;
  }

  if (countsUnsubscribe) {
    countsUnsubscribe();
    countsUnsubscribe = null;
  }

  if (offsetUnsubscribe) {
    offsetUnsubscribe();
    offsetUnsubscribe = null;
  }

  if (!sessionId) {
    statusEl.textContent = 'Waiting for control.';
    teamCountsEl.innerHTML = '';
    updatePhaseVisibility();
    return;
  }

  sessionUnsubscribe = onValue(ref(db, `sessions/${sessionId}`), (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    currentPhase = data?.phase ?? '-';
    currentRound = typeof data?.currentRound === 'number' ? data.currentRound : null;
    roundStartedAt = typeof data?.roundStartedAt === 'number' ? data.roundStartedAt : null;
    sessionPhaseEl.textContent = currentPhase;
    statusEl.textContent = data?.phase ? 'Live' : 'Waiting for control.';
    roundTitleEl.textContent = currentRound ? `Round ${currentRound}` : 'Round';
    updateRoundClock();
    updatePhaseVisibility();
  });

  countsUnsubscribe = onValue(ref(db, `sessions/${sessionId}/teamCounts`), (snapshot: DataSnapshot) => {
    const counts = snapshot.val() as Record<string, number> | null;
    teamCountsEl.innerHTML = '';
    for (let i = 0; i < TEAM_COUNT; i += 1) {
      const count = counts?.[i.toString()] ?? 0;
      const item = document.createElement('li');
      item.textContent = `Team ${i + 1}: ${count}`;
      item.style.color = TEAM_COLORS[i];
      teamCountsEl.appendChild(item);
    }
  });

  offsetUnsubscribe = onValue(ref(db, '.info/serverTimeOffset'), (snapshot: DataSnapshot) => {
    serverOffsetMs = typeof snapshot.val() === 'number' ? snapshot.val() : 0;
    updateRoundClock();
  });
};

listenActiveSessionId(db, bindSession);

introTextEl.innerHTML = INTRODUCTION_TEXT.map((line) => `<p>${line}</p>`).join('');

const buildTeamGrid = () => {
  teamGridEl.innerHTML = '';
  for (let teamIndex = 0; teamIndex < TEAM_COUNT; teamIndex += 1) {
    const column = document.createElement('div');
    column.className = 'team-column';

    const heading = document.createElement('h3');
    heading.textContent = `Team ${teamIndex + 1}`;
    heading.style.color = TEAM_COLORS[teamIndex];
    column.appendChild(heading);

    for (let customerIndex = 0; customerIndex < CUSTOMERS_PER_TEAM; customerIndex += 1) {
      const imageIndex = teamIndex * CUSTOMERS_PER_TEAM + customerIndex;
      const card = document.createElement('div');
      card.className = 'customer-card';
      const img = document.createElement('img');
      img.src = customerImgUrls[imageIndex] ?? customerImgUrls[0];
      img.alt = 'Customer';
      card.appendChild(img);
      column.appendChild(card);
    }

    teamGridEl.appendChild(column);
  }
};

buildTeamGrid();
