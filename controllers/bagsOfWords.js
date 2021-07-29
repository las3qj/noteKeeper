const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const { createTable } = require("./../services/tabling");
const { createBagOfWords } = require("./../services/bagsOfWords");
const { getClient, getDB } = require("./../database/database");

const postBagOfWords = async (req, res) => {
  const client = getClient();
  try {
    await client.connect();
    const { filePath } = req.body;
    const db = getDB(client);
    const textString = parseTxtFile(filePath);
    console.log(textString);
    const tokens = tokenize(textString);
    const table = createTable(tokens);
    await createBagOfWords(textString, tokens, table, db);
    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  } finally {
    await client.close();
  }
};

module.exports = { postBagOfWords };
