const postCorpus = async (cDoc, db) => {
  const corpora = db.collection("corpora");
  const result = await corpora.insertOne(cDoc);
  return result;
};

module.exports = { postCorpus };
