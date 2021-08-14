const {
  getBagsByID,
  addCorporaToBag,
  updateBags,
  removeCorporaFromBag,
  updateBagsAnalyses,
} = require("./../services/bagsOfWords");
const {
  createCorpusTable,
  createInverseTable,
} = require("./../services/tabling");
const {
  createCorpus,
  addBagsToCorpus,
  updateCorpus,
  getCorporaByID,
  removeBagsFromCorpus,
  putBagsInCorpus,
  deleteCorpusByID,
  checkIfAnalysesRun,
} = require("./../services/corpora");
const { controlWrapper, getDifferences } = require("./../services/misc");
const { getBagsAndCorporaByIDs } = require("./../services/common");
const {
  updateAnalysis,
  getWatchedAnalyses,
  updateAnalyses,
  getAnalysisFunct,
} = require("./../services/textAnalysis");

const getCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const ids = req.query.ids;
    const result = await getCorporaByID(ids, db);
    res.status(200);
    res.json({ data: result });
  });
};

const postCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { name, description, bagIDs } = req.body;
    let table = {};
    let bagArray = [];
    if (bagIDs.length > 0) {
      bagArray = await getBagsByID(bagIDs, db);
      table = createCorpusTable(bagArray);
    }
    const result = await createCorpus(name, description, bagIDs, table, db);
    if (bagIDs.length > 0) {
      const corpusID = result.insertedId;
      const updatedBags = bagArray.map((bag) =>
        addCorporaToBag(bag, [{ _id: corpusID }])
      );
      await updateBags(bagIDs, updatedBags, db, false);
    }
    res.sendStatus(200);
  });
};

const deleteCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID } = req.body;
    const corporaArray = await getCorporaByID([corpusID], db);
    const bagIDs = corporaArray[0].bags;
    const bagArray = await getBagsByID(bagIDs, db);
    const updatedBags = bagArray.map((bag) =>
      removeCorporaFromBag(bag, [corpusID])
    );
    await Promise.all([
      updateBags(bagIDs, updatedBags, db, false),
      deleteCorpusByID(corpusID, db),
    ]);
    res.sendStatus(200);
  });
};

const putCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, name, description, bagIDs } = req.body;
    const corporaArray = await getCorporaByID([corpusID], db);
    const oldCorpus = corporaArray[0];
    const { toAdd, toRemove, unChanged } = getDifferences(
      oldCorpus.bags,
      bagIDs
    );
    const [bagsToAdd, bagsToRem, unchangedBags] = await Promise.all([
      getBagsByID(toAdd, db),
      getBagsByID(toRemove, db),
      getBagsByID(unChanged, db),
    ]);
    const newBags = unchangedBags.concat(bagsToAdd);
    const updatedRemBags = [];
    const inverseTables = [];
    for (let bag of bagsToRem) {
      updatedRemBags.push(removeCorporaFromBag(bag, [corpusID]));
      inverseTables.push(createInverseTable(bag.table));
    }
    const updatedAddBags = bagsToAdd.map((bag) =>
      addCorporaToBag(bag, corporaArray)
    );
    const corpusAfterRem = removeBagsFromCorpus(
      oldCorpus,
      toRemove,
      inverseTables
    );
    const updatedBagsTable = addBagsToCorpus(corpusAfterRem, bagsToAdd);
    const analysesToRun = getWatchedAnalyses(oldCorpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable, newBags)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      oldCorpus,
      analysesToRun.names,
      corpusResults,
      "true"
    );
    const updatedCorpus = { ...updatedBagsTable, ...updatedAnalyses };
    const bagResults = analysesResults.map((analysis) => analysis.byBag);
    const addBagAnalysesMap = updateBagsAnalyses(
      bagsToAdd,
      analysesToRun.names,
      bagResults
    );
    toAdd.map((id, index) => {
      const addBagAnalyses = addBagAnalysesMap[id];
      if (addBagAnalysesMap[id] !== undefined) {
        updatedAddBags[index] = { ...updatedAddBags[index], ...addBagAnalyses };
      }
    });
    await Promise.all([
      updateCorpus(corpusID, { ...updatedCorpus, name, description }, db),
      updateBags(toAdd, updatedAddBags, db, false),
      updateBags(toRemove, updatedRemBags, db, false),
    ]);
    res.sendStatus(200);
  });
};

const getBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const id = req.query.id;
    const corpora = await getCorporaByID([id], db);
    const bags = corpora[0].bags;
    const bagArray = await getBagsByID(bags, db);
    res.status(200);
    res.json({ data: bagArray });
  });
};

const addBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
      bagIDs,
      [corpusID],
      db
    );
    const corpus = corporaArray[0];
    const currentBags = await getBagsByID(corpus.bags, db);
    const allBags = currentBags.concat(bagArray);
    const updatedBagsTable = addBagsToCorpus(corpus, bagArray);
    const updatedBags = bagArray.map((bag) =>
      addCorporaToBag(bag, corporaArray)
    );

    const analysesToRun = getWatchedAnalyses(corpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable, allBags)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const bagResults = analysesResults.map((analysis) => analysis.byBag);
    const updatedCorpAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults,
      "true"
    );
    const updatedCorpus = { ...updatedBagsTable, ...updatedCorpAnalyses };

    const updatedBagMap = updateBagsAnalyses(
      bagArray,
      analysesToRun.names,
      bagResults
    );
    bagIDs.forEach((bagID, index) => {
      const updatedAnalysis = updatedBagMap[bagID];
      if (updatedAnalysis !== undefined) {
        updatedBags[index] = {
          ...updatedBags[index],
          ...updatedAnalysis,
        };
      }
    });
    await Promise.all([
      updateCorpus(corpusID, updatedCorpus, db),
      updateBags(bagIDs, updatedBags, db, false),
    ]);
    res.sendStatus(200);
  });
};

const removeBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
      bagIDs,
      [corpusID],
      db
    );
    const corpus = corporaArray[0];
    const updatedBags = [];
    const inverseTables = [];
    for (let bag of bagArray) {
      updatedBags.push(removeCorporaFromBag(bag, [corpusID]));
      inverseTables.push(createInverseTable(bag.table));
    }
    const updatedBagsTable = removeBagsFromCorpus(
      corpus,
      bagIDs,
      inverseTables
    );
    const remainingBags = await getBagsByID(updatedBagsTable.bags, db);
    const analysesToRun = getWatchedAnalyses(corpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable, remainingBags)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults,
      "true"
    );
    const updatedCorpus = { ...updatedBagsTable, ...updatedAnalyses };
    await Promise.all([
      updateBags(bagIDs, updatedBags, db, false),
      updateCorpus(corpusID, updatedCorpus, db),
    ]);
    res.sendStatus(200);
  });
};

const putBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    const corporaArray = await getCorporaByID([corpusID], db);
    const corpus = corporaArray[0];
    const { toAdd, toRemove, unChanged } = getDifferences(corpus.bags, bagIDs);
    const [addBags, removeBags, unchangedBags] = await Promise.all([
      getBagsByID(toAdd, db),
      getBagsByID(toRemove, db),
      getBagsByID(unChanged, db),
    ]);
    const newBags = unchangedBags.concat(addBags);
    const inverseTables = removeBags.map((bag) =>
      createInverseTable(bag.table)
    );

    const updatedBagsTable = putBagsInCorpus(
      corpus,
      addBags,
      inverseTables,
      toRemove,
      bagIDs
    );
    const analysesToRun = getWatchedAnalyses(corpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable, newBags)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults,
      "true"
    );
    const updatedCorpus = { ...updatedBagsTable, ...updatedAnalyses };

    const updatedRemBags = removeBags.map((bag) =>
      removeCorporaFromBag(bag, [corpusID])
    );
    const updatedAddBags = addBags.map((bag) =>
      addCorporaToBag(bag, corporaArray)
    );
    const bagResults = analysesResults.map((analysis) => analysis.byBag);
    const addBagAnalysesMap = updateBagsAnalyses(
      addBags,
      analysesToRun.names,
      bagResults
    );
    toAdd.map((id, index) => {
      const addBagAnalyses = addBagAnalysesMap[id];
      if (addBagAnalysesMap[id] !== undefined) {
        updatedAddBags[index] = { ...updatedAddBags[index], ...addBagAnalyses };
      }
    });
    await Promise.all([
      updateCorpus(corpusID, updatedCorpus, db),
      updateBags(toAdd, updatedAddBags, db, false),
      updateBags(toRemove, updatedRemBags, db, false),
    ]);
    res.sendStatus(200);
  });
};

const runAnalysis = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, name, watchForUpdates, params } = req.body;
    const corporaArray = await getCorporaByID([corpusID], db);
    const corpus = corporaArray[0];

    const bagArray = await getBagsByID(corpus.bags, db);
    const lastEdited =
      corpus.updated !== undefined ? corpus.updated : corpus.created;
    // If no bags or not updated since last analysis, don't run (covers watchingForUpdates)
    const dryUpdate = checkIfAnalysesRun(
      corpus,
      name,
      lastEdited,
      watchForUpdates,
      params
    );
    if (dryUpdate !== undefined) {
      await updateCorpus(corpusID, dryUpdate, db, false);
      res.sendStatus(200);
      return;
    }
    // If existing collocates run, pull params from corp object
    let collocParams = params;
    if (
      name === "collocates" &&
      corpus.analyses.collocates !== undefined &&
      corpus.analyses.collocates[params.title] !== undefined
    ) {
      collocParams = {
        title: params.title,
        terms: corpus.analyses.collocates[params.title].terms,
        stopWords: corpus.analyses.collocates[params.title].stopWords,
        range: corpus.analyses.collocates[params.title].range,
      };
    }
    const funct = getAnalysisFunct(name);
    const analysis = funct(corpus, bagArray, collocParams);
    const updatedCorpus = updateAnalysis(
      corpus,
      name,
      analysis.corpus,
      watchForUpdates,
      [collocParams]
    );
    const updatedBagMap = updateBagsAnalyses(
      bagArray,
      [name],
      [analysis.byBag]
    );
    await Promise.all([
      updateCorpus(corpusID, updatedCorpus, db, false),
      updateBags(
        Object.keys(updatedBagMap),
        Object.values(updatedBagMap),
        db,
        false
      ),
    ]);
    res.sendStatus(200);
  });
};

module.exports = {
  postCorpus,
  addBags,
  removeBags,
  putBags,
  putCorpus,
  deleteCorpus,
  getCorpora,
  getBags,
  runAnalysis,
};
