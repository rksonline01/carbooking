const AdminRoleModel = require("./model/AdminRoleModel");
const AdminModule = require(WEBSITE_ADMIN_MODULES_PATH+"admin_modules/model/AdminModule");
const { ObjectId } = require('mongodb');
const async 		= require('async');
function AdminRoleController(){

    /**
	 * Function for get admin role list
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res)=>{
        if(isPost(req)){
            let limit			= 	(req.body.length)	?	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? 	parseInt(req.body.start)	:DEFAULT_SKIP;
            let search_data 	=   req.body.search_data;

            /** Configure Datatable conditions*/
			configDatatable(req,res,null).then((dataTableConfig)=>{
                let commonConditions = {
                    is_shown : SHOWN,
                };

                if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                        }
                    })
                }
                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

                let conditions = [{
                    $facet : {
                        "roles_list" : [
                            {$match	: dataTableConfig.conditions},
                            {
								$project : {
									"_id" 						:1,
									"role_name" 				:1,
									"category_ids"				:1,
									"not_deletable"				:1,
									"modified" 					:1,
									"active"   					:1,
									"created"					:1,
								}
							},
							{ $sort: dataTableConfig.sort_conditions},
							{ $skip: skip },
							{ $limit: limit },
                        ],
                        "roles_all_count" : [
                            {$match : commonConditions},
                            {
                                $group : {
                                    _id : null,
                                    count : {$count : {}}
                                }
                            },
                            {
                                $project : {
                                    _id :0 , count :1
                                }
                            }
                        ],
                        "roles_filter_count" : [
                            {$match: dataTableConfig.conditions},
                            {
                                $group : {
                                    _id : null,
                                    count : {$count : {}}
                                }
                            },
                            {
                                $project : {
                                    _id :0 , count :1
                                }
                            }
                        ]
                    }
                }];

                let option = {
                    conditions : conditions
                }

                AdminRoleModel.getAggregateAdminRole(req,res,option).then(roleResult=>{
                    let responseStatus = (roleResult.status) ? roleResult.status : "";
                    let responseResult = (roleResult.result && roleResult.result[0]) ? roleResult.result[0] : "";

                    let roles_list = (responseResult && responseResult.roles_list) ? responseResult.roles_list : [];
                    let roles_all_count = (responseResult && responseResult.roles_all_count && responseResult.roles_all_count[0] && responseResult.roles_all_count[0]["count"]) ? responseResult.roles_all_count[0]["count"] : DEACTIVE;
                    let roles_filter_count = (responseResult && responseResult.roles_filter_count && responseResult.roles_filter_count[0] && responseResult.roles_filter_count[0]["count"]) ? responseResult.roles_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   roles_list,
                        recordsTotal	:	roles_all_count,
                        recordsFiltered	:  	roles_filter_count,
                    });
                })
            })

        }else{
            /** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/admin_role/list"]);
			res.render('list');
        }
    }


     /**
	 * Function for add role
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    this.add = (req, res)=>{
        if(isPost(req)){

            /** Sanitize Data **/
            req.body = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
            let roleName  = (req.body.role)		    ? req.body.role	 		: "";
            let modules   = (req.body.module_ids)	? req.body.module_ids	: "";

            try{
                /** Include admin modules Module **/
                AdminModule.formatModuleIdsArray(req, res).then((moduleArray)=>{
                    let insertData = {
                        role_name 	: roleName,
                        module_ids 	: moduleArray,
                        is_shown    : SHOWN,
                        assign_modules 	: modules,
                        created 	: getUtcDate(),
                        modified 	: getUtcDate()
                    };

                    let saveOption = {
                        insertData : insertData
                    }

                    AdminRoleModel.saveAdminRole(req,res,saveOption).then(saveResponse=>{
                        if(saveResponse.status == STATUS_SUCCESS){
                            /** Send success response **/
                            req.flash(STATUS_SUCCESS,res.__("admin.admin_role.role_has_been_added_successfully"));
                            res.send({
                                status		: STATUS_SUCCESS,
                                redirect_url: WEBSITE_ADMIN_URL+"admin_role",
                                message		: res.__("admin.admin_role.role_has_been_added_successfully")
                            });
                        }else{
                            /** Send error response **/
                            res.send({
                                status : STATUS_ERROR,
                                message: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}],
                            });
                        }
                    })
                })
            }catch(e){
                /** Send error response **/
                res.send({
                    status	: STATUS_ERROR,
                    message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                });
            }
        }else{
             /** Include admin modules Module **/
            AdminModule.getAdminModulesTree(req, res).then((response)=>{
                 /** Render view file **/
                req.breadcrumbs(BREADCRUMBS['admin/admin_role/add']);
                res.render('add',{
                    admin_modules : response.result
                });
            });
        }
    }

    /**
	 * Function for edit role
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    this.edit = (req, res)=>{
        let roleId	= (req.params.id) ? req.params.id : "";
        if(roleId){
            if(isPost(req)){
                /** Sanitize Data **/
                req.body 	  = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                let roleName  = (req.body.role)	        ? req.body.role	        : "";
                let modules   = (req.body.module_ids)	? req.body.module_ids	: "";

                    try{
                        AdminModule.formatModuleIdsArray(req, res).then((moduleArray)=>{
                            let conditions = {
                                _id : new ObjectId(roleId)
                            };

                            let updateData = {
                                role_name 	: roleName,
                                module_ids 	: moduleArray,
                                assign_modules 	: modules,
                                modified 	: getUtcDate()
                            };

                            let updateOptions = {
                                conditions : conditions,
                                updateData : {$set : updateData}
                            };

                            AdminRoleModel.updateAdminRole(req,res,updateOptions).then(updateResponse=>{
                                if(updateResponse.status == STATUS_SUCCESS){
                                    let userConditions = {
                                        user_role_id 		: roleId,
										is_admin_approved 	: ACTIVE,
                                    };

                                    let userOptions = {
                                        conditions : userConditions
                                    };

                                    AdminRoleModel.getUserList(userOptions).then(userResponse=>{
                                        let result = userResponse.result ? userResponse.result : [];
                                        if(result.length > 0){
                                            async.forEachOf(result,(records,index,eachCallback)=>{
                                                let userId = (records._id) ? records._id : MONGO_ID;

                                                let userUpdateCondition = {
                                                    _id : new ObjectId(userId)
                                                };
                                                
                                                let userUpdateData = {
                                                    module_ids 	: moduleArray,
                                                };

                                                let userUpdateOption = {
                                                    conditions : userUpdateCondition,
                                                    updateData : {$set : userUpdateData}
                                                };

                                                AdminRoleModel.updateUser(req,res,userUpdateOption).then(userUpdateResponse=>{
                                                    eachCallback(null);
                                                })

                                            }, (parentErr) => {
													
                                                /** Send success response **/
                                                req.flash(STATUS_SUCCESS,res.__("admin.admin_role.role_details_updated_successfully"));
                                                res.send({
                                                    status		: STATUS_SUCCESS,
                                                    redirect_url: WEBSITE_ADMIN_URL+"admin_role",
                                                    message		: res.__("admin.admin_role.role_details_updated_successfully")
                                                });
                                            })

                                        }else{
                                            /** Send success response **/
                                            req.flash(STATUS_SUCCESS,res.__("admin.admin_role.role_details_updated_successfully"));
                                            res.send({
                                                status		: STATUS_SUCCESS,
                                                redirect_url: WEBSITE_ADMIN_URL+"admin_role",
                                                message		: res.__("admin.admin_role.role_details_updated_successfully")
                                            });
                                        }
                                    })
                                }else{
                                    /** Send error response **/
                                    res.send({
                                        status : STATUS_ERROR,
                                        message: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}],
                                    });
                                }
                            })

                        })

                    }catch(e){
                        /** Send error response **/
                        res.send({
                            status	: STATUS_ERROR,
                            message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                        });
                    }

            }else{
                
                let conditions = {
                    _id : new ObjectId(roleId)
                };
                let fields = {
                    _id : 1,role_name :1,module_ids:1
                };
                let detailOption = {
                    conditions : conditions,
                    fields : fields
                };
                AdminRoleModel.getAdminRoleDetail(detailOption).then(detailResponse=>{
                    let status = detailResponse.status;
                    let result = detailResponse.result ? detailResponse.result : [];
                    if(status == STATUS_SUCCESS && result){
                        AdminModule.getAdminModulesTree(req, res).then((response)=>{
                            /** Render view file **/
                            req.breadcrumbs(BREADCRUMBS['admin/admin_role/edit']);
                            res.render('edit',{
                                result          : result,
                                admin_modules   : response.result
                            });
                        });

                    }else{
                        /** Send error response **/
                        req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL+"admin_role")
                    }
                })
                
            }
        }else{
             /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
			return;
        }
    }
}
module.exports = new AdminRoleController();