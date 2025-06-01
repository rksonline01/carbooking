const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class SmsLogs {

	constructor(){
		this.DbCollection = TABLE_SMS_LOGS;
	}
	

	/**
   * Function to get aggregate sms logs list 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getAggregateSmsLogsList = (req, res, optionObj) => {
		optionObj["collection"] = this.DbCollection
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
module.exports = new SmsLogs();
