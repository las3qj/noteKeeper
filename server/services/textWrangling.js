/**
 * Removes all non-word characters from the text string and returns an array of all tokenized words
 * @param {String} textString - a single string containing the text of the document
 * @returns an array of the tokenized strings from the text string with non-word characters removed
 */
const tokenize = (textString) => {
  const wordCharsOnly = removeNonWordChar(textString.toLocaleLowerCase());
  const tokens = wordCharsOnly.split(" ");
  const nonEmptyTokens = removeEmptyTokens(tokens);
  return nonEmptyTokens;
};

/**
 * Replaces all non-word characters in the string with an empty string, effectively removing them
 * @param {String} string - the string to replace within
 * @returns string with all non-word characters removed
 */
const removeNonWordChar = (string) => {
  const NWC_PATTERN = /[^\x20\x2D0-9A-Z\x5Fa-z\xC0-\xD6\xD8-\xF6\xF8-\xFF]/g;
  const replacedString = string.replace(NWC_PATTERN, "");
  return replacedString;
};

/**
 * Removes all tokens from the token array that match the empty string, ""
 * @param {Array <String>} tokens - the token array
 * @returns the token array without any empty strings
 */
const removeEmptyTokens = (tokens) => {
  const filteredTokens = tokens.filter((value, index, array) => value !== "");
  return filteredTokens;
};

module.exports = {
  tokenize,
};
