const { db } = require("./../utils/admin");

const POSITIONS_REF = db.collection("positions");
const STUDY_PROGRAMS_REF = db.collection("study_programs");

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

exports.getPositions = async (req, res) => {
  try {
    const positionList = [];

    const querySnapshot = await POSITIONS_REF.get();
    querySnapshot.forEach(doc => {
      positionList.push(doc.data());
    });

    const updatedPositionList = positionList.map(
      resolvePositionWithStudyPrograms
    );

    const data = await Promise.all(updatedPositionList);

    res.json(data);
  } catch (error) {
    res.send("Something went wrong. ");
  }
};
