const { MongoClient } = require('mongodb');

// Connection URL for the local MongoDB instance
const url = 'mongodb://0.0.0.0:27017';

// Database name
const dbName = 'nse';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
let db;
let collection; 

module.exports = {};

module.exports.collection = null

module.exports.connect =async function connect() {
  try {
    // Connect to the local MongoDB instance
    console.log('Connected to MongoDB');
    // Get a reference to the database
    

  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports.insert = async function insert( document ){
    try {
        await client.connect();
        db = client.db(dbName);
        collection = db.collection('stocks');
        const updateOperation = {
            $set: document,
        };
        const result = await collection.updateOne({ symbol: document.symbol }, updateOperation, { upsert: true });
        console.log(`Inserted document with _id: ${result.insertedId}`);
        
    } catch ( error ){
        console.error('Error:', error);
    }finally{
        client.close();
    }
}

module.exports.getData = async function getData( filter, req, res ){
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('stocks');
        // Define your filter criteria here (e.g., filtering by a specific field)
        // Fetch data with the filter
        const data = await collection.find(filter).toArray();
        res.json(data);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } finally {
        if (client) {
          client.close();
        }
      }
}
