const tokenLengths = (table, bags) => {
  const bagResults = {};
  const corpLengths = [];
  let corpTotal = 0;
  let corpTokenCount = 0;
  for (token in table) {
    const length = token.length;
    const counts = table[token].counts;
    if (corpLengths[length] === undefined) {
      corpLengths[length] = counts;
    } else {
      corpLengths[length] += counts;
    }
    corpTotal += length * counts;
    corpTokenCount += counts;
    for (bagID in table[token].byDoc) {
      let bagResult = bagResults[bagID];
      const bagCount = table[token].byDoc[bagID];
      if (bagResult === undefined) {
        bagResult = { lengths: [], total: 0, tokenCount: 0 };
      }
      if (bagResult.lengths[length] === undefined) {
        bagResult.lengths[length] = bagCount;
      } else {
        bagResult.lengths[length] += bagCount;
      }
      bagResult.tokenCount += bagCount;
      bagResult.total += bagCount * length;
      bagResults[bagID] = bagResult;
    }
  }
  for (let i = 0; i < corpLengths.length; i++) {
    if (corpLengths[i] === undefined) {
      corpLengths[i] = 0;
    }
  }
  const corpAverage = corpTotal / corpTokenCount;
  const lengthsOfCorp = { lengths: corpLengths, average: corpAverage };
  const lengthsByBag = bags.map((bagOID) => {
    const bagResult = bagResults[bagOID.toString()];
    const bagLengths = bagResult.lengths;
    for (let i = 0; i < bagLengths.length; i++) {
      if (bagLengths[i] === undefined) {
        bagLengths[i] = 0;
      }
    }
    return {
      lengths: bagLengths,
      average: bagResult.total / bagResult.tokenCount,
    };
  });
  return { corpus: lengthsOfCorp, byBag: lengthsByBag };
};

const updateAnalyses = (doc, name, analysis) => {
  let updatedDoc = {};
  if (doc.analyses[name] === undefined) {
    updatedDoc = {
      analyses: {
        ...doc.analyses,
        [name]: { runs: [{ analysis, timestamp: Date() }] },
      },
    };
  } else {
    updatedDoc = {
      analyses: {
        ...doc.analyses,
        [name]: {
          runs: doc.analyses[name].runs.concat([
            { analysis, timestamp: Date() },
          ]),
        },
      },
    };
  }
  return updatedDoc;
};

module.exports = {
  tokenLengths,
  updateAnalyses,
};
