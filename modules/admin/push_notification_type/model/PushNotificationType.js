const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class PushNotificationType {

	constructor() {
		this.DbCollection = TABLE_PUSH_NOTIFICATION_TYPES;
	}

	/**
	 * Function to get notification type list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAllPushNotificationTypeList = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj.collection = this.DbCollection
			DbClass.getFindResult(req, res, next, optionObj).then(blockRes => {

				let responseStatus = (blockRes.status) ? blockRes.status : "";
				let responseResult = (blockRes.result) ? blockRes.result : "";
				if (responseStatus == STATUS_ERROR) {

					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					});

				} else {
					return resolve({
						status: STATUS_SUCCESS,
						result: responseResult,
						error: false,
						message: ""
					});
				}
			})
		});
	}

	/**
	 * Function to get notification type count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getPushNotificationTypeCount = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.getCountDocuments(req, res, next, optionObj).then(resultResCount => {

				let responseStatus = (resultResCount.status) ? resultResCount.status : "";
				let responseCount = (resultResCount.result) ? resultResCount.result : "";
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
					});
				}
				return resolve({
					status: STATUS_SUCCESS,
					result: responseCount,
					error: false,
					message: ""
				});
			})
		});
	}

	/**
	 * Function to get notification type find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getPushNotificationTypeFindOne = (optionObj) => {
		optionObj.collection = this.DbCollection;
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(resultResponse => {

				let responseStatus = (resultResponse.status) ? resultResponse.status : "";
				let responseResult = (resultResponse.result) ? resultResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					});
				}
				return resolve({
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				});
			})
		})
	}

	/**
   * Function to save notification type
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	savePushNotificationType = (req, res, next, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {

			DbClass.saveInsertOne(req, res, next, optionObj).then(saveResult => {
				let responseStatus = (saveResult.status) ? saveResult.status : "";
				let responseResult = (saveResult.result) ? saveResult.result : {};
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					});
				}
				return resolve({
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				});
			})
		})
	}


	/**
	* Function to  update one notification type
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	updateOnePushNotificationType = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, optionObj).then(updateResult => {

				let responseStatus = (updateResult.status) ? updateResult.status : "";
				let responseResult = (updateResult.result) ? updateResult.result : {};
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					});
				}
				return resolve({
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				});
			})
		})
	}

	/**
	* Function to  delete notification type details
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	deleteOnePushNotificationType = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.deleteOneRecords(req, res, optionObj).then(deleteResult => {
				let responseStatus = (deleteResult.status) ? deleteResult.status : "";
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: {},
						message: ""
					});
				}
				return resolve({
					status: STATUS_SUCCESS,
					result: {},
					error: false,
					message: ""
				});
			})
		})
	}

	/**
	* Function to  get aggregate notification type list
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	getAggregatePushNotificationTypeList = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {

			DbClass.getAggregateResult(req, res, optionObj).then(notificationTypeRes => {

				let responseStatus = (notificationTypeRes.status) ? notificationTypeRes.status : "";
				let responseResult = (notificationTypeRes.result) ? notificationTypeRes.result : "";
				if (responseStatus == STATUS_ERROR) {
					return resolve({
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					});
				} else {
					return resolve({
						status: STATUS_SUCCESS,
						result: responseResult,
						error: false,
						message: ""
					});

				}
			})
		})
	}
}
module.exports = new PushNotificationType();