const {
  getBagsByID,
  addCorporaToBag,
  updateBags,
  removeCorporaFromBag,
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
} = require("./../services/corpora");
const { controlWrapper, getDifferences } = require("./../services/misc");
const { getBagsAndCorporaByIDs } = require("./../services/common");

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
      await updateBags(bagIDs, updatedBags, db);
    }
    res.sendStatus(200);
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
    const newCorpus = addBagsToCorpus(corporaArray[0], bagArray);
    const newBags = bagArray.map((bag) => addCorporaToBag(bag, corporaArray));
    await Promise.all([
      updateCorpus(corpusID, newCorpus, db),
      updateBags(bagIDs, newBags, db),
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
    const updatedCorpus = removeBagsFromCorpus(corpus, bagIDs, inverseTables);
    await Promise.all([
      updateBags(bagIDs, updatedBags, db),
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

    const updatedCorpus = putBagsInCorpus(
      corpus,
      addBags,
      inverseTables,
      toRemove,
      bagIDs
    );
    const updatedAddBags = addBags.map((bag) =>
      addCorporaToBag(bag, corporaArray)
    );
    const updatedRemBags = removeBags.map((bag) =>
      removeCorporaFromBag(bag, [corpusID])
    );
    await Promise.all([
      updateCorpus(corpusID, updatedCorpus, db),
      updateBags(toAdd, updatedAddBags, db),
      updateBags(toRemove, updatedRemBags, db),
    ]);
    res.sendStatus(200);
  });
};

/*
const putCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, updatedCorpus } = req.body;
    await handlePutCorpus(corpusID, updatedCorpus, db);
    res.sendStatus(200);
  });
};*/

module.exports = { postCorpus, addBags, removeBags, putBags };
