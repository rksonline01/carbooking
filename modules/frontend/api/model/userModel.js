const DbClass = require("../../../../classes/dbClass");

class UserModel {
	constructor() {
		this.db_collection_name = TABLE_USERS;
		this.db_user_subscriptions_collection_name = TABLE_USER_SUBSCRIPTIONS;
		this.db_user_packages_collection_name = TABLE_USER_PACKAGES;
		this.db_payment_transaction_collection_name = TABLE_PAYMENT_TRANSACTIONS;
	}

	/**
	 * Function to save MySubscription data
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveMySubscription = (req, res, optionObj) => {
		optionObj.collection = this.db_user_subscriptions_collection_name;
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
	 * Function to get My Subscription list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAggregateMySubscriptionList = (req, res, optionObj) => {
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


	/**
	 * Function to get My Subscription find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getMySubscriptionFindOne = (optionObj) => {
		optionObj.collection = this.db_user_subscriptions_collection_name;
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(resultResponse => {

				let responseStatus = (resultResponse.status) ? resultResponse.status : "";
				let responseResult = (resultResponse.result) ? resultResponse.result : "";
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
	 * Function to save My Package data
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveMyPackage = (req, res, optionObj) => {
		optionObj.collection = this.db_user_packages_collection_name;
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
	 * Function to get My Package list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAggregateMyPackageList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_user_packages_collection_name;

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


	/**
	 * Function to get My Package find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getMyPackageFindOne = (optionObj) => {
		optionObj.collection = this.db_user_packages_collection_name;
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(resultResponse => {

				let responseStatus = (resultResponse.status) ? resultResponse.status : "";
				let responseResult = (resultResponse.result) ? resultResponse.result : "";
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
	 * Function to save payment transaction
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveMyPaymentTransaction = (req, res, optionObj) => {
		optionObj.collection = this.db_payment_transaction_collection_name
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
	* Function to get payment transaction list
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getMyPaymentTransactionList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_payment_transaction_collection_name;

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
	* Function to get user list
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getAllUserList = (req, res, optionObj) => {
		return new Promise(resolve => {
			
			optionObj["collection"] = this.db_collection_name

			DbClass.getAggregateResult(req, res, optionObj).then(userResponse => {
 
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

}

module.exports = new UserModel;