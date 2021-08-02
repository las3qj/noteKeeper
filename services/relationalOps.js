const { getBagsByID, addToBagCorpora, updateBag } = require("./bagsOfWords");
const { getCorporaByID, addToCorpusBags, updateCorpus } = require("./corpora");
const { addToCorpusTable } = require("./tabling");
const { parseObjectIDArray } = require("./misc");

const addCorporaToBags = async (bags, corpora, db) => {
  const resArray = bags.map((bag) => addCorporaToBag(bag, corpora, db));
  const result = await Promise.all(resArray);
  return result;
};

const addCorporaToBag = async (bag, corpora, db) => {
  const newCorpora = addToBagCorpora(bag.corpora, corpora);
  const result = await updateBag(bag._id, { corpora: newCorpora }, db);
  return result;
};

const addBagsToCorpora = async (bags, corpora, db) => {
  const resArray = corpora.map((corpora) => addCorporaToBag(bags, corpora, db));
  const result = await Promise.all(resArray);
  return result;
};

const addBagsToCorpus = async (corpus, bagArray, db) => {
  const newTable = addToCorpusTable(corpus.table, bagArray);
  const newBags = addToCorpusBags(corpus.bags, bagArray);
  const result = await updateCorpus(
    corpus._id,
    { bags: newBags, table: newTable },
    db
  );
  return result;
};

const getBagsAndCorporaByIDs = async (bagIDs, corpusIDs, db) => {
  const [bagArray, corporaArray] = await Promise.all([
    getBagsByID(bagIDs, db),
    getCorporaByID(corpusIDs, db),
  ]);
  return { bagArray, corporaArray };
};

const handleAddBagsToCorpus = async (corpusID, bagIDs, db) => {
  const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
    bagIDs,
    [corpusID],
    db
  );
  const res = await Promise.all([
    addBagsToCorpus(corporaArray[0], bagArray, db),
    addCorporaToBags(bagArray, corporaArray, db),
  ]);
  return res;
};

const handleAddCorporaToBag = async (bagID, corporaID, db) => {
  const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
    [bagID],
    corporaID,
    db
  );
  const res = await Promise.all([
    addBagsToCorpora(bagArray, corporaArray, db),
    addCorporaToBag(bagArray[0], corporaArray, db),
  ]);
  return res;
};

module.exports = {
  addCorporaToBags,
  handleAddCorporaToBag,
  handleAddBagsToCorpus,
};
