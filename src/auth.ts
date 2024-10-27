//npm install firebase

//project-263144475527

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDy9jt5fwA6BryQJT7NaXkpp-qX1mWUds",
  authDomain: "metabase-copilot.firebaseapp.com",
  projectId: "metabase-copilot",
  storageBucket: "metabase-copilot.appspot.com",
  messagingSenderId: "263144475527",
  appId: "1:263144475527:web:1dbd83642d44b1dd43a122",
  measurementId: "G-T37V1T4EWZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
