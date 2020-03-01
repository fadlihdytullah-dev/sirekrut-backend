require("dotenv").config();
const functions = require("firebase-functions");
const app = require("express")();

const { getPositions } = require("./routes/positions");

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};

// Initialize Firebase
const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

app.get("/positions", getPositions);

// exports.helloWorld = functions.https.onRequest((req, res) => res.send('Hello world!'));
exports.api = functions.https.onRequest(app);
