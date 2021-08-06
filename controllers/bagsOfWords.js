const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const {
  createNoteTable,
  createInverseTable,
  createDeltaTable,
  updateCorpusTable,
} = require("./../services/tabling");
const {
  createBagOfWords,
  getBagsByID,
  updateBag,
  addCorporaToBag,
  removeCorporaFromBag,
  deleteBagByID,
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
} = require("./../services/corpora");

const postBagOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { filePath } = req.body;
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createNoteTable(tokens);
    const corpora = [];
    await createBagOfWords(textString, tokens, table, corpora, db);
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
    const updatedAddCorpora = addCorpora.map((corpus) =>
      addBagsToCorpus(corpus, [{ _id: oldBag._id, table }])
    );
    const inverseTable = createInverseTable(oldBag.table);
    const updatedRemCorpora = removeCorpora.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    const deltaTable = createDeltaTable(oldBag.table, tableDeepCopy);

    const updatedUpdateCorpora = updateCorp.map((corpus) => {
      const updatedTable = updateCorpusTable(corpus.table, deltaTable, bagID);
      return { table: updatedTable };
    });

    await Promise.all([
      updateBag(bagID, { textString, tokens, table, corpora: corporaOIDs }, db),
      updateCorpora(toAdd, updatedAddCorpora, db),
      updateCorpora(toRemove, updatedRemCorpora, db),
      updateCorpora(unChanged, updatedUpdateCorpora, db),
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
    const updatedCorpora = corporaArray.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
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
      const deltaTable = createDeltaTable(oldBag.table, tableDeepCopy);
      const corporaArray = await getCorporaByID(oldBag.corpora, db);
      const updatedCorpora = corporaArray.map((corpus) => {
        const table = updateCorpusTable(corpus.table, deltaTable, bagID);
        return { table };
      });
      await Promise.all([
        updateCorpora(oldBag.corpora, updatedCorpora, db),
        updateBag(bagID, { textString, tokens, table }, db),
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
    const newCorpora = corporaArray.map((corpus) =>
      addBagsToCorpus(corpus, bagArray)
    );
    const newBag = addCorporaToBag(bagArray[0], corporaArray);
    await Promise.all([
      updateCorpora(corporaIDs, newCorpora, db),
      updateBag(bagID, newBag, db),
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
    const bag = bagArray[0];
    const inverseTable = createInverseTable(bag.table);
    const updatedBag = removeCorporaFromBag(bag, corporaIDs);
    const updatedCorpora = corporaArray.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    await Promise.all([
      updateBag(bagID, updatedBag, db),
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

    const corporaOIDs = parseObjectIDArray(corporaIDs);
    const updatedAddCorpora = addCorpora.map((corpus) =>
      addBagsToCorpus(corpus, [bag])
    );
    const inverseTable = createInverseTable(bag.table);
    const updatedRemCorpora = removeCorpora.map((corpus) =>
      removeBagsFromCorpus(corpus, [bagID], [inverseTable])
    );
    await Promise.all([
      updateBag(bagID, { corpora: corporaOIDs }, db),
      updateCorpora(toAdd, updatedAddCorpora, db),
      updateCorpora(toRemove, updatedRemCorpora, db),
    ]);
    res.sendStatus(200);
  });
};

module.exports = {
  postBagOfWords,
  getBagsOfWords,
  addCorpora,
  updateText,
  removeCorpora,
  putCorpora,
  putBagOfWords,
  deleteBagOfWords,
  getCorpora,
};
