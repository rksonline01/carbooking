const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class AdminRoleModel{

    constructor(){
        this.db_collection_name = TABLE_ADMIN_ROLE;
        this.user_collection_name = TABLE_USERS;
    }

     /**
	 * Function to get admin role aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getAggregateAdminRole = (req,res,option)=>{
        option["collection"] = this.db_collection_name;
        return new Promise(resolve => {
			DbClass.getAggregateResult(req, res, option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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
	 * Function to save admin role 
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    saveAdminRole = (req,res,option)=>{
        option["collection"] = this.db_collection_name;
        return new Promise(resolve => {
			DbClass.saveInsertOne(req, res, option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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
	 * Function to get admin role detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getAdminRoleDetail = (option)=>{
        option["collection"] = this.db_collection_name;
        return new Promise(resolve => {
			DbClass.getFindOne(option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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
	 * Function to update admin role 
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    updateAdminRole = (req,res,option)=>{
        option["collection"] = this.db_collection_name;
        return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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
	 * Function to get admin role detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getUserList = (option)=>{
        option["collection"] = this.user_collection_name;
        return new Promise(resolve => {
			DbClass.getFindAllWithoutLimit(option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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
	 * Function to update user role
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    updateUser = (req,res,option)=>{
        option["collection"] = this.user_collection_name;
        return new Promise(resolve => {
			DbClass.updateOneRecord(req, res, option).then(roleResult => {
                
				let responseStatus = (roleResult.status) ? roleResult.status : "";
				let responseCount = (roleResult.result) ? roleResult.result : "";
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

}
module.exports = new AdminRoleModel;