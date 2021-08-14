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

const collocates = ({ table }, bags, { title, terms, stopWords, range }) => {
  if (range === undefined) {
    range = 4;
  }
  const bagsCollocates = {};
  const corpusCollocates = {};
  // create bagMap for simpler indexing
  const bagMap = {};
  bags.forEach((bag) => {
    bagMap[bag._id.toString()] = bag;
    bagsCollocates[bag._id.toString()] = { [title]: {} };
  });
  // create stopWords map for simple indexing
  const stopWordsMap = {};
  stopWords.forEach((stopWord) => {
    stopWordsMap[stopWord] = true;
  });
  terms.forEach((targetWord) => {
    if (table[targetWord] === undefined) {
      return;
    }
    const bagsToExamine = Object.keys(table[targetWord].byDoc);
    const tokenTotalObject = {};
    bagsToExamine.forEach((bagOID) => {
      const tokenObject = {};
      const bag = bagMap[bagOID.toString()];
      const indices = bag.table[targetWord].occurences;
      const tokenArray = bag.tokens;
      indices.forEach((index) => {
        let bound = index + range;
        for (let i = index + 1; i <= bound; i++) {
          if (i >= tokenArray.length) {
            break;
          }
          const token = tokenArray[i];
          if (stopWordsMap[token] === undefined) {
            if (tokenObject[token] === undefined) {
              tokenObject[token] = 1;
            } else {
              tokenObject[token] += 1;
            }
            if (tokenTotalObject[token] === undefined) {
              tokenTotalObject[token] = 1;
            } else {
              tokenTotalObject[token] += 1;
            }
          } else {
            bound += 1;
          }
        }
        bound = index - range;
        for (let j = index - 1; j >= bound; j--) {
          if (j < 0) {
            break;
          }
          const token = tokenArray[j];
          if (stopWordsMap[token] === undefined) {
            if (tokenObject[token] === undefined) {
              tokenObject[token] = 1;
            } else {
              tokenObject[token] += 1;
            }
            if (tokenTotalObject[token] === undefined) {
              tokenTotalObject[token] = 1;
            } else {
              tokenTotalObject[token] += 1;
            }
          } else {
            bound -= 1;
          }
        }
      });
      bagsCollocates[bagOID.toString()][title][targetWord] = tokenObject;
    });
    corpusCollocates[targetWord] = tokenTotalObject;
  });

  return { corpus: { [title]: corpusCollocates }, byBag: bagsCollocates };
};

const runWatchedCollocates = (corpus, bagArray, paramsArray) => {
  const results = paramsArray.map((params) =>
    collocates(corpus, bagArray, params)
  );
  let corpusRes = {};
  const byBag = {};
  results.forEach((result) => {
    corpusRes = { ...corpusRes, ...result.corpus };
    for (id in result.byBag) {
      let bagRes = byBag[id];
      if (bagRes === undefined) {
        bagRes = {};
      }
      bagRes = { ...bagRes, ...result.byBag[id] };
      byBag[id] = bagRes;
    }
  });
  return { corpus: corpusRes, byBag };
};

const getWatchedAnalyses = ({ analyses }) => {
  const analysisStrings = [];
  const analysisFuncts = [];
  for (analysis in analyses) {
    if (analysis === "collocates") {
      const paramsArray = getWatchedCollocates(analyses[analysis]);
      if (paramsArray.length > 0) {
        analysisStrings.push(analysis);
        analysisFuncts.push((corpus, bagArray) =>
          runWatchedCollocates(corpus, bagArray, paramsArray)
        );
      }
    } else if (analyses[analysis].watchForUpdates) {
      analysisStrings.push(analysis);
      analysisFuncts.push(getAnalysisFunct(analysis));
    }
  }
  return { names: analysisStrings, functs: analysisFuncts };
};

const getWatchedCollocates = (collocates) => {
  const paramsArray = [];
  for (title in collocates) {
    if (collocates[title].watchForUpdates) {
      paramsArray.push({
        title: title,
        terms: collocates[title].terms,
        stopWords: collocates[title].stopWords,
        range: collocates[title].range,
      });
    }
  }
  return paramsArray;
};

const getAnalysisFunct = (string) => {
  const map = {
    tokenLengths: tokenLengths,
    lexicalVariety: lexicalVariety,
    collocates: collocates,
  };
  return map[string];
};

const getAnalysisFuncts = (stringArray) => {
  const functArray = stringArray.map((string) => getAnalysisFunct(string));
  return functArray;
};

const updateCorpusCollocates = (
  collocates,
  analysis,
  watchForUpdates,
  paramsArray
) => {
  let updatedColloc = collocates;
  if (updatedColloc === undefined) {
    updatedColloc = {};
  }
  if (paramsArray !== undefined) {
    paramsArray.forEach((params) => {
      if (updatedColloc[params.title] === undefined) {
        updatedColloc[params.title] = {
          terms: params.terms,
          range: params.range,
          stopWords: params.stopWords,
          runs: [],
        };
      }
      updatedColloc[params.title].watchForUpdates = watchForUpdates === "true";
    });
  }
  const titles = Object.keys(analysis);
  titles.forEach((title) => {
    updatedColloc[title].runs.push({
      analysis: analysis[title],
      timestamp: Date(),
    });
  });

  return updatedColloc;
};

const updateBagCollocates = (collocates, analysis) => {
  let updatedColloc = collocates;
  if (updatedColloc === undefined) {
    updatedColloc = {};
  }
  for (title in analysis) {
    if (updatedColloc[title] === undefined) {
      updatedColloc[title] = { runs: [] };
    }
    updatedColloc[title].runs.push({
      analysis: analysis[title],
      timestamp: Date(),
    });
  }
  return updatedColloc;
};

const updateAnalysis = (
  { analyses },
  name,
  analysis,
  watchForUpdates,
  paramsArray
) => {
  let updatedDoc = { analyses };
  console.log(name);
  console.log(watchForUpdates);
  if (name === "collocates") {
    let collocates = {};
    if (watchForUpdates !== undefined) {
      collocates = updateCorpusCollocates(
        analyses.collocates,
        analysis,
        watchForUpdates,
        paramsArray
      );
    } else {
      collocates = updateBagCollocates(analyses.collocates, analysis);
    }
    updatedDoc.analyses.collocates = collocates;
  } else {
    if (analyses[name] === undefined) {
      updatedDoc.analyses[name] = { runs: [{ analysis, timestamp: Date() }] };
    } else {
      updatedDoc.analyses[name].runs = analyses[name].runs.concat([
        { analysis, timestamp: Date() },
      ]);
    }
    if (watchForUpdates !== undefined) {
      console.log(name);
      console.log("watchForUpdates");
      console.log(watchForUpdates);
      console.log(typeof watchForUpdates);
      updatedDoc.analyses[name].watchForUpdates = watchForUpdates === "true";
    }
  }
  return updatedDoc;
};

const updateAnalyses = (
  { analyses },
  names,
  analysesRes,
  watchForUpdates,
  paramsArray
) => {
  let updatedDoc = { analyses };
  analysesRes.forEach((analysis, index) => {
    updatedDoc = updateAnalysis(
      updatedDoc,
      names[index],
      analysis,
      watchForUpdates,
      paramsArray
    );
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
  collocates,
  getAnalysisFunct,
  getAnalysisFuncts,
  getWatchedAnalyses,
  consolidateByBags,
};
