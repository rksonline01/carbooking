const dbClass = require("../../../../classes/dbClass");

const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class Master{

	constructor() {
		this.DbCollection = TABLE_MASTERS;
	}

	getAllMasterList = async (req, res, optionObj) => {
		/** Get user Details **/
		optionObj.collection = this.DbCollection;
		return new Promise(async resolve => {

			DbClass.getAggregateResult(req, res, optionObj).then(masterResponse => {
				let userResStatus = (masterResponse.status) ? masterResponse.status : "";
				let userResult = (masterResponse.result) ? masterResponse.result : "";

				if (userResStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: "in error case"
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: userResult,
					error: false,
					message: ""
				};
				return resolve(response);
			});
		});
	}


	/**
	 * Function to get faq count
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getMasterCount = (req, res, optionObj) => {
		optionObj.collection = this.DbCollection
		return new Promise(resolve => {
			DbClass.getCountDocuments(optionObj).then(resultResCount => {

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
	 * Function to save master
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveMaster = (req,res,optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.DbCollection;

			dbClass.saveInsertOne(req,res,optionObj).then(masterResponse=>{
				let responseStatus = (masterResponse.status) ? masterResponse.status : "";
				let responseResult = (masterResponse.result) ? masterResponse.result : "";
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
			});
		});
	}

	/**
	 * Function to get Master deatsils
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getMasterDetails = (optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.DbCollection;

			dbClass.getFindOne(optionObj).then(masterResponse=>{
				let responseStatus = (masterResponse.status) ? masterResponse.status : "";
				let responseResult = (masterResponse.result) ? masterResponse.result : "";
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
			});
		});
	}


	updateMasterDetails = (req,res,optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.DbCollection;

			dbClass.findAndupdateOneRecord(req,res,optionObj).then(masterResponse=>{
				let responseStatus = (masterResponse.status) ? masterResponse.status : "";
				let responseResult = (masterResponse.result) ? masterResponse.result : "";
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
			});
		})
	}

}
module.exports = new Master();
