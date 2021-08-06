const postBagOfWords = async (bOWDoc, db) => {
  const bags = db.collection("bagsOfWords");
  const result = await bags.insertOne(bOWDoc);
  return result;
};

const getBagsOfWords = async (objectIDs, db) => {
  const bags = db.collection("bagsOfWords");
  const result = await bags.find({ _id: { $in: objectIDs } });
  return result;
};

const getBagOfWords = async (objectID, db) => {
  const bags = db.collection("bagsOfWords");
  const result = await bags.findOne({ _id: objectID });
  return result;
};

const putBagOfWords = async (objectID, updateAttributes, db) => {
  const bags = db.collection("bagsOfWords");
  const filter = { _id: objectID };
  const updateDoc = { $set: updateAttributes };
  const result = await bags.updateOne(filter, updateDoc);
  return result;
};

const deleteBagOfWords = async (objectID, db) => {
  const bags = db.collection("bagsOfWords");
  const query = { _id: objectID };
  const result = await bags.deleteOne(query);
  return result;
};

module.exports = {
  postBagOfWords,
  getBagsOfWords,
  getBagOfWords,
  putBagOfWords,
  deleteBagOfWords,
};
