const { postBagOfWords, getBagsOfWords } = require("./../database/bagsOfWords");

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
 * @param {Array <ObjectID>} objectIDs - array of objectIDs corresponding to bagsOfWords
 * @param {MongoDB Database} db - database ref for mongodb
 * @returns Array containing the results of the query (in the form of bagsOfWords objects)
 */
const getBagsByIDs = async (objectIDs, db) => {
  const result = await getBagsOfWords(objectIDs, db);
  return result;
};

module.exports = { createBagOfWords, getBagsByIDs };
