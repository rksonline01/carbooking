const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class NotificationModel{
    constructor(){
        this.db_collection_name = TABLE_NOTIFICATIONS
    }


     /**
	 * Function to get notification aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getNotificationAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(notificationResult => {
                
				let responseStatus = (notificationResult.status) ? notificationResult.status : "";
				let responseCount = (notificationResult.result) ? notificationResult.result : "";
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
	 * Function to get notification list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getNotificationList = (optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getFindAll(optionObj).then(notificationResult => {
                
				let responseStatus = (notificationResult.status) ? notificationResult.status : "";
				let responseCount = (notificationResult.result) ? notificationResult.result : "";
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
	 * Function to update notifications
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateNotifications = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.updateManyRecords(req,res,optionObj).then(notificationResult => {
                
				let responseStatus = (notificationResult.status) ? notificationResult.status : "";
				let responseCount = (notificationResult.result) ? notificationResult.result : "";
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
	 * Function to update notifications
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getNotificationsCount = (optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getCountDocuments(optionObj).then(notificationResult => {
                
				let responseStatus = (notificationResult.status) ? notificationResult.status : "";
				let responseCount = (notificationResult.result) ? notificationResult.result : "";
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

}
module.exports = new NotificationModel;