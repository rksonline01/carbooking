const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class PopupAds {

	constructor(){
		this.DbCollection = TABLE_POPUP_ADS;
	}
	

	/**
   * Function to get aggregate popup ads list 
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	getAggregatePopupAdsList = (req, res, optionObj) => {
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
     * to add Popup Ads
     */
    addPopupAdsData = (req,res,option)=>{
        return new Promise(resolve=>{
            option["collection"] = this.DbCollection;
            DbClass.saveInsertOne(req,res,option).then(testimonialsResponse=>{
                let responseStatus = (testimonialsResponse.status) ? testimonialsResponse.status : "";
				let responseResult = (testimonialsResponse.result) ? testimonialsResponse.result : "";
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
     * to get detail of PopupAds
     */
	PopupAdsDetails = (req,res,option)=>{
		 
        return new Promise(resolve=>{
            option["collection"] = this.DbCollection;
			
            DbClass.getFindOne(option).then(testimonialsResponse=>{
				
                let responseStatus = (testimonialsResponse.status) ? testimonialsResponse.status : "";
				let responseResult = (testimonialsResponse.result) ? testimonialsResponse.result : "";
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
	updateOnePopupAds = (req, res, optionObj) => {
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
	 deletePopupAds = (req, res, optionObj) => {
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
module.exports = new PopupAds();
