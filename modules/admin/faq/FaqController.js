const FaqModel = require("./model/Faq");
const { ObjectId } = require('mongodb');
const async = require('async');



function Faq() {
 

	/**
	 * Function to get cms list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getFaqList = (req, res) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			let userType = (req.body.user_type_search) ? req.body.user_type_search : "";
			let question = (req.body.question) ? req.body.question : "";
			let answer = (req.body.answer) ? req.body.answer : "";

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {

				let search_data = (req.body.search_data) ? req.body.search_data : [];
				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {
							if (formdata.name == "question" || formdata.name == "answer") {
								dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
							}
						}
					})
				}

				let conditions = [
					{
						$facet: {
							"faq_list": [
								{
									$project: {
										_id: 1,
										question: 1,
										answer: 1,
										modified: 1,
										is_active: 1,
										display_priority: { $cond: { if: "$display_priority", then: "$display_priority", else: 0 } },
									}
								},
								{ $match: dataTableConfig.conditions },
								{ $sort: dataTableConfig.sort_conditions },
								{ $skip: skip },
								{ $limit: limit },
							],
							"faq_all_count": [
								{
									$group: {
										_id: null,
										count: { $count: {} }
									}
								},
								{
									$project: {
										_id: 0, count: 1
									}
								}
							],
							"faq_filter_count": [
								{
									$group: {
										_id: null,
										count: { $count: {} }
									}
								},
								{
									$project: {
										_id: 0, count: 1
									}
								}
							]
						}
					}
				];

				let optionObj = {
					conditions: conditions
				}

				FaqModel.getAggregateFaqList(req, res, optionObj).then(faqResponse => {
					let responseStatus = (faqResponse.status) ? faqResponse.status : "";
					let responseResult = (faqResponse.result && faqResponse.result[0]) ? faqResponse.result[0] : "";

					let faq_list = (responseResult && responseResult.faq_list) ? responseResult.faq_list : [];
					let faq_all_count = (responseResult && responseResult.faq_all_count && responseResult.faq_all_count[0] && responseResult.faq_all_count[0]["count"]) ? responseResult.faq_all_count[0]["count"] : DEACTIVE;
					let faq_filter_count = (responseResult && responseResult.faq_filter_count && responseResult.faq_filter_count[0] && responseResult.faq_filter_count[0]["count"]) ? responseResult.faq_filter_count[0]["count"] : DEACTIVE;
					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: faq_list,
						recordsTotal: faq_all_count,
						recordsFiltered: faq_filter_count,
					});
				})
			});
		} else {
			let options = {
				collections: [
					{
						collection: TABLE_MASTERS,
						columns: ["_id", "name"],
						conditions: {
							dropdown_type: 'faq_category',
							status: ACTIVE
						}
					}
				]
			}
			/** Get dropdown list */
			getDropdownList(req, res, options).then(dropDownResponse => {
				/** render listing page **/
				req.breadcrumbs(BREADCRUMBS['admin/faq/list']);
				res.render('list', {
					faq_category_list: (dropDownResponse && dropDownResponse.final_html_data && dropDownResponse.final_html_data["0"]) ? dropDownResponse.final_html_data["0"] : "",
				});
			});
		}
	};//End getCmsList()

	/**
	 * Function to get cms's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getFaqDetails = (req, res, next) => {
		return new Promise(resolve => {
			let faqId = (req.params.id) ? req.params.id : "";
			/** Get Cms details **/
			let conditionsObj = { _id: new ObjectId(faqId) };
			let optionObj = {
				conditions: conditionsObj,
				fields: { _id: 1, name: 1, body: 1, modified: 1, pages_descriptions: 1, question: 1, is_active: 1, user_type: 1, answer: 1 },
			}
			FaqModel.getFaqFindOne(optionObj).then(blockRes => {

				let result = (blockRes.result) ? blockRes.result : "";
				if (!result) {
					/** Send error response */
					let response = {
						status: STATUS_ERROR,
						message: res.__("admin.system.invalid_access")
					};
					return resolve(response);
				}

				/** Send success response */
				let response = {
					status: STATUS_SUCCESS,
					result: result
				};
				resolve(response);
			});

		});
	};// End getFaqDetails().

	/**
	 * Function to update cms's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editFaq = (req, res, next) => {
		if (isPost(req)) {

			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			let id = (req.params.id) ? req.params.id : "";

			if (id == "" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '')) {
				/** Send error response **/
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			const clone = require('clone');
			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let answer = (req.body.answer) ? req.body.answer : "";

			/** Check validation **/
			if (answer != "") {
				req.body.answer = answer.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
			}

			let conditionsObj = { _id: new ObjectId(id) };
			let updateRecordObj = {
				$set: {
					answer: answer,
					question: (req.body.question) ? req.body.question : "",
					default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
					pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
					modified: getUtcDate()
				}
			}
			let optionObj = {
				conditions: conditionsObj,
				updateData: updateRecordObj,
			}
			FaqModel.updateOneFaq(req, res, optionObj).then(updateResult => {
				let responseStatus = (updateResult.status) ? updateResult.status : "";
				if (responseStatus == STATUS_ERROR) {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				} else {
					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.faq.faq_has_been_updated_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'faq',
						message: res.__("admin.faq.faq_has_been_updated_successfully"),
					});
				}
			})
		} else {
			getFaqDetails(req, res, next).then(response => {

				/** Get faq details **/
				if (response.status != STATUS_SUCCESS) {
					/** Send error response **/
					req.flash('error', response.message);
					res.redirect(WEBSITE_ADMIN_URL + 'faq');
					return;
				}

				/** Get language list **/
				getLanguages().then(languageList => {
					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/faq/edit']);
					res.render('edit', {
						result: response.result,
						language_list: languageList,
					});
				}).catch(next);
			});
		}
	};//End editFaq()

	/**
	 * Function for add cms
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addFaq = (req, res, next) => {
		if (isPost(req)) {
			/** Sanitize Data */
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			if (req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '') {
				/** Send error response */
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			const clone = require('clone');
			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let answer = (req.body.answer) ? req.body.answer : "";
			let question = (req.body.question) ? req.body.question : "";

			if (answer != "") {
				req.body.body = answer.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
			}


			/** Set options **/
			let options = {
				title: question,
				table_name: "faqs",
				slug_field: "slug"
			};

			/** Make Slug */
			getDatabaseSlug(options).then(async (response) => {
				/** Save Cms details */
				const collationName = db.collection(TABLE_FAQS);
				let priorityData = await collationName.find({ "display_priority": { $exists: true } }).collation(COLLATION_VALUE).sort({ "display_priority": -1 }).limit(1).toArray();
				let priority = 1;
				if (priorityData.length > 0) {
					priority = (priorityData[0] && priorityData[0]['display_priority']) ? priorityData[0]['display_priority'] + 1 : 1;
				}
				let optionObj = {
					insertData: {
						question: question,
						answer: answer,
						slug: (response && response.title) ? response.title : "",
						default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
						is_active: ACTIVE,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						display_priority: priority,
						created: getUtcDate(),
						modified: getUtcDate()
					}
				}
				FaqModel.saveFaq(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					}
					/** Send success response */
					req.flash(STATUS_SUCCESS, res.__("admin.faq.faq_has_been_added_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'faq',
						message: res.__("admin.faq.faq_has_been_added_successfully")
					});

				})

			}, error => {
				/** Send error response */
				res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			});
		} else {

			/** Get language list */
			getLanguages().then(languageList => {
				req.breadcrumbs(BREADCRUMBS['admin/faq/add']);
				/**Render add cms page */
				res.render('add', {
					language_list: languageList
				});
			}).catch(next);
		}
	};//End addFaq()

	/**
	 *  * Function for delete faq
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 * **/
	this.deleteFaq = (req, res, next) => {
		var response = (req.body.data) ? req.body.data : "";
		var faqId = (req.params.id) ? req.params.id : "";

		let conditionsObj = { _id: new ObjectId(faqId) };
		let optionObj = {
			conditions: conditionsObj,
		}
		FaqModel.deleteOneFaq(req, res, optionObj).then(deleteRes => {
			let responseStatus = (deleteRes.status) ? deleteRes.status : "";
			if (responseStatus == STATUS_ERROR) {
				/** Send error response **/
				res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}
			/** Send success response **/
			req.flash(STATUS_SUCCESS, res.__("admin.faq.faq_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL + "faq");

		})

	};

	/**
 * Function for update faq's status
 *
 * @param req 	As Request Data
 * @param res 	As Response Data
 * @param next 	As Callback argument to the middleware function
 *
 * @return null
 */
	this.updateFaqStatus = (req, res, next) => {
		let faqId = (req.params.id) ? req.params.id : "";
		let faqStatus = (req.params.status == ACTIVE) ? DEACTIVE : ACTIVE;

		/** Update Faq record **/
		let conditionsObj = { _id: new ObjectId(faqId) };
		let updateRecordObj = {
			$set: {
				is_active: faqStatus,
				modified: getUtcDate()
			}
		}
		let optionObj = {
			conditions: conditionsObj,
			updateData: updateRecordObj,
		}
		FaqModel.updateOneFaq(req, res, optionObj).then(updateResult => {
			let responseStatus = (updateResult.status) ? updateResult.status : "";
			if (responseStatus == STATUS_ERROR) {
				/** Send error response **/
				res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}
			/** Send success response **/
			req.flash(STATUS_SUCCESS, res.__("admin.faq.faq_status_has_been_updated_successfully"));
			res.redirect(WEBSITE_ADMIN_URL + "faq");
		})


	};//End updateFaqStatus()

	/**
	 * Function for view faq's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewFaqDetails = (req, res, next) => {

		/** Get faq details **/
		getFaqDetails(req, res, next).then((response) => {
			if (response.status != STATUS_SUCCESS) {
				/** Send error response **/
				req.flash(STATUS_ERROR, response.message);
				res.redirect(WEBSITE_ADMIN_URL + "faq");
				return;
			}

			/** Render view page  **/
			req.breadcrumbs(BREADCRUMBS['admin/faq/view']);
			res.render('view', {
				result: (response.result) ? response.result : {},
			});
		}).catch(next);
	};//End viewFaqDetails()

	/**
	 * Function for update display priority status
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.changeDisplayPriority = (req, res, next) => {
		let masterId = (req.body.id) ? req.body.id : "";
		let priority = (req.body.new_priority) ? req.body.new_priority : ""
		var error = 0;
		var message = "";
		var isPriority = Number.isInteger(Number(priority));
		if (priority == "") {
			error = 1;
			message = "Please enter priority.";
		} else if (isNaN(priority)) {
			error = 1;
			message = "Priority should be numeric";
		} else if (priority < ACTIVE) {
			error = 1;
			message = "Priority should be greater than zero";
		} else if (isPriority == false) {
			error = 1;
			message = "Priority should be an integer";
		}

		if (error == 1) {
			res.send({
				status: STATUS_ERROR,
				message: message,
			});
		} else {
			/** Update master status **/
			let updateCondition = {
				_id: new ObjectId(masterId)
			}

			let updateData = {
				display_priority: parseInt(priority),
			}

			let optionObj = {
				conditions: updateCondition,
				updateData: { $set: updateData }
			};

			FaqModel.updateOneFaq(req, res, optionObj).then(updateMasterResponse => {
				if (updateMasterResponse.status === STATUS_SUCCESS) {
					/** Send success response **/
					message = res.__("Display priority has been updated successfully");
					res.send({
						status: STATUS_SUCCESS,
						message: message,
					});
				} else {
					/** Send success response **/
					res.send({
						status: STATUS_SUCCESS,
						message: res.__("admin.system.something_going_wrong_please_try_again"),
					});
				}
			});
		}
	};// end changeDisplayPriority()

}
module.exports = new Faq();
