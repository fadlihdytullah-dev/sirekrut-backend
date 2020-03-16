const cors = require("cors");
require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const app = express();

const {
  getPositions,
  getPosition,
  addAndUpdatePositionValidation,
  addPosition,
  deletePosition,
  updatePosition
} = require("./routes/positions");

const {
  getStudyPrograms,
  getStudyProgram,
  addAndUpdateStudyProgramValidation,
  addStudyProgram,
  deleteStudyProgram,
  updateStudyProgram
} = require("./routes/study-programs");

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛣 Positions Route
app.get("/positions", getPositions);
app.get("/positions/:id", getPosition);
app.post("/positions", addAndUpdatePositionValidation, addPosition);
app.delete("/positions/:id", deletePosition);
app.put("/positions/:id", addAndUpdatePositionValidation, updatePosition);

// 🛣 Study Programs Route
app.get("/study_programs", getStudyPrograms);
app.get("/study_programs/:id", getStudyProgram);
app.post(
  "/study_programs",
  addAndUpdateStudyProgramValidation,
  addStudyProgram
);
app.delete("/study_programs/:id", deleteStudyProgram);
app.put(
  "/study_programs/:id",
  addAndUpdateStudyProgramValidation,
  updateStudyProgram
);

// exports.helloWorld = functions.https.onRequest((req, res) => res.send('Hello world!'));
exports.api = functions.https.onRequest(app);
