const MasterModel 	= 	require("./model/Master");
const async			= 	require("async");
const { ObjectId } 	= 	require('mongodb');
const clone			= 	require("clone");
const DbClass 		= 	require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
function Master(){

	/**
	 * Function to get master list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.getMasterList = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));

		if(isPost(req)){
			let limit			=	(req.body.length)	?	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)	? 	parseInt(req.body.start)	:DEFAULT_SKIP;
			let language		= 	(req.session.lang)	?	req.session.lang			: DEFAULT_LANGUAGE_CODE;
			let search_data 	= req.body.search_data;

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				/** Common Conditions **/
				let commonConditions = {
					dropdown_type	:	masterType
				};

				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

				if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "status"){
                                dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                            }
                            
                        }
                
                    })
                }
				
				let conditions = [
					{
						$facet : {
							"master_list" : [
								{ $match: dataTableConfig.conditions },
								{ $sort: dataTableConfig.sort_conditions },
								{ $skip: skip },
								{ $limit: limit },
								{
									$project: {
										"_id": 1,
										"name": { $cond : {if: { $ne : ["$pages_descriptions."+language+".name",'']},then:"$pages_descriptions."+language+".name",else:"$name"}},
										"created": 1,
										"modified": 1,
										"status": 1,
										"image": 1,
										"is_default": 1,
										"dropdown_type": 1,
									}
								},
							],
							"master_all_count" : [
								{$match : commonConditions},
								{
									$group : {
										_id : null,
										count : {$sum: 1}
									}
								},
								{
									$project : {
										_id: 0, count :1
									}
								}
							],
							"master_filter_count" : [
								{$match : dataTableConfig.conditions},
								{
									$group : {
										_id : null,
										count : {$count : {}}
									}
								},
								{
									$project : {
										_id : 0, count : 1
									}
								}
							]
						}
					}
				]

				let optionObj = {
					conditions : conditions
				}

				MasterModel.getAllMasterList(req,res,optionObj).then(masterResponse=>{
					let responseStatus = (masterResponse.status) ? masterResponse.status : "";
					let responseResult = (masterResponse.result && masterResponse.result[0]) ? masterResponse.result[0] : "";
					
					let master_list = (responseResult && responseResult.master_list) ? responseResult.master_list : [];
					let master_all_count = (responseResult && responseResult.master_all_count && responseResult.master_all_count[0] && responseResult.master_all_count[0]["count"]) ? responseResult.master_all_count[0]["count"] : DEACTIVE;
					let master_filter_count = (responseResult && responseResult.master_filter_count && responseResult.master_filter_count[0] && responseResult.master_filter_count[0]["count"]) ? responseResult.master_filter_count[0]["count"] : DEACTIVE;
					res.send({
						status			: 	responseStatus,
						draw			:	dataTableConfig.result_draw,
						data			:   master_list,
						recordsTotal	:	master_all_count,
						recordsFiltered	:  	master_filter_count,
					});
				})
			});
		}else{
			async.parallel([
				(callback)=>{
					callback(null,"");
				},
			],
			(err,response)=>{
				if(err) return next(err);

				/** Render listing page **/
				req.breadcrumbs(BREADCRUMBS["admin/master/list"]);
				res.render("list",{
					parent_list			: 	(response && response[0]) ? response[0] :"",
					type				: 	masterType,
					displayType 		:	displayType,
					dynamic_variable	: 	displayType,
					dynamic_url			: 	masterType,
				});
			});
		}
	};//End getMasterList()

	/**
	 * Function for add master details
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addMaster = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));

		convertMultipartFormData(req,res).then(()=>{
			if(isPost(req)){
				/** Sanitize Data **/
				req.body = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				if(req.body.pages_descriptions == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
					/** Send error response */
					return res.send({
						status	: STATUS_ERROR,
						message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
				}



				let parentId		=	(req.body.parent_id)	? 	ObjectId(req.body.parent_id) 	:"";

				let allData			= 	req.body;

				req.body 			= 	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			
				let name			=	(req.body.name)			? 	req.body.name.trim() 			:"";
				let helpText		=	(req.body.help_text)	? 	req.body.help_text.trim() 		:"";


				/** Set options for upload image **/
				let image	= 	(req.files && req.files.master_image)	?	req.files.master_image	:"";
				let options = {
					'image' 	:	image,
					'filePath' 	: 	MASTER_FILE_PATH,
					'oldPath' 	: 	""
				};

				let errors = []

				/** Upload master  image **/
				moveUploadedFile(req, res,options).then(response=>{
					if(response.status == STATUS_ERROR){
						errors.push({'path':'master_image','msg':response.message});
					}else{
						var imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
					}

					if(errors.length > 0){
						/** Send error response **/
						return res.send({
							status	: STATUS_ERROR,
							message	: errors,
						});
					}

					let insertData = {
						name				:	name,
						help_text			:	helpText,
						dropdown_type		:	masterType,
						image				:	imageName,
						parent_id			:	parentId,
						pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions :{},
						status	 			:	ACTIVE,
						created 			:	getUtcDate(),
						modified 			: 	getUtcDate()
					}

					let optionObj = {
						insertData : insertData
					};

					MasterModel.saveMaster(req,res,optionObj).then(saveMasterResponse=>{
						if(saveMasterResponse.status == STATUS_SUCCESS){
							req.flash(STATUS_SUCCESS,res.__("admin.master.master_has_been_added_successfully",res.__(displayType)));
							res.send({
								status			:	STATUS_SUCCESS,
								redirect_url	: 	WEBSITE_ADMIN_URL+"master/"+masterType,
								message			:	res.__("admin.master.master_has_been_added_successfully",res.__(displayType)),
							});
						}else{
							return next(saveMasterResponse.error)
						}
					})
				}).catch(next);

			}else{
			
				async.parallel([
					(callback)=>{
						callback(null,"");
					},
					(callback)=>{
						/** Get language list **/
						getLanguages().then(languageList=>{
							callback(null,languageList);
						}).catch(next);
					}
				],
				(err,response)=>{
					if(err) return next(err);

					/** Render add page **/
					req.breadcrumbs(BREADCRUMBS["admin/master/add"]);
					res.render("add",{
						parent_list			: 	(response && response[0]) ? response[0] :"",
						language_list		: 	(response && response[1]) ? response[1] :[],
						type				: 	masterType,
						displayType 		:	displayType,
						dynamic_variable	: 	displayType,
						dynamic_url			: 	masterType,
					});
				});
			}
		});
	};//End addMaster()

	/**
	 * Function to update master's Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.masterUpdate = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let masterId 	= 	(req.params.id) 	? 	req.params.id 	:"";

		convertMultipartFormData(req,res).then(()=>{
			if(isPost(req)){
				/** Sanitize Data **/
				req.body	= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				let id		= 	(req.params.id) 	? 	req.params.id 	:"";

				if(masterType =="" || id =="" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] =="")){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});

				}

			
				let allData			=	req.body;
				req.body			=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
				req.body.parent_id 	= 	(allData.parent_id)		?	allData.parent_id				:"";
				let name			=	(req.body.name)			? 	req.body.name.trim() 			:"";
				let helpText		=	(req.body.help_text)	? 	req.body.help_text.trim() 			:"";
				let parentId		=	(req.body.parent_id)	? 	ObjectId(req.body.parent_id) 	:"";
 
				let errMessageArray = 	[];


				/** Set options for upload image **/
				let image 			= 	(req.files && req.files.master_image)	? 	req.files.master_image 	:"";
				let oldImage 		= 	(allData.old_image) 			?	allData.old_image	:"";
				let options	=	{
					'image' 	:	image,
					'filePath' 	: 	MASTER_FILE_PATH,
					'oldPath' 	: 	oldImage
				};

				/** Upload user image **/
				moveUploadedFile(req, res,options).then(response=>{
					if(response.status == STATUS_ERROR){
						errMessageArray.push({'path':'image','msg':response.message});
					}else{
						var imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
					}

					if(errMessageArray.length > 0){
						/** Send error response **/
						return res.send({
							status	: STATUS_ERROR,
							message	: errMessageArray
						});
					}

					let updateCondition = {
						_id : new ObjectId(id)
					}

					let updateData = {
						name				: 	name,
						help_text			:	helpText,
						parent_id			:	parentId,
						image				: 	imageName,
						pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions :{},
						modified 			:	getUtcDate()
					}
					
					let optionObj = {
						conditions : updateCondition,
						updateData : {$set: updateData}
					}

					MasterModel.updateMasterDetails(req,res,optionObj).then(updateMasterResponse=>{
						if(updateMasterResponse.status === STATUS_ERROR){
							/** Send error response **/
							req.flash("error",updateMasterResponse.message);
							res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
							return;
						}else{
							/** Send success response **/
							req.flash(STATUS_SUCCESS,res.__("admin.master.master_details_has_been_updated_successfully",res.__(displayType)));
							res.send({
								status			: 	STATUS_SUCCESS,
								redirect_url	:	WEBSITE_ADMIN_URL+"master/"+masterType,
								message			: 	res.__("admin.master.master_details_has_been_updated_successfully",res.__(displayType)),
							});
						}
					}).catch(next);

				})

			}else{

				let detailsCondition = {
					_id 			: 	new ObjectId(masterId),
					dropdown_type	:	masterType
				}

				let optionObj  = { 
					conditions : detailsCondition,
					fields : {}
				}
				/** Get master details **/
				MasterModel.getMasterDetails(optionObj).then(masterResponse=>{
					if(masterResponse.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash("error",masterResponse.message);
						res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
						return;
					}

					let result 		= masterResponse.result;
					/** Render edit page **/
					getLanguages().then(languageList=>{
						req.breadcrumbs(BREADCRUMBS["admin/master/edit"]);
						res.render("edit",{
							language_list		: 	languageList,
							result				:	result,
							type				: 	masterType,
							displayType 		:	displayType,
							dynamic_variable	: 	displayType,
							dynamic_url			: 	masterType,
						});
					})
				}).catch(next);
			}
		});
	};//End masterUpdate()

	/**
	 * Function for update master status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.updateMasterStatus = (req,res,next)=>{
		let masterType		=	(req.params.type)			?	req.params.type			: "";
		let masterId		=	(req.params.id)				?	req.params.id			: "";
		let masterStatus	=	(req.params.status==ACTIVE) ? 	DEACTIVE 				: ACTIVE;
		let displayType		= 	toTitleCase(masterType.replace(RegExp("_","g")," "));

		/** Update master status **/

		let updateCondition = {
			_id : new ObjectId(masterId)
		}

		let updateData = {
			status		: 	masterStatus,
			modified	:	getUtcDate()
		} 

		let optionObj = {
			conditions : updateCondition,
			updateData : {$set : updateData}
		};

		MasterModel.updateMasterDetails(req,res,optionObj).then(updateMasterResponse=>{
			if(updateMasterResponse.status === STATUS_SUCCESS){
				/** Send success response **/
				req.flash("success",res.__("admin.master.status_has_been_updated_successfully",res.__(displayType)));
				res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
			}else{
				/** Send success response **/
				req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
			}
		});
	};// end updateMasterStatus()

	/**
	 * Function for view master's Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewMaster = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let masterId	=	(req.params.id)		?	req.params.id	: "";
		let displayType	= 	toTitleCase(masterType.replace(RegExp("_","g")," "));
		let language 	= 	(req.session.lang)	?	req.session.lang : DEFAULT_LANGUAGE_CODE;

		let detailsCondition = {
			_id 			: 	new ObjectId(masterId),
			dropdown_type	:	masterType
		}

		let optionObj  = { 
			conditions : detailsCondition,
			fields : {
				"_id": 1,
				"name": { $cond : {if: { $ne : ["$pages_descriptions."+language+".name",'']},then:"$pages_descriptions."+language+".name",else:"$name"}},
				"modified": 1,
				"status": 1,
				"image": 1,
			}
		}

		/** Get master details **/
		MasterModel.getMasterDetails(optionObj).then(response=>{
			if(response.status != STATUS_SUCCESS){
				/** Send error response **/
				req.flash("error",response.message);
				res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
				return;
			}

			/** Render view page*/
			req.breadcrumbs(BREADCRUMBS["admin/master/view"]);
			res.render("view",{
				result			: 	response.result,
				type			: 	masterType,
				displayType 	:	displayType,
				dynamic_variable: 	displayType,
				dynamic_url		:	masterType,
			});
		}).catch(next);
	};//End viewMaster()
	
	
	
	/**
	 * Function for update Default status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	 */
	this.updateDefaultStatus = (req,res,next)=>{
		let masterType	=	(req.params.type)	?	req.params.type	: "";
		let masterId	=	(req.params.id)		?	req.params.id	: "";
		
        if(masterId){

            let condition = { dropdown_type : masterType };

            let updateData = {
                $set: {
                    is_default: {
                        $cond: { if: { $eq: ["$_id", new ObjectId(masterId)] }, then: ACTIVE, else: DEACTIVE }
                    },
                    modified: getUtcDate()
                }
            };

            let updateOption = {
                collection : TABLE_MASTERS,
                conditions : condition,
                updateData : [updateData]
            };

            DbClass.updateManyRecords(null,null,updateOption).then(updateResponse=>{
                if(updateResponse.status == STATUS_SUCCESS){
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS,res.__("admin.master.status_has_been_updated_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
                }else{
                     /** Send success response **/
					req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
					res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
                }
            })

        }else{
            /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"master/"+masterType);
			return;
        }
	};//End updateDefaultStatus()
}
module.exports = new Master();
