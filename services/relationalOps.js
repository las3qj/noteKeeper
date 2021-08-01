const { getBagsByID, addToBagCorpora, updateBag } = require("./bagsOfWords");
const { getCorporaByID, addToCorpusBags, updateCorpus } = require("./corpora");
const { addToCorpusTable } = require("./tabling");

const addCorporaToBag = async (bagID, corporaID, db) => {
  const [bagArray, corporaArray] = await Promise.all([
    getBagsByID([bagID], db),
    getCorporaByID(corporaID, db),
  ]);
  const bag = bagArray[0];
  const newCorpora = addToBagCorpora(bag.corpora, corporaArray);
  const result = await updateBag(bagID, { corpora: newCorpora }, db);
  return result;
};

const addBagsToCorpus = async (corpusID, bagIDs, db) => {
  const [bagArray, corporaArray] = await Promise.all([
    getBagsByID(bagIDs, db),
    getCorporaByID([corpusID], db)[0],
  ]);
  const corpus = corporaArray[0];
  const newTable = addToCorpusTable(corpus.table, bagArray);
  const newBags = addToCorpusBags(corpus.bags, bagArray);
  const result = await updateCorpus(
    corpusID,
    { bags: newBags, table: newTable },
    db
  );
  return result;
};

module.exports = { addCorporaToBag, addBagsToCorpus };
