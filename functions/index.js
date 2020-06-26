const cors = require('cors');
require('dotenv').config();
const functions = require('firebase-functions');
const express = require('express');
const app = express();

const {
  addAdmin,
  addAdminValidation,
  getUsers,
  loginAdmin,
  deleteUser,
  loginAdminValidation,
  FBAuthMiddleware,
} = require('./routes/auth');

const {
  getPositions,
  getPosition,
  addPositionValidation,
  addPosition,
  deletePosition,
  updatePosition,
} = require('./routes/positions');

const {
  getStudyPrograms,
  getStudyProgram,
  addAndUpdateStudyProgramValidation,
  addStudyProgram,
  deleteStudyProgram,
  updateStudyProgram,
} = require('./routes/study-programs');

const {
  getTimelines,
  getTimeline,
  addTimelineValidation,
  addTimeline,
  updateTimeline,
  deleteTimeline,
} = require('./routes/timelines');

const {
  addSubmission,
  getSubmissions,
  updateStatus,
  updateStatusAgreement,
  updateScore,
} = require('./routes/submission');

const {
  getForm,
  getForms,
  addFormsValidation,
  addForm,
  updateForm,
  deleteForm,
  formSettings,
  getFormSettings,
} = require('./routes/forms');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// 🛣 Auth Route
app.post('/register', addAdminValidation, addAdmin);
app.post('/login', loginAdminValidation, loginAdmin);
app.get('/users', getUsers);
app.delete('/users/:id', deleteUser);
// 🛣 Positions Route
app.get('/positions', getPositions);
app.get('/positions/:id', getPosition);
app.post('/positions', [addPositionValidation, FBAuthMiddleware], addPosition);
app.delete('/positions/:id', [FBAuthMiddleware], deletePosition);
app.put('/positions/:id', [FBAuthMiddleware], updatePosition);

// 🛣 Study Programs Route
app.get('/study_programs', getStudyPrograms);
app.get('/study_programs/:id', getStudyProgram);
app.post(
  '/study_programs',
  [addAndUpdateStudyProgramValidation, FBAuthMiddleware],
  addStudyProgram
);
app.delete('/study_programs/:id', [FBAuthMiddleware], deleteStudyProgram);
app.put(
  '/study_programs/:id',
  [addAndUpdateStudyProgramValidation, FBAuthMiddleware],
  updateStudyProgram
);

// 🛣 Timelines Route
app.get('/timelines', getTimelines);
app.get('/timelines/:id', getTimeline);
app.post('/timelines', [FBAuthMiddleware, addTimelineValidation], addTimeline);
app.put('/timelines/:id', [FBAuthMiddleware], updateTimeline);
app.delete('/timelines/:id', [FBAuthMiddleware], deleteTimeline);

// 🛣 Submission Route
app.get('/submission', getSubmissions);
app.get('/submission/:id', getTimeline);
app.post('/submission', addSubmission);
app.put('/submissions-update', [FBAuthMiddleware], updateStatus);
app.put(
  '/submissions-update/agreement',
  [FBAuthMiddleware],
  updateStatusAgreement
);
app.put('/submission/:id', [FBAuthMiddleware], updateScore);
app.delete('/submission/:id', [FBAuthMiddleware], deleteTimeline);

// 🛣 Forms Route
app.get('/forms', getForms);
app.get('/forms/:id', getForm);
app.put('/forms/conf', formSettings);
app.get('/forms-conf', getFormSettings);
app.post('/forms', [FBAuthMiddleware, addFormsValidation], addForm);
app.put('/forms/:id', [FBAuthMiddleware], updateForm);
app.delete('/forms/:id', [FBAuthMiddleware], deleteForm);

// exports.helloWorld = functions.https.onRequest((req, res) => res.send('Hello world!'));
exports.api = functions.https.onRequest(app);
