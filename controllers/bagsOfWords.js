const { parseTxtFile } = require("./../services/fileParsing");
const { tokenize } = require("./../services/textWrangling");
const { createNoteTable } = require("./../services/tabling");
const {
  createBagOfWords,
  getBagsByID,
  updateBag,
} = require("./../services/bagsOfWords");
const { controlWrapper } = require("./../services/misc");
const {
  handleAddCorporaToBag,
  handleUpdateBagCorpora,
} = require("../services/relationalOps");

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
      await Promise.all([
        handleUpdateBagCorpora(oldBag, tableDeepCopy, db),
        updateBag(bagID, { textString, tokens, table }, db),
      ]);
    } else {
      await updateBag(bagID, { textString, tokens, table }, db);
    }
    res.sendStatus(200);
  });
};

const addCorpora = async (req, res) => {
  controlWrapper(res, async (db) => {
    const { bagID, corporaIDs } = req.body;
    await handleAddCorporaToBag(bagID, corporaIDs, db);
    res.sendStatus(200);
  });
};

module.exports = { postBagOfWords, getBagsOfWords, addCorpora, updateText };
