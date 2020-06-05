const {db} = require('../utils/admin');
const {check, validationResult} = require('express-validator');
const {actionType} = require('../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('../utils/helper');

const SUBMISSION_REF = db.collection('submissions');
const CONTEXT = 'submission timeline(s)';

let responseData;

const addTimelineValidation = [
  check('title').isString().notEmpty(),
  check('type').isIn(['STAFF', 'DOSEN', 'PROFESSIONAL']).notEmpty(),
  check('startDate').isString().notEmpty(),
  check('endDate').isString().notEmpty(),
  check('forms').isArray().notEmpty(),
  check('positions').isArray().notEmpty(),
];

const getSubmissions = async (req, res) => {
  try {
    const timelines = [];

    const querySnapshot = await SUBMISSION_REF.orderBy(
      'createdAt',
      'desc'
    ).get();
    querySnapshot.forEach((doc) => timelines.push({id: doc.id, ...doc.data()}));

    responseData = buildResponseData(true, null, timelines);

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

const getTimeline = async (req, res) => {
  // try {
  //   const {id} = req.params;
  //   const doc = await TIMELINE_REF.doc(id).get();
  //   if (!doc.exists) {
  //     responseData = buildResponseData(
  //       false,
  //       'Timeline with the given ID was not found.',
  //       null
  //     );
  //     return res.status(404).json(responseData);
  //   }
  //   const data = {id: doc.id, ...doc.data()};
  //   responseData = buildResponseData(true, null, data);
  //   res.json(responseData);
  // } catch (error) {
  //   responseData = buildResponseData(
  //     false,
  //     buildErrorMessage(actionType.RETRIEVING, CONTEXT),
  //     null
  //   );
  //   res.json(responseData);
  // }
};

const addSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    let newItem = ({
      fullName,
      email,
      address,
      originFrom,
      dateOfBirth,
      gender,
      phoneNumber,
      lastEducation,
      toeflScore,
      toeflFile = null,
      _360Score,
      _360File = null,
      cvFile = null,
      profilePicture,
      position,
    } = req.body);

    newItem = {
      ...newItem,
      status: 0,
      score: {academicScore: 0, psikotesScore: 0, interviewScore: 0},
      passed: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await SUBMISSION_REF.add(newItem);

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

    res.json(responseData);
  }
};

const updateScore = async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await SUBMISSION_REF.doc(id).get();
    console.log(doc, 'ASDASDASDSA');
    console.log(req.body);
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Timeline with the given ID was not found.',
        null
      );
      return res.status(404).json(responseData);
    }
    const prevData = doc.data();
    const {score} = req.body;
    // const updatedItem = {
    //   title: title || prevData.title,
    //   type: type || prevData.type,
    //   startDate: startDate || prevData.startDate,
    //   endDate: endDate || prevData.endDate,
    //   forms: forms || prevData.forms,
    //   positions: positions || prevData.positions,
    //   updatedBy: req.user.nip,
    //   updatedAt: new Date().toISOString(),
    // };
    const updatedScore = {
      score: {
        psikotesScore: score.psikotesScore || prevData.score.psikotesScore,
        interviewScore: score.interviewScore || prevData.score.interviewScore,
        academicScore: score.academicScore || prevData.score.academicScore,
      },
    };
    const docRef = await SUBMISSION_REF.doc(id).update(updatedScore);
    const data = {
      id: docRef.id,
      ...updatedScore,
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

const deleteTimeline = async (req, res) => {
  // try {
  //   const {id} = req.params;
  //   const doc = await TIMELINE_REF.doc(id).get();
  //   if (!doc.exists) {
  //     responseData = buildResponseData(
  //       false,
  //       'Timeline with the given ID was not found.',
  //       null
  //     );
  //     return res.status(404).json(responseData);
  //   }
  //   await TIMELINE_REF.doc(id).delete();
  //   responseData = buildResponseData(true, null, null);
  //   res.json(responseData);
  // } catch (error) {
  //   responseData = buildResponseData(
  //     false,
  //     buildErrorMessage(actionType.DELETING, CONTEXT),
  //     null
  //   );
  //   res.json(responseData);
  // }
};

module.exports = {
  getSubmissions,
  getTimeline,
  addTimelineValidation,
  addSubmission,
  updateScore,
  deleteTimeline,
};
