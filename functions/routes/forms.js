const {db} = require('../utils/admin');
const {check, validationResult} = require('express-validator');
const {actionType} = require('../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('../utils/helper');

const FORMS_REF = db.collection('forms');
const FORMS_CONF = db.collection('formSetting');
const CONTEXT = 'form(s)';

let responseData;

const addFormsValidation = [check('name').isString().notEmpty()];

const getForms = async (req, res) => {
  try {
    const forms = [];

    const querySnapshot = await FORMS_REF.orderBy('createdAt', 'desc').get();
    querySnapshot.forEach((doc) => forms.push({id: doc.id, ...doc.data()}));

    responseData = buildResponseData(true, null, forms);

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

const getForm = async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await FORMS_REF.doc(id).get();

    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Form with the given ID was not found.',
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

const addForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    let newItem = ({name} = req.body);

    newItem = {
      ...newItem,
      createdBy: req.user.nip,
      createdAt: new Date().toISOString(),
    };

    const docRef = await FORMS_REF.add(newItem);

    const data = {
      id: docRef.id,
      ...newItem,
    };

    responseData = buildResponseData(true, null, data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.ADDING, CONTEXT) + error.message,
      null
    );

    res.json(responseData);
  }
};

const formSettings = async (req, res) => {
  try {
    const doc = await FORMS_CONF.doc('data').get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Form with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const prevData = doc.data();

    const {showToefl, show360} = req.body;

    const updatedItem = {
      showToefl,
      show360,
    };

    const docRef = await FORMS_CONF.doc('data').update(updatedItem);

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

const getFormSettings = async (req, res) => {
  try {
    const doc = await FORMS_CONF.doc('data').get();

    const data = {...doc.data()};
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

const updateForm = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await FORMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Form with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    const prevData = doc.data();

    const {name} = req.body;

    const updatedItem = {
      name: name || prevData.name,
    };

    const docRef = await FORMS_REF.doc(id).update(updatedItem);

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

const deleteForm = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await FORMS_REF.doc(id).get();
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'Form with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    await FORMS_REF.doc(id).delete();
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
  getForms,
  getForm,
  addFormsValidation,
  getFormSettings,
  addForm,
  formSettings,
  updateForm,
  deleteForm,
};
