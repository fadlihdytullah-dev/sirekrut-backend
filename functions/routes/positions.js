const {check, validationResult} = require('express-validator');
const {db} = require('./../utils/admin');
const {actionType} = require('./../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('./../utils/helper');

const POSITIONS_REF = db.collection('positions');
const STUDY_PROGRAMS_REF = db.collection('studyPrograms');
const CONTEXT = 'position(s)';

let responseData;

const addPositionValidation = [
  check('name').isString().notEmpty(),
  check('minimumGraduate')
    .isString()
    .isIn(['DIPLOMA', 'SARJANA', 'MAGISTER', 'DOKTOR'])
    .notEmpty(),
  check('studyPrograms').notEmpty(),
  check('minimumGPA').isNumeric().notEmpty(),
  check('details').optional({nullable: true}),
];

const resolvePositionWithStudyPrograms = async (position) => {
  const {studyPrograms} = position;

  if (!studyPrograms) {
    return;
  }

  if (studyPrograms === 'ALL') {
    return position;
  } else {
    const data = studyPrograms.map(async (studyProgramID) => {
      const doc = await STUDY_PROGRAMS_REF.doc(studyProgramID).get();
      return {...doc.data(), id: studyProgramID};
    });

    const result = await Promise.all(data);

    return {...position, studyPrograms: result};
  }
};

const getPositions = async (req, res) => {
  try {
    const positionList = [];

    const querySnapshot = await POSITIONS_REF.orderBy(
      'createdAt',
      'desc'
    ).get();
    querySnapshot.forEach((doc) => {
      positionList.push({id: doc.id, ...doc.data()});
    });

    const positionListWithStudyPrograms = positionList.map(
      resolvePositionWithStudyPrograms
    );

    const data = await Promise.all(positionListWithStudyPrograms);
    responseData = buildResponseData(true, null, data);
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
    const {id} = req.params;
    const doc = await POSITIONS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Position with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const data = {id: doc.id, ...doc.data()};
    const updatedData = await resolvePositionWithStudyPrograms(data);
    responseData = buildResponseData(true, null, updatedData);

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

    let newItem = ({
      name,
      minimumGraduate,
      studyPrograms,
      minimumGPA,
      details = '',
    } = req.body);

    newItem = {
      ...newItem,
      createdBy: req.user.nip,
      createdAt: new Date().toISOString(),
    };

    const docRef = await POSITIONS_REF.add(newItem);

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

const deletePosition = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await POSITIONS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Position with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    await POSITIONS_REF.doc(id).delete();
    responseData = buildResponseData(true, null, null);

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
  try {
    const {id} = req.params;
    const doc = await POSITIONS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Position with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const prevData = doc.data();

    const {
      name,
      minimumGraduate,
      studyPrograms,
      minimumGPA,
      details,
    } = req.body;

    const updatedItem = {
      name: name || prevData.name,
      minimumGraduate: minimumGraduate || prevData.minimumGraduate,
      studyPrograms: studyPrograms || prevData.studyPrograms,
      minimumGPA: minimumGPA || prevData.minimumGPA,
      details: details || prevData.details,
      updatedBy: req.user.nip,
      updatedAt: new Date().toISOString(),
    };

    const docRef = await POSITIONS_REF.doc(id).update(updatedItem);
    const data = {
      id,
      ...updatedItem,
    };

    responseData = buildResponseData(true, null, data);

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
  addPositionValidation,
  getPositions,
  getPosition,
  addPosition,
  deletePosition,
  updatePosition,
};
