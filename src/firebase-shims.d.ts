declare module 'firebase/app' {
  export type FirebaseApp = unknown;
  export function initializeApp(config: unknown): FirebaseApp;
}

declare module 'firebase/database' {
  export type Database = unknown;
  export type DataSnapshot = {
    val(): any;
    exists(): boolean;
  };
  export type Unsubscribe = () => void;

  export function getDatabase(app?: unknown): Database;
  export function ref(db: Database, path: string): unknown;
  export function onValue(ref: unknown, cb: (snapshot: DataSnapshot) => void): Unsubscribe;
  export function push(ref: unknown): { key: string | null };
  export function set(ref: unknown, value: unknown): Promise<void>;
  export function serverTimestamp(): object;
  export function runTransaction(
    ref: unknown,
    cb: (current: unknown) => unknown
  ): Promise<{ committed: boolean }>;
  export function get(ref: unknown): Promise<DataSnapshot>;
}
