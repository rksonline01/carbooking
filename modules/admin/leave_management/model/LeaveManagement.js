
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class LeaveManagement {

	constructor(){
		this.DbCollection = TABLE_LEAVES;
	}

	/**
	 * Function to get promo code aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getLeaveManagementAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
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
	 * Function to get promo code find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getLeaveManagementFindOne = (optionObj) => {
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
   * Function to save promo code
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveLeaveManagement = (req, res, optionObj) => {
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
	* Function to  update one promo code
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	updateOneLeaveManagement = (req, res, optionObj) => {
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
	* Function to  delete 
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	deleteOneLeaveManagement = (req, res, optionObj) => {
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



}
module.exports = new LeaveManagement();
