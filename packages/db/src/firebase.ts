import { type App, cert, getApps, initializeApp } from "firebase-admin/app";

/**
 * Configuration comes from two environment variables (paste them in Vercel):
 *   FIREBASE_SERVICE_ACCOUNT  the service account JSON file, whole   (server only, secret)
 *   FIREBASE_WEB_CONFIG       the firebaseConfig = { ... } block      (public, sent to browsers)
 *
 * For local development against the Firebase emulators, set FIRESTORE_EMULATOR_HOST and
 * FIREBASE_AUTH_EMULATOR_HOST instead (see README).
 */

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

/**
 * Parses JSON, or the JavaScript object people copy from the Firebase console
 * (`const firebaseConfig = { apiKey: "..." };`), so either can be pasted as is.
 */
export function parseLooseObject(raw: string): Record<string, unknown> {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const body = text
      .replace(/^[^{]*/, "") // drop "const firebaseConfig =" and anything before {
      .replace(/[^}]*$/, "") // drop trailing ";" and anything after }
      .replace(/\/\/[^\n]*/g, "") // line comments
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/,\s*}/g, "}");
    return JSON.parse(body);
  }
}

const emulatorProject = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "demo-forkd";
const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const sa = parseLooseObject(raw) as { project_id?: string; client_email?: string; private_key?: string };
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email or private_key. Paste the whole JSON file.");
  }
  return {
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    // Some dashboards turn the newlines in the key into literal "\n".
    privateKey: sa.private_key.replace(/\\n/g, "\n"),
  };
}

/** True when Firebase is not configured: the app runs on in-memory sample data. */
export const isDemoMode = !process.env.FIREBASE_SERVICE_ACCOUNT && !usingEmulators;

export function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const sa = readServiceAccount();
  if (sa) return initializeApp({ credential: cert(sa), projectId: sa.projectId });
  if (usingEmulators) return initializeApp({ projectId: emulatorProject });
  throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT.");
}

/** Public config for the browser SDK, or null in demo mode. */
export function getFirebaseWebConfig(): (FirebaseWebConfig & { authEmulatorUrl?: string }) | null {
  if (isDemoMode) return null;
  const authEmulatorUrl = process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
    : undefined;
  const raw = process.env.FIREBASE_WEB_CONFIG;
  if (!raw) {
    if (usingEmulators) {
      return { apiKey: "demo-key", authDomain: `${emulatorProject}.firebaseapp.com`, projectId: emulatorProject, authEmulatorUrl };
    }
    throw new Error("FIREBASE_WEB_CONFIG is not set. Paste the firebaseConfig block from the Firebase console.");
  }
  const cfg = parseLooseObject(raw) as unknown as FirebaseWebConfig;
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId) {
    throw new Error("FIREBASE_WEB_CONFIG needs apiKey, authDomain and projectId.");
  }
  return { apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId, authEmulatorUrl };
}
