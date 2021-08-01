const { getBagsByIDs } = require("./../services/bagsOfWords");
const {
  createCorpusTable,
  addToCorpusTable,
} = require("./../services/tabling");
const { createCorpus, addBagsByID } = require("./../services/corpora");
const { controlWrapper } = require("./../services/misc");

const postCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { name, description, bagIDs } = req.body;
    const bagArray = await getBagsByIDs(bagIDs, db);
    const table = createCorpusTable(bagArray);
    await createCorpus(name, description, bagIDs, table, db);
    res.sendStatus(200);
  });
};

const addBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    await addBagsByID(corpusID, bagIDs);
    res.sendStatus(200);
  });
};

module.exports = { postCorpus, addBags };
