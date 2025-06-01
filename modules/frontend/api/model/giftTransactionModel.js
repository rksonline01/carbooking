const DbClass = require("../../../../classes/dbClass");
class GiftTransactionModel{

    constructor(){
        this.db_gift_transaction_logs = TABLE_GIFT_TRANSACTION_LOGS;
        this.db_wallet_transaction_logs = TABLE_WALLET_TRANSACTION_LOGS;
		this.db_incr_collection_name = TABLE_INCREMENTALS;
    }

     
     /**
     * Function to save user address
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    saveGiftTransactionLogs = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_gift_transaction_logs;

            DbClass.saveInsertOne(req,res,options).then(saveResponse=>{
                let responseStatus = (saveResponse.status) ? saveResponse.status : "";
                let responseResult = (saveResponse.result) ? saveResponse.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
            });
        });
    }

    /**
     * Function to get gift transaction
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getGiftTransactionDetail = (options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_gift_transaction_logs;

            DbClass.getFindOne(options).then(addressResponse=>{
                let responseStatus = (addressResponse.status) ? addressResponse.status : "";
                let responseResult = (addressResponse.result) ? addressResponse.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
            })
        })
    }


    /**
	 * Function to get gift list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getGiftAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_gift_transaction_logs;

            DbClass.getAggregateResult(req,res,optionObj).then((JobResponse)=>{
                 let responseStatus = (JobResponse.status) ? JobResponse.status : "";
                let responseResult = (JobResponse.result) ? JobResponse.result : "";
 
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
                
            });
        });

    }


    /**
     * Function to save wallet transaction logs
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    saveWalletTransactionLogs = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_wallet_transaction_logs;

            DbClass.saveInsertOne(req,res,options).then(saveResponse=>{
                let responseStatus = (saveResponse.status) ? saveResponse.status : "";
                let responseResult = (saveResponse.result) ? saveResponse.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
            });
        });
    }


    /**
	 * Function to get wallet transaction
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getWalletTransationAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_wallet_transaction_logs;

            DbClass.getAggregateResult(req,res,optionObj).then((listResponse)=>{
                let responseStatus = (listResponse.status) ? listResponse.status : "";
                let responseResult = (listResponse.result) ? listResponse.result : "";

                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
                
            });
        });

    }
	
	
	
	
	/**
     * Function to get Gift Transaction Id
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    generateGiftTransactionId = (req, res) => {
        return new Promise(resolve => {
            let condition = {
                slug: 'gift_transaction_id'
            }
            let updateData = {
                '$inc': { number: 1 }
            }
            let options = {
                conditions: condition,
                updateData: updateData,
                collection: this.db_incr_collection_name
            }
            DbClass.findAndupdateOneRecord(req, res, options).then(response => {
                let responseStatus = (response.status) ? response.status : "";
                let responseResult = (response.result) ? response.result : "";
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    var giftTransactionId = responseResult.prefix + responseResult.number;
                    let response = {
                        status: STATUS_SUCCESS,
                        result: giftTransactionId,
                        error: false,
                        message: ""
                    };
                    return resolve(response);
                }
            })
        })
    }
    
    
}

module.exports = new GiftTransactionModel;