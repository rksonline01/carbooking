const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

class TextSetting {

    constructor(){
        this.db_collection_name = TABLE_TEXT_SETTINGS;
    }

    /**
     * Function to get textsettings list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getAllTextSetting = (req,res,optionObj)=>{
        return new Promise(resolve => {

            DbClass.getFindAll(optionObj).then(textSettinRes => {

                let responseStatus = (textSettinRes.status) ? textSettinRes.status : "";
                let responseResult = (textSettinRes.result) ? textSettinRes.result : "";
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
        });
    }


    /**
     * Function to get textsettings count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getTextSettingCount = (req, res, optionObj) => {
        return new Promise(resolve => {
            DbClass.getCountDocuments(optionObj).then(resultResCount => {

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
     * Function to get textsettings find one
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getTextSettingFindOne = (optionObj) => {

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
    * Function to get textsettings save
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    saveTextSetting = (req, res, optionObj) =>{
        return new Promise(resolve =>{
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
    * Function to get textsettings update one
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    updateOneTextSetting = (req, res, optionObj)=>{
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
     * Function to get textsettings aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     getAggregateTextSetting = (req,res,optionObj)=>{
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_name;
            DbClass.getAggregateResult(req,res,optionObj).then(textSettinRes => {

                let responseStatus = (textSettinRes.status) ? textSettinRes.status : "";
                let responseResult = (textSettinRes.result) ? textSettinRes.result : "";
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
        });
    }

     /**
     * Function to get textsettings aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    deleteOneTextSetting = (req,res,optionObj)=>{
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_name;
            DbClass.deleteOneRecords(req,res,optionObj).then(textSettinRes => {

                let responseStatus = (textSettinRes.status) ? textSettinRes.status : "";
                let responseResult = (textSettinRes.result) ? textSettinRes.result : "";
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
        });
    }

     /**
     * Function to get textsettings aggregate list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     deleteMultipleTextSetting = (req,res,optionObj)=>{
        return new Promise(resolve => {
            optionObj["collection"] = this.db_collection_name;
            DbClass.deleteManyRecords(req,res,optionObj).then(textSettinRes => {
                let responseStatus = (textSettinRes.status) ? textSettinRes.status : "";
                let responseResult = (textSettinRes.result) ? textSettinRes.result : "";
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
        });
    }
}
module.exports = new TextSetting();