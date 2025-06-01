/**  including .env file */
var mongoUrl = process.env.MONGO_URL;
//
const mongoUrl = "mongodb+srv://rksonline01:otUmyxInZ6NgUGYH@cluster0.mongodb.net/myDB?retryWrites=true&w=majority";


var MongoClient = require('mongodb').MongoClient;

var _db;

//var dbName = process.env.DATABASE;
var dbName = carbooking;

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
