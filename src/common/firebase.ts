// Firebase initialization shared by projector, control, and mobile clients.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

let app: FirebaseApp | null = null;
let database: Database | null = null;

const requireEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const getFirebaseApp = () => {
  if (!app) {
    app = initializeApp({
      apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
      authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      databaseURL: requireEnv('VITE_FIREBASE_DATABASE_URL'),
      projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: requireEnv('VITE_FIREBASE_APP_ID')
    });
  }
  return app;
};

export const getDatabaseInstance = () => {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
};
