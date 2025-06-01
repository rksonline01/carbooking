const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class FranchiseContractsModel {

    constructor(){
        this.db_collection_name = TABLE_FRANCHISE_CONTRACTS;
    }

    /**
	 * Function to get Contract aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getFranchiseContractAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(contractResponse => {

				let responseStatus = (contractResponse.status) ? contractResponse.status : "";
				let responseCount = (contractResponse.result) ? contractResponse.result : "";
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
   * Function to save Contract
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveContract = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, optionObj).then(contractResponse => {
				let responseStatus = (contractResponse.status) ? contractResponse.status : "";
				let responseResult = (contractResponse.result) ? contractResponse.result : {};
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
   * Function to save Contract
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getContractDetail = (optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
	 * Function to update Contract
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateContract = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
	 * Function to update Many Contract
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateManyContract = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.updateManyRecords(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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
	 * Function to delete Contract
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	deleteContract = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name
		return new Promise(resolve => {
			DbClass.deleteOneRecords(req, res, optionObj).then(newsletterResponse => {
				let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
				let responseResult = (newsletterResponse.result) ? newsletterResponse.result : {};
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

module.exports = new FranchiseContractsModel;