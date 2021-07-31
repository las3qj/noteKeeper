const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const { createNoteTable } = require("./../services/tabling");
const { createBagOfWords, getBagsByIDs } = require("./../services/bagsOfWords");
const { controlWrapper } = require("./../services/misc");

const postBagOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { filePath } = req.body;
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createNoteTable(tokens);
    await createBagOfWords(textString, tokens, table, db);
    res.sendStatus(200);
  });
};

const getBagsOfWords = async (req, res) => {
  controlWrapper(res, async (db) => {
    const ids = req.query.ids;
    const result = await getBagsByIDs(ids, db);
    res.status(200);
    res.json({ data: result });
  });
};

module.exports = { postBagOfWords, getBagsOfWords };
