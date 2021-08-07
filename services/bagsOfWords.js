const {
  postBagOfWords,
  getBagsOfWords,
  getBagOfWords,
  putBagOfWords,
  deleteBagOfWords,
} = require("./../database/bagsOfWords");
const { parseObjectIDArray, parseObjectID } = require("./misc");

const postBagsofWords = async (bagDocs, db) => {
  const results = Promise.all(
    bagDocs.map((bagDoc) => postBagOfWords(bagDoc, db))
  );
  return results;
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

const deleteBagByID = async (bagID, db) => {
  const objectID = parseObjectID(bagID);
  const result = await deleteBagOfWords(objectID, db);
  return result;
};

const addCorporaToBag = (bag, corpora) => {
  const updatedCorpora = bag.corpora.slice();
  for (let corpus of corpora) {
    updatedCorpora.push(corpus._id);
  }
  return { corpora: updatedCorpora };
};

const removeCorporaFromBag = (bag, corporaIDs) => {
  const updatedCorpora = bag.corpora.filter(
    (corpusOID) => !corporaIDs.includes(corpusOID.toString())
  );
  return { corpora: updatedCorpora };
};

const updateBag = async (id, updateAttributes, db) => {
  const objectID = parseObjectID(id);
  const result = await putBagOfWords(objectID, updateAttributes, db);
  return result;
};

const updateBags = async (ids, updateAttributesArray, db) => {
  const result = await Promise.all(
    ids.map((id, index) => updateBag(id, updateAttributesArray[index], db))
  );
  return result;
};

module.exports = {
  postBagsofWords,
  getBagsByID,
  addCorporaToBag,
  removeCorporaFromBag,
  updateBag,
  updateBags,
  deleteBagByID,
};
