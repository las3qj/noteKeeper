const {
  postCorpus,
  getCorpora,
  getCorpus,
  putCorpus,
  deleteCorpus,
} = require("./../database/corpora");
const { parseObjectIDArray, parseObjectID } = require("./misc");
const { updateCorpusTable, addToCorpusTable } = require("./tabling");
const { updateAnalyses } = require("./textAnalysis");

const createCorpus = async (name, description, ids, table, db) => {
  const bags = parseObjectIDArray(ids);
  const corpusDoc = {
    name,
    description,
    bags,
    table,
    analyses: {},
  };
  const result = await postCorpus(corpusDoc, db);
  return result;
};

const deleteCorpusByID = async (corpusID, db) => {
  const objectID = parseObjectID(corpusID);
  const result = await deleteCorpus(objectID, db);
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

const addBagsToCorpus = (corpus, bagArray) => {
  const updatedBags = corpus.bags.slice();
  for (let bag of bagArray) {
    updatedBags.push(bag._id);
  }
  const updatedTable = addToCorpusTable(corpus.table, bagArray);
  return { bags: updatedBags, table: updatedTable };
};

const removeBagsFromCorpus = (corpus, bagIDs, inverseTables) => {
  let table = corpus.table;
  const bags = corpus.bags.slice();
  bagIDs.map((id, index) => {
    bags.splice(
      bags.findIndex((bag) => bag.toString() === id),
      1
    );
    table = updateCorpusTable(table, inverseTables[index], id);
  });
  return { table, bags };
};

const putBagsInCorpus = (
  corpus,
  addBags,
  inverseTables,
  removeIDs,
  updateBagIDs
) => {
  let table = corpus.table;
  inverseTables.forEach((inverseTable, index) => {
    table = updateCorpusTable(table, inverseTable, removeIDs[index]);
  });
  const newTable = addToCorpusTable(table, addBags);
  const bags = parseObjectIDArray(updateBagIDs);

  return { table: newTable, bags };
};

const updateCorpus = async (id, updateAttributes, db, appendDate = true) => {
  const objectID = parseObjectID(id);
  const doc = appendDate
    ? { ...updateAttributes, updated: Date() }
    : updateAttributes;
  const result = await putCorpus(objectID, doc, db);
  return result;
};

const updateCorpora = async (ids, updateAttributesArray, db) => {
  const results = await Promise.all(
    ids.map((id, index) => updateCorpus(id, updateAttributesArray[index], db))
  );
  return results;
};

const updateWatchedAnalyses = (
  corporaArray,
  updatedBagsTables,
  namesArrays,
  analysesResults
) => {
  const updatedCorpora = analysesResults.map((analyses, index) => {
    const corpusResults = analyses.map((analysis) => analysis.corpus);
    const names = namesArrays[index];
    const updatedCorpus = {
      ...updatedBagsTables[index],
      ...updateAnalyses(corporaArray[index], names, corpusResults, "true"),
    };
    return updatedCorpus;
  });
  return updatedCorpora;
};

const checkIfAnalysesRun = (
  corpus,
  name,
  lastEdited,
  watchForUpdates,
  params
) => {
  if (name === "collocates") {
    if (
      corpus.bags.length === 0 ||
      (corpus.analyses[name] !== undefined &&
        corpus.analyses[name][params.title] !== undefined &&
        Date.parse(
          corpus.analyses[name][params.title].runs[
            corpus.analyses[name][params.title].runs.length - 1
          ].timestamp
        )) > Date.parse(lastEdited)
    ) {
      const updatedCorpus = { analyses: { [name]: {}, ...corpus.analyses } };
      if (
        corpus.analyses[name] === undefined ||
        corpus.analyses[name][params.title] === undefined
      ) {
        updatedCorpus.analyses[name][params.title] = {
          terms: params.terms,
          range: params.range,
          stopWords: params.stopWords,
          runs: [],
        };
      }
      updatedCorpus.analyses[name][params.title].watchForUpdates =
        watchForUpdates === "true";
      return updatedCorpus;
    }
  } else {
    if (
      corpus.bags.length === 0 ||
      (corpus.analyses[name] !== undefined &&
        Date.parse(
          corpus.analyses[name].runs[corpus.analyses[name].runs.length - 1]
            .timestamp
        )) > Date.parse(lastEdited)
    ) {
      const updatedCorpus = { analyses: { [name]: {}, ...corpus.analyses } };
      if (corpus.analyses[name] === undefined) {
        updatedCorpus.analyses[name] = { runs: [] };
      }
      updatedCorpus.analyses[name].watchForUpdates = watchForUpdates === "true";
      return updatedCorpus;
    }
  }
  return undefined;
};

module.exports = {
  createCorpus,
  getCorporaByID,
  addBagsToCorpus,
  updateCorpus,
  updateCorpora,
  removeBagsFromCorpus,
  putBagsInCorpus,
  deleteCorpusByID,
  updateWatchedAnalyses,
  checkIfAnalysesRun,
};
