const async = require("async");
class dbClass {


    getUserDetails = async (req, res, options) => {
        /** Get user Details **/
        const users = db.collection(TABLE_USERS);

        let conditions = (options.conditions) ? options.conditions : {};
        let fields = (options.fields) ? options.fields : {};
        return new Promise(async resolve => {
            try {
                let usertData = await users.findOne(conditions, { projection: fields });
                let response = {
                    status: STATUS_SUCCESS,
                    result: usertData,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);

            }
            //return "Hello";
        });
    }

    /**
     * Function for get data using aggregate
     * @param options  As options object
     * @param req				As Request Data
     * @return array
     */
    getAggregateResult = async (req, res, options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let resultData = await collationName.aggregate(conditions).toArray();
                let response = {
                    status: STATUS_SUCCESS,
                    result: resultData,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
            //return "Hello";
        });
    }

    /**
     * Function for find One
     *
     * @param options  As options object
     * @param req				As Request Data
     *
     * @return array
     */
    getFindOne = (options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        let fields = (options.fields) ? options.fields : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            if (Object.keys(conditions).length <= 0) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: "Conditions object can not be blank."
                };
                return resolve(response);
            }
            try {
                let resultData = await collationName.findOne(conditions, { projection: fields });
                let response = {
                    status: STATUS_SUCCESS,
                    result: resultData,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }

    /**
    * Function for find all
    *
    * @param options  As options object
    * @param req				As Request Data
    *
    * @return array
    */
    getFindAll = async (options) => {

        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        let fields = (options.fields) ? options.fields : {};
        let limit = (options.limit) ? options.limit : DEFAULT_LIMIT;
        let skip = (options.skip) ? Number(options.skip) : DEFAULT_SKIP;
        let sortCondition = (options.sort_condition) ? options.sort_condition : { "created": SORT_DESC };
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let resultData = await collationName.find(conditions, { projection: fields }).collation(COLLATION_VALUE).sort(sortCondition).limit(limit).skip(skip).toArray();
                let response = {
                    status: STATUS_SUCCESS,
                    result: resultData,
                    error: false,
                    message: ""
                };

                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }


    /**
    * Function for find all without limit
    *
    * @param options  As options object
    * @param req				As Request Data
    *
    * @return array
    */
    getFindAllWithoutLimit = async (options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        let fields = (options.fields) ? options.fields : {};
        let sortCondition = (options.sort_condition) ? options.sort_condition : { "created": SORT_DESC };
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let resultData = await collationName.find(conditions, { projection: fields }).sort(sortCondition).toArray();
                let response = {
                    status: STATUS_SUCCESS,
                    result: resultData,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }

    getCountDocuments = (options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let resultCount = await collationName.countDocuments(conditions);
                let response = {
                    status: STATUS_SUCCESS,
                    result: resultCount,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }

    saveInsertOne = (req, res, options) => {
        let insertData = (options.insertData) ? options.insertData : {};
        let collection = (options.collection) ? options.collection : {};
        if (!insertData["created"]) {
            insertData["created"] = getUtcDate();
        }
        if (!insertData["modified"]) {
            insertData["modified"] = getUtcDate();
        }
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let saveResult = await collationName.insertOne(insertData);
                let response = {
                    status: STATUS_SUCCESS,
                    result: saveResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }

        })
    }

    updateOneRecord = (req, res, options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let updateData = (options.updateData) ? options.updateData : {};
        let upsertOption = (options.upsertOption) ? options.upsertOption : { upsert: false };
        let collection = (options.collection) ? options.collection : {};

        /*
        if(!updateData["$set"] || !updateData["$set"]["modified"]){
            updateData["$set"]["modified"] = getUtcDate();
        }
        */

        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let updateResult = await collationName.updateOne(conditions, updateData, upsertOption);
                let response = {
                    status: STATUS_SUCCESS,
                    result: updateResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }


    findAndupdateOneRecord = (req, res, options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let updateData = (options.updateData) ? options.updateData : {};
        let upsertOption = (options.upsertOption) ? options.upsertOption : {};
        let collection = (options.collection) ? options.collection : {};
        upsertOption["returnNewDocument"] = true;

        /*
        if(!updateData["$set"] || !updateData["$set"]["modified"]){
            updateData["$set"]["modified"] = getUtcDate();
        }
        */

        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let updateResult = await collationName.findOneAndUpdate(conditions, updateData, upsertOption);
                 let response = {
                    status: STATUS_SUCCESS,
                    result: updateResult.result || updateResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {

                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }


    /**
     * Function to update many records
     *
     * @param options  As options object
     * @param req				As Request Data
     *
     * @return array
     */
    updateManyRecords = (req, res, options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let updateData = (options.updateData) ? options.updateData : {};
        let collection = (options.collection) ? options.collection : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let updateResult = await collationName.updateMany(conditions, updateData);
                let response = {
                    status: STATUS_SUCCESS,
                    result: updateResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {

                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })

    }


    /**
     * Function to delete one records
     *
     * @param options  As options object
     * @param req				As Request Data
     *
     * @return array
     */
    deleteOneRecords = (req, res, options) => {
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let deleteResult = await collationName.deleteOne(conditions);
                let response = {
                    status: STATUS_SUCCESS,
                    result: deleteResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {

                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })

    }

    /**
     * Function to delete many records
     *
     * @param options  As options object
     * @param req				As Request Data
     *
     * @return array
     */
    deleteManyRecords = (req, res, options) => {

        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let deleteResult = await collationName.deleteMany(conditions);
                let response = {
                    status: STATUS_SUCCESS,
                    result: deleteResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {

                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })

    }


    getDistinctList = (options) => {
        let collection = (options.collection) ? options.collection : '';
        let field = (options.field) ? options.field : '';
        let conditions = (options.conditions) ? options.conditions : {};
        const collationName = db.collection(collection);

        return new Promise(async resolve => {
            try {
                let distinctResult = await collationName.distinct(field, conditions);
                let response = {
                    status: STATUS_SUCCESS,
                    result: distinctResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })

    }


    saveInsertMany = (req, res, options) => {
        let insertData = (options.insertData) ? options.insertData : {};
        let collection = (options.collection) ? options.collection : {};
        insertData = insertData.map(data => {
            let obj = { ...data, created: getUtcDate(), modified: getUtcDate() };
            return obj;
        })
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let saveResult = await collationName.insertMany(insertData);
                let response = {
                    status: STATUS_SUCCESS,
                    result: saveResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }

        })
    }


    /**
    * Function to distinct ids
    *
    * @param options  As options object
    * @param req				As Request Data
    *
    * @return array
    */
    findDistinctiId = (req,res,options)=>{
        let conditions = (options.conditions) ? options.conditions : {};
        let collection = (options.collection) ? options.collection : {};
        let distinctIdField = (options.distinctIdField) ? options.distinctIdField : {};
        const collationName = db.collection(collection);
        return new Promise(async resolve => {
            try {
                let queryResult = await collationName.distinct(distinctIdField,conditions);

                let response = {
                    status: STATUS_SUCCESS,
                    result: queryResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            } catch (error) {
                
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: error.message
                };
                return resolve(response);
            }
        })
    }

}
module.exports = new dbClass();

//module.exports = userObj
//module.exports = new dbClass();