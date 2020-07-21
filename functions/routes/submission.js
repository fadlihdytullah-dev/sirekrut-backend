const {db} = require('../utils/admin');
const {check, validationResult} = require('express-validator');
const {actionType} = require('../utils/constants');
const {
  buildErrorMessage,
  buildResponseData,
  getErrorListFromValidator,
} = require('../utils/helper');

const SUBMISSION_REF = db.collection('submissions');
const TIMELINE_REF = db.collection('timelines');
const CONTEXT = 'submission timeline(s)';

let responseData;

const getSubmissions = async (req, res) => {
  let {filterValue, filter, periode, determination} = req.query;
  filter = filter || 'status';
  filterValue = filter === 'status' ? parseInt(filterValue) : filterValue;
  try {
    const timelines = [];
    let querySnapshot;

    if (determination) {
      querySnapshot = await SUBMISSION_REF.where(filter, '==', 6)
        .where('determination', '==', 2)
        .get();
    } else if (periode) {
      querySnapshot = await SUBMISSION_REF.where(filter, '==', filterValue)
        .where('periodId', '==', periode)
        .get();
    } else if (periode === 'ALL') {
      querySnapshot = await SUBMISSION_REF.where(
        filter,
        '==',
        filterValue
      ).get();
    } else {
      querySnapshot = await SUBMISSION_REF.where(
        filter,
        '==',
        filterValue
      ).get();
    }

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
      score: {
        academicScore: 0,
        psikotesScore: 0,
        microteachingScore: 0,
        interviewScore: 0,
        orientationScore: 0,
      },
      passed: 0,
      determination: 0,
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

    const updatedScore = {
      score: {
        academicScore: score.academicScore || prevData.score.academicScore,
        psikotesScore: score.psikotesScore || prevData.score.psikotesScore,
        microteachingScore:
          score.microteachingScore || prevData.score.microteachingScore,
        interviewScore: score.interviewScore || prevData.score.interviewScore,
        orientationScore:
          score.orientationScore || prevData.score.orientationScore,
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

const updateStatus = async (req, res) => {
  const {applicants, updatedStatus} = req.body;
  try {
    const updateAllStatus = async () => {
      const dataUpdate = applicants.map(async (id) => {
        const docRef = await SUBMISSION_REF.doc(id).update({
          status: updatedStatus,
        });
        const data = {
          id: docRef.id,
          status: true,
        };
        return true;
      });
      const promiseDone = Promise.all(dataUpdate);
      return promiseDone;
    };

    const updateStatus = await updateAllStatus();
    responseData = buildResponseData(true, null, {applicants, updatedStatus});
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

const updateStatusAgreement = async (req, res) => {
  const {id, updatedStatus, positionId, periodId} = req.body;
  try {
    const docRef = await SUBMISSION_REF.doc(id).update({
      passed: updatedStatus,
      determination: 0,
    });
    responseData = buildResponseData(true, null, {id, updatedStatus});

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

const updateStatusDetermination = async (req, res) => {
  const {id, updatedStatus, positionId, periodId} = req.body;
  try {
    if (updatedStatus === 2) {
      const getAllAplicantsFromPositions = await SUBMISSION_REF.where(
        'positionId',
        '==',
        positionId
      )
        .where('periodId', '==', periodId)
        .where('determination', '==', 2)
        .get();
      const totalAcceptApplicant = getAllAplicantsFromPositions.docs.length;

      const getQuotaFromPeriode = await TIMELINE_REF.doc(periodId).get();

      if (getQuotaFromPeriode.data()) {
        const getPosition = await getQuotaFromPeriode
          .data()
          .positions.filter((data) => data.positionID === positionId);

        if (totalAcceptApplicant >= getPosition[0].quota) {
          responseData = buildResponseData(
            false,
            'Jumlah lulusan telah cukup',
            null
          );
        } else {
          const docRef = await SUBMISSION_REF.doc(id).update({
            determination: updatedStatus,
          });
        }
      }
    } else {
      const docRef = await SUBMISSION_REF.doc(id).update({
        determination: updatedStatus,
      });

      responseData = buildResponseData(true, null, {id, updatedStatus});
    }

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

module.exports = {
  getSubmissions,
  addSubmission,
  updateScore,
  updateStatus,
  updateStatusAgreement,
  updateStatusDetermination,
};
