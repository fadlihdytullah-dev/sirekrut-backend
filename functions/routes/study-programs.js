const {db} = require('./../utils/admin');
const {check, validationResult} = require('express-validator');
const {actionType} = require('./../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('./../utils/helper');

const STUDY_PROGRAMS_REF = db.collection('studyPrograms');
const CONTEXT = 'study program(s)';

let responseData;

const addAndUpdateStudyProgramValidation = [
  check('name').isString().notEmpty(),
  check('degree').isString().notEmpty(),
];

const getStudyPrograms = async (req, res) => {
  try {
    const studyPrograms = [];

    const querySnapshot = await STUDY_PROGRAMS_REF.orderBy(
      'createdAt',
      'desc'
    ).get();
    querySnapshot.forEach((doc) =>
      studyPrograms.push({id: doc.id, ...doc.data()})
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
    const {id} = req.params;
    const doc = await STUDY_PROGRAMS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Study program with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const data = {id: doc.id, ...doc.data()};
    responseData = buildResponseData(true, null, data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, 'study program'),
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

    const {name, degree} = req.body;

    const newItem = {
      name,
      degree,
      createdBy: req.user.nip,
      createdAt: new Date().toISOString(),
    };

    const docRef = await STUDY_PROGRAMS_REF.add(newItem);

    const data = {
      id: docRef.id,
      ...newItem,
    };

    responseData = buildResponseData(true, null, data);

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

const updateStudyProgram = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const {id} = req.params;

    const doc = await STUDY_PROGRAMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Study program with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const {name, degree} = req.body;
    const updatedItem = {
      name,
      degree,
      updatedBy: req.user.nip,
      updatedAt: new Date().toISOString(),
    };

    const docRef = await STUDY_PROGRAMS_REF.doc(id).update(updatedItem);

    const data = {
      id: docRef.id,
      ...updatedItem,
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
    const {id} = req.params;

    const doc = await STUDY_PROGRAMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Study program with the given ID was not found.',
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

const changeStudyProgramStatus = async (req, res) => {
  let {id} = req.params;

  const doc = await STUDY_PROGRAMS_REF.doc(id).get();

  if (!doc.exists) {
    responseData = buildResponseData(
      false,
      'Study Program with the given ID was not found.',
      null
    );

    return res.status(404).json(responseData);
  }

  const data = doc.data();
  const status = data.status === 'ACTIVE' ? 'NONACTIVE' : 'ACTIVE';
  const updatedData = {
    ...data,
    status,
  };

  const docRef = await STUDY_PROGRAMS_REF.doc(id).update(updatedData);

  responseData = buildResponseData(true, null, updatedData || {});

  res.json(responseData);
};

module.exports = {
  getStudyPrograms,
  getStudyProgram,
  addAndUpdateStudyProgramValidation,
  addStudyProgram,
  updateStudyProgram,
  deleteStudyProgram,
  changeStudyProgramStatus,
};
