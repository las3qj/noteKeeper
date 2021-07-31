const ObjectId = require("mongodb").ObjectId;

/**
 * Parses a string hex value into an ObjectID type
 * @param {String} string - the string to be parsed into an ObjectID
 * @returns ObjectID parsed from the given string
 */
const parseObjectID = (string) => {
  return ObjectId(string);
};

/**
 * Parses an array of hex strings representing ObjectIDs into ObjectID types
 * @param {Array <String>} strings - array of strings representing ObjectIDs
 * @returns {Array <ObjectID>} objectIDArray - array of objectIDs from the string array
 */
const parseObjectIDArray = (strings) => {
  const objectIDArray = [];
  for (string of strings) {
    objectIDArray.push(parseObjectID(string));
  }
  return objectIDArray;
};

module.exports = {
  parseObjectID,
  parseObjectIDArray,
};
