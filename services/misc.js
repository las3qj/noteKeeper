const ObjectId = require("mongodb").ObjectId;
const { getClient, getDB } = require("./../database/database");

/**
 * Parses a string hex value into an ObjectID type
 * @param {String} string - the string to be parsed into an ObjectID
 * @returns ObjectID parsed from the given string
 */
const parseObjectID = (string) => {
  if (typeof string === "string") {
    return ObjectId(string);
  }
  return string;
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

const getDifferences = (prevOIDs, updatedIDs) => {
  const toAdd = updatedIDs.slice();
  const toRemove = prevOIDs.slice();
  const unChanged = [];
  for (let rI = 0; rI < toRemove.length; ) {
    let aI = toAdd.findIndex((corpus) => corpus === toRemove[rI].toString());
    if (aI > -1) {
      toRemove.splice(rI, 1);
      unChanged.push(toAdd.splice(aI, 1)[0]);
    } else {
      rI++;
    }
  }
  return { toAdd, toRemove, unChanged };
};

const controlWrapper = async (res, funct) => {
  const client = getClient();
  try {
    await client.connect();
    const db = getDB(client);
    await funct(db);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  } finally {
    await client.close();
  }
};

module.exports = {
  parseObjectID,
  parseObjectIDArray,
  controlWrapper,
  getDifferences,
};
