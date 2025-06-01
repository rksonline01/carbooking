const DbClass = require("../../../../classes/dbClass");
class UserAddressModel{

    constructor(){
        this.db_collection_name = TABLE_USER_ADDRESSES;
        this.db_user_collection_name = TABLE_USERS;

    }

    
	/**
	 * Function to get User Address list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getUserAddressAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((productResponse)=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
                let responseResult = (productResponse.result) ? productResponse.result : "";

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
     * Function to get count of address's of user
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getUserAddressCount = (options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_collection_name;
            DbClass.getCountDocuments(options).then(addressResponse=>{
                let responseStatus = (addressResponse.status) ? addressResponse.status : "";
                let responseResult = (addressResponse.result) ? addressResponse.result : "";

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
     * Function to save user address
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    saveUserAddress = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_collection_name;

            DbClass.saveInsertOne(req,res,options).then(saveResponse=>{
                let responseStatus = (saveResponse.status) ? saveResponse.status : "";
                let responseResult = (saveResponse.result) ? saveResponse.result : "";
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
     * Function to get user address detail
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getUserAddressDetail = (options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_collection_name;

            DbClass.getFindOne(options).then(addressResponse=>{
                let responseStatus = (addressResponse.status) ? addressResponse.status : "";
                let responseResult = (addressResponse.result) ? addressResponse.result : "";
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
     * Function to update user address
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    updateUserAddress = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_collection_name;
            
            DbClass.updateOneRecord(req,res,options).then(updateResponse=>{
                let responseStatus = (updateResponse.status) ? updateResponse.status : "";
                let responseResult = (updateResponse.result) ? updateResponse.result : "";
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
     * Function to user list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    userAggregateList = async(req,res,options)=>{
		/** Get user Details **/
	   return new Promise(async resolve=>{
			options["collection"] = this.db_user_collection_name;		
		   	DbClass.getAggregateResult(req, res, options).then(userResponse => {
			   let userResStatus = (userResponse.status) ? userResponse.status : "";
			   let userResult = (userResponse.result) ? userResponse.result : "";

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
    
}

module.exports = new UserAddressModel;