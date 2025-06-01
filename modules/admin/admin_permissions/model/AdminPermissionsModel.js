const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class AdminPermissionModel{
    constructor() {
        this.db_collection_name = TABLE_USERS;
		this.db_role_collection_name = TABLE_ADMIN_ROLE;
    }

    /**
	 * Function to get sub admin aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSubAdminAggregateList = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, optionObj).then(subAdminResponse => {
                let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
				let result = (subAdminResponse.result) ? subAdminResponse.result : "";
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
					result: result,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}

    /**
	 * Function to add subAdmin
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	addSubAdmin = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, optionObj).then(subAdminResponse => {

				let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
				let result = (subAdminResponse.result) ? subAdminResponse.result : "";
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
					result: result,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}


	/**
	 * Function to add subAdmin
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSubAdminDetail = (optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(subAdminResponse => {

				let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
				let result = (subAdminResponse.result) ? subAdminResponse.result : "";
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
					result: result,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}

	/**
	 * Function to add subAdmin
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateSubAdmin = (req, res, optionObj) => {
		optionObj.collection = this.db_collection_name;
		return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, optionObj).then(subAdminResponse => {

				let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
				let result = (subAdminResponse.result) ? subAdminResponse.result : "";
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
					result: result,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}

	/**
	 * Function to modules of role
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getRoleModules = (optionObj) => {
		optionObj.collection = this.db_role_collection_name;
		return new Promise(resolve => {
			DbClass.getFindOne(optionObj).then(subAdminResponse => {

				let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
				let result = (subAdminResponse.result) ? subAdminResponse.result : "";
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
					result: result,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		});
	}
}
module.exports = new AdminPermissionModel;