const crypto = require("crypto");
const async = require("async");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class User {

	constructor() {
		this.db_collection_name = TABLE_USERS;
		this.db_wallet_transaction_logs = TABLE_WALLET_TRANSACTION_LOGS;
		this.db_user_point_logs_collection = TABLE_USER_POINT_LOGS;
		this.db_user_subscriptions_collection_name = TABLE_USER_SUBSCRIPTIONS;

	}

	/**
	* Function to get user list
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getAllUserList = (req, res, optionObj) => {
		return new Promise(resolve => {
			DbClass.getFindAll(optionObj).then(userResponse => {

				let responseStatus = (userResponse.status) ? userResponse.status : "";
				let responseMessage = (userResponse.message) ? userResponse.message : "";
				let responseResult = (userResponse.result) ? userResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: responseMessage
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
		});
	}


	/**
	* Function to get user count
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getUserCount = (req, res, optionObj) => {
		return new Promise(resolve => {
			DbClass.getCountDocuments(optionObj).then(resultResCount => {

				let responseStatus = (resultResCount.status) ? resultResCount.status : "";
				let responseMessage = (resultResCount.message) ? resultResCount.message : "";
				let responseCount = (resultResCount.result) ? resultResCount.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: responseMessage
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseCount,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}


	getUserDetails = (options) => {
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
			}
			catch (error) {
				let response = {
					status: STATUS_ERROR,
					result: {},
					error: true,
					message: "in error case"
				};
				return resolve(response);
			}
		});
	}


	userAggregateResult = async (req, res, options) => {
		/** Get user Details **/
		return new Promise(async resolve => {
			options["collection"] = this.db_collection_name;
			DbClass.getAggregateResult(req, res, options).then(userResponse => {
				let userResStatus = (userResponse.status) ? userResponse.status : "";
				let userResult = (userResponse.result) ? userResponse.result : "";

				if (userResStatus == STATUS_ERROR) {
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
					result: userResult,
					error: false,
					message: ""
				};
				return resolve(response);
			});
		});
	}


	/**
   * Function to save user data
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveUserData = (req, res, optionObj) => {
		return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, optionObj).then(saveResult => {
				let responseStatus = (saveResult.status) ? saveResult.status : "";
				let responseResult = (saveResult.result) ? saveResult.result : {};
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
	updateOneUser = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_name
			DbClass.updateOneRecord(req, res, optionObj).then(updateResult => {

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
		})
	}
	
	
	
	/**
	 * Function to update Many User
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateManyUser = (req, res, option) => {
		return new Promise(resolve => {
			option["collection"] = this.db_collection_name;
			DbClass.updateManyRecords(req, res, option).then(updateManyResponse => {
				let responseStatus = (updateManyResponse.status) ? updateManyResponse.status : "";
				let responseResult = (updateManyResponse.result) ? updateManyResponse.result : "";
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
		})
	}


	/**
	 * Function to get wallet transaction
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getWalletTransationAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_wallet_transaction_logs;

			DbClass.getAggregateResult(req, res, optionObj).then((listResponse) => {
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
	* Function to get user list
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getWalletTransationList = (req, res, optionObj) => {
		return new Promise(resolve => {	
			optionObj["collection"] = this.db_wallet_transaction_logs;
			DbClass.getFindAll(optionObj).then(userResponse => {

				let responseStatus = (userResponse.status) ? userResponse.status : "";
				let responseMessage = (userResponse.message) ? userResponse.message : "";
				let responseResult = (userResponse.result) ? userResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: responseMessage
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
		});
	}


	/**
	 * Function to get coins logs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getPointsAggregateList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_user_point_logs_collection;

			DbClass.getAggregateResult(req, res, optionObj).then((coinsResponse) => {
				let responseStatus = (coinsResponse.status) ? coinsResponse.status : "";
				let responseResult = (coinsResponse.result) ? coinsResponse.result : "";

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
	 * Function to get user Subscription list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAggregateUserSubscription = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_user_subscriptions_collection_name;

			DbClass.getAggregateResult(req, res, optionObj).then((JobResponse) => {
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


}
module.exports = new User();
