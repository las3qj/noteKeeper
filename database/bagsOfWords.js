const postBagOfWords = async (bOWDoc, db) => {
  const notes = db.collection("bagsOfWords");
  const result = await notes.insertOne(bOWDoc);
  return result;
};

const getBagsOfWords = async (objectIDs, db) => {
  const notes = db.collection("bagsOfWords");
  const result = await notes.find({ _id: { $in: objectIDs } });
  return result;
};

module.exports = { postBagOfWords, getBagsOfWords };
