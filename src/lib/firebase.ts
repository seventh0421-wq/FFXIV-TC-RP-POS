import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Sign in anonymously to establish a session and help with connectivity reliability
signInAnonymously(auth).catch(err => {
  console.warn("Anonymous sign-in failed, continuing as unauthenticated", err);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

// Test connection silently - CRITICAL CONSTRAINT
async function testConnection() {
  try {
    const connDoc = doc(db, 'test', 'connection');
    await getDocFromServer(connDoc);
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      // Even a permission-denied error is good, it means we reached the server
      console.log("Firestore reachability test completed.");
    }
  }
}
testConnection();
