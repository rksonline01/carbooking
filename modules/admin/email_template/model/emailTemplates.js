const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class EmailTemplate{

    constructor(){
        this.db_collection_name = TABLE_EMAIL_TEMPLATES;
    }

    
    /**
     * Function to get email template list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getEmailTemplateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindAll(optionObj).then((templateResponse)=>{
                let responseStatus = (templateResponse.status) ? templateResponse.status : "";
                let responseResult = (templateResponse.result) ? templateResponse.result : "";

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
     * Function to get email template count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getEmailTemplateCount = (req,res,optionObj)=>{
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
     * Function to get email template detail
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getTemplateDetail =(req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then(templateDetailResponse=>{
                let responseStatus = (templateDetailResponse.status) ? templateDetailResponse.status : "";
                let responseResult = (templateDetailResponse.result) ? templateDetailResponse.result : "";

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
     * Function to update email template detail
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    updateEmailTemplate = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;
            DbClass.updateOneRecord(req, res, optionObj).then(templateUpdateResponse=>{
                let responseStatus = (templateUpdateResponse.status) ? templateUpdateResponse.status : "";
                let responseResult = (templateUpdateResponse.result) ? templateUpdateResponse.result : "";

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
     * Function to get email template aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     getEmailTemplateAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((templateResponse)=>{
                let responseStatus = (templateResponse.status) ? templateResponse.status : "";
                let responseResult = (templateResponse.result) ? templateResponse.result : "";

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
}

module.exports = new EmailTemplate;