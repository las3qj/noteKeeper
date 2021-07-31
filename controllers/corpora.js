const { getBagsByIDs } = require("./../services/bagsOfWords");
const { createCorpusTable } = require("./../services/tabling");
const { createCorpus } = require("./../services/corpora");
const { getClient, getDB } = require("./../database/database");

const postCorpus = async (req, res) => {
  const client = getClient();
  try {
    await client.connect();
    const { name, description, bagIDs } = req.body;
    const db = getDB(client);
    const bagArray = await getBagsByIDs(bagIDs, db);
    const table = createCorpusTable(bagArray);
    await createCorpus(name, description, bagIDs, table, db);
    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  } finally {
    await client.close();
  }
};

module.exports = { postCorpus };
