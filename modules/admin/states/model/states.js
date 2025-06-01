const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class State{

    constructor(){
        this.db_collection_name = TABLE_STATES;
    }

    
    /**
	 * Function to get state list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getStateList = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindAll(optionObj).then((stateResponse)=>{
                let responseStatus = (stateResponse.status) ? stateResponse.status : "";
                let responseResult = (stateResponse.result) ? stateResponse.result : "";

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
	 * Function to get state list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
     getStateAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((stateResponse)=>{
                let responseStatus = (stateResponse.status) ? stateResponse.status : "";
                let responseResult = (stateResponse.result) ? stateResponse.result : "";

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
     * Function to get State count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getStateCount = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getCountDocuments(optionObj).then(countResponse=>{
                let responseStatus = (countResponse.status) ? countResponse.status : "";
                let responseResult = (countResponse.result) ? countResponse.result : "";

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
            })
        })
    }

    /**
     * Function to add State
     * 
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    addState = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.saveInsertOne(req,res,optionObj).then(stateResponse=>{
				let responseStatus = (stateResponse.status) ? stateResponse.status : "";
				let responseResult = (stateResponse.result) ? stateResponse.result : "";
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
			});
        })
    }

    /**
	 * Function to get state details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getStateDetails = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then((stateResponse)=>{
                let responseStatus = (stateResponse.status) ? stateResponse.status : "";
                let responseResult = (stateResponse.result) ? stateResponse.result : "";

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
     * Function to update State
     * 
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     updateState = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.updateOneRecord(req,res,optionObj).then(stateResponse=>{
				let responseStatus = (stateResponse.status) ? stateResponse.status : "";
				let responseResult = (stateResponse.result) ? stateResponse.result : "";
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
			});
        })
    }
}

module.exports = new State;
