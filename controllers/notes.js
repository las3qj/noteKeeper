const { parseTxtFile } = require("../services/fileParsing");
const { tokenize } = require("../services/textWrangling");
const { createTable } = require("../services/tabling");

const createTable = async (req, res) => {
  const { filePath } = req.body;
  try {
    const textString = parseTxtFile(filePath);
    const tokens = tokenize(textString);
    const table = createTable(tokens);
    await createNote(textString, tokens, table);
    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
};

module.exports = { createTable };
