const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class Cities{

    constructor(){
        this.db_collection_name = TABLE_CITY;
    }

    
    /**
	 * Function to get countries list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCitiesList = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindAll(optionObj).then((citiesResponse)=>{
                let responseStatus = (citiesResponse.status) ? citiesResponse.status : "";
                let responseResult = (citiesResponse.result) ? citiesResponse.result : "";

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
	 * Function to get city list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCitiesAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((citiesResponse)=>{
                let responseStatus = (citiesResponse.status) ? citiesResponse.status : "";
                let responseResult = (citiesResponse.result) ? citiesResponse.result : "";

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
     * Function to get cities count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getCitiesCount = (optionObj)=>{
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
     * Function to add cities
     * 
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    addCities = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.saveInsertOne(req,res,optionObj).then(citiesResponse=>{
				let responseStatus = (citiesResponse.status) ? citiesResponse.status : "";
				let responseResult = (citiesResponse.result) ? citiesResponse.result : "";
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
	 * Function to get countries details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCitiesDetails = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then((citiesResponse)=>{
                let responseStatus = (citiesResponse.status) ? citiesResponse.status : "";
                let responseResult = (citiesResponse.result) ? citiesResponse.result : "";

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
     * Function to update cities
     * 
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     updateCities = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.updateOneRecord(req,res,optionObj).then(citiesResponse=>{
                let responseStatus = (citiesResponse.status) ? citiesResponse.status : "";
				let responseResult = (citiesResponse.result) ? citiesResponse.result : "";
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

module.exports = new Cities;
