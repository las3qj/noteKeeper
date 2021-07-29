const postBagOfWords = async (bOWDoc, db) => {
  const notes = db.collection("bagsOfWords");
  const result = await notes.insertOne(bOWDoc);
  return result;
};

module.exports = { postBagOfWords };
