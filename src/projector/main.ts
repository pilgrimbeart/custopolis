// Projector client entry point for shared display.
import { onValue, ref, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import { byId } from '../common/dom';
import { getDatabaseInstance } from '../common/firebase';
import { listenActiveSessionId } from '../common/session';

const db = getDatabaseInstance();

const sessionIdEl = byId<HTMLParagraphElement>('session-id');
const sessionPhaseEl = byId<HTMLParagraphElement>('session-phase');
const statusEl = byId<HTMLParagraphElement>('status');

let sessionUnsubscribe: Unsubscribe | null = null;

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
