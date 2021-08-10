const tokenLengths = ({ table }) => {
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
  const lengthsByBag = {};
  for (id in bagResults) {
    const bagLengths = bagResults[id].lengths;
    for (let i = 0; i < bagLengths.length; i++) {
      if (bagLengths[i] === undefined) {
        bagLengths[i] = 0;
      }
    }
    lengthsByBag[id] = {
      lengths: bagLengths,
      average: bagResults[id].total / bagResults[id].tokenCount,
    };
  }
  return { corpus: lengthsOfCorp, byBag: lengthsByBag };
};

const lexicalVariety = ({ table }) => {
  const bagResults = {};
  const corpusUniques = Object.keys(table).length;
  let corpusTotal = 0;
  for (token in table) {
    corpusTotal += table[token].counts;
    for (bagID in table[token].byDoc) {
      let bagResult = bagResults[bagID];
      const bagCount = table[token].byDoc[bagID];
      if (bagResult === undefined) {
        bagResult = { uniques: 0, total: 0 };
      }

      bagResult.uniques += 1;
      bagResult.total += bagCount;
      bagResults[bagID] = bagResult;
    }
  }
  const corpusVariety = {
    uniques: corpusUniques,
    ratio: corpusUniques / corpusTotal,
  };
  const varietyByBag = {};
  for (id in bagResults) {
    varietyByBag[id] = {
      uniques: bagResults[id].uniques,
      ratio: bagResults[id].uniques / bagResults[id].total,
    };
  }
  return { corpus: corpusVariety, byBag: varietyByBag };
};

const getWatchedAnalyses = ({ analyses }) => {
  const analysisStrings = [];
  for (analysis in analyses) {
    if (analyses[analysis].watchForUpdates) {
      analysisStrings.push(analysis);
    }
  }
  const analysisFuncts = getAnalysisFuncts(analysisStrings);
  return { names: analysisStrings, functs: analysisFuncts };
};

/*
const getNeedsAnalysis = ({ analysis, updated, created }) => {
  if (analysis === undefined) {
    return true;
  }
  const lastRun = analysis.runs[-1];
  const lastEdited = updated !== undefined ? updated : created;
  if (Date.parse(lastRun.timestamp) < Date.parse(lastEdited)) {
    return true;
  }
  return false;
};*/

const getAnalysisFuncts = (stringArray) => {
  const map = { tokenLengths: tokenLengths, lexicalVariety: lexicalVariety };
  const functArray = stringArray.map((string) => map[string]);
  return functArray;
};

const updateAnalysis = ({ analyses }, name, analysis) => {
  let updatedDoc = {};
  if (analyses[name] === undefined) {
    updatedDoc = {
      analyses: {
        ...analyses,
        [name]: { runs: [{ analysis, timestamp: Date() }] },
      },
    };
  } else {
    updatedDoc = {
      analyses: {
        ...analyses,
        [name]: {
          runs: analyses[name].runs.concat([{ analysis, timestamp: Date() }]),
        },
      },
    };
  }
  return updatedDoc;
};

const updateAnalyses = (doc, names, analyses) => {
  let updatedDoc = doc;
  analyses.forEach((analysis, index) => {
    updatedDoc = updateAnalysis(updatedDoc, names[index], analysis);
  });
  return updatedDoc;
};

const consolidateByBags = (namesArrays, byBagsArrays, bagsToWatch) => {
  const masterMap = {};
  namesArrays.forEach((namesArray, corpIndex) => {
    const byBagsArray = byBagsArrays[corpIndex];
    namesArray.forEach((name, nameIndex) => {
      let masterEntry = masterMap[name];
      if (masterEntry === undefined) {
        const byBags = byBagsArray[nameIndex];
        masterEntry = {};
        for (bagID of bagsToWatch) {
          masterEntry[bagID] = byBags[bagID];
        }
      }
      masterMap[name] = masterEntry;
    });
  });
  const names = [];
  const byBags = [];
  for (nameID in masterMap) {
    names.push(nameID);
    byBags.push(masterMap[nameID]);
  }
  return { names, byBags };
};

/*
const updateWatchedAnalyses = (updatedCorpus, analysesResults) => {
  const analysis = functions[0](corpus);
  const updatedCorpus = updateAnalyses(corpus, name, analysis.corpus);
  updatedCorpus.analyses[name].watchForUpdates = watchForUpdates === "true";
  const bagsToUpdate = bagArray.filter((bag) => {
    if (bag.analyses[name] === undefined) {
      return true;
    }
    const lastRan =
      bag.analyses[name].runs[bag.analyses[name].runs.length - 1].timestamp;
    const lastEdited = bag.updated !== undefined ? bag.updated : bag.created;
    if (Date.parse(lastRan) < Date.parse(lastEdited)) {
      return true;
    }
    return false;
  });
  const updatedBags = bagsToUpdate.map((bag, index) =>
    updateAnalyses(bag, name, analysis.byBag[index])
  );
  await Promise.all([
    updateCorpus(corpusID, updatedCorpus, db, false),
    updateBags(corpus.bags, updatedBags, db, false),
  ]);
  res.sendStatus(200);
};*/

module.exports = {
  tokenLengths,
  updateAnalysis,
  updateAnalyses,
  lexicalVariety,
  getAnalysisFuncts,
  getWatchedAnalyses,
  consolidateByBags,
};
