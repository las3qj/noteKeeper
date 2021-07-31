const { postCorpus } = require("./../database/corpora");

const createCorpus = async (name, description, notes, table, db) => {
  const corpusDoc = {
    name,
    description,
    notes,
    table,
  };
  const result = await postCorpus(corpusDoc, db);
  return result;
};

module.exports = { createCorpus };
