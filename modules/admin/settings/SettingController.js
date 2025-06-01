const { ObjectId } = require('mongodb');
const SettingModel = require("./model/Setting");
function SettingController() {

	/**
	 *  Function to get settings list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getSettingList = (req, res)=>{
		if(isPost(req)){
			let limit			= 	(req.body.length)	?	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip			=	(req.body.start) 	? 	parseInt(req.body.start)	:DEFAULT_SKIP;
			const collection	= 	db.collection('settings');
			const async			=	require("async");

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				let search_data = (req.body.search_data) ? req.body.search_data : [];
				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {
							dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
						}
					})
				}
				let conditions = [
					{
						$facet: {
							"setting_list": [

								{
									$project: {
										_id: 1,
										title: 1,
										value: 1,
										key_value: 1,
										modified: 1
									}
								},
								{ $match: dataTableConfig.conditions },
								{ $sort: dataTableConfig.sort_conditions },
								{ $skip: skip },
								{ $limit: limit },

							],
							"setting_all_count": [
								{
									$group: {
										_id: null,
										count: { $sum: 1 }
									}
								},
								{
									$project: { count: 1, _id: 0 }
								}
							],
							"setting_filter_count": [
								{ $match: dataTableConfig.conditions },
								{
									$group: {
										_id: null,
										count: { $sum: 1 }
									}
								},
								{
									$project: { count: 1, _id: 0 }
								}
							]
						}
					}
				];

				let optionObj = {
					conditions: conditions
				}
				SettingModel.getSettingAggregateList(req, res, optionObj).then(settingResponse => {

					let responseStatus = (settingResponse.status) ? settingResponse.status : "";
					let responseResult = (settingResponse.result && settingResponse.result[0]) ? settingResponse.result[0] : "";

					let setting_list = (responseResult && responseResult.setting_list) ? responseResult.setting_list : [];
					let setting_all_count = (responseResult && responseResult.setting_all_count && responseResult.setting_all_count[0] && responseResult.setting_all_count[0]["count"]) ? responseResult.setting_all_count[0]["count"] : DEACTIVE;
					let setting_filter_count = (responseResult && responseResult.setting_filter_count && responseResult.setting_filter_count[0] && responseResult.setting_filter_count[0]["count"]) ? responseResult.setting_filter_count[0]["count"] : DEACTIVE;
					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: setting_list,
						recordsTotal: setting_all_count,
						recordsFiltered: setting_filter_count,
					});

				});

			});
		}else{

			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/setting/list"]);
			res.render('list');
		}
	};//End getSettingList()

	/**
	 * Function for add setting
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
   	this.addSetting = (req, res)=>{
		if(isPost(req)){
			req.body 		=	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let title 		= 	(req.body.title)			? 	req.body.title			:"";
			let value 		= 	(req.body.value)			?	req.body.value			:"";
			let keyValue 	= 	(req.body.key_value)		? 	req.body.key_value		:"";
			let inputType 	= 	(req.body.input_type)		? 	req.body.input_type		:"";
			let validatType = 	(req.body.validate_type)	? 	req.body.validate_type	:"";
			let order 		= 	(req.body.order)			? 	req.body.order			:"";
			let editable 	= 	(req.body.editable)			? 	req.body.editable		:0;
			let required 	= 	(req.body.required)			? 	req.body.required		:0;
			let validRegx	= 	/^[0-9]+$/;



			/** parse Validation array  **/
			var errors = [];
			if(!validRegx.test(order) && order != ""){
				if(!errors){
					var errors=[];
				}
				errors.push({"path":'order',"msg":res.__("admin.setting.please_enter_valid_order")});
			}
			if (errors.length == 0) {
				try {
					/** Configure settings unique conditions*/

					let conditionsObj = { key_value: { $regex: "^" + keyValue + "$", $options: "i" }, };
					let optionObj = {
						conditions: conditionsObj,
						fields: { _id: 1},
					}
					SettingModel.getSettingFindOne(optionObj).then(settingRes => {
						let result = (settingRes.result) ? settingRes.result : "";
						if (!result) {
							let type = keyValue.split('.');
							type = (type[0]) ? type[0] : "";
							order = (order != "") ? parseInt(order) : "";

							let optionObj = {
								insertData: {
									type: type,
									title: title,
									key_value: keyValue,
									input_type: inputType,
									validate_type: validatType,
									value: value,
									order_weight: order,
									editable: parseInt(editable),
									required: parseInt(required),
									created: getUtcDate(),
									modified: getUtcDate(),
								}
							}
							
							if(inputType == "select"){
								optionObj.insertData.option_value = value;
							}
							 
							SettingModel.saveSetting(req, res, optionObj).then(saveResult => {
								let responseStatus = (saveResult.status) ? saveResult.status : "";

								if (responseStatus == STATUS_ERROR) {
									/** Send error response **/
									res.send({
										status: STATUS_ERROR,
										message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
									});
								} else {
									/** Write setting in file **/
									writeSettingDetails(req, res).then(response => {
										/** Send success response **/
										req.flash(STATUS_SUCCESS, res.__("admin.setting.setting_has_been_added_successfully"));
										res.send({
											status: STATUS_SUCCESS,
											redirect_url: WEBSITE_ADMIN_URL + "settings",
											message: res.__("admin.setting.setting_has_been_added_successfully")
										});
									});
								}

							})

						}else{

							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ "path": "key_value", "msg": res.__("admin.setting.key_value_is_already_exist") }],
							});

						}
					});
				}catch(e){
					/** Send error response **/
					res.send({
						status	: STATUS_ERROR,
						message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again ")}]
					});
				}
			}else {
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}
		}else{
			/** Render view file **/
			req.breadcrumbs(BREADCRUMBS["admin/setting/add"]);
			res.render('add');
		}
	};//End addSetting()

	 /**
	 * Function for delete setting
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.deleteSetting = (req, res)=>{
		let id	= (req.params.id) ? req.params.id : '';
		if(id) {
			try {
				/** Delete setting*/
				let conditionsObj = { _id: new ObjectId(id) };
				let optionObj = {
					conditions: conditionsObj,
				}
				SettingModel.deleteOneSetting(req,res,optionObj).then(settingRes => {
					/** Write setting in file **/
					writeSettingDetails(req, res).then(response => {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.setting.setting_deleted_successfully"));
						res.redirect(WEBSITE_ADMIN_URL + "settings");
					});

				});

			}catch(e) {
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"settings");
			}
		}else {
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"settings");
		}
	};//End deleteSetting()

	/**
	 *  Function to get detail of a setting
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
	let getSettingDetails = (req,res)=>{
		return new Promise(resolve=>{
			let settingId = (req.params.id) ? req.params.id : "";
			if(!settingId || settingId ==""){
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.invalid_access")
				};
				resolve(response);
			}else{
				try{
					/**Get settings details*/

					let conditionsObj = { _id: new ObjectId(settingId) };
					let optionObj = {
						conditions: conditionsObj,
						fields: {},
					}
					SettingModel.getSettingFindOne(optionObj).then(settingRes => {
						let result = (settingRes.result) ? settingRes.result : "";

						if (result) {
							/** Send success response **/
							let response = {
								status: STATUS_SUCCESS,
								result: result
							};
							resolve(response);
						} else {
							/** Send error response **/
							let response = {
								status: STATUS_ERROR,
								message: res.__("admin.system.invalid_access")
							};
							resolve(response);
						}
					});
				}catch(e){
					/** Send error response */
					let response = {
						status	: STATUS_ERROR,
						message	: res.__("admin.system.something_going_wrong_please_try_again")
					};
					resolve(response);
				}
			}
		});
	};//End settingDetails()

	/**
	 * Function for update setting details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.editSetting = (req, res)=>{
		let id 		   = 	(req.params.id)	? 	req.params.id	:"";
		if(isPost(req)){
			/** Sanitize Data **/
			req.body 		=	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let title 		= 	(req.body.title)		?	req.body.title			:"";
			let value 		= 	(req.body.value)		?	req.body.value			:"";
			let keyValue 	= 	(req.body.key_value)	?	req.body.key_value		:"";
			let inputType 	= 	(req.body.input_type)	? 	req.body.input_type		:"";
			let validatType	= 	(req.body.validate_type)? 	req.body.validate_type	:"";
			let order 		= 	(req.body.order)		? 	req.body.order			:"";
			let editable 	= 	(req.body.editable)		? 	req.body.editable		:0;
			let required 	= 	(req.body.required)		? 	req.body.required		:0;
			let validRegx 	= 	/^[0-9]+$/;


			/** parse Validation array  **/
			var errors = [];
			if(!validRegx.test(order) && order != ""){
				if(!errors){
					var errors=[];
				}
				errors.push({"param":'order',"msg":res.__("admin.setting.please_enter_valid_order")});
			}

			if (errors.length == 0) {

				try{

					/** Configure user unique conditions*/

					let conditionsObj = { key_value: { $regex: "^" + keyValue + "$", $options: "i" }, _id: { $ne: new ObjectId(id) }};
					let optionObj = {
						conditions: conditionsObj,
						fields: { _id: 1 },
					}
					SettingModel.getSettingFindOne(optionObj).then(settingRes => {
						let result = (settingRes.result) ? settingRes.result : "";
						if (!result) {
							let type = keyValue.split('.');
							type = (type[0]) ? type[0] : "";
							order = (order != "") ? parseInt(order) : "";

							/** Update block record **/
							let conditionsObj = { _id: new ObjectId(id) };
							let updateRecordObj = {
								$set: {
									type: type,
									title: title,
									key_value: keyValue,
									input_type: inputType,
									validate_type: validatType,
									value: value,
									order_weight: order,
									editable: parseInt(editable),
									required: parseInt(required),
									modified: getUtcDate()
								}
							}
							
							if(inputType == "select"){
								updateRecordObj.$set.option_value = value;
							}
							
							
							let optionObj = {
								conditions: conditionsObj,
								updateData: updateRecordObj,
							}
							SettingModel.updateOneSetting(req, res, optionObj).then(updateResult => {
								/** Write setting in file **/
								writeSettingDetails(req, res).then(response => {
									/** Send success response **/
									req.flash(STATUS_SUCCESS, res.__("admin.setting.setting_has_been_updated_successfully"));
									res.send({
										status: STATUS_SUCCESS,
										redirect_url: WEBSITE_ADMIN_URL + 'settings',
										message: res.__("admin.setting.setting_has_been_updated_successfully"),
									});
								});
							})

						}else{
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ "path": "key_value", "msg": res.__("admin.setting.key_value_is_already_exist") }],
							});
						}

					})
				} catch(e) {
					/** Send error response **/
					res.send({
						status : STATUS_ERROR,
						message: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
				}
			} else {
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}
		} else {
			getSettingDetails(req, res).then((response)=>{
				if(response.status == STATUS_SUCCESS){
					/** Render edit page  **/
					req.breadcrumbs(BREADCRUMBS['admin/setting/edit']);
					res.render('edit',{
						result	: response.result,
					});
				}else{
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					res.redirect(WEBSITE_ADMIN_URL+'settings');
				}
			});
		}
	};//End editSetting()

	/**
	 *  Function to get settings list and update settings
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.prefix = (req, res)=>{
		let type		=	(req.params.type) ? req.params.type	:"";
		let displayType	= 	type.replace(RegExp("_","g")," ");
		if(isPost(req)){
			/** Sanitize Data **/
			req.body 	= 	sanitizeData(req.body,[/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi]);
			let errors 	= 	[];
			if(typeof req.body.settings !== typeof undefined && req.body.settings.length >0){
				let startDate	=	"";
				let endDate		=	"";
				req.body.settings.forEach((records,index)=>{
					let value 			=	(records.value)					?	records.value				:"";
					let title 			= 	(records.title)					?	records.title.toLowerCase()	:"";
					let uppercasetitle 	= 	(records.title)					?	records.title				:"";
					let required 		= 	(records.required)				?	records.required			:"";
					let inputType 		= 	(records.input_type)			?	records.input_type			:"";
					let validateType 	= 	(records.validate_type)			?	records.validate_type		:"";
					startDate			=	((validateType == "start_time") || (validateType == "start_date"))	?	value	:startDate;
					endDate				=	((validateType == "end_time") || (validateType == "end_date"))		?	value	:endDate;

					if(value =="" && required == REQUIRED && inputType !="checkbox"){
						errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.please_enter_value",title)});
					}else if(validateType == "number"){
						let validRegx 	= 	/^[0-9]+$/;
						if(!validRegx.test(value)){
							errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.please_enter_valid_value",title)});
						}
					}else if(validateType == "float"){
						let validRegx 	= 	/^[0-9]+([.][0-9]+)?$/;
						if(!validRegx.test(value)){
							errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.please_enter_valid_value",title)});
						}
					}else if(validateType == "percentage"){
						let validRegx 	= 	/^[0-9]+([.][0-9]+)?$/;
						if(!validRegx.test(value)){
							errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.please_enter_valid_value",title)});
						}else if(value < 0 || value >100){
							errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.please_enter_valid_value",title)});
						}
					}

					if(required == REQUIRED && (validateType == "number" || validateType == "float")){
						if(value <= 0){
							errors.push({"param":"setting_"+index+"_value","msg":res.__("admin.setting.value_should_be_greater_than",uppercasetitle)});
						}
					}

					if((startDate !="" && endDate !="") && (validateType == "end_time" || validateType == "end_date")){
						if(startDate >= endDate){
							message = (validateType == "end_time")	?	res.__("admin.setting.end_time_should_be_greater_than_start_time")	:	res.__("admin.setting.end_date_should_be_greater_than_start_date");
							errors.push({"param":"setting_"+index+"_value","msg":message});
						}
					}

					
					if(req.body.settings.length-1 == index){
						if(errors.length > 0){
							res.send({
								/** Send error response **/
								status	: STATUS_ERROR,
								message	: errors,
							});
						}else{
							try{
								req.body.settings.forEach((data,dataIndex)=>{
									let value 		=	(data.value)	?	data.value	:"";
									let settingId	= 	(data.id)		?	data.id		:"";
									if(settingId && settingId!=""){
										try{
											/** Update settings details **/
											const settings = db.collection("settings");

											let conditionsObj = { _id: new ObjectId(settingId) };
											let updateRecordObj = {
												$set: {
													"value": value,
													"modified": getUtcDate()
												}
											}
											/** Update record*/
											let optionObj = {
												conditions: conditionsObj,
												updateData: updateRecordObj,
											}
											SettingModel.updateOneSetting(req, res, optionObj).then(updateResult => {
												let responseStatus = (updateResult.status) ? updateResult.status : "";
												if (responseStatus == STATUS_ERROR) {
													/** Send error response **/
													res.send({
														status: STATUS_ERROR,
														message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
													});
												}
												if (req.body.settings.length - 1 == dataIndex) {
													/** Write setting in file **/
													writeSettingDetails(req, res).then(response => {
														/** Send success response **/
														req.flash(STATUS_SUCCESS, res.__("admin.setting.setting_details_has_been_updated_successfully"));
														res.send({
															status: STATUS_SUCCESS,
															redirect_url: WEBSITE_ADMIN_URL + "settings/prefix/" + type,
															message: res.__("admin.setting.setting_details_has_been_updated_successfully"),
														});
													});
												}
											})


										}catch(e){
											/** Send error response **/
											res.send({
												status	:	STATUS_ERROR,
												message	: 	[{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
											});
										}
									}else{
										if(req.body.settings.length-1 == dataIndex){
											/** Send success response **/
											req.flash(STATUS_SUCCESS,res.__("admin.setting.setting_details_has_been_updated_successfully"));
											res.send({
												status: STATUS_SUCCESS,
												redirect_url : WEBSITE_ADMIN_URL+"settings/prefix/"+type,
												message: res.__("admin.setting.setting_details_has_been_updated_successfully"),
											});
										}
									}
								});
							}catch(e){
								/** Send error response **/
								res.send({
									status	:	STATUS_ERROR,
									message	: 	[{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
								});
							}
						}
					}
				});
			}else{
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}
		}else{
			/** Get settings details **/
			getPrefixSettingDetails(req, res).then(response=>{
				if(response.status == STATUS_SUCCESS){
					/**Render edit page*/
					req.breadcrumbs(BREADCRUMBS["admin/setting/prefix"]);
					res.render("prefix",{
						result				: response.result,
						type 				: type,
						dynamic_variable 	: toTitleCase(displayType)+" "+res.__("admin.setting.settings"),
						dynamic_url			: type,
						displayType			: displayType
					});
				}else{
					req.flash("error",response.message);
					res.redirect(WEBSITE_ADMIN_URL+"dashboard");
				}
			});
		}
	};//End prefix()

	/**
	 *  Function to get detail of a setting
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
	let getPrefixSettingDetails = (req,res)=>{
		return new Promise(resolve=>{
			let type	=	(req.params.type) ? req.params.type	:"";
			if(!type || type ==""){
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.invalid_access")
				};
				resolve(response);
			}else{
				try{
					/**Get settings details*/
					let conditionsObj = { "key_value": { $regex: type }, "editable": { $ne: 0 } };

					let optionObj = {
						conditions: conditionsObj,
						fields: {},
						options: {
							sort: { order_weight: 1 }
						}
					}
					SettingModel.getSettingFind(optionObj).then(settingRes => {
						let settingStatus = (settingRes.status) ? settingRes.status : "";
						let settingResult = (settingRes.result) ? settingRes.result : "";
console.log(settingResult);
						if (settingStatus == STATUS_ERROR) {
							/** Send error response **/
							let response = {
								status: STATUS_ERROR,
								message: res.__("admin.system.invalid_access")
							};
							resolve(response);
						} else {
							/** Send success response **/
							let response = {
								status: STATUS_SUCCESS,
								result: settingResult
							};
							resolve(response);
						}
					});

				}catch(e){
					/** Send error response */
					let response = {
						status	: STATUS_ERROR,
						message	: res.__("admin.system.something_going_wrong_please_try_again")
					};
					resolve(response);
				}
			}
		});
	};//End getPrefixSettingDetails()

	/**
	 *  Function to write setting details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
	let writeSettingDetails = (req,res)=>{
		return new Promise(resolve=>{

			var frontUrl = WEBSITE_ROOT_PATH.substr(0, WEBSITE_ROOT_PATH.lastIndexOf("dev/"));
			const settings 	= 	db.collection("settings");

			let conditionsObj = {};
			let optionObj = {
				conditions: conditionsObj,
				fields: { _id: 1, key_value: 1, value: 1 },
			}
			SettingModel.getSettingFind(optionObj).then(settingRes => {

				let settingStatus = (settingRes.status) ? settingRes.status : "";
				let settingResult = (settingRes.result) ? settingRes.result : "";

				if (settingStatus == STATUS_ERROR) {
					/** Send error response **/
					let response = {
						status: STATUS_ERROR,
						message: res.__("admin.system.invalid_access")
					};
					resolve(response);
				} else {
					/** Send success response **/
					let settingsObj = {};
					settingResult.map(record => {
						let settingKey = (record.key_value) ? record.key_value : "";
						let settingValue = (record.value) ? record.value : "";

						settingKey = settingKey.replace(/"/g, '\\"');
						settingKey = settingKey.replace(/'/g, "\\'");
						settingValue = settingValue.replace(/"/g, '\\"');
						settingValue = settingValue.replace(/'/g, "\\'");

						settingsObj[settingKey] = settingValue;
					});
					const fs = require("fs");
					fs.writeFile(WEBSITE_ROOT_PATH + "config/settings.json", JSON.stringify(settingsObj), "utf8", function (err) {

					});
					//return false;
					setTimeout(function () {
						myCache.del("settings");
					}, 5000);

					/** Send success response */
					let response = {
						status: STATUS_SUCCESS,
					};
					resolve(response);
				}


			})

		});
	};//End writeSettingDetails()
}

module.exports = new SettingController();
