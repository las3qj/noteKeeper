const {
  postBagOfWords,
  getBagsOfWords,
  getBagOfWords,
  putBagOfWords,
} = require("./../database/bagsOfWords");
const { parseObjectIDArray, parseObjectID } = require("./misc");

const createBagOfWords = async (textString, tokens, table, corpora, db) => {
  const noteDoc = {
    textString,
    tokens,
    table,
    corpora,
  };
  const result = await postBagOfWords(noteDoc, db);
  return result;
};

/**
 * Returns an array containing the bagsOfWords corresponding to the given objectIDs
 * @param {Array <String>} ids - array of String objectIDs corresponding to bagsOfWords
 * @param {MongoDB Database} db - database ref for mongodb
 * @returns Array containing the results of the query (in the form of bagsOfWords objects)
 */
const getBagsByID = async (ids, db) => {
  if (ids.length === 0) {
    return [];
  }
  const objectIDArray = parseObjectIDArray(ids);
  let result;
  if (objectIDArray.length > 1) {
    const cursor = await getBagsOfWords(objectIDArray, db);
    result = await cursor.toArray();
  } else {
    result = [await getBagOfWords(objectIDArray[0], db)];
  }
  return result;
};

const addToBagCorpora = (curCorpora, newCorpora) => {
  const updatedCorpora = curCorpora.slice();
  for (let corpus of newCorpora) {
    updatedCorpora.push(corpus._id);
  }
  return updatedCorpora;
};

const updateBag = async (id, updateAttributes, db) => {
  const objectID = parseObjectID(id);
  const result = await putBagOfWords(objectID, updateAttributes, db);
  return result;
};

module.exports = { createBagOfWords, getBagsByID, addToBagCorpora, updateBag };
