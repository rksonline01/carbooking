const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class Country{

    constructor(){
        this.db_collection_name = TABLE_COUNTRY;
    }


    /**
	 * Function to get countries list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCountryList = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindAll(optionObj).then((countryResponse)=>{
                let responseStatus = (countryResponse.status) ? countryResponse.status : "";
                let responseResult = (countryResponse.result) ? countryResponse.result : "";

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
     * Function to get country count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getCountryCount = (optionObj)=>{
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
     * Function to add country
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    addCountry = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.saveInsertOne(req,res,optionObj).then(countryResponse=>{
				let responseStatus = (countryResponse.status) ? countryResponse.status : "";
				let responseResult = (countryResponse.result) ? countryResponse.result : "";
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
    getCountryDetails = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then((countryResponse)=>{
                let responseStatus = (countryResponse.status) ? countryResponse.status : "";
                let responseResult = (countryResponse.result) ? countryResponse.result : "";

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
     * Function to update country
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     updateCountry = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.updateOneRecord(req,res,optionObj).then(countryResponse=>{
                let responseStatus = (countryResponse.status) ? countryResponse.status : "";
				let responseResult = (countryResponse.result) ? countryResponse.result : "";
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
     * Function to get country aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getCountryAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

			DbClass.getAggregateResult(req,res,optionObj).then(countryResponse=>{
				let responseStatus = (countryResponse.status) ? countryResponse.status : "";
				let responseResult = (countryResponse.result) ? countryResponse.result : "";
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

module.exports = new Country;
