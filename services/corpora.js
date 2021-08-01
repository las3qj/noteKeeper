const {
  postCorpus,
  getCorpora,
  getCorpus,
  putCorpus,
} = require("./../database/corpora");
const { getBagsByIDs } = require("./bagsOfWords");
const { addToCorpusTable } = require("./tabling");
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
  const objectIDArray = parseObjectIDArray(ids);
  let result;
  if (objectIDArray.length > 1) {
    const cursor = await getCorpora(objectIDArray, db);
    result = await cursor.toArray();
  } else {
    result = await getCorpus(objectIDArray[0], db);
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

const addBagsByID = async (corpusID, bagIDs) => {
  const [bagArray, corpus] = await Promise.all([
    getBagsByIDs(bagIDs, db),
    getCorporaByID([corpusID], db),
  ]);
  const newTable = addToCorpusTable(corpus.table, bagArray);
  const newBags = addToCorpusBags(corpus.bags, bagArray);
  const result = await updateCorpus(
    corpusID,
    { bags: newBags, table: newTable },
    db
  );
  return result;
};

module.exports = {
  createCorpus,
  getCorporaByID,
  addToCorpusBags,
  updateCorpus,
  addBagsByID,
};
