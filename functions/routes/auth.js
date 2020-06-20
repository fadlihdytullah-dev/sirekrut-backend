const {firebase, db, admin} = require('./../utils/admin');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const {
  getErrorListFromValidator,
  buildResponseData,
  buildErrorMessage,
} = require('./../utils/helper');
const {actionType} = require('./../utils/constants');

const CONTEXT = 'user(s)';

const USERS_REF = db.collection('users');

const addAdminValidation = [
  check('nip').isString().notEmpty(),
  check('email').isEmail().notEmpty(),
  check('password').isString().notEmpty(),
  check('confirmPassword').isString().notEmpty(),
];

const loginAdminValidation = [
  check('email').isEmail().notEmpty(),
  check('password').isString().notEmpty(),
];

let responseData;

const FBAuthMiddleware = async (req, res, next) => {
  let tokenKey;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      tokenKey = req.headers.authorization.split('Bearer ')[1];
    } else {
      responseData = buildResponseData(false, 'Unauthorized');

      return res.status(403).json(responseData);
    }

    // const decodedToken = await admin.auth().verifyIdToken(tokenKey);
    const decodedToken = jwt.verify(tokenKey, 'meongmeongmeong');
    console.log(decodedToken, 'Decode TOken');
    req.user = decodedToken;
    const userData = await USERS_REF.where('userId', '==', req.user.uid)
      .limit(1)
      .get();

    req.user.nip = userData.docs[0].data().nip;

    return next();
  } catch (error) {
    responseData = buildResponseData(
      false,
      'Error while verifying token.',
      null
    );

    res.status(403).json(responseData);
  }
};

const addAdmin = async (req, res) => {
  console.log('WAWAWA');
  console.log(req.body, 'this is from req.body');
  try {
    const errors = validationResult(req);

    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const {nip, email, password, confirmPassword, name} = req.body;

    if (password !== confirmPassword) {
      responseData = buildResponseData(
        false,
        'Password and Confirm Password must be same.',
        null
      );

      return res.status(422).json(responseData);
    }

    // Check wether the user  with NIP already exits or not
    const userDocument = await USERS_REF.doc(nip).get();

    if (userDocument.exists) {
      responseData = buildResponseData(false, 'NIP Already taken.', null);

      return res.status(400).json(responseData);
    }

    const userData = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    const userId = userData.user.uid;

    const tokenKey = await userData.user.getIdToken(true);

    const userCredentials = {
      nip,
      name,
      email,
      createdAt: new Date().toISOString(),
      userId,
    };
    console.log(userCredentials);

    await USERS_REF.doc(nip).set(userCredentials);

    responseData = buildResponseData(true, null, {token: tokenKey});

    res.status(201).json(responseData);
  } catch (error) {
    console.log({error});
    if (error.code === 'auth/email-already-in-use') {
      responseData = buildResponseData(false, 'Email already taken.', null);

      return res.status(400).json(responseData);
    }

    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.ADDING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = [];

    const querySnapshot = await USERS_REF.orderBy('createdAt', 'desc').get();
    querySnapshot.forEach((doc) => users.push({id: doc.id, ...doc.data()}));

    responseData = buildResponseData(true, null, users);

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

const loginAdmin = async (req, res) => {
  console.log(req.body, 'this is credintial');
  try {
    const errors = validationResult(req);
    const hasError = getErrorListFromValidator(errors);

    if (hasError) {
      responseData = buildResponseData(false, hasError.errorList, null);

      return res.status(422).json(responseData);
    }

    const {email, password} = req.body;

    const userData = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then();

    const token = jwt.sign({uid: userData.user.uid}, 'meongmeongmeong', {
      expiresIn: '7d',
    });

    responseData = buildResponseData(true, null, {token});

    res.json(responseData);
  } catch (error) {
    console.log(error);
    if (error.code === 'auth/wrong-password') {
      responseData = buildResponseData(false, 'Wrong credentials.', null);

      return res.status(403).json(responseData);
    }

    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, CONTEXT),
      null
    );

    res.status(500).json(responseData);
  }
};

const deleteUser = async (req, res) => {
  try {
    const {id} = req.params;

    const doc = await USERS_REF.doc(id).get();
    console.log(doc.data(), 'INI DOC WHEN DELETED');
    if (!doc.exists) {
      responseData = buildResponseData(
        false,
        'User with the given ID was not found.',
        null
      );

      return res.status(404).json(responseData);
    }

    await admin.auth().deleteUser(doc.data().userId);
    await USERS_REF.doc(id).delete();
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
  addAdmin,
  getUsers,
  addAdminValidation,
  loginAdminValidation,
  loginAdmin,
  FBAuthMiddleware,
  deleteUser,
};
