const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const {
  createNoteTable,
  createInverseTable,
  createDeltaTable,
  updateCorpusTable,
} = require("./../services/tabling");
const {
  postBagsofWords,
  getBagsByID,
  updateBag,
  addCorporaToBag,
  removeCorporaFromBag,
  deleteBagByID,
  updateBags,
  updateBagsAnalyses,
} = require("./../services/bagsOfWords");
const {
  controlWrapper,
  getDifferences,
  parseObjectIDArray,
} = require("./../services/misc");
const { getBagsAndCorporaByIDs } = require("./../services/common");
const {
  addBagsToCorpus,
  updateCorpora,
  removeBagsFromCorpus,
  getCorporaByID,
  updateWatchedAnalyses,
} = require("./../services/corpora");
const {
  getWatchedAnalyses,
  updateAnalyses,
  consolidateByBags,
} = require("../services/textAnalysis");

const postBagsOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { filePaths, corporaIDs } = req.body;
    const textStringArray = filePaths.map((filePath) => parseTxtFile(filePath));
    const tokensArray = textStringArray.map((textString) =>
      tokenize(textString)
    );
    const tableArray = tokensArray.map((tokens) => createNoteTable(tokens));
    const corporaOIDs = parseObjectIDArray(corporaIDs);
    const bagDocs = textStringArray.map((textString, index) => {
      return {
        textString,
        tokens: tokensArray[index],
        table: tableArray[index],
        corpora: corporaOIDs,
        analyses: {},
      };
    });
    const postedIDs = await postBagsofWords(bagDocs, db);
    const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
      postedIDs,
      corporaOIDs,
      db
    );
    const postedIDStrings = postedIDs.map((oID) => oID.toString());
    const updatedBagsTables = corporaArray.map((corpus) =>
      addBagsToCorpus(corpus, bagArray)
    );
    const corporaBags = await Promise.all(
      updatedBagsTables.map(async (corpus) => {
        const res = await getBagsByID(corpus.bags, db);
        return res;
      })
    );
    const analysesToRun = corporaArray.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const analysesResults = analysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedBagsTables[index], corporaBags[index])
      )
    );
    const namesArrays = analysesToRun.map((analyses) => analyses.names);
    const updatedCorpora = updateWatchedAnalyses(
      corporaArray,
      updatedBagsTables,
      namesArrays,
      analysesResults
    );
    const byBagsArrays = analysesResults.map((analyses) =>
      analyses.map((analysis) => analysis.byBag)
    );
    const { names, byBags } = consolidateByBags(
      namesArrays,
      byBagsArrays,
      postedIDStrings
    );
    const updatedBagsMap = updateBagsAnalyses(bagArray, names, byBags);

    await Promise.all([
      updateBags(
        Object.keys(updatedBagsMap),
        Object.values(updatedBagsMap),
        db,
        false
      ),
      updateCorpora(corporaOIDs, updatedCorpora, db),
    ]);
    res.sendStatus(200);
  });
};

const getBagsOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const ids = req.query.ids;
    const result = await getBagsByID(ids, db);
    res.status(200);
    res.json({ data: result });
  });
};

const putBagOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, filePath, corporaIDs } = req.body;
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createNoteTable(tokens);
    const tableDeepCopy = JSON.parse(JSON.stringify(table));
    const oldBags = await getBagsByID([bagID], db);
    const oldBag = oldBags[0];
    const { toAdd, toRemove, unChanged } = getDifferences(
      oldBag.corpora,
      corporaIDs
    );
    const [addCorpora, removeCorpora, updateCorp] = await Promise.all([
      getCorporaByID(toAdd, db),
      getCorporaByID(toRemove, db),
      getCorporaByID(unChanged, db),
    ]);
    const corporaOIDs = parseObjectIDArray(corporaIDs);
    const updatedBagText = { textString, tokens, table, corpora: corporaOIDs };
    // Update bags and tables of added corpora
    const updatedAddBagsTables = addCorpora.map((corpus) =>
      addBagsToCorpus(corpus, [{ _id: oldBag._id, table }])
    );
    // Update bags and tables of removed corpora
    const inverseTable = createInverseTable(oldBag.table);
    const updatedRemBagsTables = removeCorpora.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    // Update tables of updated corpora
    const deltaTable = createDeltaTable(oldBag.table, tableDeepCopy);
    const updatedUpdTables = updateCorp.map((corpus) => {
      const updatedTable = updateCorpusTable(corpus.table, deltaTable, bagID);
      return { table: updatedTable, bags: corpus.bags };
    });
    // Get bags of corpora to update collocate analyses
    const [addCorpBags, remCorpBags, updCorpBags] = await Promise.all([
      Promise.all(
        updatedAddBagsTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          res[res.findIndex((bag) => bag._id.toString() === bagID)] = {
            ...updatedBagText,
            _id: bagID,
          };
          return res;
        })
      ),
      Promise.all(
        updatedRemBagsTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          return res;
        })
      ),
      Promise.all(
        updatedUpdTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          res[res.findIndex((bag) => bag._id.toString() === bagID)] = {
            ...updatedBagText,
            _id: bagID,
          };
          return res;
        })
      ),
    ]);
    // Running watched analyses of added corpora
    const addAnalysesToRun = addCorpora.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const addAnalysesResults = addAnalysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedAddBagsTables[index], addCorpBags[index])
      )
    );
    const addNamesArrays = addAnalysesToRun.map((analyses) => analyses.names);
    const updatedAddCorpora = updateWatchedAnalyses(
      addCorpora,
      updatedAddBagsTables,
      addNamesArrays,
      addAnalysesResults
    );
    // Running watched analyses of removed corpora
    const remAnalysesToRun = removeCorpora.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const remNamesArrays = remAnalysesToRun.map((analyses) => analyses.names);
    const remAnalysesResults = remAnalysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedRemBagsTables[index], remCorpBags[index])
      )
    );
    const updatedRemCorpora = updateWatchedAnalyses(
      removeCorpora,
      updatedRemBagsTables,
      remNamesArrays,
      remAnalysesResults
    );
    // Running watched analyses of updated corpora
    const updAnalysesToRun = updateCorp.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const updAnalysesResults = updAnalysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedUpdTables[index], updCorpBags[index])
      )
    );
    const updNamesArrays = updAnalysesToRun.map((analyses) => analyses.names);
    const updatedUpdCorpora = updateWatchedAnalyses(
      updateCorp,
      updatedUpdTables,
      updNamesArrays,
      updAnalysesResults
    );
    // Updating bag analyses
    const addByBagsArrays = addAnalysesResults.map((analyses) =>
      analyses.map((analysis) => analysis.byBag)
    );
    const updByBagsArrays = updAnalysesResults.map((analyses) =>
      analyses.map((analysis) => analysis.byBag)
    );
    const { names, byBags } = consolidateByBags(
      addNamesArrays.concat(updNamesArrays),
      addByBagsArrays.concat(updByBagsArrays),
      [bagID]
    );
    const updatedBagsMap = updateBagsAnalyses(
      [{ ...oldBag, updated: Date() }],
      names,
      byBags
    );
    const updatedBag = { ...updatedBagText, ...updatedBagsMap[bagID] };

    await Promise.all([
      updateBag(bagID, updatedBag, db),
      updateCorpora(toAdd, updatedAddCorpora, db),
      updateCorpora(toRemove, updatedRemCorpora, db),
      updateCorpora(unChanged, updatedUpdCorpora, db),
    ]);
    res.sendStatus(200);
  });
};

const deleteBagOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID } = req.body;
    const bagArray = await getBagsByID([bagID], db);
    const bag = bagArray[0];
    const corporaIDs = bag.corpora;
    const corporaArray = await getCorporaByID(corporaIDs, db);

    const inverseTable = createInverseTable(bag.table);
    const updatedBagsTables = corporaArray.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    const corporaBags = await Promise.all(
      updatedBagsTables.map(async (corpus) => {
        const res = await getBagsByID(corpus.bags, db);
        return res;
      })
    );
    const analysesToRun = corporaArray.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const analysesResults = analysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedBagsTables[index], corporaBags[index])
      )
    );
    const namesArrays = analysesToRun.map((analyses) => analyses.names);
    const updatedCorpora = updateWatchedAnalyses(
      corporaArray,
      updatedBagsTables,
      namesArrays,
      analysesResults
    );
    await Promise.all([
      updateCorpora(corporaIDs, updatedCorpora, db),
      deleteBagByID(bagID, db),
    ]);
    res.sendStatus(200);
  });
};

