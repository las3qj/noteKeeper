const { getBagsByID } = require("./../services/bagsOfWords");
const { createCorpusTable } = require("./../services/tabling");
const { createCorpus } = require("./../services/corpora");
const { controlWrapper } = require("./../services/misc");
const {
  handleAddBagsToCorpus,
  addCorporaToBags,
  handleRemoveBagsFromCorpus,
} = require("./../services/relationalOps");

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
      await addCorporaToBags(bagArray, [{ _id: corpusID }], db);
    }
    res.sendStatus(200);
  });
};

const addBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    await handleAddBagsToCorpus(corpusID, bagIDs, db);
    res.sendStatus(200);
  });
};

const removeBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    await handleRemoveBagsFromCorpus(corpusID, bagIDs, db);
    res.sendStatus(200);
  });
};

module.exports = { postCorpus, addBags, removeBags };
