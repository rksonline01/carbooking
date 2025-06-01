const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const async = require("async");
const clone 	= require("clone");
class AdminModule {

    constructor() {
        this.DbCollection = TABLE_ADMIN_MODULES;
    }

    /**
     * Function to get  aggrigated result
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */

    getAllModuleWithAggrigate = (req, res, optionObj) => {
        optionObj.collection = this.DbCollection
       
        return new Promise(resolve => {
            DbClass.getAggregateResult(req, res, optionObj).then(graphRes => {
               
                let graphResStatus = (graphRes.status) ? graphRes.status : "";
                let responseResult = (graphRes.result) ? graphRes.result : "";
                if (graphResStatus == STATUS_ERROR) {
                    //callback(null, graphResStatus);
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

            });
        })
    }

    /**
     * Function for result count
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */

    getResultCount = (req, res, optionObj) => {
        optionObj.collection = this.DbCollection
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
     * Function to get module listing
     * @param req As Request Data
     * @param res As Response Data
     */

    getAdminModulesListing = (req, res) => {
        return new Promise(resolve => {
            try {
                let admin_lang = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
                let userId = (req.session.user._id) ? req.session.user._id : "";
                let conditionsObj = { _id: new ObjectId(userId), is_deleted: NOT_DELETED };
                let optionObj = {
                    conditions: conditionsObj,
                    collection: TABLE_USERS,
                    fields: { user_role_id: 1, module_ids: 1 },
                }
                DbClass.getFindOne(optionObj).then(userResponse => {
                    let userResultStatus = (userResponse.status) ? userResponse.status : "";
                    let userResult = (userResponse.result) ? userResponse.result : "";
                    if (userResultStatus == STATUS_ERROR) {
                        let response = {
                            status: STATUS_SUCCESS,
                            result: []
                        };
                        resolve(response);
                    } else {
                        let userRoleId = (userResult.user_role_id) ? userResult.user_role_id : "";
                        let moduleLists = (userResult.module_ids) ? userResult.module_ids : [];
                        let moduleIds = moduleLists.map(moduleList => {
                            let moduleId = (moduleList._id) ? String(moduleList._id) : "";
                            return moduleId;
                        });

                        /** Set conditions **/
                        let conditionsObj = [
                            { $match: { is_active: ACTIVE } },
                            {
                                $lookup: {
                                    "from": this.DbCollection,
                                    "localField": "parent_id",
                                    "foreignField": "_id",
                                    "as": "parent_detail"
                                }
                            },
                            { $project: { parent_order: { $cond: { if: { $eq: ["$parent_id", 0] }, then: '$order', else: { "$arrayElemAt": ["$parent_detail.order", 0] } } }, order: 1, parent_id: 1, path: 1, group_path: 1, icon: 1,
                            title : { $cond : {if: { $ne : ["$pages_descriptions."+admin_lang+".title",'']},then:"$pages_descriptions."+admin_lang+".title",else:"$title"}}} },
                            { $sort: { parent_order: 1, parent_id: 1, order: 1 } }

                        ]
                        let optionObj = {
                            conditions: conditionsObj,
                            collection: this.DbCollection
                        }
                        DbClass.getAggregateResult(req, res, optionObj).then(modulesResponse => {
                            let modulesResStatus = (modulesResponse.status) ? modulesResponse.status : "";
                            let result = (modulesResponse.result) ? modulesResponse.result : "";
                            if (modulesResStatus == STATUS_ERROR) {
                                let response = {
                                    status: STATUS_ERROR,
                                    result: [],
                                    message: res.__("admin.system.something_going_wrong_please_try_again2")
                                };
                                resolve(response);
                            } else {
                                const clone = require("clone");
                                let moduleArray = {};
                                async.each(result, (module, parentCallback) => {
                                    let moduleId = (module._id) ? module._id : "";
                                    let parentId = (module.parent_id) ? module.parent_id : 0;
                                    if (moduleIds.indexOf(String(moduleId)) !== -1 || userRoleId == SUPER_ADMIN_ROLE_ID) {
                                        let detail = clone(module);

                                        /** Remove order and parent order and parent id field from array **/
                                        delete detail['order'];
                                        delete detail['parent_order'];
                                        delete detail['parent_id'];
                                        

                                        if (parentId == 0) {
                                            let childs = [];
                                            if (moduleArray[moduleId] && moduleArray[moduleId]['childs']) {
                                                childs = moduleArray[moduleId]['childs'];
                                            }
                                            detail["childs"] = childs;
                                            moduleArray[moduleId] = detail;
                                        } else {
                                            if (!moduleArray[parentId]) {
                                                moduleArray[parentId] = {};
                                            }
                                            if (!moduleArray[parentId]["childs"]) {
                                                moduleArray[parentId]["childs"] = [];
                                            }
                                            moduleArray[parentId]["childs"].push(detail);
                                        }
                                        parentCallback(null);
                                    } else {
                                        parentCallback(null);
                                    }
                                }, (parentErr) => {

                                    let response = {
                                        status: STATUS_SUCCESS,
                                        result: (moduleArray) ? Object.values(moduleArray) : []
                                    };
                                    resolve(response);
                                });
                            }

                        })

                    }
                });
            } catch (e) {
                let response = {
                    status: STATUS_ERROR,
                    result: [],
                    message: res.__("admin.system.something_going_wrong_please_try_again1")
                };
                resolve(response);
            }
        });
    };//End getAdminModulesListing()


    /**
     * Function to get all parent modules
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */

    getParentModules = (req, res, optionObj) => {
        optionObj.collection = this.DbCollection
        return new Promise(resolve => {
            DbClass.getFindAllWithoutLimit(optionObj).then(getModulesList => {
                let response = {
                    status: getModulesList.status,
                    result: getModulesList.result,
                    error: getModulesList.error,
                    message: getModulesList.message

                };
                resolve(response);

            })
        })
    }

    /**
     * Function to get module datail
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */
    getModuleDetail = (req, res, optionObj) => {

        optionObj.collection = this.DbCollection

        return new Promise(resolve => {
            DbClass.getFindOne(optionObj).then(moduleDetailData => {

                let response = {
                    status: moduleDetailData.status,
                    result: moduleDetailData.result,
                    error: moduleDetailData.error,
                    message: moduleDetailData.message

                };
                resolve(response);
            })
        })
    }


    /**
     * Function to create new module data     
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */

    saveModule = (req, res, optionObj) => {
        optionObj.collection = this.DbCollection
        return new Promise(resolve => {
            DbClass.saveInsertOne(req, res, optionObj).then(saveResult => {

                let response = {
                    status: saveResult.status,
                    result: saveResult.result,
                    error: saveResult.error,
                    message: saveResult.message
                };
                return resolve(response);
            })
        })
    }


    /**
     * Function to update module
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */

    updateModule = (req, res, optionObj) => {
        optionObj.collection = this.DbCollection
       
        return new Promise(resolve => {
            DbClass.updateOneRecord(req, res, optionObj).then(saveResult => {

                let response = {
                    status: saveResult.status,
                    result: saveResult.result,
                    error: saveResult.error,
                    message: saveResult.message
                };
                return resolve(response);
            })
        })

    }

    /**
     * Function to update module
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */
    updateMultipleModule   = (req,res,optionObj)=>{
        optionObj.collection = this.DbCollection
       
        return new Promise(resolve => {
            DbClass.updateManyRecords(req, res, optionObj).then(saveResult => {

                let response = {
                    status: saveResult.status,
                    result: saveResult.result,
                    error: saveResult.error,
                    message: saveResult.message
                };
                return resolve(response);
            })
        })
    }



    /**
     * Function to update module
     * @param req As Request Data
     * @param res As Response Data
     * @optionObj As input data
     */
      deleteMultipleModule   = (req,res,optionObj)=>{
        optionObj.collection = this.DbCollection
       
        return new Promise(resolve => {
            DbClass.deleteManyRecords(req, res, optionObj).then(saveResult => {

                let response = {
                    status: saveResult.status,
                    result: saveResult.result,
                    error: saveResult.error,
                    message: saveResult.message
                };
                return resolve(response);
            })
        })
    }


    /**
	 * Function to get admin modules array to use in roles and permission
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
    getAdminModulesTree = (req, res)=>{
		return new Promise(resolve=>{
			try{
                let conditions = [
                    {$match	 : {is_active : ACTIVE}},
					{$lookup : {
						"from" 			: TABLE_ADMIN_MODULES,
						"localField"	: "parent_id",
						"foreignField"	: "_id",
						"as" 			: "parent_detail"
					}},
					{$addFields	: {parent_order: {$cond: {if: {$eq: [ "$parent_id", 0]}, then: '$order', else: {"$arrayElemAt" : ["$parent_detail.order",0]} } }}},
					{$project 	: {parent_detail : 0 }},
					{$sort  	: {parent_order : SORT_ASC,parent_id : SORT_ASC,order : SORT_ASC}}
                ];
                let options = {
                    conditions : conditions,
                    collection : this.DbCollection
                }
                DbClass.getAggregateResult(req, res, options).then(modulesResponse => {
                    let status = modulesResponse.status;
                    let result = modulesResponse.result ? modulesResponse.result : [];
					if(status == STATUS_SUCCESS && result){
						if(result.length > 0){
							
							let moduleArray = {};

							async.each(result,(module, parentCallback)=>{
								let moduleId	= (module._id) 			? module._id 		: "";
								let parentId	= (module.parent_id) 	? module.parent_id 	: 0;

								let detail 				= clone(module);
								detail["id"] 			= String(moduleId);
								detail["parent_id"] 	= String(parentId);
								detail["name"] 			= (module.title) ? String(module.title) : "";

								if(parentId == 0){
									let childs		= [];
									if(moduleArray[moduleId] && moduleArray[moduleId]['childs']){
										childs = moduleArray[moduleId]['childs'];
									}
									detail["childs"] 		= childs;
									moduleArray[moduleId] 	= detail;
								}else{
									if(!moduleArray[parentId]){
										moduleArray[parentId] = {};
									}
									if(!moduleArray[parentId]["childs"]){
										moduleArray[parentId]["childs"] = [];
									}
									moduleArray[parentId]["childs"].push(detail);
								}
								parentCallback(null);
							},(parentErr)=>{
								let response = {
									status : STATUS_SUCCESS,
									result : (moduleArray) ? Object.values(moduleArray) : []
								};
								resolve(response);
							});
						}else{
							let response = {
								status  : STATUS_SUCCESS,
								result  : []
							};
							resolve(response);
						}
					}else{
						let response = {
							status  : STATUS_ERROR,
							result  : [],
							message : res.__("admin.system.something_going_wrong_please_try_again")
						};
						resolve(response);
					}
				});
			}catch(e){
				let response = {
					status  : STATUS_ERROR,
					result  : [],
					message : res.__("admin.system.something_going_wrong_please_try_again")
				};
				resolve(response);
			}
		});
	};//End getAdminModulesTree()

    /**
	 * Function to change format of module ids array
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
    formatModuleIdsArray = (req,res)=>{
        return new Promise(resolve=>{
            let modules   = (req.body.module_ids)	? req.body.module_ids	: {};
            
            if(typeof modules !== typeof undefined && modules){
                if(Object.keys(modules).length > 0){
                    let selectedModuleObjectIds = Object.keys(modules).map(records=>{
                        return (records) ? new ObjectId(records) : "";
                    });

                    let conditions = [
                        {$match:{ _id : {$in : selectedModuleObjectIds}}},
						{$lookup : {
							"from" 			: TABLE_ADMIN_MODULES,
							"localField"	: "_id",
							"foreignField"	: "parent_id",
							"as" 			: "child_detail"
						}},
						{$project 	: {
							_id:1, group_path:1, parent_id:1,
							childs: {"$size" : ["$child_detail"]}
						}},
                    ];

                    let option = {
                        conditions : conditions,
                        collection : this.DbCollection
                    }

                    DbClass.getAggregateResult(req, res, option).then(modulesResponse => {
                        let status = modulesResponse.status;
                        let result = modulesResponse.result ? modulesResponse.result : [];
                        if(status == STATUS_SUCCESS && result){
                            resolve(result);
                        }else{
                            resolve([]);
                        }
                    });
                }else{
                    resolve([]);
                }
            }else{
                resolve([]);
            }
        });
	};//End formatModuleIdsArray()
    
}
module.exports = new AdminModule();
