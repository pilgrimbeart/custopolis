// Control client entry point for session control.
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import QRCode from 'qrcode';
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { createSession, listenActiveSessionId } from '../common/session';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const sessionPhaseEl = byId<HTMLParagraphElement>('session-phase');
const mobileUrlEl = byId<HTMLParagraphElement>('mobile-url');
const hostWarningEl = byId<HTMLParagraphElement>('host-warning');
const mobileUrlInput = byId<HTMLInputElement>('mobile-url-input');
const updateQrButton = byId<HTMLButtonElement>('update-qr');
const resetQrButton = byId<HTMLButtonElement>('reset-qr');
const qrCanvas = byId<HTMLCanvasElement>('qr-canvas');
const newSessionButton = byId<HTMLButtonElement>('new-session');
const copyMobileButton = byId<HTMLButtonElement>('copy-mobile');

const STORAGE_KEY = 'custopolis-mobile-url-override';
const baseUrl = import.meta.env.BASE_URL;
const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL;
const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const defaultBaseUrl = publicBaseUrl
  ? normalizeBaseUrl(publicBaseUrl)
  : new URL(baseUrl, window.location.origin).toString();
const defaultMobileUrl = new URL('mobile/', defaultBaseUrl).toString();
const defaultProjectorUrl = new URL('projector/', defaultBaseUrl).toString();
const hostname = window.location.hostname;

if (hostname === 'localhost' || hostname === '127.0.0.1') {
  hostWarningEl.hidden = false;
}

const renderQr = (url: string) => {
  mobileUrlEl.textContent = url;
  mobileUrlInput.value = url;
QRCode.toCanvas(qrCanvas, url, {
    width: 220,
    margin: 2,
    color: {
      dark: '#1b1b1b',
      light: '#fff7e6'
    }
  }).catch((error: unknown) => {
    console.error(error);
  });
};

const storedOverride = localStorage.getItem(STORAGE_KEY);
renderQr(storedOverride ?? defaultMobileUrl);

const projectorLink = document.createElement('p');
projectorLink.className = 'hint';
projectorLink.textContent = `Projector URL: ${defaultProjectorUrl}`;
mobileUrlEl.insertAdjacentElement('afterend', projectorLink);

updateQrButton.addEventListener('click', () => {
  const nextUrl = mobileUrlInput.value.trim();
  if (!nextUrl) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, nextUrl);
  renderQr(nextUrl);
});

resetQrButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderQr(defaultMobileUrl);
});

let sessionUnsubscribe: Unsubscribe | null = null;

const bindSession = (sessionId: string | null) => {
  sessionIdEl.textContent = sessionId ?? 'Not set';
  sessionPhaseEl.textContent = '-';

  if (sessionUnsubscribe) {
    sessionUnsubscribe();
    sessionUnsubscribe = null;
  }

  if (!sessionId) {
    return;
  }

  sessionUnsubscribe = onValue(ref(db, `sessions/${sessionId}`), (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    sessionPhaseEl.textContent = data?.phase ?? '-';
  });
};

listenActiveSessionId(db, bindSession);

newSessionButton.addEventListener('click', async () => {
  newSessionButton.disabled = true;
  try {
    await createSession(db);
  } catch (error) {
    console.error(error);
    sessionPhaseEl.textContent = 'Error creating session';
  } finally {
    newSessionButton.disabled = false;
  }
});

copyMobileButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(mobileUrlInput.value || defaultMobileUrl);
    copyMobileButton.textContent = 'Copied!';
    window.setTimeout(() => {
      copyMobileButton.textContent = 'Copy mobile URL';
    }, 1500);
  } catch (error) {
    console.error(error);
    copyMobileButton.textContent = 'Copy failed';
  }
});
