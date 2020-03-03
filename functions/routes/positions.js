const { check, validationResult } = require("express-validator");
const { db } = require("./../utils/admin");
const { actionType } = require("./../utils/constants");
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator
} = require("./../utils/helper");

const POSITIONS_REF = db.collection("positions");
const STUDY_PROGRAMS_REF = db.collection("study_programs");
const CONTEXT = "position(s)";

let responseData;

const addAndUpdatePositionValidation = [
  check("name")
    .isString()
    .notEmpty(),
  check("minimum_graduate")
    .isString()
    .isIn(["DIPLOMA", "SARJANA", "MAGISTER", "DOKTOR"])
    .notEmpty(),
  check("study_programs").notEmpty(),
  check("minimum_gpa")
    .isNumeric()
    .notEmpty(),
  check("details").optional({ nullable: true })
];

const resolvePositionWithStudyPrograms = async position => {
  const studyPrograms = position.study_programs;
  if (studyPrograms === "ALL") {
    return position;
  } else {
    const data = studyPrograms.map(async studyProgramID => {
      const doc = await STUDY_PROGRAMS_REF.doc(studyProgramID).get();
      return { ...doc.data(), id: studyProgramID };
    });

    const result = await Promise.all(data);

    return { ...position, study_programs: result };
  }
};

const getPositions = async (req, res) => {
  try {
    const positionList = [];

    const querySnapshot = await POSITIONS_REF.get();
    querySnapshot.forEach(doc => {
      positionList.push({ id: doc.id, ...doc.data() });
    });

    const updatedPositionList = positionList.map(
      resolvePositionWithStudyPrograms
    );

    const data = await Promise.all(updatedPositionList);
    responseData = buildResponseData(true, "", data);
    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const getPosition = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await POSITIONS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        "Position with the given ID was not found.",
        null
      );

      return res.status(404).json(responseData);
    }

    const data = { id: doc.id, ...doc.data() };
    const updatedData = await resolvePositionWithStudyPrograms(data);
    responseData = buildResponseData(true, "", updatedData);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const addPosition = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const newItem = ({
      name,
      minimum_graduate,
      study_programs,
      minimum_gpa,
      details = ""
    } = req.body);
    const docRef = await POSITIONS_REF.add(newItem);
    const data = {
      id: docRef.id,
      ...newItem
    };

    responseData = buildResponseData(true, "", data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.ADDING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const deletePosition = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await POSITIONS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        "Position with the given ID was not found."
      );

      return res.status(404).json(responseData);
    }

    await POSITIONS_REF.doc(id).delete();
    responseData = buildResponseData(true, "", null);
    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.DELETING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const updatePosition = async (req, res) => {
  const id = req.params.id;
  const doc = await POSITIONS_REF.doc(id).get();

  if (!doc.exists) {
    responseData = buildResponseData(
      false,
      "Position with the given ID was not found."
    );

    return res.status(404).json(responseData);
  }

  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const updatedItem = ({
      name,
      minimum_graduate,
      study_programs,
      minimum_gpa,
      details = ""
    } = req.body);
    const docRef = await POSITIONS_REF.doc(id).set(updatedItem);
    const data = {
      id,
      ...updatedItem
    };

    responseData = buildResponseData(true, "", data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.UPDATING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

module.exports = {
  addAndUpdatePositionValidation,
  getPositions,
  getPosition,
  addPosition,
  deletePosition,
  updatePosition
};
