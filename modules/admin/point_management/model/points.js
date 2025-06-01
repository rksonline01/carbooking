const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class Package {

	constructor(){
		this.db_user_point_logs_collection = TABLE_USER_POINT_LOGS;
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

}

module.exports = new Package();
