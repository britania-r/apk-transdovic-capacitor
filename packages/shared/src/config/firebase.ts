export interface FirebaseConfigParams {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export const getFirebaseConfig = (params: FirebaseConfigParams = {}) => ({
  apiKey: params.apiKey || '',
  authDomain: params.authDomain || '',
  projectId: params.projectId || '',
  storageBucket: params.storageBucket || '',
  messagingSenderId: params.messagingSenderId || '',
  appId: params.appId || '',
});