const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');

class CategoryModel{
    constructor(){
        this.db_collection_name = TABLE_CATEGORIES
    }

      /**
	 * Function to get category list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCategoryAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((categoryResponse)=>{
                let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                let responseResult = (categoryResponse.result) ? categoryResponse.result : "";

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
     * Function to get categories count
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    getCategoriesCount = (optionObj)=>{
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
	 * Function to save category
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveCagetory = (req,res,optionObj)=>{
		return new Promise(resolve=>{
			optionObj["collection"] = this.db_collection_name;

			DbClass.saveInsertOne(req,res,optionObj).then(categoryResponse=>{
				let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
				let responseResult = (categoryResponse.result) ? categoryResponse.result : "";
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
			});
		});
	}

    /**
	 * Function to get category list without limit
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCategoriesList = (optionObj)=>{
        return new Promise(resolve=>{

            optionObj["collection"] = this.db_collection_name;
            DbClass.getFindAllWithoutLimit(optionObj).then((categoryResponse)=>{
                let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                let responseResult = (categoryResponse.result) ? categoryResponse.result : "";
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
	 * Function to get category detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getCategoryDetail = (optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getFindOne(optionObj).then((categoryResponse)=>{
                let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                let responseResult = (categoryResponse.result) ? categoryResponse.result : "";
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
	 * Function to get category detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    updateCategory = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.updateOneRecord(req,res,optionObj).then((categoryResponse)=>{
                let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                let responseResult = (categoryResponse.result) ? categoryResponse.result : "";

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
	 * Function to get parent category
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getParentCategory = (req,res)=>{
        return new Promise(resolve=>{

            let language = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

            let conditions = {
                status : ACTIVE
            };

            let fields = {
                _id : 1,
                category_name :  { $cond : {if: { $ne : ["$pages_descriptions."+language+".category_name",'']},then:"$pages_descriptions."+language+".category_name",else:"$category_name"}}
            };

            let listOption = {
                conditions : conditions,
                fields : fields,
            };

            this.getCategoriesList(listOption).then(parentCategoryResponse=>{

                if(parentCategoryResponse.status == STATUS_SUCCESS){
                    let response = {
                        status : STATUS_SUCCESS,
                        result : parentCategoryResponse.result
                    };
                    return resolve(response);
                }else{
                    let response = {
                        status : STATUS_ERROR,
                        result : [],
                        message : parentCategoryResponse.message
                    };
                    return resolve(response);
                }
            })
        })
    }


    /**
	 * Function to get sub category
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getSubCategory = (req,res)=>{
        return new Promise(resolve=>{

            let language		= (req.body.lang_code)	? req.body.lang_code	: "";
            let categoryId      = (req.body.parent_id)  ? req.body.parent_id    : "";

            let conditions = {
                parent_id : new ObjectId(categoryId),
                status : ACTIVE
            };

            let fields = {
                _id : 1,
                category_name :  { $cond : {if: { $ne : ["$pages_descriptions."+language+".category_name",'']},then:"$pages_descriptions."+language+".category_name",else:"$category_name"}}
            };

            let listOption = {
                conditions : conditions,
                fields : fields,
            };


            this.getCategoriesList(listOption).then(parentCategoryResponse=>{
                if(parentCategoryResponse.status == STATUS_SUCCESS){
                    let response = {
                        status : STATUS_SUCCESS,
                        result : parentCategoryResponse.result
                    };
                    return resolve(response);
                }else{
                    let response = {
                        status : STATUS_ERROR,
                        result : [],
                        message : parentCategoryResponse.message
                    };
                    return resolve(response);
                }
            })
        })
    }


  

}

module.exports = new CategoryModel;