const { ObjectId } = require('mongodb');
const async = require("async");
const EmailTemplate = require("./model/emailTemplates");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

const clone = require('clone');

function EmailTemplateController() {

	/**
	 * Function to get email template list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getTemplateList = (req, res, next) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			let search_data = req.body.search_data

			configDatatable(req, res, null).then(dataTableConfig => {

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
							"template_list": [
								{
									$match: dataTableConfig.conditions
								},
								{
									$project: {
										_id: 1, name: 1, subject: 1, modified: 1
									}
								},
								{
									$sort: dataTableConfig.sort_conditions
								},
								{ $skip: skip },
								{ $limit: limit },
							],
							"template_all_count": [
								{
									$group: {
										_id: null,
										count: { $count: {} }
									}
								},
								{
									$project: { _id: 0, count: 1 }
								}
							],
							"template_filter_count": [
								{ $match: dataTableConfig.conditions },
								{
									$group: {
										_id: null,
										count: { $count: {} }
									}
								},
								{
									$project: { _id: 0, count: 1 }
								}
							]
						}
					}
				];

				let optionObj = {
					conditions: conditions
				}

				EmailTemplate.getEmailTemplateAggregateList(req, res, optionObj).then(templateResponse => {
					let responseStatus = (templateResponse.status) ? templateResponse.status : "";
					let responseResult = (templateResponse.result && templateResponse.result[0]) ? templateResponse.result[0] : "";

					let template_list = (responseResult && responseResult.template_list) ? responseResult.template_list : [];
					let template_all_count = (responseResult && responseResult.template_all_count && responseResult.template_all_count[0] && responseResult.template_all_count[0]["count"]) ? responseResult.template_all_count[0]["count"] : DEACTIVE;
					let template_filter_count = (responseResult && responseResult.template_filter_count && responseResult.template_filter_count[0] && responseResult.template_filter_count[0]["count"]) ? responseResult.template_filter_count[0]["count"] : DEACTIVE;

					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: template_list,
						recordsTotal: template_all_count,
						recordsFiltered: template_filter_count,
					});
				})
			});
		} else {

			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/email_template/list"]);
			res.render('list');
		}

	}

	/**
	* Function to edit an email template
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
	this.editEmailTemplate = (req, res, next) => {
		let emailTemplateId = (req.params.id) ? req.params.id : "";
		if (emailTemplateId) {
			if (isPost(req)) {

				req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);


				let pageBody = (req.body.body) ? req.body.body : "";

				if (pageBody != "") {
					req.body.body = pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g), " ").trim();
				}

				try {

					let name = (req.body.name) ? req.body.name : "";
					let subject = (req.body.subject) ? req.body.subject : "";
					//let body	=	(req.body.body)			?	req.body.body 		:"";

					let updateCondition = {
						_id: new ObjectId(emailTemplateId)
					}

					let updateData = {
						name: name,
						subject: subject,
						body: pageBody,
						// email_descriptions	:	(allData.email_descriptions)	?	allData.email_descriptions	:{},
						modified: getUtcDate()
					}

					let optionObj = {
						conditions: updateCondition,
						updateData: { $set: updateData }
					}

					EmailTemplate.updateEmailTemplate(req, res, optionObj).then(updateResponse => {
						let updateStatus = (updateResponse.status) ? updateResponse.status : '';
						if (updateStatus == STATUS_SUCCESS) {
							/** Send Success response **/
							req.flash(STATUS_SUCCESS, res.__("admin.email_template.email_template_has_been_updated_successfully"));
							res.send({
								status: STATUS_SUCCESS,
								redirect_url: WEBSITE_ADMIN_URL + "email_template",
								message: res.__("admin.email_template.email_template_has_been_updated_successfully"),
							});
						} else {
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
							});
						}
					})

				} catch (e) {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				}



			} else {
				/** Get language list **/
				getLanguages().then(languageList => {
					/** Get email template details **/
					let detailCondition = {
						_id: new ObjectId(emailTemplateId)
					}

					let detailField = { _id: 1, name: 1, subject: 1, action: 1, body: 1, modified: 1, email_descriptions: 1 }

					let optionObj = {
						conditions: detailCondition,
						fields: detailField
					}

					EmailTemplate.getTemplateDetail(req, res, optionObj).then((templateDetailResponse) => {
						if (templateDetailResponse.status == STATUS_SUCCESS) {
							/** Render edit page*/

							let emailOptions = null;
							let action = (templateDetailResponse.result.action) ? templateDetailResponse.result.action : null;

							let conditions = {
								action: action,
							};

							DbClass.getFindOne({
								conditions: conditions,
								collection: TABLE_EMAIL_ACTIONS,
							}).then((emailActionResponse) => {

								if (emailActionResponse.status == STATUS_SUCCESS) {
									let emailActionResult = emailActionResponse.result ? emailActionResponse.result : "";
									emailOptions = (emailActionResult.options) ? emailActionResult.options : "";

									req.breadcrumbs(BREADCRUMBS["admin/email_template/edit"]);
									res.render('edit', {
										result: templateDetailResponse.result,
										email_options: emailOptions,
										language_list: languageList
									});
								} else {
									req.flash("error", templateDetailResponse.message);
									res.redirect(WEBSITE_ADMIN_URL + "email_template");
								}

							});

						} else {
							req.flash("error", templateDetailResponse.message);
							res.redirect(WEBSITE_ADMIN_URL + "email_template");
						}
					});
				});
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "dashboard");
		}
	}
}

module.exports = new EmailTemplateController()