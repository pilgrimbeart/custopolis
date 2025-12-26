// Control client entry point for session control.
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { createSession, listenActiveSessionId } from '../common/session';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const sessionPhaseEl = byId<HTMLParagraphElement>('session-phase');
const mobileUrlEl = byId<HTMLParagraphElement>('mobile-url');
const newSessionButton = byId<HTMLButtonElement>('new-session');
const copyMobileButton = byId<HTMLButtonElement>('copy-mobile');

const baseUrl = import.meta.env.BASE_URL;
const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL;
const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const defaultBaseUrl = publicBaseUrl
  ? normalizeBaseUrl(publicBaseUrl)
  : new URL(baseUrl, window.location.origin).toString();
const defaultMobileUrl = new URL('mobile/', defaultBaseUrl).toString();
mobileUrlEl.textContent = defaultMobileUrl;

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
    await navigator.clipboard.writeText(defaultMobileUrl);
    copyMobileButton.textContent = 'Copied!';
    window.setTimeout(() => {
      copyMobileButton.textContent = 'Copy mobile URL';
    }, 1500);
  } catch (error) {
    console.error(error);
    copyMobileButton.textContent = 'Copy failed';
  }
});
