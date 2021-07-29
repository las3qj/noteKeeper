const { postBagOfWords } = require("./../database/bagsOfWords");

const createBagOfWords = async (textString, tokens, table, db) => {
  const noteDoc = {
    textString,
    tokens,
    table,
  };
  const result = await postBagOfWords(noteDoc, db);
  return result;
};

module.exports = { createBagOfWords };
