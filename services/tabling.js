/**
 * Given an array of tokens, creates a table mapping token to an object containing a count integer and an occurences array
 * @param {Array <String>} tokens
 * @returns {Object} table - mapping words to counts and occurences
 */
const createTable = (tokens) => {
  const table = {};
  // Leveraging array indexing and hashmaps, should approach O(n)
  for (var i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (table[token] === undefined) {
      table[token] = { counts: 1, occurences: [i] };
    } else {
      const tableEntry = table[token];
      table[token] = {
        counts: tableEntry.counts + 1,
        occurences: tableEntry.occurences.concat([i]),
      };
    }
  }
  return table;
};

module.exports = { createTable };
