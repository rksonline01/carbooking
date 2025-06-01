const crypto = require("crypto");
const async = require("async");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class WalletTransationLogs {

	constructor() {

		this.db_wallet_transaction_logs = TABLE_WALLET_TRANSACTION_LOGS;
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

 

}
module.exports = new WalletTransationLogs();
