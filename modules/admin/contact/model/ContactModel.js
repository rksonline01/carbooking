const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class Contact {

	constructor(){
		this.DbCollection = TABLE_CONTACT_US;
	}
	
	/**
	 * Function to get contact find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getContactFindOne = (optionObj) => {
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
   * Function to get aggregate contact list 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getAggregateContactList = (req, res, optionObj) => {
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

	/**
   * Function to get update contact reply MESSAGE 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	updateContactReplyMessage = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.findAndupdateOneRecord(req, res, optionObj).then(saveResult => {
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
module.exports = new Contact();
