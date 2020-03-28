const cors = require("cors");
require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const app = express();

const {
  addAdmin,
  addAdminValidation,
  loginAdmin,
  loginAdminValidation,
  FBAuthMiddleware
} = require("./routes/auth");

const {
  getPositions,
  getPosition,
  addPositionValidation,
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛣 Auth Route
app.post("/register", addAdminValidation, addAdmin);
app.post("/login", loginAdminValidation, loginAdmin);

// 🛣 Positions Route
app.get("/positions", getPositions);
app.get("/positions/:id", getPosition);
app.post("/positions", [addPositionValidation, FBAuthMiddleware], addPosition);
app.delete("/positions/:id", [FBAuthMiddleware], deletePosition);
app.put("/positions/:id", [FBAuthMiddleware], updatePosition);

// 🛣 Study Programs Route
app.get("/study_programs", getStudyPrograms);
app.get("/study_programs/:id", getStudyProgram);
app.post(
  "/study_programs",
  [addAndUpdateStudyProgramValidation, FBAuthMiddleware],
  addStudyProgram
);
app.delete("/study_programs/:id", [FBAuthMiddleware], deleteStudyProgram);
app.put(
  "/study_programs/:id",
  [addAndUpdateStudyProgramValidation, FBAuthMiddleware],
  updateStudyProgram
);

// exports.helloWorld = functions.https.onRequest((req, res) => res.send('Hello world!'));
exports.api = functions.https.onRequest(app);
