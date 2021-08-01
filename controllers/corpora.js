const { getBagsByID } = require("./../services/bagsOfWords");
const { createCorpusTable } = require("./../services/tabling");
const { createCorpus } = require("./../services/corpora");
const { controlWrapper } = require("./../services/misc");
const { addBagsToCorpus } = require("./../services/relationalOps");

const postCorpus = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { name, description, bagIDs } = req.body;
    const bagArray = await getBagsByID(bagIDs, db);
    const table = createCorpusTable(bagArray);
    await createCorpus(name, description, bagIDs, table, db);
    res.sendStatus(200);
  });
};

const addBags = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { corpusID, bagIDs } = req.body;
    await addBagsToCorpus(corpusID, bagIDs, db);
    res.sendStatus(200);
  });
};

module.exports = { postCorpus, addBags };
