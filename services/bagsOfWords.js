const {
  postBagOfWords,
  getBagsOfWords,
  getBagOfWords,
  putBagOfWords,
  deleteBagOfWords,
} = require("./../database/bagsOfWords");
const { parseObjectIDArray, parseObjectID } = require("./misc");
const { updateAnalyses } = require("./textAnalysis");

const postBagsofWords = async (bagDocs, db) => {
  const results = await Promise.all(
    bagDocs.map((bagDoc) => postBagOfWords(bagDoc, db))
  );
  const ids = results.map((result) => result.insertedId);
  return ids;
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

const updateBag = async (id, updateAttributes, db, appendDate = true) => {
  const objectID = parseObjectID(id);
  const doc = appendDate
    ? { ...updateAttributes, updated: Date() }
    : updateAttributes;
  const result = await putBagOfWords(objectID, doc, db);
  return result;
};

const updateBags = async (
  ids,
  updateAttributesArray,
  db,
  appendDate = true
) => {
  const result = await Promise.all(
    ids.map((id, index) =>
      updateBag(id, updateAttributesArray[index], db, appendDate)
    )
  );
  return result;
};

const getBagsCollocatesToUpdate = (bag, byBag, lastEdited) => {
  let collocates = bag.analyses.collocates;
  const analyses = byBag[bag._id.toString()];
  const result = {};
  if (collocates === undefined) {
    return analyses;
  }
  for (title in analyses) {
    if (
      collocates[title] === undefined ||
      lastEdited >=
        Date.parse(
          collocates[title].runs[collocates[title].runs.length - 1].timestamp
        )
    ) {
      result[title] = analyses[title];
    }
  }
  return result;
};

const updateBagsAnalyses = (bagsArray, names, byBag) => {
  const updatedBagMap = {};
  bagsArray.forEach(({ _id, analyses, updated, created }) => {
    const lastEdited =
      updated !== undefined ? Date.parse(updated) : Date.parse(created);
    const namesArray = [];
    const analysesArray = [];
    names.forEach((name, index) => {
      if (name === "collocates") {
        const collocs = getBagsCollocatesToUpdate(
          { _id, analyses },
          byBag[index],
          lastEdited
        );
        namesArray.push(name);
        analysesArray.push(collocs);
      } else if (
        analyses[name] === undefined ||
        lastEdited >=
          Date.parse(
            analyses[name].runs[analyses[name].runs.length - 1].timestamp
          )
      ) {
        namesArray.push(name);
        analysesArray.push(byBag[index][_id.toString()]);
      }
    });
    if (namesArray.length > 0) {
      const updatedBag = updateAnalyses(
        { analyses },
        namesArray,
        analysesArray
      );
      updatedBagMap[_id.toString()] = updatedBag;
    }
  });
  return updatedBagMap;
};

module.exports = {
  postBagsofWords,
  getBagsByID,
  addCorporaToBag,
  removeCorporaFromBag,
  updateBag,
  updateBags,
  deleteBagByID,
  updateBagsAnalyses,
};
