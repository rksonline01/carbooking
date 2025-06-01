const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class EmailLogs{

    constructor(){
        this.db_collection_name = TABLE_EMAIL_LOGS;
    }

    
    /**
     * Function to get email logs list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getEmailLogsList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindAll(optionObj).then((logResponse)=>{
                let responseStatus = (logResponse.status) ? logResponse.status : "";
                let responseResult = (logResponse.result) ? logResponse.result : "";

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
        })
    }


    /**
     * Function to get email log count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getEmailLogCount = (req,res,optionObj)=>{
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
     * Function to get email log detail
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getEmailLogDetail =(req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then(logDetailResponse=>{
                let responseStatus = (logDetailResponse.status) ? logDetailResponse.status : "";
                let responseResult = (logDetailResponse.result) ? logDetailResponse.result : "";

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
     * Function to get email log aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     getEmailLogAggregateList =(req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then(logDetailResponse=>{
                let responseStatus = (logDetailResponse.status) ? logDetailResponse.status : "";
                let responseResult = (logDetailResponse.result) ? logDetailResponse.result : "";

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

}

module.exports = new EmailLogs;