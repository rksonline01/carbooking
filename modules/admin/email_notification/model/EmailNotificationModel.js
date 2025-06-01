const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class EmailNotificationModel{

    constructor() {
        this.db_collection_name = TABLE_EMAIL_NOTIFICATIONS;
        this.user_collection_name = TABLE_USERS;
    }

    /**
	 * Function to get pn aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getEmailNotificationAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(resultResCount => {
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
	 * Function to get all user list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getUserList = (option)=>{
        option["collection"] = this.user_collection_name;
        return new Promise(resolve=>{
            DbClass.getFindAllWithoutLimit(option).then(userResponse=>{
                
                let responseStatus = (userResponse.status) ? userResponse.status : "";
				let responseCount = (userResponse.result) ? userResponse.result : "";
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
        })
    }


    getDistinctUserList = (option)=>{
        option["collection"] = this.user_collection_name;
        return new Promise(resolve=>{
            DbClass.getDistinctList(option).then(userResponse=>{
                
                let responseStatus = (userResponse.status) ? userResponse.status : "";
				let responseCount = (userResponse.result) ? userResponse.result : "";
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
        })
    }

    /**
   * Function to save push notification
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveEmailNotification = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
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
     * Function to delete push notification
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	deleteEmailNotification = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.deleteOneRecords(req, res, optionObj).then(saveResult => {
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
     * Function to update push notification
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	updateEmailNotification = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, optionObj).then(saveResult => {
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

module.exports = new EmailNotificationModel;