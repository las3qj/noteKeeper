const { getBagsByID, addToBagCorpora, updateBag } = require("./bagsOfWords");
const { getCorporaByID, addToCorpusBags, updateCorpus } = require("./corpora");
const { parseObjectIDArray } = require("./misc");
const {
  addToCorpusTable,
  createDeltaTable,
  createInverseTable,
  updateCorpusTable,
} = require("./tabling");

const addCorporaToBags = async (bags, corpora, db) => {
  console.log("addCorporaToBags" + bags.toString() + corpora.toString());
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

const updateBagCorpus = async (corpus, bagID, deltaTable, db) => {
  const table = updateCorpusTable(corpus.table, deltaTable, bagID);
  const result = await updateCorpus(corpus._id.toString(), { table }, db);
  return result;
};

const handleUpdateBagCorpora = async (oldBag, newTable, db) => {
  const deltaTable = createDeltaTable(oldBag.table, newTable);
  const bagID = oldBag._id.toString();
  const corporaArray = await getCorporaByID(oldBag.corpora, db);
  const res = await Promise.all(
    corporaArray.map((corpus) => updateBagCorpus(corpus, bagID, deltaTable, db))
  );
  return res;
};

const removeBagFromCorpus = async (corpus, bagOID, inverseTable, db) => {
  const table = updateCorpusTable(
    corpus.table,
    inverseTable,
    bagOID.toString()
  );
  const bags = corpus.bags.slice();
  bags.splice(
    bags.findIndex((bag) => bag.toString() === bagOID.toString()),
    1
  );
  const result = await updateCorpus(corpus._id.toString(), { table, bags }, db);
  return result;
};

const removeBagsFromCorpus = async (corpus, bagArray, db) => {
  let table = corpus.table;
  bagArray.forEach((bag) => {
    const inverseTable = createInverseTable(bag.table);
    table = updateCorpusTable(table, inverseTable, bag._id.toString());
  });
  const bags = corpus.bags.filter(
    (cBag) =>
      bagArray.findIndex((bag) => bag._id.toString() === cBag.toString()) < 0
  );
  const result = await updateCorpus(corpus._id.toString(), { table, bags }, db);
  return result;
};

const removeBagFromCorpora = async (corporaArray, bag, db) => {
  const inverseTable = createInverseTable(bag.table);
  const res = await Promise.all(
    corporaArray.map((corpus) =>
      removeBagFromCorpus(corpus, bag._id, inverseTable, db)
    )
  );
  return res;
};

/*const removeBagsFromCorpora = async (corporaArray, bags, db) => {
  const results = await Promise.all(
    bags.map((bag) => removeBagFromCorpora(corporaArray, bag, db))
  );
  return results;
};*/

const removeCorporaFromBag = async (bag, corporaIDs, db) => {
  const corpora = bag.corpora.filter(
    (corpusOID) => !corporaIDs.includes(corpusOID.toString())
  );
  const result = await updateBag(bag._id.toString(), { corpora }, db);
  return result;
};

const removeCorporaFromBags = async (bags, corporaIDs, db) => {
  console.log("remove corpora from bags: " + bags.toString());
  const results = await Promise.all(
    bags.map((bag) => removeCorporaFromBag(bag, corporaIDs, db))
  );
  return results;
};

const handleRemoveCorporaFromBag = async (bagID, corporaIDs, db) => {
  const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
    [bagID],
    corporaIDs,
    db
  );
  const bag = bagArray[0];
  const result = await Promise.all([
    removeCorporaFromBag(bag, corporaIDs, db),
    removeBagFromCorpora(corporaArray, bag, db),
  ]);
  return result;
};

const handleRemoveBagsFromCorpus = async (corpusID, bagIDs, db) => {
  const { bagArray, corporaArray } = await getBagsAndCorporaByIDs(
    bagIDs,
    [corpusID],
    db
  );
  const corpus = corporaArray[0];
  const result = await Promise.all([
    removeCorporaFromBags(bagArray, [corpusID], db),
    removeBagsFromCorpus(corpus, bagArray, db),
  ]);
  return result;
};

const getBagDiffs = (corpusBags, putBagIDs) => {
  const bagsToAdd = putBagIDs.slice();
  const bagsToRemove = corpusBags.slice();
  for (let rI = 0; rI < bagsToRemove.length; ) {
    let aI = bagsToAdd.findIndex((bag) => bag === bagsToRemove[rI].toString());
    if (aI > -1) {
      bagsToRemove.splice(rI, 1);
      bagsToAdd.splice(aI, 1);
    } else {
      rI++;
    }
  }
  return { bagsToAdd, bagsToRemove };
};

const putBagsInCorpus = async (
  corpus,
  addBags,
  removeBags,
  updateBagIDs,
  db
) => {
  let table = corpus.table;
  console.log("putBagsInCorpus corpus.table: ", table);
  removeBags.forEach((bag) => {
    const inverseTable = createInverseTable(bag.table);
    table = updateCorpusTable(table, inverseTable, bag._id.toString());
  });
  console.log("not removeBags tables either");
  const newTable = addToCorpusTable(table, addBags);
  console.log("newTable: " + newTable.toString());
  const bags = parseObjectIDArray(updateBagIDs);

  const result = await updateCorpus(
    corpus._id.toString(),
    { table: newTable, bags },
    db
  );
  return result;
};

const handlePutBagsInCorpus = async (corpusID, bagIDs, db) => {
  const corporaArray = await getCorporaByID([corpusID], db);
  console.log("corporaArray: " + corporaArray.toString());
  const corpus = corporaArray[0];
  const { bagsToAdd, bagsToRemove } = getBagDiffs(corpus.bags, bagIDs);
  console.log(
    "get bag diffs: " + bagsToAdd.toString() + bagsToRemove.toString()
  );
  const [addBags, removeBags] = await Promise.all([
    getBagsByID(bagsToAdd, db),
    getBagsByID(bagsToRemove, db),
  ]);
  console.log(
    "get add and remove bags: " + addBags.toString() + removeBags.toString()
  );
  const corpResult = putBagsInCorpus(corpus, addBags, removeBags, bagIDs, db);

  const bagsResult = Promise.all([
    removeCorporaFromBags(removeBags, [corpusID], db),
    addCorporaToBags(addBags, [corpus], db),
  ]);

  const result = await Promise.all([corpResult, bagsResult]);
  return result;
};

module.exports = {
  addCorporaToBags,
  handleAddCorporaToBag,
  handleAddBagsToCorpus,
  handleUpdateBagCorpora,
  handleRemoveCorporaFromBag,
  handleRemoveBagsFromCorpus,
  handlePutBagsInCorpus,
};
