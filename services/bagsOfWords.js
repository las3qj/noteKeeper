const { postBagOfWords, getBagsOfWords } = require("./../database/bagsOfWords");
const { parseObjectIDArray } = require("./misc");

const createBagOfWords = async (textString, tokens, table, db) => {
  const noteDoc = {
    textString,
    tokens,
    table,
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
const getBagsByIDs = async (ids, db) => {
  const objectIDArray = parseObjectIDArray(ids);
  const cursor = await getBagsOfWords(objectIDArray, db);
  const result = await cursor.toArray();
  return result;
};

module.exports = { createBagOfWords, getBagsByIDs };