const updateText = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, filePath } = req.body;
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createNoteTable(tokens);
    const tableDeepCopy = JSON.parse(JSON.stringify(table));
    const oldBags = await getBagsByID([bagID], db);
    const oldBag = oldBags[0];
    if (oldBag.corpora.length > 0) {
      // Updating corpora bags and tables
      const deltaTable = createDeltaTable(oldBag.table, tableDeepCopy);
      const corporaArray = await getCorporaByID(oldBag.corpora, db);
      const updatedBagsTables = corporaArray.map((corpus) => {
        const table = updateCorpusTable(corpus.table, deltaTable, bagID);
        return { table, bags: corpus.bags };
      });
      const updatedBagText = { textString, tokens, table };
      const corporaBags = await Promise.all(
        updatedBagsTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          res[res.findIndex((bag) => bag._id.toString() === bagID)] = {
            ...updatedBagText,
            _id: bagID,
          };
          return res;
        })
      );
      // Running watched analyses of updated corpora
      const analysesToRun = corporaArray.map((corpus) =>
        getWatchedAnalyses(corpus)
      );
      const analysesResults = analysesToRun.map((analyses, index) =>
        analyses.functs.map((analysis) =>
          analysis(updatedBagsTables[index], corporaBags[index])
        )
      );
      const namesArrays = analysesToRun.map((analyses) => analyses.names);
      const updatedCorpora = updateWatchedAnalyses(
        corporaArray,
        updatedBagsTables,
        namesArrays,
        analysesResults
      );
      // Saving analyses results to updated bag
      const byBagsArrays = analysesResults.map((analyses) =>
        analyses.map((analysis) => analysis.byBag)
      );
      const { names, byBags } = consolidateByBags(namesArrays, byBagsArrays, [
        bagID,
      ]);
      const updatedBagsMap = updateBagsAnalyses(
        [{ ...oldBag, updated: Date() }],
        names,
        byBags
      );
      const updatedBag = { ...updatedBagText, ...updatedBagsMap[bagID] };
      await Promise.all([
        updateCorpora(oldBag.corpora, updatedCorpora, db),
        updateBag(bagID, updatedBag, db),
      ]);
    } else {
      await updateBag(bagID, { textString, tokens, table }, db);
    }
    res.sendStatus(200);
  });
};

const getCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const id = req.query.id;
    const bags = await getBagsByID([id], db);
    const corpora = bags[0].corpora;
    const corporaArray = await getCorporaByID(corpora, db);
    res.status(200);
    res.json({ data: corporaArray });
  });
};

const addCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, corporaIDs } = req.body;
    const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
      [bagID],
      corporaIDs,
      db
    );
    // Updating bags and tables of added corpora
    const updatedBagsTables = corporaArray.map((corpus) =>
      addBagsToCorpus(corpus, bagArray)
    );
    const corporaBags = await Promise.all(
      updatedBagsTables.map(async (corpus) => {
        const res = await getBagsByID(corpus.bags, db);
        return res;
      })
    );
    const updatedBagCorpora = addCorporaToBag(bagArray[0], corporaArray);
    // Running watched analyses of added corpora
    const analysesToRun = corporaArray.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const analysesResults = analysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedBagsTables[index], corporaBags[index])
      )
    );
    const namesArrays = analysesToRun.map((analyses) => analyses.names);
    const updatedCorpora = updateWatchedAnalyses(
      corporaArray,
      updatedBagsTables,
      namesArrays,
      analysesResults
    );
    // Adding analyses results to bag object
    const byBagsArrays = analysesResults.map((analyses) =>
      analyses.map((analysis) => analysis.byBag)
    );
    const { names, byBags } = consolidateByBags(namesArrays, byBagsArrays, [
      bagID,
    ]);
    const updatedBagsMap = updateBagsAnalyses(bagArray, names, byBags);
    const updatedBag = { ...updatedBagCorpora, ...updatedBagsMap[bagID] };

    await Promise.all([
      updateCorpora(corporaIDs, updatedCorpora, db),
      updateBag(bagID, updatedBag, db, false),
    ]);
    res.sendStatus(200);
  });
};

const removeCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, corporaIDs } = req.body;
    const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
      [bagID],
      corporaIDs,
      db
    );
    // Updating removed corpora bags and tables
    const bag = bagArray[0];
    const inverseTable = createInverseTable(bag.table);
    const updatedBag = removeCorporaFromBag(bag, corporaIDs);
    const updatedBagsTables = corporaArray.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    const corporaBags = await Promise.all(
      updatedBagsTables.map(async (corpus) => {
        const res = await getBagsByID(corpus.bags, db);
        return res;
      })
    );
    // Running watched analyses of removed corpora
    const analysesToRun = corporaArray.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const namesArrays = analysesToRun.map((analyses) => analyses.names);
    const analysesResults = analysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedBagsTables[index], corporaBags[index])
      )
    );
    const updatedCorpora = updateWatchedAnalyses(
      corporaArray,
      updatedBagsTables,
      namesArrays,
      analysesResults
    );

    await Promise.all([
      updateBag(bagID, updatedBag, db, false),
      updateCorpora(corporaIDs, updatedCorpora, db),
    ]);
    res.sendStatus(200);
  });
};

const putCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, corporaIDs } = req.body;
    const bagArray = await getBagsByID([bagID], db);
    const bag = bagArray[0];
    const { toAdd, toRemove } = getDifferences(bag.corpora, corporaIDs);
    const [addCorpora, removeCorpora] = await Promise.all([
      getCorporaByID(toAdd, db),
      getCorporaByID(toRemove, db),
    ]);
    // Updating bags and tables of added and removed corpora
    const corporaOIDs = parseObjectIDArray(corporaIDs);
    const updatedAddBagsTables = addCorpora.map((corpus) =>
      addBagsToCorpus(corpus, [bag])
    );
    const inverseTable = createInverseTable(bag.table);
    const updatedRemBagsTables = removeCorpora.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    const updatedBagCorpora = { corpora: corporaOIDs };
    // Get bags of corpora to update collocate analyses
    const [addCorpBags, remCorpBags] = await Promise.all([
      Promise.all(
        updatedAddBagsTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          return res;
        })
      ),
      Promise.all(
        updatedRemBagsTables.map(async (corpus) => {
          const res = await getBagsByID(corpus.bags, db);
          return res;
        })
      ),
    ]);
    // Running watched analyses of removed corproa
    const remAnalysesToRun = removeCorpora.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const remNamesArrays = remAnalysesToRun.map((analyses) => analyses.names);
    const remAnalysesResults = remAnalysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedRemBagsTables[index], remCorpBags[index])
      )
    );
    const updatedRemCorpora = updateWatchedAnalyses(
      removeCorpora,
      updatedRemBagsTables,
      remNamesArrays,
      remAnalysesResults
    );
    // Running watched analyses of added corpora
    const addAnalysesToRun = addCorpora.map((corpus) =>
      getWatchedAnalyses(corpus)
    );
    const addAnalysesResults = addAnalysesToRun.map((analyses, index) =>
      analyses.functs.map((analysis) =>
        analysis(updatedAddBagsTables[index], addCorpBags[index])
      )
    );
    const addNamesArrays = addAnalysesToRun.map((analyses) => analyses.names);

    const updatedAddCorpora = updateWatchedAnalyses(
      addCorpora,
      updatedAddBagsTables,
      addNamesArrays,
      addAnalysesResults
    );
    // Updating bag analyses
    const byBagsArrays = addAnalysesResults.map((analyses) =>
      analyses.map((analysis) => analysis.byBag)
    );
    const { names, byBags } = consolidateByBags(addNamesArrays, byBagsArrays, [
      bagID,
    ]);
    const updatedBagsMap = updateBagsAnalyses(bagArray, names, byBags);
    const updatedBag = { ...updatedBagCorpora, ...updatedBagsMap[bagID] };

    await Promise.all([
      updateBag(bagID, updatedBag, db, false),
      updateCorpora(toAdd, updatedAddCorpora, db),
      updateCorpora(toRemove, updatedRemCorpora, db),
    ]);
    res.sendStatus(200);
  });
};

module.exports = {
  postBagsOfWords,
  getBagsOfWords,
  addCorpora,
  updateText,
  removeCorpora,
  putCorpora,
  putBagOfWords,
  deleteBagOfWords,
  getCorpora,
};
