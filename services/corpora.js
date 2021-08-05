const {
  postCorpus,
  getCorpora,
  getCorpus,
  putCorpus,
} = require("./../database/corpora");
const { parseObjectIDArray, parseObjectID } = require("./misc");

const createCorpus = async (name, description, ids, table, db) => {
  const bags = parseObjectIDArray(ids);
  const corpusDoc = {
    name,
    description,
    bags,
    table,
  };
  const result = await postCorpus(corpusDoc, db);
  return result;
};

const getCorporaByID = async (ids, db) => {
  if (ids.length === 0) {
    return [];
  }
  const objectIDArray = parseObjectIDArray(ids);
  let result;
  if (objectIDArray.length > 1) {
    const cursor = await getCorpora(objectIDArray, db);
    result = await cursor.toArray();
  } else {
    result = [await getCorpus(objectIDArray[0], db)];
  }
  return result;
};

const addToCorpusBags = (currentBags, newBags) => {
  const updatedBags = currentBags.slice();
  for (let bag of newBags) {
    updatedBags.push(bag._id);
  }
  return updatedBags;
};

const updateCorpus = async (id, updateAttributes, db) => {
  const objectID = parseObjectID(id);
  const result = await putCorpus(objectID, updateAttributes, db);
  return result;
};

module.exports = {
  createCorpus,
  getCorporaByID,
  addToCorpusBags,
  updateCorpus,
};
