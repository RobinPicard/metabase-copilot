import { initializeApp } from 'firebase/app';


declare const __FIREBASE_ENV__: string;

const FIREBASE_ENV = __FIREBASE_ENV__ || 'dev';

let firebaseConfig;
if (FIREBASE_ENV === 'prod') {
  firebaseConfig = require('./firebaseConfigProd.json');
} else {
  firebaseConfig = require('./firebaseConfigDev.json');
}

const app = initializeApp(firebaseConfig);


export default app;
