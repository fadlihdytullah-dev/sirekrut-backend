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

    // const token = jwt.sign(
    //   {
    //     alg: 'RS256',
    //     iss: 'firebase-adminsdk-zctwr@si-rekrut.iam.gserviceaccount.com',
    //     sub: 'firebase-adminsdk-zctwr@si-rekrut.iam.gserviceaccount.com',
    //     aud:
    //       'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    //     iat: parseInt(new Date().getTime() / 1000),
    //     exp: parseInt(new Date().getTime() / 1000) + 60 * 60,
    //     uid: userData.user.uid,
    //   },
    //   '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCugG9anmUic9Br\n3kLxMNNEZ+kHdPgs/Nq/34My48tCrLm7y9tSf3QKmhpCQSXa7jXoIyRz23Vcj/Qr\nB/MGqnOHPb9+mHteVJJ30VIBtqq+nyHigKk/pMeO+ue21BvEjl8scWAmfeUHE5WT\nOIRN2iYukjNzXOjEwAKU+p1p+KnzbdiAfhde76b4g8gukvNHwRV7KQ2G4LMLHeHp\nwieolTIWlZPRiS59prxf8tKTuYAiKVrbuSSKTlgKgRxP8KrTKerTFo8HwBWP3SAg\nOA9mcZ03F74ZX2gbFMNUBM7ox10f86nUXMzpkJousvTa+NTnYt1G8PnzTbk4Jl28\nvUj1T+cFAgMBAAECggEAFb+cIUcsg6a7izYgUb8sFZJ90Jgbdj/tY4yP5X/OjXjJ\njUZTB20rIUcjjq5f8XFO9qeqm2X2spqea96Jw4Lq8ygW/cgzWAZiWtyTw/LoROnA\nZ2JxtaTr2j4bMwYsj8rOwdM/kIyQRtmCAt9AXhOaPqOqFe62dA8aQ0cY52Q+ikAp\nmq3eO6L6gb3l1LdvqiAqwtQD/RrdDI9gcXALbYP5lAQUeDt8aUZ6nnfWUcXfJ96k\nAIRrNV0FuwNJGFnxCVAGCiRb7zBPdD5Dt3DWyT1RC3i0/nxgRDAIifPNXONq2fVn\n672quVTqV9zNrY7LpAOIp10+Q4z9OtQK0Kk9iCQ0AQKBgQDn0RSSmUgGXNUmam1I\n2gu4uh6xP5kfikCHqeedmhxgafUjqHy4dCwJOMZoSUlrLP0SSbnwaTVgS0e08ErX\nU/8Npa+Al5kTpSBkP6orxJRaLDK8RmDm9Q/hVzRgMq5QeTdlDY3K1e14JWVxiTgn\nI+19czkKV2pVAjhPoPXGfnRPIQKBgQDAtLGznL9BLlllQdnOfEGe2qdbfbmXyK/Q\nEbQGPyIX4Vq3/GtYDOYklKri1/iz/oTsE1zckSsspp7SkvQDCMmZaUDBGcRCtugc\nu42xq8PduJlFTA5XAedmD/wU7TwpEQnv/gu75wSNs9Q8CWagoyO9QpvtlAN2BL79\nqdGYfFHPZQKBgGbLUukS6VpQ7f/D78P/VHVMqvGENx1CTA0cbWV4gh7KvXZbbzrH\n4QMR1wFFhjXtVCc45CfUL2QM3bZBW56SU6Y0k1ddYfbRIUTy6j3QRMybjr/oIW4o\nuyr8ZXBG6P8sUUEROo/4Pv4o7wvigjDxAI3Be0i3rKIXgurkgDfNuTuhAoGAbwet\nW0904plR6IWIePAe3ugchRprVIjMw5VvpCm7+wZcvqUxNAo6j9kYnJrTMOH0tBBz\n8KGzvoZB/BGvhhAKF9oM9TVjXw0Dr4pgmX3d3GH/7W1k1bzDFosfMu99OiwXDa/S\nEvGILhzuq6i++M8GSIWYUcp2NAmIAZ9WpAT9HgECgYEA3aUMY4zilp4Rsli1yQ9K\nsP7/lwIUpprqfEVuqDVPJKD73OgjLgCzAGkNKFRAUzocSlSLYDQgrtEGrTXyq6C7\nxASoqRYsJLJw2FHTbs3cJIZz2RHWwDWLnr2mf3JUBSAvsKQlTzoLAlfBQjWeNhdX\nzDNG2nFydJyXaqV/imgfMnE=\n-----END PRIVATE KEY-----\n',
    //   {algorithm: 'RS256'}
    // );

    const token = jwt.sign({uid: userData.user.uid}, 'meongmeongmeong', {
      expiresIn: '7d',
    });

    // admin
    //   .auth()
    //   .createCustomToken(userData.user.uid)
    //   .then(function (customToken) {
    //     console.log(customToken, 'this is custom token');
    //     // Send token back to client
    //   })
    //   .catch(function (error) {
    //     console.log('Error creating custom token:', error);
    //   });

    // await firebase.auth().signInWithCustomToken(token);
    // const tokenKey = await userData.user.getIdToken(true);

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
