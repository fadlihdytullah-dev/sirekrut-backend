const { db } = require("./../utils/admin");
const {
  buildErrorMessage,
  buildResponseData,
  actionType
} = require("./../utils/constants");

const STUDY_PROGRAMS_REF = db.collection("study_programs");

let responseData;

exports.getStudyPrograms = async (req, res) => {
  try {
    const studyPrograms = [];
    const querySnapshot = await STUDY_PROGRAMS_REF.get();
    querySnapshot.forEach(doc =>
      studyPrograms.push({ id: doc.id, ...doc.data() })
    );

    responseData = buildResponseData(true, "", studyPrograms);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.RETRIEVING, "study programs"),
      null
    );

    res.send(responseData);
  }
};

exports.getStudyProgram = async (req, res) => {
  try {
    const id = req.params.id;
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
    responseData = buildResponseData(true, "", data);

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

exports.addStudyProgram = async (req, res) => {
  // TODO: Validate input add
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      responseData = buildResponseData(false, "Name is required", null);

      return res.status(400).json(responseData);
    }

    const newItem = { name };

    const docRef = await STUDY_PROGRAMS_REF.add(newItem);

    const data = {
      id: docRef.id,
      name
    };
    responseData = buildResponseData(true, "", data);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.ADDING, "study program"),
      null
    );

    res.json(responseData);
  }
};

exports.updateStudyProgram = async (req, res) => {
  // TODO: Validate input update
  try {
    const id = req.params.id;
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

    if (!name || name.trim().length === 0) {
      responseData = buildResponseData(false, "Name is required", null);

      return res.status(400).json(responseData);
    }

    const updatedItem = { name };
    const docRef = await STUDY_PROGRAMS_REF.doc(id).set(updatedItem);

    const data = {
      id: docRef.id,
      name
    };
    responseData = buildResponseData(true, "", data);

    res.json(responseData);
  } catch (error) {
    responseData.message = buildErrorMessage(
      actionType.UPDATING,
      "study program"
    );
    res.send(responseData);
  }
};

exports.deleteStudyProgram = async (req, res) => {
  try {
    const id = req.params.id;
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
    responseData = buildResponseData(true, "", null);

    res.json(responseData);
  } catch (error) {
    responseData = buildResponseData(
      false,
      buildErrorMessage(actionType.DELETING, "study program"),
      null
    );

    res.json(responseData);
  }
};
