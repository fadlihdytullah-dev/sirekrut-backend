const { db } = require("./../utils/admin");
const { check, validationResult } = require("express-validator");
const { actionType } = require("./../utils/constants");
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator
} = require("./../utils/helper");

const STUDY_PROGRAMS_REF = db.collection("studyPrograms");
const CONTEXT = "study program(s)";

let responseData;

const addAndUpdateStudyProgramValidation = [
  check("name")
    .isString()
    .notEmpty()
];

const getStudyPrograms = async (req, res) => {
  try {
    const studyPrograms = [];

    const querySnapshot = await STUDY_PROGRAMS_REF.get();
    querySnapshot.forEach(doc =>
      studyPrograms.push({ id: doc.id, ...doc.data() })
    );

    responseData = buildResponseData(true, null, studyPrograms);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, CONTEXT),
      null
    );

    res.send(responseData);
  }
};

const getStudyProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await STUDY_PROGRAMS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        "Study program with the given ID was not found.",
        null
      );

      return res.status(404).json(responseData);
    }

    const data = { id: doc.id, ...doc.data() };
    responseData = buildResponseData(true, null, data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, "study program"),
      null
    );

    res.json(responseData);
  }
};

const addStudyProgram = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const { name } = req.body;

    const docRef = await STUDY_PROGRAMS_REF.add({ name });

    const data = {
      id: docRef.id,
      name
    };

    responseData = buildResponseData(true, null, data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.ADDING, CONTEXT),
      null
    );

    res.json(responseData);
  }
};

const updateStudyProgram = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const { id } = req.params;

    const doc = await STUDY_PROGRAMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        "Study program with the given ID was not found.",
        null
      );

      return res.status(404).json(responseData);
    }

    const { name } = req.body;
    const updatedItem = { name };

    console.log("ℹ️ name:=", name);

    const docRef = await STUDY_PROGRAMS_REF.doc(id).set(updatedItem);

    const data = {
      id: docRef.id,
      name
    };
    responseData = buildResponseData(true, null, data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.UPDATING, CONTEXT) + error.message,
      null
    );

    res.status(500).json(responseData);
  }
};

const deleteStudyProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await STUDY_PROGRAMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        "Study program with the given ID was not found.",
        null
      );

      return res.status(404).json(responseData);
    }

    await STUDY_PROGRAMS_REF.doc(id).delete();
    responseData = buildResponseData(true, null, null);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.DELETING, CONTEXT),
      null
    );

    res.json(responseData);
  }
};

module.exports = {
  getStudyPrograms,
  getStudyProgram,
  addAndUpdateStudyProgramValidation,
  addStudyProgram,
  updateStudyProgram,
  deleteStudyProgram
};
