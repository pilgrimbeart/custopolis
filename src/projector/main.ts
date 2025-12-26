// Projector client entry point for shared display.
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import QRCode from 'qrcode';
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { listenActiveSessionId } from '../common/session';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const sessionPhaseEl = byId<HTMLParagraphElement>('session-phase');
const statusEl = byId<HTMLParagraphElement>('status');
const mobileUrlEl = byId<HTMLParagraphElement>('mobile-url');
const qrCanvas = byId<HTMLCanvasElement>('qr-canvas');

let sessionUnsubscribe: Unsubscribe | null = null;

const baseUrl = import.meta.env.BASE_URL;
const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL;
const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const defaultBaseUrl = publicBaseUrl
  ? normalizeBaseUrl(publicBaseUrl)
  : new URL(baseUrl, window.location.origin).toString();
const mobileUrl = new URL('mobile/', defaultBaseUrl).toString();

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

const bindSession = (sessionId: string | null) => {
  sessionIdEl.textContent = sessionId ?? 'Not set';
  sessionPhaseEl.textContent = '-';

  if (sessionUnsubscribe) {
    sessionUnsubscribe();
    sessionUnsubscribe = null;
  }

  if (!sessionId) {
    statusEl.textContent = 'Waiting for control.';
    return;
  }

  sessionUnsubscribe = onValue(ref(db, `sessions/${sessionId}`), (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    sessionPhaseEl.textContent = data?.phase ?? '-';
    statusEl.textContent = data?.phase ? 'Live' : 'Waiting for control.';
  });
};

listenActiveSessionId(db, bindSession);
