const DbClass = require('../../../../classes/dbClass')
const asyncParallel = require('async/parallel');
var async = require('async');


class RegistrationModel {

    constructor() {
        this.db_collection_name = TABLE_USERS;
        this.db_rating_collection = TABLE_RATING;

    }


    /**
     * Function to save user 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    saveUser = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

            DbClass.saveInsertOne(req, res, option).then(saveOrderResponse => {
                let responseStatus = (saveOrderResponse.status) ? saveOrderResponse.status : "";
                let responseResult = (saveOrderResponse.result) ? saveOrderResponse.result : "";
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
     * Function to get user details
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getUserDetail = (option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;

            DbClass.getFindOne(option).then(orderResponse => {
                let responseStatus = (orderResponse.status) ? orderResponse.status : "";
                let responseResult = (orderResponse.result) ? orderResponse.result : "";
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
    * Function to update user
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    updateUser = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_collection_name;
            DbClass.updateOneRecord(req, res, option).then(updateOrderResponse => {
                let responseStatus = (updateOrderResponse.status) ? updateOrderResponse.status : "";
                let responseResult = (updateOrderResponse.result) ? updateOrderResponse.result : "";
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
     * Function to get user update one
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    findAndupdateOneUser = (req, res, optionObj) => {
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_name
            DbClass.findAndupdateOneRecord(req, res, optionObj).then(updateResult => {
                let responseStatus = (updateResult.status) ? updateResult.status : "";
                let responseResult = (updateResult.result) ? updateResult.result : {};
                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: responseResult,
                        message: ""
                    };
                    return resolve(response);
                }
                let response = {
                    status: STATUS_SUCCESS,
                    result: responseResult,
                    error: false,
                    message: ""
                };
                return resolve(response);
            })
        });
    }


    /**
    * Function to save rating 
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    saveRating = (req, res, option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_rating_collection;

            DbClass.saveInsertOne(req, res, option).then(saveResponse => {
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
     * Function to get all rating list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getAllRatingList = (option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_rating_collection;

            DbClass.getFindAllWithoutLimit(option).then(response => {
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
     * Function to get User View Details
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	getUserViewDetails = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_name;

			DbClass.getAggregateResult(req, res, optionObj).then(userDetailResponse => {
				let userResStatus = (userDetailResponse.status) ? userDetailResponse.status : "";
				let userResult = (userDetailResponse.result) ? userDetailResponse.result : "";

				if (userResStatus == STATUS_ERROR || userResult.length <= 0) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);
				}


				let response = {
					status: STATUS_SUCCESS,
					result: userResult[0],
					error: false,
					message: ""
				};
				return resolve(response);
			});
		})
	}
	

    /**
     * Function to get order booking details
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getRatingDetails = (option) => {
        return new Promise(resolve => {
            option["collection"] = this.db_rating_collection;
            DbClass.getFindOne(option).then(orderResponse => {

                let responseStatus = (orderResponse.status) ? orderResponse.status : "";
                let responseResult = (orderResponse.result) ? orderResponse.result : "";
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
	 * Function to save user login activity
	 *
	 * @param req		As 	Request Data
	 * @param res		As 	Response Data
	 * @param options	As  object of data
	 *
	 * @return json
	 **/
	saveLoginLogs = (req, res, options) =>{
		return new Promise(resolve=>{
			try{
				let userId		=	(options._id)			? options._id		:"";
				let deviceType 	= 	(req.body.device_type)	? req.body.device_type 	:"";
				let deviceToken = 	(req.body.device_token)	? req.body.device_token :"";
				let deviceId 	= 	(req.body.device_id)	? req.body.device_id :"";
				let async		=	require('async');
				
				/** Send error response **/
				if(!userId) return resolve({status : STATUS_ERROR, options : options, message : res.__("system.something_going_wrong_please_try_again")});
				
				async.parallel([
					(callback)=>{
						/** Manage update data **/
						let userUpdatedData = {
							$set	:	{
								is_user_logged_in	: ACTIVE,
								last_login	:	getUtcDate(),
								modified	:	getUtcDate(),
							}
						};
						
						if(deviceType && deviceToken){
							userUpdatedData["$set"]["device_details"] = [{
								device_type 	: 	deviceType.toLowerCase(),
								device_token	: 	deviceToken,
								device_id		: 	deviceId,
							}];
						}

						/** Save user device details **/
						const users	=	db.collection("users");
						users.updateOne({_id : userId},userUpdatedData,(updateErr,updateResult)=>{
							callback(updateErr,updateResult);
						});
					},
					(callback)=>{
						/** Save user login details **/
						const user_logins	=	db.collection("user_logins");
						user_logins.insertOne({
								user_id			:	userId,
								device_type 	: 	deviceType,
								device_token	: 	deviceToken,
								device_id		: 	deviceId,
								logout_time		: 	"",
								created 		: 	getUtcDate(),
							},(err,insertResult)=>{
								callback(err, insertResult);
							}
						);
					},
				],
				(err, asyncResponse)=>{
					/** Send error response **/
					if(err) return resolve({status : STATUS_ERROR, options: options, message : res.__("system.something_going_wrong_please_try_again")});
					
					/** Send success response **/
					resolve({status	: STATUS_SUCCESS, options	: options});
				});
			}catch(e){
				/** Send error response **/
				resolve({
					status	:	STATUS_ERROR,
					options	: 	options,
					message	: 	res.__("system.something_going_wrong_please_try_again")
				});
			}
		});
	}// end saveLoginLogs()
}
module.exports = new RegistrationModel;