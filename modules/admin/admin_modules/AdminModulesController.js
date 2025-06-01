const { ObjectId } = require('mongodb');
const async = require("async");
const AdminModule = require("./model/AdminModule");
const clone				= 	require('clone');

function AdminModulesController() {
	const GlobalAdminModulesController = this;

	/**
	 * Function to get Admin Modules list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			let search_data = req.body.search_data

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {
				async.parallel({
					module_list: (callback) => {
						/** Default sorting **/
						if (dataTableConfig.sort_conditions && typeof dataTableConfig.sort_conditions["_id"] !== typeof undefined) {
							dataTableConfig.sort_conditions = { parent_order: SORT_ASC, parent_id: SORT_ASC, order: SORT_ASC };
						}
						/** Search by title **/

						if(search_data.length){

							search_data.map(formdata=>{
								if(formdata.name!="search_open" && formdata.value!=""){

									if(formdata.name =="is_active"){
										dataTableConfig.conditions[formdata.name] 	= Number(formdata.value)
									}
									else{
										dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
									}

								}

							})

						}



						/** Set conditions **/
						let conditionsObj = [
							{ $match: dataTableConfig.conditions },
							{ $sort: dataTableConfig.sort_conditions },
							{ $skip: skip },
							{ $limit: limit },
							{
								$lookup: {
									"from": TABLE_ADMIN_MODULES,
									"localField": "parent_id",
									"foreignField": "_id",
									"as": "parent_detail"
								}
							},
							{
								$project: {
									id: 1, title: 1, parent_id: 1, is_active: 1, order: 1, modified: 1, parent_name: { $arrayElemAt: ["$parent_detail.title", 0] },
									parent_order: { $cond: { if: { $eq: ["$parent_id", 0] }, then: '$order', else: { $arrayElemAt: ["$parent_detail.order", 0] } } },
								}
							},

						]
						let optionObj = {
							conditions: conditionsObj,
						}

						AdminModule.getAllModuleWithAggrigate(req, res, optionObj).then(adminModulesRes => {

							let responseStatus = (adminModulesRes.status) ? adminModulesRes.status : "";
							let responseResult = (adminModulesRes.result) ? adminModulesRes.result : "";
							if (responseStatus == STATUS_ERROR) {
								callback(responseStatus, {});
							} else {
								callback(null, responseResult);
							}
						});
					},
					module_total_count: (callback) => {
						/** Get total number of records in admin module collection **/
						let optionObj = {
							conditions: dataTableConfig.conditions,
						}
						AdminModule.getResultCount(req, res, optionObj).then(adminModulesRes => {
							let responseStatus = (adminModulesRes.status) ? adminModulesRes.status : "";
							let responseCount = (adminModulesRes.result) ? adminModulesRes.result : "";
							if (responseStatus == STATUS_ERROR) {
								callback(responseStatus, {});
							} else {
								callback(null, responseCount);
							}
						});

					},
					module_filter_count: (callback) => {
						/** Get filtered records counting in admin module **/
						let optionObj = {
							conditions: dataTableConfig.conditions,

						}
						AdminModule.getResultCount(req, res, optionObj).then(adminModulesRes => {
							let responseStatus = (adminModulesRes.status) ? adminModulesRes.status : "";
							let responseCount = (adminModulesRes.result) ? adminModulesRes.result : "";
							if (responseStatus == STATUS_ERROR) {
								callback(responseStatus, {});
							} else {
								callback(null, responseCount);
							}
						});
					}
				}, (err, response) => {
					/** Send response **/
					res.send({
						status: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw: dataTableConfig.result_draw,
						data: (response['module_list']) ? response['module_list'] : [],
						recordsTotal: (response['module_total_count']) ? response['module_total_count'] : 0,
						recordsFiltered: (response['module_filter_count']) ? response['module_filter_count'] : 0
					});
				});
			});
		} else {
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/admin_modules/list']);
			res.render('list');
		}
	}

	/**
	 * Function for add admin module
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */

	this.add = (req, res) => {

		/** Form Post **/
		if (isPost(req)) {
			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

			if(req.body.page_descriptions === undefined || req.body.page_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.page_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
				  status	: STATUS_ERROR,
				  message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			let allData		= 	req.body;
			req.body		=	clone(allData.page_descriptions[DEFAULT_LANGUAGE_CODE]);

			try {
				let title = (req.body.title) ? req.body.title : "";
				let path = (allData.path) ? allData.path : "";
				let groupPath = (allData.group_path) ? allData.group_path : "";
				let icon = (allData.icon) ? allData.icon : "";
				let order = (allData.order) ? allData.order : "";
				let parentId = (allData.parent) ? new ObjectId(allData.parent) : 0;

				try {

					let insertUserData = {
						title: title,
						path: path,
						group_path: groupPath,
						icon: icon,
						parent_id: parentId,
						order: parseInt(order),
						pages_descriptions		: (allData.page_descriptions)	? allData.page_descriptions :{},
						is_active: ACTIVE,
						created: getUtcDate(),
						modified: getUtcDate(),
					}

					let optionObj = {
						insertData: insertUserData
					}

					AdminModule.saveModule(req, res, optionObj).then(record => {

						if (record.status == STATUS_ERROR) {
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.record.message }],
							});

						}
						myCache.del("admin_modules_list");

						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.admin_module.admin_module_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + "admin_modules",
							message: res.__("admin.admin_module.admin_module_has_been_added_successfully")
						});

					})


				} catch (e) {
					/** Send error response **/
					console.log(e.message);
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: e.message }]
					});
				}

			} catch (e) {
				/** Send error response **/
				res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

		} else {
			GlobalAdminModulesController.getAdminModulesList(req, res).then((response) => {
				getLanguages().then(languageList=>{

					if (response.status == STATUS_SUCCESS) {
						/** Render add page  **/
						req.breadcrumbs(BREADCRUMBS['admin/admin_modules/add']);
						res.render('add', {
							result: (response.result) ? response.result : "",
							language_list : languageList
						});
					} else {
						/** Send error response **/
						req.flash(STATUS_ERROR, response.message);
						res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');
					}
				})
			});
		}

	}

	/**
	 * Function to get Admin Module list
	 * @param req As Request Data
	 * @param res As Response Data
	 * @return json
	 */
	this.getAdminModulesList = (req, res) => {
		return new Promise(resolve => {
			try {
				/** Get admin modules details **/

				let optionObj = {
					conditions: { parent_id: 0, is_active : 1 },
					fields: { _id: 1, title: 1 },
					sort_condition: { "order": 1 }
				}
				AdminModule.getParentModules(req, res, optionObj).then(moduleList => {

					if (moduleList.status == STATUS_SUCCESS) {

						/** Send success response **/
						let response = {
							status: STATUS_SUCCESS,
							result: moduleList.result
						};
						resolve(response);
					} else {
						/** Send error response */
						let response = {
							status: STATUS_ERROR,
							result: [],
							message: res.__("admin.system.something_going_wrong_please_try_again")
						};
						resolve(response);
					}
				})

			} catch (e) {
				/** Send error response */
				let response = {
					status: STATUS_ERROR,
					result: [],
					message: res.__("admin.system.something_going_wrong_please_try_again")
				};
				resolve(response);
			}
		});
	};//End getAdminModulesList()



	/**
	 * Function for edit admin module
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.edit = (req, res) => {
		let moduleId = (req.params.id) ? req.params.id : "";
		if (moduleId && moduleId != "") {
			if (isPost(req)) {
				/** Sanitize Data **/
				req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
				if(req.body.page_descriptions === undefined || req.body.page_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.page_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
					/** Send error response */
					return res.send({
					  status	: STATUS_ERROR,
					  message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					});
				}

				let allData		= 	req.body;
				req.body		=	clone(allData.page_descriptions[DEFAULT_LANGUAGE_CODE]);

				try {
					let title = (req.body.title) ? req.body.title : "";
					let path = (allData.path) ? allData.path : "";
					let groupPath = (allData.group_path) ? allData.group_path : "";
					let icon = (allData.icon) ? allData.icon : "";
					let order = (allData.order) ? allData.order : "";
					let parentId = (allData.parent) ? new ObjectId(allData.parent) : 0;

					/** update  admin module data*/
					let updateData = {
						$set: {
							title: title,
							path: path,
							group_path: groupPath,
							icon: icon,
							parent_id: parentId,
							pages_descriptions		: (allData.page_descriptions)	? allData.page_descriptions :{},
							order: parseInt(order),
							modified: getUtcDate()
						}
					};
					/** Save and update user data **/
					let optionObj = {
						conditions: {
							_id: new ObjectId(moduleId)
						},
						updateData: updateData

					}

					AdminModule.updateModule(req, res, optionObj).then(updateResult => {

						if (updateResult.status == STATUS_ERROR) {
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
							});
						}
						/** Delete Modules list **/
						myCache.del("admin_modules_list");
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.admin_module.admin_modules_details_updated_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'admin_modules',
							message: res.__("admin.admin_module.admin_modules_details_updated_successfully")
						});

					})

				} catch (e) {
					/** Send error response **/
					console.log(e)
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: e.message }]
					});
				}

			} else {
				async.parallel([
					(callback) => {
						let optionObj = {
							conditions: { parent_id: 0 },
							fields: { _id: 1, title: 1 },
							sort_condition: { "order": 1 }
						}
						GlobalAdminModulesController.getAdminModulesList(req, res, optionObj).then((parentResponse) => {
							if (parentResponse.status == STATUS_SUCCESS) {
								callback(null, parentResponse.result);
							} else {
								callback(STATUS_ERROR, parentResponse);
							}
						});
					},
					(callback) => {
						GlobalAdminModulesController.getAdminModuleDetails(req, res).then(response => {
							if (response.status == STATUS_SUCCESS) {
								callback(null, response.result);
							} else {
								callback(STATUS_ERROR, response);
							}
						});
					},
					(callback)=>{
						getLanguages().then(languageList=>{
							callback(null,languageList)
						})
					}
				], (err, response) => {
					if (!err) {
						/** Render edit page  **/
						req.breadcrumbs(BREADCRUMBS['admin/admin_modules/edit']);
						res.render('edit', {
							parentResult: (response[0]) ? response[0] : [],
							result: (response[1]) ? response[1] : [],
							language_list : (response[2]) ? response[2] : []
						});
					} else {
						/** Send error response **/
						req.flash(STATUS_ERROR, response.message);
						res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');
					}
				});
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "admin_modules");
		}
	};//End edit()





	/**
	 * Function for get Admin Module Details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
	this.getAdminModuleDetails = (req, res) => {

		return new Promise(resolve => {
			let id = (req.params.id) ? req.params.id : "";
			if (!id || id == '') {
				let response = {
					status: STATUS_ERROR,
					message: res.__("admin.system.invalid_access")
				};
				resolve(response);
			} else {
				try {
					/** Get admin module details **/
					let optionObj = {
						conditions: {
							_id: new ObjectId(id)
						},
						fields: { _id: 1, title: 1, path: 1, order: 1, group_path: 1, icon: 1, is_active: 1, modified: 1, parent_id: 1, pages_descriptions: 1 }
					}
					AdminModule.getModuleDetail(req, res, optionObj).then(result => {
						let response = {
							status: result.status,
							result: result.result,
							message: result.message
						};
						resolve(response);
					});

				} catch (e) {

					/** Send error response **/
					let response = {
						status: STATUS_ERROR,
						message: e.message
					};
					resolve(response);
				}
			}
		});
	};//End getAdminModuleDetails();

	/**
	 * Function for get Admin Module Details
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return json
	 */
	this.updateAdminModuleStatus = (req, res) => {
		try {
			let moduleId = (req.params.id) ? req.params.id : "";
			let status = (req.params.status == ACTIVE) ? DEACTIVE : ACTIVE;
			if (moduleId) {

				optionObj = {
					conditions: {
						$or: [
							{ _id: new ObjectId(moduleId) },
							{ parent_id: new ObjectId(moduleId) }
						]
					},
					updateData: {
						$set: {
							is_active: status,
							modified: getUtcDate()
						}
					}

				}
				AdminModule.updateMultipleModule(req, res, optionObj).then(result => {


					if (result.status == STATUS_ERROR) {
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');
					}
					myCache.del("admin_modules_list");

					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.admin_module.admin_modules_status_updated_successfully"));
					res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');

				})

			} else {
				/** Send error response **/
				req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
				res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');
			}
		} catch (e) {
			console.log(e.message)
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
			res.redirect(WEBSITE_ADMIN_URL + 'admin_modules');
		}
	}

	/**
	 * Function for delete admin module
	 * @param req As Request Data
	 * @param res As Response Data
	 * @return null
	 */
	this.delete = (req, res) => {
		let moduleId = (req.params.id) ? req.params.id : '';
		if (moduleId) {
			try {
				/** Delete admin module*/
				optionObj = {
					conditions: {
						$or: [
							{ _id: new ObjectId(moduleId) },
							{ parent_id: new ObjectId(moduleId) }
						]
					}
				}
				AdminModule.deleteMultipleModule(req, res, optionObj).then(result => {

					if (result.status == STATUS_ERROR) {
						/** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + "admin_modules");
					}

					/** Delete Modules list **/
					myCache.del("admin_modules_list");
					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.admin_module.admin_module_has_been_deleted_successfully"));
					res.redirect(WEBSITE_ADMIN_URL + "admin_modules");

				})

			} catch (e) {
				console.log(e.message)
				/** Send error response **/
				req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL + "admin_modules");
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "admin_modules");
		}
	};//End delete()

}


module.exports = new AdminModulesController();
