const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class B2BDiscount {

	constructor(){
		this.DbCollection = TABLE_B2B_DISCOUNT;
	}
	

	/**
   * Function to get aggregate company list 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getAggregateB2BDiscountList = (req, res, optionObj) => {
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

    /**
     * 
     * to add B2BDiscount
     */
    addB2BDiscountData = (req,res,option)=>{
        return new Promise(resolve=>{
            option["collection"] = this.DbCollection;
            DbClass.saveInsertOne(req,res,option).then(companyResponse=>{
                let responseStatus = (companyResponse.status) ? companyResponse.status : "";
				let responseResult = (companyResponse.result) ? companyResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: res.__("admin.system.something_going_wrong_please_try_again")
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
     * 
     * to get detail of B2BDiscount
     */
	B2BDiscountDetails = (req,res,option)=>{		 
		
        return new Promise(resolve=>{
            option["collection"] = this.DbCollection;
			
            DbClass.getFindOne(option).then(companyResponse=>{
				
                let responseStatus = (companyResponse.status) ? companyResponse.status : "";
				let responseResult = (companyResponse.result) ? companyResponse.result : "";
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
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
            })
        })
    }
    

	 /**
   * Function to get update one
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	updateOneB2BDiscount = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.DbCollection
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
   	* Function to delete one
   	*
   	* @param req As Request Data
   	* @param res As Response Data
   	*
   	* @return render/json
   	*/
	 deleteB2BDiscount = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.DbCollection
			DbClass.deleteOneRecords(req, res, optionObj).then(updateResult => {
				
				let responseStatus = (updateResult.status) ? updateResult.status : "";				
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: {},
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: {},
					error: false,
					message: ""
				};
				return resolve(response);
			})
		})
	}

}
module.exports = new B2BDiscount();
