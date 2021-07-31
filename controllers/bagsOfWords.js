const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const { createNoteTable } = require("./../services/tabling");
const { createBagOfWords, getBagsByIDs } = require("./../services/bagsOfWords");
const { getClient, getDB } = require("./../database/database");
const { parseObjectIDArray } = require("./../services/misc");

const postBagOfWords = async (req, res) => {
  const client = getClient();
  try {
    await client.connect();
    const { filePath } = req.body;
    const db = getDB(client);
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createNoteTable(tokens);
    await createBagOfWords(textString, tokens, table, db);
    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  } finally {
    await client.close();
  }
};

const getBagsOfWords = async (req, res) => {
  const client = getClient();
  try {
    await client.connect();
    const db = getDB(client);
    const ids = req.query.ids;
    const objectIDArray = parseObjectIDArray(ids);
    const result = await getBagsByIDs(objectIDArray, db);
    const resArray = await result.toArray();
    res.status(200);
    res.json({ data: resArray });
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  } finally {
    await client.close();
  }
};

module.exports = { postBagOfWords, getBagsOfWords };
