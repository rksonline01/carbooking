const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const async = require("async");
const TestSetting = require("./model/TextSetting");
function TextSettingController() {

	/**
	 * Function to get textsettings list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getTextSettingList = (req, res) => {
		let textSettingType = (req.params.type) ? req.params.type : "";
		if (textSettingType && TEXT_SETTINGS_NAME[textSettingType]) {
			let textSettingName = TEXT_SETTINGS_NAME[textSettingType];

			if (isPost(req)) {

				let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
				let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
				let searchData      = (req.body.search_data) ? req.body.search_data : [];

				/** Configure Datatable conditions*/
				configDatatable(req, res, null).then((dataTableConfig) => {
					let commonConditions = {
						type: textSettingType
					};
					dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

					if(searchData.length){
						searchData.map(formdata=>{
							if(formdata.name!="search_open" && formdata.value!=""){
								{
									dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
								}
							}
						})
					}

					let conditions = [{
						$facet : {
							"text_settings_list" : [
								{ $match : dataTableConfig.conditions},
								{
									$project : {
										_id: 1,
										key: 1, 
										value:  1,
										modified: 1
									}
								},
								{ $sort : dataTableConfig.sort_conditions},
								{ $skip : skip},
								{ $limit : limit}
							],
							"text_setting_all_count" : [
								{$match : commonConditions},
								{$group:{
									_id: null,
									count: { $sum: 1 }
								}},
								{
									$project:{count:1,_id:0}
								}
							],
							"text_setting_filter_count" : [
								{$match : dataTableConfig.conditions},
								{$group:{
									_id: null,
									count: { $sum: 1 }
								}},
								{
									$project:{count:1,_id:0}
								}
							]
						}
					}];

					let optionObj = {
						conditions : conditions
					}

					TestSetting.getAggregateTextSetting(req,res,optionObj).then(textSettingResponse=>{
						let responseStatus = (textSettingResponse.status) ? textSettingResponse.status : "";
						let responseResult = (textSettingResponse.result && textSettingResponse.result[0]) ? textSettingResponse.result[0] : "";
						
						let text_settings_list = (responseResult && responseResult.text_settings_list) ? responseResult.text_settings_list : [];
						let text_setting_all_count = (responseResult && responseResult.text_setting_all_count && responseResult.text_setting_all_count[0] && responseResult.text_setting_all_count[0]["count"]) ? responseResult.text_setting_all_count[0]["count"] : DEACTIVE;
						let text_setting_filter_count = (responseResult && responseResult.text_setting_filter_count && responseResult.text_setting_filter_count[0] && responseResult.text_setting_filter_count[0]["count"]) ? responseResult.text_setting_filter_count[0]["count"] : DEACTIVE;
						res.send({
							status			: 	responseStatus,
							draw			:	dataTableConfig.result_draw,
							data			:   text_settings_list,
							recordsTotal	:	text_setting_all_count,
							recordsFiltered	:  	text_setting_filter_count,
						});
					});
				});
			} else {
				/** render listing page **/
				req.breadcrumbs(BREADCRUMBS["admin/text_setting/list"]);
				res.render("list", {
					type: textSettingType,
					dynamic_variable: textSettingName + " " + res.__("admin.text_setting.management"),
					dynamic_url: textSettingType
				});
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	};//End getTextSettingList()

	/**
	 * Function for get text setting's detail
	 *
	 * @param req		As Request Data
	 * @param res		As Response Data
	 *
	 * @return json
	 */
	let textSettingDetails = (req, res) => {
		return new Promise(resolve => {
			let textSettingId = (req.params.id) ? req.params.id : "";
			if (!textSettingId || textSettingId == "") {
				let response = {
					status: STATUS_ERROR,
					message: res.__("admin.system.invalid_access")
				};
				resolve(response);
			} else {
				try {
					/**Get text settings detials*/

					let conditionsObj = { _id: new ObjectId(textSettingId) };
					let optionObj = {
						conditions: conditionsObj,
						collection: TABLE_TEXT_SETTINGS,
						fields: { _id: 1, key: 1, value: 1, modified: 1, default_language_id: 1, text_settings_descriptions: 1 },
					}
					TestSetting.getTextSettingFindOne(optionObj).then(textSettingRes => {

						let textStatus = (textSettingRes.status) ? textSettingRes.status : "";
						let textResult = (textSettingRes.result) ? textSettingRes.result : "";
						if (textStatus == STATUS_ERROR) {
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
								result: textResult
							};
							resolve(response);
						}
					});

				} catch (e) {

					/** Send error response */
					let response = {
						status: STATUS_ERROR,
						message: res.__("admin.system.something_going_wrong_please_try_again")
					};
					resolve(response);
				}
			}
		});
	};//End textSettingDetails()




	/**
	 * Function for update text setting's detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.editTextSetting = (req, res) => {
		let textSettingType = (req.params.type) ? req.params.type : "";
		let id = (req.params.id) ? req.params.id : "";

		if (textSettingType && TEXT_SETTINGS_NAME[textSettingType]) {

			let textSettingName = TEXT_SETTINGS_NAME[textSettingType];
			if (isPost(req)) {

				/** Sanitize Data **/
				req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

				if (id != "" && typeof req.body.text_settings_descriptions !== typeof undefined && (typeof req.body.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID] !== typeof undefined && req.body.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID] && req.body.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID] != "")) {
					const clone = require("clone");
					let allData = req.body;
					req.body = clone(allData.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
					req.body.key = (allData.key) ? allData.key : "";

					try {
						let key = (req.body.key) ? req.body.key : "";
						let value = (req.body.value) ? req.body.value : "";

						/** Update record*/

						let conditionsObj = { _id: new ObjectId(id) };
						let updateRecordObj = {
							$set: {
								key: key,
								value: value,
								default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
								text_settings_descriptions: (allData.text_settings_descriptions) ? allData.text_settings_descriptions : {},
								modified: getUtcDate()
							}
						}
						/** Update record*/
						let optionObj = {
							conditions: conditionsObj,
							updateData: updateRecordObj,
							collection: TABLE_TEXT_SETTINGS
						}
						TestSetting.updateOneTextSetting(req, res, optionObj).then(updateResult => {

							let responseStatus = (updateResult.status) ? updateResult.status : "";
							if (responseStatus == STATUS_ERROR) {
								/** Send error response **/
								res.send({
									status: STATUS_ERROR,
									message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
								});
							} else {
								writeTextSettingFile().then(response => {
									/** Send success response **/
									req.flash(STATUS_SUCCESS, res.__("admin.text_setting.text_setting_has_been_updated_successfully"));
									res.send({
										status: STATUS_SUCCESS,
										redirect_url: WEBSITE_ADMIN_URL + "text-setting/" + textSettingType,
										message: res.__("admin.text_setting.text_setting_has_been_updated_successfully"),
									});
								});
							}
						});
					} catch (e) {
						/** Send error response **/

						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					}

				} else {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: res.__("admin.system.something_going_wrong_please_try_again")
					});
				}
			} else {

				/** Get language list **/
				getLanguages(req, res).then((languageList) => {
					/** Get text settings details **/
					textSettingDetails(req, res).then((response) => {
						if (response.status == STATUS_SUCCESS) {
							/** Render edit page **/
							req.breadcrumbs(BREADCRUMBS["admin/text_setting/edit"]);
							res.render("edit", {
								result: response.result,
								language_list: languageList,
								type: textSettingType,
								dynamic_variable: textSettingName + " " + res.__("admin.text_setting.management"),
								dynamic_url: textSettingType,
								textSettingId: id,
							});
						} else {
							/** Send error response **/
							req.flash(STATUS_ERROR, response.message);
							res.redirect(WEBSITE_ADMIN_URL + "text-setting/" + textSettingType);
						}
					});
				});
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	};//End editTextSetting()

	/**
	 * Function for add text settings
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.addTextSetting = (req, res) => {
		let textSettingType = (req.params.type) ? req.params.type : "";
		if (textSettingType && TEXT_SETTINGS_NAME[textSettingType]) {
			let textSettingName = TEXT_SETTINGS_NAME[textSettingType];
			if (isPost(req)) {

				/** Sanitize Data **/
				req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
				if (req.body.text_settings_descriptions != undefined && req.body.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID] != undefined && req.body.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID] != "") {
					const clone = require("clone");
					let allData = req.body;
					req.body = clone(allData.text_settings_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
					req.body.key = (allData.key) ? allData.key : "";

					//return false;
					try {
						let key = (req.body.key) ? req.body.key : "";
						let value = (req.body.value) ? req.body.value : "";
						/** Insert record*/
						let optionObj = {
							insertData: {
								key: key,
								value: value,
								type: textSettingType,
								default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
								text_settings_descriptions: (allData.text_settings_descriptions) ? allData.text_settings_descriptions : {},
								created: getUtcDate(),
								modified: getUtcDate()
							},
							collection: TABLE_TEXT_SETTINGS
						}
						TestSetting.saveTextSetting(req, res, optionObj).then(saveResult => {

							let responseStatus = (saveResult.status) ? saveResult.status : "";

							if (responseStatus == STATUS_ERROR) {
								/** Send error response **/
								res.send({
									status: STATUS_ERROR,
									message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
								});
							} else {
								writeTextSettingFile().then((response) => {

									/** Send success response **/
									req.flash(STATUS_SUCCESS, res.__("admin.text_setting.text_setting_has_been_added_successfully"));
									res.send({
										status: STATUS_SUCCESS,
										redirect_url: WEBSITE_ADMIN_URL + "text-setting/" + textSettingType + "/add",
										message: res.__("admin.text_setting.text_setting_has_been_added_successfully")
									});
								});
							}
						});


					} catch (e) {

						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					}

				} else {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				}
			} else {

				/** Get language list **/
				getLanguages(req, res).then((languageList) => {

					/** Render add page **/
					req.breadcrumbs(BREADCRUMBS["admin/text_setting/add"]);
					res.render("add", {
						language_list: languageList,
						type: textSettingType,
						dynamic_variable: textSettingName + " " + res.__("admin.text_setting.management"),
						dynamic_url: textSettingType,
					});
				});
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	};//End addTextSetting()

	/**
	 * Function for deleting text setting's detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.deleteOneTextSettings = (req,res) =>{
		let textSettingType = (req.params.type) ? req.params.type : "";
		let id = (req.params.id) ? req.params.id : "";
		if (textSettingType && TEXT_SETTINGS_NAME[textSettingType] && id) {

			let deleteCondition = {
				_id : new ObjectId(id)
			};

			let deleteOption = {
				conditions : deleteCondition
			}

			TestSetting.deleteOneTextSetting(req,res,deleteOption).then(textResponse=>{
				let responseStatus = (textResponse.status) ? textResponse.status : "";
				if (responseStatus == STATUS_ERROR) {
					/** Send error response **/
					req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
					res.redirect(WEBSITE_ADMIN_URL + "text-setting/"+textSettingType);
				} else {
					writeTextSettingFile().then(response => {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.text_setting.text_setting_has_been_deleted_successfully"));
						res.redirect(WEBSITE_ADMIN_URL + "text-setting/"+textSettingType);
					});
				}
			})

		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	}

	/**
	 * Function for deleting multiple text setting's detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.deleteMultipleTextSettings = (req,res) =>{
		let textSettingType = (req.params.type) ? req.params.type : "";
		let id = (req.body.text_setting_ids) ? req.body.text_setting_ids : [];
		if (textSettingType && TEXT_SETTINGS_NAME[textSettingType]) {

			if(id.length > 0){
				let selectedId = [];
				selectedId = id.map(id=>{return new ObjectId(id)})

				let deleteCondition = {
					_id : {$in : selectedId}
				};

				let deleteOption = {
					conditions : deleteCondition
				}

				TestSetting.deleteMultipleTextSetting(req,res,deleteOption).then(textResponse=>{
					let responseStatus = (textResponse.status) ? textResponse.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.send({
							status: STATUS_ERROR,
							redirect_url: WEBSITE_ADMIN_URL + "text-setting/" + textSettingType,
							message: res.__("admin.system.something_going_wrong_please_try_again")
						});
					} else {
						writeTextSettingFile().then(response => {
							/** Send success response **/
							req.flash(STATUS_SUCCESS, res.__("admin.text_setting.text_setting_has_been_deleted_successfully"));
							res.send({
								status: STATUS_SUCCESS,
								redirect_url: WEBSITE_ADMIN_URL + "text-setting/" + textSettingType,
								message: res.__("admin.text_setting.text_setting_has_been_deleted_successfully")
							});
						});
					}
				})
			}else{
				req.flash(STATUS_ERROR, res.__("select at least one id to perform the action."));
				res.redirect(WEBSITE_ADMIN_URL + "text-setting/"+textSettingType);
			}

			

		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	}

	/**
	 * Function to write text setting file.
	 *
	 * @param null
	 *
	 * @return void
	 */
	let writeTextSettingFile = () => {
		return new Promise(resolve => {
			try {

				/** Get Active Languages List **/
				let conditionsObj = { active: ACTIVE };
				let optionObj = {
					conditions: conditionsObj,
					collection: TABLE_LANGUAGES,
					limit: DEFAULT_LIMIT,
					skip: DEFAULT_SKIP,
					sort_condition: {},
					fields: { _id: 1, folder_code: 1 },
				}
				DbClass.getFindAll(optionObj).then(languageRes => {

					let languageStatus = (languageRes.status) ? languageRes.status : "";
					let languageResult = (languageRes.result) ? languageRes.result : "";
					if (languageStatus == STATUS_ERROR) {
						resolve();
					} else {
						if (languageResult && languageResult.length > 0) {
							let languageObject = {};
							let textSettingsObject = {};
							const fs = require("fs");
							var frontUrl = FRONT_URL_FOR_SETTINGS;

							languageResult.forEach((languageRecord, languageIndex) => {
								languageId = (languageRecord["_id"]) ? languageRecord["_id"] : "";
								languageFolderCode = (languageRecord["folder_code"]) ? languageRecord["folder_code"] : "";
								/** Create a Language Object With language id and folder code **/
								languageObject[languageId] = languageFolderCode;
								if (typeof textSettingsObject[languageFolderCode] === typeof undefined) {
									textSettingsObject[languageFolderCode] = {};
								}
								if (languageResult.length - 1 == languageIndex) {
									if (Object.keys(languageObject).length > 0) {
										/** Get All text settings **/
										let textOptionObj = {
											conditions: {},
											collection: TABLE_TEXT_SETTINGS,
											fields: { _id: 1, key: 1, value: 1, text_settings_descriptions: 1, modified: 1,type:1 },
										}
										DbClass.getFindAllWithoutLimit(textOptionObj).then(textSettinRes => {

											let textStatus = (textSettinRes.status) ? textSettinRes.status : "";
											let result = (textSettinRes.result) ? textSettinRes.result : "";
											if (textStatus == STATUS_ERROR) {
												resolve();
											} else {
												let textSettingsObject = {};
												let textSettingsWebObject = {};
												result.forEach((record, arrayIndex) => {
													let languageKey = (record.key) ? record.key : "";
													let languageValue = (record.value) ? record.value : "";
													let textType = (record.type) ? record.type : "";

													/** Loop through Language Object and check that particular value is exist in this language or not, if not exist then use default langugae value **/
													Object.keys(languageObject).forEach((languageId, languageIndex) => {
														folderCode = languageObject[languageId];
														/** Check Textsetting Folder code is undefined or not **/
														if (typeof textSettingsObject[folderCode] === typeof undefined) {
															textSettingsObject[folderCode] = {};
														}

														/** Check Textsetting[Folder code][Text setting key] is undefined or not **/
														if (typeof textSettingsObject[folderCode][languageKey] === typeof undefined) {
															textSettingsObject[folderCode][languageKey] = {};
														}

														/** Check if value is exist in a particular language or not **/
														if (typeof record["text_settings_descriptions"] !== typeof undefined && typeof record["text_settings_descriptions"][languageId] !== typeof undefined && typeof record["text_settings_descriptions"][languageId]["value"] !== typeof undefined && record["text_settings_descriptions"][languageId]["value"] != "") {
															textSettingsObject[folderCode][languageKey] = record["text_settings_descriptions"][languageId]["value"];
														} else {
															textSettingsObject[folderCode][languageKey] = languageValue;
														}

														/** Web start in front */
														if(textType == 'front'){
															/** Check Textsetting Folder code is undefined or not **/
															if (typeof textSettingsWebObject[folderCode] === typeof undefined) {
																textSettingsWebObject[folderCode] = {};
															}

															/** Check Textsetting[Folder code][Text setting key] is undefined or not **/
															if (typeof textSettingsWebObject[folderCode][languageKey] === typeof undefined) {
																textSettingsWebObject[folderCode][languageKey] = {};
															}

															/** Check if value is exist in a particular language or not **/
															if (typeof record["text_settings_descriptions"] !== typeof undefined && typeof record["text_settings_descriptions"][languageId] !== typeof undefined && typeof record["text_settings_descriptions"][languageId]["value"] !== typeof undefined && record["text_settings_descriptions"][languageId]["value"] != "") {
																textSettingsWebObject[folderCode][languageKey] = record["text_settings_descriptions"][languageId]["value"];
															} else {
																textSettingsWebObject[folderCode][languageKey] = languageValue;
															}
														}
														/** Web end in front */

														/** check If result.length-1 == arrayIndex, means textsettings loop is on the last index then write file **/
														if (result.length - 1 == arrayIndex) {
															fs.writeFile(WEBSITE_ROOT_PATH + "locales/" + folderCode + ".json", JSON.stringify(textSettingsObject[folderCode]), "utf8", () => { });
															fs.writeFile( frontUrl + FRONT_TEXT_SETTING_FILE_PATH + folderCode+"/common.json", JSON.stringify(textSettingsWebObject[folderCode]), "utf8", () => { });
															
															if (Object.keys(languageObject).length - 1 == languageIndex) {
																resolve();
															}
														}
													});

												})
											}

										});
									} else {
										resolve();
									}
								}
							});
						}
					}
				})
			} catch (e) {
				resolve();
			}
		});
	};//End writeTextSettingFile()
}

module.exports = new TextSettingController();
