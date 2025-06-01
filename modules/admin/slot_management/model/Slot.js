
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
class Slot {

	constructor(){
		this.DbCollection = TABLE_SLOT;
	}

	/**
	 * Function to get Slot aggregate list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSlotAggregateList = (req, res, optionObj) => {
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
	 * Function to get Slot find one
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getSlotFindOne = (optionObj) => {
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
   * Function to save Slot
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	saveSlot = (req, res, optionObj) => {
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
	* Function to  update one Slot
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	updateOneSlot = (req, res, optionObj) => {
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
     * 
     * to get detail of slot
     */
	SlotDetails = (req,res,option)=>{
		 
        return new Promise(resolve=>{
            option["collection"] = this.DbCollection;
			
            DbClass.getFindOne(option).then(slotResponse=>{
                let responseStatus = (slotResponse.status) ? slotResponse.status : "";
				let responseResult = (slotResponse.result) ? slotResponse.result : "";
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

}
module.exports = new Slot();
