const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://hiruni0624_db_user:Hiruni123456@cluster0.x6ncgma.mongodb.net/medical_db?appName=Cluster0';
const client = new MongoClient(uri);
async function run() {
    try {
        await client.connect();
        const db = client.db('medical_db');
        const collection = db.collection('users');
        const result = await collection.deleteMany({
            fullName: { $regex: 'kamal|udara|senith', $options: 'i' }
        });
        console.log(result.deletedCount + ' users deleted.');
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
