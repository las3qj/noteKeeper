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
} = require("./../services/corpora");
const { controlWrapper, getDifferences } = require("./../services/misc");
const { getBagsAndCorporaByIDs } = require("./../services/common");
const {
  updateAnalysis,
  getAnalysisFuncts,
  getWatchedAnalyses,
  updateAnalyses,
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
    const { toAdd, toRemove } = getDifferences(oldCorpus.bags, bagIDs);
    const [bagsToAdd, bagsToRem] = await Promise.all([
      getBagsByID(toAdd, db),
      getBagsByID(toRemove, db),
    ]);
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
      analysis(updatedBagsTable)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      oldCorpus,
      analysesToRun.names,
      corpusResults
    );
    analysesToRun.names.forEach((name) => {
      updatedAnalyses.analyses[name].watchForUpdates = true;
    });
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
    const updatedBagsTable = addBagsToCorpus(corpus, bagArray);
    const updatedBags = bagArray.map((bag) =>
      addCorporaToBag(bag, corporaArray)
    );

    const analysesToRun = getWatchedAnalyses(corpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const bagResults = analysesResults.map((analysis) => analysis.byBag);
    const updatedCorpAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults
    );
    analysesToRun.names.forEach((name) => {
      updatedCorpAnalyses.analyses[name].watchForUpdates = true;
    });
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
    const analysesToRun = getWatchedAnalyses(corpus);
    const analysesResults = analysesToRun.functs.map((analysis) =>
      analysis(updatedBagsTable)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults
    );
    analysesToRun.names.forEach((name) => {
      updatedAnalyses.analyses[name].watchForUpdates = true;
    });
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
    const { toAdd, toRemove } = getDifferences(corpus.bags, bagIDs);
    const [addBags, removeBags] = await Promise.all([
      getBagsByID(toAdd, db),
      getBagsByID(toRemove, db),
    ]);
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
      analysis(updatedBagsTable)
    );
    const corpusResults = analysesResults.map((analysis) => analysis.corpus);
    const updatedAnalyses = updateAnalyses(
      corpus,
      analysesToRun.names,
      corpusResults
    );
    analysesToRun.names.forEach((name) => {
      updatedAnalyses.analyses[name].watchForUpdates = true;
    });
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
    const { corpusID, name, watchForUpdates } = req.body;
    const corporaArray = await getCorporaByID([corpusID], db);
    const corpus = corporaArray[0];
    const lastEdited =
      corpus.updated !== undefined ? corpus.updated : corpus.created;
    // If no bags or not updated since last analysis, don't run (covers watchingForUpdates)
    if (
      corpus.bags.length === 0 ||
      (corpus.analyses[name] !== undefined &&
        Date.parse(
          corpus.analyses[name].runs[corpus.analyses[name].runs.length - 1]
            .timestamp
        ) > Date.parse(lastEdited))
    ) {
      const updatedCorpus = { analyses: { [name]: {} } };
      updatedCorpus.analyses[name] = {
        runs:
          corpus.analyses[name] === undefined ? [] : corpus.analyses[name].runs,
        watchForUpdates: watchForUpdates === "true",
      };

      await updateCorpus(corpusID, updatedCorpus, db, false);
      res.sendStatus(200);
      return;
    }

    const bagArray = await getBagsByID(corpus.bags, db);
    const functions = getAnalysisFuncts([name]);
    const analysis = functions[0](corpus);
    const updatedCorpus = updateAnalysis(corpus, name, analysis.corpus);
    updatedCorpus.analyses[name].watchForUpdates = watchForUpdates === "true";
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
