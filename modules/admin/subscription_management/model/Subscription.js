const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class Subscription {

	constructor(){
		this.DbCollection = TABLE_SUBSCRIPTIONS;
	}
	
	/**
	 * Function to get Subscription list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAllSubscriptionList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj.collection = this.DbCollection
			DbClass.getFindAll(optionObj).then(blockRes => {

				let responseStatus = (blockRes.status) ? blockRes.status : "";
				let responseResult = (blockRes.result) ? blockRes.result : "";
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
		});
	}


	/**
	 * Function to get Subscription count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSubscriptionCount = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.getCountDocuments(optionObj).then(resultResCount => {

				let responseStatus = (resultResCount.status) ? resultResCount.status : "";
				let responseCount = (resultResCount.result) ? resultResCount.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
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


	/**
	 * Function to get Subscription find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSubscriptionFindOne = (optionObj) => {
		optionObj.collection = this.DbCollection;
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
   * Function to save Subscription
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveSubscription = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
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
	* Function to  update one Subscription
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	updateOneSubscription = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
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
   * Function to get aggregate Subscription list 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getAggregateSubscriptionList = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(saveResult => {
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

}

module.exports = new Subscription();
