const AdminPermissionModel = require('./model/AdminPermissionsModel');
const AdminModule = require('../admin_modules/model/AdminModule');
const {hash}    	=	require('bcrypt');
const { ObjectId } = require('mongodb');
function AdminPermissionsController(){

    const saltRounds= 10;

	/**
	 * Function to get admin permission list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res)=>{
		if(isPost(req)){
            let limit			= 	(req.body.length)	? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? parseInt(req.body.start)	: DEFAULT_SKIP;
            let search_data 	=   req.body.search_data;

            configDatatable(req,res,null).then(dataTableConfig=>{
				commonConditions = {
					is_sub_admin : IS_SUBADMIN,
					is_deleted 	 : NOT_DELETED
				};
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

                if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                        }
                    })
                }
                
                let conditions = [{
                    $facet : {
                        "sub_admin_list" : [
                            {$match : dataTableConfig.conditions},
                            {$project : {
                                _id : 1, full_name : 1,email : 1,company_name:1,phone_number:1,created : 1, user_role_id	: 1,active : 1,is_verified:1,is_email_verified:1
                            }},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit : limit} 
                        ],
                        "sub_admin_all_count" : [
                            {$match : commonConditions},
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "sub_admin_filter_count" : [
                            {$match: dataTableConfig.conditions},
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ]
                    }
                }];

                let options = {
                    conditions : conditions
                }

                AdminPermissionModel.getSubAdminAggregateList(req,res,options).then(subAdminResponse=>{
                    let responseStatus = (subAdminResponse.status) ? subAdminResponse.status : "";
                    let responseResult = (subAdminResponse.result && subAdminResponse.result[0]) ? subAdminResponse.result[0] : "";

                    let sub_admin_list = (responseResult && responseResult.sub_admin_list) ? responseResult.sub_admin_list : [];
                    let sub_admin_all_count = (responseResult && responseResult.sub_admin_all_count && responseResult.sub_admin_all_count[0] && responseResult.sub_admin_all_count[0]["count"]) ? responseResult.sub_admin_all_count[0]["count"] : DEACTIVE;
                    let sub_admin_filter_count = (responseResult && responseResult.sub_admin_filter_count && responseResult.sub_admin_filter_count[0] && responseResult.sub_admin_filter_count[0]["count"]) ? responseResult.sub_admin_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   sub_admin_list,
                        recordsTotal	:	sub_admin_all_count,
                        recordsFiltered	:  	sub_admin_filter_count,
                    });
                })
            })
        }else{
            /** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/admin_permissions/list']);
			res.render('list');
        }
    }

    /**
	 * Function for add admin permission
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    this.add = (req, res)=> {
		if(isPost(req)){
            req.body 		= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let password	=	(req.body.password)	? 	req.body.password	:"";
			let userRole	= 	(req.body.user_role)?	req.body.user_role	:"";

			let firstName 	= 	(req.body.first_name)	?	req.body.first_name	:"";
			let lastName 	= 	(req.body.last_name)	? 	req.body.last_name	:"";
			let email 		= 	(req.body.email)		? 	req.body.email		:"";
			let fullName	= 	firstName+' '+ lastName;

            /** Set requested Data **/
            let options = {
                title 		: fullName,
                table_name 	: "users",
                slug_field 	: "slug"
            };

            /** Get slug **/
            getDatabaseSlug(options).then(response=>{
                /** Include admin modules Module **/
                AdminModule.formatModuleIdsArray(req, res).then(moduleArray=>{
                    /**Genrate password hash */
                    hash(password, saltRounds).then(newPassword=>{
                        let inserData = {
                            user_role_id		: userRole,
                            role_id 			: new ObjectId(userRole),
                            first_name 			: firstName,
                            last_name 			: lastName,
                            full_name			: fullName,
                            slug 				: (response && response.title)	?	response.title	:"",
                            email 				: email,
                            username 			: email,
                            password			: newPassword,
                            module_ids			: moduleArray,
                            is_sub_admin		: IS_SUBADMIN,
                            active 				: ACTIVE,
                            is_email_verified 	: ACTIVE,
                            is_mobile_verified 	: ACTIVE,
                            is_admin_approved 	: ACTIVE,
                            is_verified 		: VERIFIED,
                            is_deleted 			: NOT_DELETED,
                            created 			: getUtcDate(),
                            modified 			: getUtcDate()
                        };

                        let option = {
                            insertData : inserData
                        }

                        AdminPermissionModel.addSubAdmin(req,res,option).then(subAdminResponse=>{
                            if(subAdminResponse.status == STATUS_SUCCESS){
                                /** Set requested data for send email **/
                                let link = '<a href="'+WEBSITE_ADMIN_URL+'">'+res.__("admin.system.click_here")+'</a>';
                                let emailOptions = {
                                    to 			: email,
                                    action 		: "subadmin_login_credentials",
                                    rep_array 	: [fullName,email,password,link]
                                };
                                /** Send email **/
                                sendMail(req,res,emailOptions);
                                /** Send success response **/
                                req.flash(STATUS_SUCCESS,res.__("admin.admin_permissions.admin_permissions_has_been_added_successfully"));
                                res.send({
                                    status		: STATUS_SUCCESS,
                                    redirect_url: WEBSITE_ADMIN_URL+"admin_permissions",
                                    message		: res.__("admin.admin_permissions.admin_permissions_has_been_added_successfully")
                                });
                            }else{
                                /** Send error response **/
                                res.send({
                                    status : STATUS_ERROR,
                                    message: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}],
                                });
                            }
                        })
                    })
                });
            });

        }else{
            let options = {
                collections: [
                    {
                        collection: TABLE_ADMIN_ROLE,
                        columns: ["_id","role_name"],
                        conditions: {
                            is_shown : SHOWN
                        }
                    },
                ]
            }
            AdminModule.getAdminModulesTree(req, res).then((moduleResponse)=>{
                getDropdownList(req, res, options).then(response => {
                    req.breadcrumbs(BREADCRUMBS['admin/admin_permissions/add']);
                    res.render('add',{
                        adminRoles		: 	(response.final_html_data && response.final_html_data[0])		?	response.final_html_data[0]		:{},
                        admin_modules   : 	(moduleResponse.result)	? moduleResponse.result	: []
                    });
                })
            })
            
        }
    }

    /**
	 * Function for edit admin permission
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.edit = (req, res)=> {
		let id 	= (req.params.id)	? req.params.id	: "";
		if(id && id != ""){
            if(isPost(req)){

                req.body			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				let userRole		= 	(req.body.user_role)		? 	req.body.user_role	 		:"";
				let password		= 	(req.body.password)			?	req.body.password			:"";

                try{

                    AdminModule.formatModuleIdsArray(req, res).then(moduleArray=>{
                        let email		=	(req.body.email)		? 	req.body.email		:"";
						let firstName	= 	(req.body.first_name)	? 	req.body.first_name	:"";
						let lastName 	= 	(req.body.last_name)	? 	req.body.last_name	:"";
						let fullName 	=	firstName+' '+ lastName;

                        let updateData	=	{
                            user_role_id 	: userRole,
                            role_id 		: new ObjectId(userRole),
                            first_name		: firstName,
                            last_name 		: lastName,
                            full_name		: fullName,
                            email 			: email,
                            module_ids		: moduleArray,
                            modified 		: getUtcDate()
                        };

                        hash(password, saltRounds).then(newPassword=>{
                            if(password != ""){
                                updateData['password']	=	newPassword;
                            }

                            let updateCondition = {
                                _id : new ObjectId(id)
                            };

                            let updateOption = {
                                conditions : updateCondition,
                                updateData : {$set: updateData}
                            }

                            AdminPermissionModel.updateSubAdmin(req,res,updateOption).then(updateResponse=>{
                                if(updateResponse.status == STATUS_SUCCESS){
                                    /** Delete user Modules list Flag **/
									userModuleFlagAction(id,"","delete");
                                    /** Send success response **/
                                    req.flash(STATUS_SUCCESS,res.__("admin.admin_permissions.admin_permissions_updated_successfully"));
                                    res.send({
                                        status		: STATUS_SUCCESS,
                                        redirect_url: WEBSITE_ADMIN_URL+"admin_permissions",
                                        message		: res.__("admin.admin_permissions.admin_permissions_updated_successfully")
                                    });
                                }else{
                                    /** Send error response **/
                                    res.send({
                                        status : STATUS_ERROR,
                                        message: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}],
                                    });
                                }
                            })
                        });
                    })
                }catch(e){
                    /** Send error response **/
					res.send({
						status : STATUS_ERROR,
						message: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
                }

            }else{
                let detailConditions = {
                    _id : new ObjectId(id)
                }
                let detailOption = {
                    conditions : detailConditions
                };
                AdminPermissionModel.getSubAdminDetail(detailOption).then(subAdminDetails=>{
                    if(subAdminDetails.status == STATUS_ERROR){
                        /** Send error response **/
							req.flash(STATUS_ERROR,subAdminDetails.message);
							res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
                    }else{
                        let roleId = (subAdminDetails.result && subAdminDetails.result.role_id) ? subAdminDetails.result.role_id : "";
                        let options = {
                            collections: [
                                {
                                    collection: TABLE_ADMIN_ROLE,
                                    selected : [roleId],
                                    columns: ["_id","role_name"],
                                    conditions: {
                                        is_shown : SHOWN
                                    }
                                },
                            ]
                        }
                        AdminModule.getAdminModulesTree(req, res).then((moduleResponse)=>{
                            getDropdownList(req, res, options).then(response => {
                                req.breadcrumbs(BREADCRUMBS['admin/admin_permissions/edit']);
                                res.render('edit',{
                                    adminRoles		: 	(response.final_html_data && response.final_html_data[0])		?	response.final_html_data[0]			:{},
                                    result			: 	(subAdminDetails.result) 		? subAdminDetails.result 		: {},
                                    admin_modules   : 	(moduleResponse.result)	? moduleResponse.result	: []
                                });
                            })
                        })
                    }
                })
               
            }
        }else{
            /** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
        }
    }

    /**
	 * Function for view Admin Permission Details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render
	 */
	this.viewDetials = (req, res)=>{
		let id	= (req.params.id)	? req.params.id	: "";
		if(id && id != ""){
			try{

                let conditions =[
                    {$match :{
                        _id			: new ObjectId(id),
                        is_deleted	: NOT_DELETED
                    }},
                    {$lookup : {
                        "from" 			: "admin_roles",
                        "localField" 	: "role_id",
                        "foreignField" 	: "_id",
                        "as" 			: "role_detail"
                    }},
                    {$project :	{
                        _id : 1, first_name : 1, last_name : 1, full_name : 1,email : 1,modified : 1,active : 1,user_role_id : 1,role_id : 1,module_ids : 1,company_name:1,phone_number:1,
                        role_name	:	{$arrayElemAt : ["$role_detail.role_name",0] },
                    }},
                ];
                let detailOption = {
                    conditions : conditions
                }
				/** Get Admin Permission details **/
				AdminPermissionModel.getSubAdminAggregateList(req, res, detailOption).then((response)=>{
					if(response.status == STATUS_SUCCESS){
						req.breadcrumbs(BREADCRUMBS['admin/admin_permissions/view']);
						/** Render view page*/
						res.render('view',{
							result : 	response.result[0]
						});
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
		}
	};//End viewDetials()


    /**
     * Function for delete User 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.deleteUser = (req, res, next) =>{
        let userId		= (req.params.id)	?	new ObjectId(req.params.id)	:	"";
		let userType 	=	(req.params.user_type) ? req.params.user_type : "";
		
        if (!userId) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
            return;
        }
		else{

            /** Set update data **/
            let updateData = {
                $set: {
					is_deleted : DELETED,
                    modified: getUtcDate()
                }
            };

            let condition = {
                _id : userId
            }

            let optionObj = {
                conditions : condition,
                updateData : updateData
            }

            AdminPermissionModel.updateSubAdmin(req,res,optionObj).then(updateResponse=>{ 
				if(updateResponse.status == STATUS_SUCCESS){
					let message = res.__("admin.user.user_deleted_successfully");
					req.flash(STATUS_SUCCESS, message);
					res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
				}
				else{
					let message = res.__("admin.system.something_going_wrong_please_try_again");
					req.flash(STATUS_ERROR, message);
					res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
				}  
            });
        }
    }
	
	
	/**
	 * Function for update active/ deactive status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateStatus  = (req, res)=>{
		let userId = (req.params.id) ? req.params.id : "";
		let status	 = (req.params.status==ACTIVE) ? DEACTIVE : ACTIVE;
		if(userId){
			try{
				
				let conditions = {
					_id : new ObjectId(userId)
				};
                let updateData = {
                    active	 : status,
					modified : getUtcDate()
                }

                let updateOption= {
                    conditions : conditions,
                    updateData : {$set : updateData}
                }
				AdminPermissionModel.updateSubAdmin(req,res,updateOption).then((updateStatusResponse)=>{
                    if(updateStatusResponse.status == STATUS_SUCCESS){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.admin_permissions.status_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+'admin_permissions');
		}
	};// end updateStatus()


    /**
	 * Function to send new login credentials to user
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.sendLoginCredentials = (req, res)=>{
		let userId	= (req.params.id) ? req.params.id : "";
		if(userId){
			try{

                let detailConditions = {
                    _id : new ObjectId(userId),
                    is_deleted	: NOT_DELETED
                };

                let fields = {
                    email:1,full_name:1,user_role_id:1
                };

                let detailOption = {
                    conditions : detailConditions,
                    fields : fields
                }
				/** Get user details **/
				AdminPermissionModel.getSubAdminDetail(detailOption).then(response=>{
					if(response.status == STATUS_SUCCESS){
						let userResult = response.result;
						getRandomString(req,res,null).then(randomResponse=>{
							if(randomResponse.status == STATUS_SUCCESS){
								let password 	= (randomResponse.result)	?	randomResponse.result	:"";

								/**Genrate password hash */
								//hash(password, saltRounds).then(newPassword=>{
								bcryptPasswordGenerate(password).then(bcryptPassword=>{
									/** Update password **/
                                    let updateData = {
                                        password : bcryptPassword,
										modified : getUtcDate()
                                    }

                                    let updateOption = {
                                        conditions : detailConditions,
                                        updateData : {$set : updateData}
                                    };

                                    AdminPermissionModel.updateSubAdmin(req,res,updateOption).then((updateResponse)=>{
										if(updateResponse.status == STATUS_SUCCESS){
											let link 		= '<a href="'+WEBSITE_ADMIN_URL+'">'+res.__("admin.system.click_here")+'</a>';
											let userEmail	= (userResult.email)		? userResult.email		: "";
											let userName	= (userResult.full_name)	? userResult.full_name	: "";

											/** Set requested data for send email **/
											let emailOptions = {
												to 			: userEmail,
												action 		: "send_login_credentials",
												rep_array 	: [userName,userEmail,password,link]
											};

											/** Send email **/
											sendMail(req,res,emailOptions);

											req.flash(STATUS_SUCCESS,res.__("admin.admin_permissions.login_credentials_send_successfully"));
											res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
										}else{
											/** Send error response  **/
											req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
											res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
										}
									});
								});
							}else{
								/** Send error response  **/
								req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
								res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
							}
						});
					}else{
						/** Send error response  **/
						req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
						res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
					}
				});
			}catch(e){
				/** Send error response  **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
			}
		}else{
			/** Send error response  **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"admin_permissions");
		}
	};//End sendLoginCredentials()


    /**
	 * Function for view modules of selected role
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render
	 */
	this.getAdminRoleModulesData = (req, res)=>{
		let roleId = (req.body.id) ? req.body.id : "";
        if(roleId){
			try{
				let conditions = {
                    _id : new ObjectId(roleId)
                };
                let fields = {
                    _id : 1,role_name :1,module_ids:1
                }
                let option = {
                    conditions : conditions,
                    fields : fields
                };

                AdminPermissionModel.getRoleModules(option).then(roleResult=>{
                    if(roleResult.status == STATUS_SUCCESS){
						res.send({
							status : STATUS_SUCCESS,
							result : roleResult.result
						});
					}else{
						res.send({
							status 	: STATUS_ERROR,
							message : res.__("admin.system.something_going_wrong_please_try_again")
						});
					}
				});
			}catch(e){
				res.send({
					status 	: STATUS_ERROR,
					message : res.__("admin.system.something_going_wrong_please_try_again")
				});
			}
		}else{
			res.send({
				status 	: STATUS_ERROR,
				message : res.__("admin.system.invalid_access")
			});
		}
	};//end getAdminRoleModulesData()

}
module.exports = new AdminPermissionsController();