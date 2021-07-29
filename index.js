const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";

const client = new MongoClient(uri);

const run = async () => {
  try {
    await client.connect();
    const database = client.db("noteKeeper");
    const notes = database.collection("notes");

    const doc = { name: "Red", town: "kanto" };
    const result = await notes.insertOne(doc);
  } finally {
    await client.close();
  }
};

run();
