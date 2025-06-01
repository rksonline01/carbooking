const DbClass = require("../../../../classes/dbClass");
class NotificationModel {

    constructor() {
        this.db_collection_notification = TABLE_NOTIFICATIONS;
    }

    /**
     * Function to get notifications
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getNotificationAggregateList = (req, res, optionObj) => {
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_notification;

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
     * Function to update user address
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    updateAllNotifications = (req, res, options) => {
        return new Promise(resolve => {
            options["collection"] = this.db_collection_notification;

            DbClass.updateManyRecords(req, res, options).then(updateResponse => {
                let responseStatus = (updateResponse.status) ? updateResponse.status : "";
                let responseResult = (updateResponse.result) ? updateResponse.result : "";
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
	 * Function to get Notifications count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getNotificationsCount = (options) => {
		return new Promise(resolve => {
			options["collection"] = this.db_collection_notification;
			DbClass.getCountDocuments(options).then(orderResponse => {
				let responseStatus = (orderResponse.status) ? orderResponse.status : "";
				let responseResult = (orderResponse.result) ? orderResponse.result : 0;

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

}

module.exports = new NotificationModel;