/**
 * Given an array of tokens, creates a table mapping token to an object containing a count integer and an occurences array
 * @param {Array <String>} tokens
 * @returns {Object} table - mapping words to counts and occurences
 */
const createNoteTable = (tokens) => {
  const table = {};
  // Leveraging array indexing and hashmaps, should approach O(n)
  for (var i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tableEntry = table[token];
    if (tableEntry === undefined) {
      table[token] = { counts: 1, occurences: [i] };
    } else {
      table[token] = {
        counts: tableEntry.counts + 1,
        occurences: tableEntry.occurences.concat([i]),
      };
    }
  }
  return table;
};

/**
 * Given an array of note docs, creates a master table with all tokens, cumulative counts, and counts by docID
 * @param {Array <Object>} docs - Array of note doc objects, with table and id fields defined
 * @returns {Object} table - mapping words to cumulative counts and counts by docID
 */
const createCorpusTable = (bagsArray) => {
  return addToCorpusTable({}, bagsArray);
};

const addToCorpusTable = (masterTable, bagsArray) => {
  // O(w*n) here w = number of words and n = number of notes -- better algorithm?
  for (var i = 0; i < bagsArray.length; i++) {
    const doc = bagsArray[i];
    const table = doc.table;
    for (var token in table) {
      const counts = table[token].counts;
      const masterEntry = masterTable[token];
      if (masterEntry === undefined) {
        masterTable[token] = { counts: counts, byDoc: { [doc._id]: counts } };
      } else {
        masterTable[token] = {
          counts: masterEntry.counts + counts,
          byDoc: { ...masterEntry.byDoc, [doc._id]: counts },
        };
      }
    }
  }
  return masterTable;
};

module.exports = { createNoteTable, createCorpusTable, addToCorpusTable };
