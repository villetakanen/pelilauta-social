// Debug script to test email login URL detection
import { initializeApp } from 'firebase/app';
import { getAuth, isSignInWithEmailLink } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDgck5PNbLKHNircXyElPoZ14KqxrknUe8',
  authDomain: 'skaldbase.firebaseapp.com',
  databaseURL: 'https://skaldbase.firebaseio.com',
  projectId: 'skaldbase',
  storageBucket: 'skaldbase.appspot.com',
  messagingSenderId: '161233573033',
  appId: '1:161233573033:web:a0b3f20d4c8c4f4c22c5b8',
  measurementId: 'G-T5E33DTZGW',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test URLs
const testUrls = [
  'https://skaldbase-test.firebaseapp.com/__/auth/action?apiKey=AIzaSyBkvavPZKGp-pJE-xI0tZT20npQ3koBh-s&mode=signIn&oobCode=r1jEs_rBP80vt_7IsYu1KxJPEQZa6CziFs35NuUMGEQAAAGZKQiDdQ&continueUrl=http://localhost:4321/&lang=en',
  'http://localhost:4321/?apiKey=AIzaSyBkvavPZKGp-pJE-xI0tZT20npQ3koBh-s&mode=signIn&oobCode=r1jEs_rBP80vt_7IsYu1KxJPEQZa6CziFs35NuUMGEQAAAGZKQiDdQ&continueUrl=http://localhost:4321/&lang=en',
  window.location.href,
];

console.log('Testing email link detection:');
testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}: ${url}`);
  console.log(`Is sign-in link: ${isSignInWithEmailLink(auth, url)}`);
  console.log('---');
});
