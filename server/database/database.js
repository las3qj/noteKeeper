const { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";

const getClient = () => {
  const client = new MongoClient(uri);
  return client;
};

const getDB = (client) => {
  const db = client.db("noteKeeper");
  return db;
};

module.exports = { getClient, getDB };
