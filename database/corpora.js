const postCorpus = async (cDoc, db) => {
  const corpora = db.collection("corpora");
  const result = await corpora.insertOne(cDoc);
  return result;
};

const getCorpora = async (objectIDs, db) => {
  const corpora = db.collection("corpora");
  const result = await corpora.find({ _id: { $in: objectIDs } });
  return result;
};

const getCorpus = async (objectID, db) => {
  const corpora = db.collection("corpora");
  const result = await corpora.findOne({ _id: objectID });
  return result;
};

const putCorpus = async (objectID, updateAttributes, db) => {
  const corpora = db.collection("corpora");
  const filter = { _id: objectID };
  const updateDoc = { $set: updateAttributes };
  const result = await corpora.updateOne(filter, updateDoc);
  return result;
};

const deleteCorpus = async (objectID, db) => {
  const corpora = db.collection("corpora");
  const query = { _id: objectID };
  const result = await corpora.deleteOne(query);
  return result;
};

module.exports = { postCorpus, getCorpora, getCorpus, putCorpus, deleteCorpus };
