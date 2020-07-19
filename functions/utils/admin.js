const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(
  __dirname + '/../serviceAccount.json'
));
require('dotenv').config();

// const firebaseConfig = {
//   apiKey: process.env.API_KEY,
//   authDomain: process.env.AUTH_DOMAIN,
//   databaseURL: process.env.DATABASE_URL,
//   projectId: process.env.PROJECT_ID,
//   storageBucket: process.env.STORAGE_BUCKET,
//   messagingSenderId: process.env.MESSAGING_SENDER_ID,
//   appId: process.env.APP_ID,
//   measurementId: process.env.MEASUREMENT_ID,
// };

var firebaseConfig = {
  apiKey: 'AIzaSyAPmjhe1mitIgs18AYcYNOF95KIM-8iWAA',
  authDomain: 'si-rekrut.firebaseapp.com',
  databaseURL: 'https://si-rekrut.firebaseio.com',
  projectId: 'si-rekrut',
  storageBucket: 'si-rekrut.appspot.com',
  messagingSenderId: '375797560482',
  appId: '1:375797560482:web:82ef40bd4ddc98ef4113fb',
  measurementId: 'G-RJMNSJKF7N',
};

// Initialize Firebase
const firebase = require('firebase');

firebase.initializeApp(firebaseConfig);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://si-rekrut.firebaseio.com',
});

const db = admin.firestore();

module.exports = {admin, db, firebase};
