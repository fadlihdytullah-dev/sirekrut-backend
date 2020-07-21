const {db} = require('../utils/admin');
const {check, validationResult} = require('express-validator');
const {actionType} = require('../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('../utils/helper');

const TIMELINE_REF = db.collection('timelines');
const CONTEXT = 'recruitment timeline(s)';

let responseData;

const addTimelineValidation = [
  check('title').isString().notEmpty(),
  check('startDate').isString().notEmpty(),
  check('endDate').isString().notEmpty(),
  check('positions').isArray().notEmpty(),
];

const getTimelines = async (req, res) => {
  try {
    const timelines = [];

    const querySnapshot = await TIMELINE_REF.orderBy('createdAt', 'desc').get();
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
  try {
    const {id} = req.params;
    const doc = await TIMELINE_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Timeline with the given ID was not found.',
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
      buildErrorMessage(actionType.RETRIEVING, CONTEXT),
      null
    );

    res.json(responseData);
  }
};

const addTimeline = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    let newItem = ({title, type, startDate, endDate, positions} = req.body);

    newItem = {
      ...newItem,
      createdBy: req.user.nip,
      createdAt: new Date().toISOString(),
    };

    const docRef = await TIMELINE_REF.add(newItem);

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

const updateTimeline = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await TIMELINE_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Timeline with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const prevData = doc.data();

    const {title, type, startDate, endDate, positions} = req.body;

    const updatedItem = {
      title: title || prevData.title,
      type: type || prevData.type,
      startDate: startDate || prevData.startDate,
      endDate: endDate || prevData.endDate,
      positions: positions || prevData.positions,
      updatedBy: req.user.nip,
      updatedAt: new Date().toISOString(),
    };

    const docRef = await TIMELINE_REF.doc(id).update(updatedItem);

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

const deleteTimeline = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await TIMELINE_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Timeline with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    await TIMELINE_REF.doc(id).delete();
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

const changeTimelineStatus = async (req, res) => {
  let {id} = req.params;

  const doc = await TIMELINE_REF.doc(id).get();

  if (!doc.exists) {
    responseData = buildResponseData(
      false,
      'Timeline with the given ID was not found.',
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

  const docRef = await TIMELINE_REF.doc(id).update(updatedData);

  responseData = buildResponseData(true, null, updatedData || {});

  res.json(responseData);
};

module.exports = {
  getTimelines,
  getTimeline,
  addTimelineValidation,
  addTimeline,
  updateTimeline,
  deleteTimeline,
  changeTimelineStatus,
};
