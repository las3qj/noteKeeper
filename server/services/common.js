const { getBagsByID } = require("./bagsOfWords");
const { getCorporaByID } = require("./corpora");
const getBagsAndCorporaByIDs = async (bagIDs, corpusIDs, db) => {
  const [bagArray, corporaArray] = await Promise.all([
    getBagsByID(bagIDs, db),
    getCorporaByID(corpusIDs, db),
  ]);
  return { bagArray, corporaArray };
};

module.exports = { getBagsAndCorporaByIDs };
