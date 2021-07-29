/**
 * Removes all non-word characters from the text string and returns an array of all tokenized words
 * @param {String} textString - a single string containing the text of the document
 * @returns an array of the tokenized strings from the text string with non-word characters removed
 */
const tokenize = (textString) => {
  const wordCharsOnly = removeNonWordChar(textString.toLocaleLowerCase());
  const tokens = wordCharsOnly.split(" ");
  return removeEmptyTokens(tokens);
};

/**
 * Replaces all non-word characters in the string with an empty string, effectively removing them
 * @param {String} string - the string to replace within
 * @returns string with all non-word characters removed
 */
const removeNonWordChar = (string) => {
  const NWC_PATTERN = /[^\x20\x2D0-9A-Z\x5Fa-z\xC0-\xD6\xD8-\xF6\xF8-\xFF]/g;
  return string.replace(NWC_PATTERN, "");
};

/**
 * Removes all tokens from the token array that match the empty string, ""
 * @param {Array <String>} tokens - the token array
 * @returns the token array without any empty strings
 */
const removeEmptyTokens = (tokens) => {
  return tokens.filter((value, index, array) => value !== "");
};

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

const updateGlobalTable = (table, globalTable) => {
  const newGlobalTable = { ...globalTable };
  for (word in table) {
    if (newGlobalTable[word] === undefined) {
      newGlobalTable[word] = table[word].counts;
    } else {
      newGlobalTable[word] += table[word].counts;
    }
  }
  return newGlobalTable;
};

const testTokenize = () => {
  const tests = [
    "This is a test sentence.",
    '"That," he said," was a bad \nidea."',
    "Hello from test land, 2",
  ];
  for (test of tests) {
    const results = tokenize(test);
    process.stdout.write("Test result: \n");
    for (token of results) {
      process.stdout.write(token + ", ");
    }
    process.stdout.write("\nEnd of results.\n");
  }
};

const testCreateTable = () => {
  const tests = ["This is a test table, table me up!"];
  for (test of tests) {
    const tokens = tokenize(test);
    const table = createTable(tokens);
    process.stdout.write("Test result: \n");
    process.stdout.write(JSON.stringify(table));
    process.stdout.write("\nEnd of results.\n");
  }
};

const testGlobalTable = () => {
  const tests = [
    "This is a test table, table me up!",
    "That was the test table, it got tabled up!",
    "Test no more tables, not today.",
  ];
  var globalTable = {};
  for (test of tests) {
    const tokens = tokenize(test);
    const table = createTable(tokens);
    globalTable = updateGlobalTable(table, globalTable);
  }
  process.stdout.write("Test results: \n");
  process.stdout.write(JSON.stringify(globalTable));
  process.stdout.write("\nEnd of results.\n");
};

testGlobalTable();
