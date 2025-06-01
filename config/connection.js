/**  including .env file */
//var mongoUrl = process.env.MONGO_URL;

var mongoUrl = "mongodb+srv://rksonline01:otUmyxInZ6NgUGYH@carbooking.sx7nd7b.mongodb.net/";



var MongoClient = require('mongodb').MongoClient;

var _db;

//var dbName = process.env.DATABASE;
dbName = "carbooking";

const client = new MongoClient(mongoUrl);

module.exports = {

	connectToServer: async function (callback) {

		await client.connect();

		const db = client.db(dbName);

		_db = db

		return callback(null);

	},

	getDb: function () {
	 
		return _db;

	}

}
