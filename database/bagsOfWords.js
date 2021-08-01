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

module.exports = { postBagOfWords, getBagsOfWords };
