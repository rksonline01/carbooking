const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const PushNotificationTypeModel =	require("./model/PushNotificationType");
const {ObjectId}	= require("mongodb");
const asyncParallel	 = require("async/parallel");
const clone = require('clone');


function PushNotificationTypeController() {

	/**
	 * Function to get faq list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getPushNotificationTypeList = (req, res,next)=>{
		if(isPost(req)){
			let limit	= 	(req.body.length) 	?	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip	= 	(req.body.start)	? 	parseInt(req.body.start)	:DEFAULT_SKIP;
			let search_data 	= req.body.search_data;

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

				if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "notification_type"){
                                dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
                            }else{
								dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };

							}
                        }
                    })
                }

				/** pipeline condition for get notification type details */
				let conditions = [
					{
						$facet : {
							list : [
								{
									$project:{
										_id: 1,
										title: 1,
										message: 1,
										modified: 1,
										notification_type: 1,
									}
								},
								{$match : dataTableConfig.conditions},
								{$sort	: dataTableConfig.sort_conditions},
								{$skip	: skip},
								{$limit	: limit}
							],
							count: [
								{$match: dataTableConfig.conditions},
								{$count: "count"},
							],
						}
					}
				];

				let optionObj = {
					'conditions' 	: conditions,

				}

				/**get Push notification type details */
				PushNotificationTypeModel.getAggregatePushNotificationTypeList(req,res,optionObj).then(notificationRes=>{

					/** Send response */
					res.send({
						status			: 	notificationRes.status || "",
						draw			:	dataTableConfig.result_draw,
						data			:   notificationRes.result && notificationRes.result[0] && notificationRes.result[0].list ||[],
						recordsTotal	:	notificationRes.result && notificationRes.result[0] && notificationRes.result[0].count && notificationRes.result[0].count[0] && notificationRes.result[0].count[0].count ||0,
						recordsFiltered	:  	notificationRes.result && notificationRes.result[0] && notificationRes.result[0].count && notificationRes.result[0].count[0] && notificationRes.result[0].count[0].count ||0,
					});
				})
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/push_notification_type/list']);
			res.render('list');
		}
	};//End getPushPushNotificationTypeList()

	/**
	 * Function to get Notification Type detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getPushNotificationTypeDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let notificationId = (req.params.id) ? req.params.id : "";
			let conditionsObj = { _id: new ObjectId(notificationId) };

			let optionObj = {
				conditions	: conditionsObj,
				fields		: { _id: 1, message: 1, notification_type: 1, pages_descriptions:1, title:1, user_type: 1, constant:1 },
			}

			PushNotificationTypeModel.getPushNotificationTypeFindOne(optionObj).then(blockRes => {
				let result = (blockRes.result) ? blockRes.result : "";
				if (!result) {
					/** Send error response */
					return resolve({
						status	: STATUS_ERROR,
						message	: res.__("admin.system.invalid_access")
					});
				}

				/** Send success response */
				resolve( {
					status	: STATUS_SUCCESS,
					result	: result
				});
			});
			
		});
	};// End getPushNotificationTypeDetails()


	/**
	 * Function for add edit Notification Type
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditPushNotificationType = (req, res, next) => {
		let notificationId	= 	(req.params.id) ?	new ObjectId(req.params.id) : new ObjectId();
		let isEditable 	    = 	(req.params.id)	?	true : false;
		
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

			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);

			req.body.type = allData.type;
			req.body.constants = allData.constants;
			
			let notificationType	=	(req.body.type) 		? 	parseInt(req.body.type) 			:"";
			let userType   			= 	(req.body.user_type)	? 	new ObjectId(req.body.user_type)	:"";
			let constants   		= 	(req.body.constants)	? 	req.body.constants					:"";
			let notificationMessage = 	(req.body.message)		? 	req.body.message					:"";
			let notificationTitle = 	(req.body.title)		? 	req.body.title					:"";

			let conditionsObj = {_id: notificationId};
			
				/** Update Data  */
				let updateRecordObj = {
					$set: {
						constant	: 	constants,
						title		: notificationTitle,
						message		: notificationMessage,
						default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						user_type	: userType,
						modified	: getUtcDate()
					},$setOnInsert: {
						notification_type	: 	notificationType,
						created				: 	getUtcDate()
					}
				}

				/** Option Object */
				let optionObj = {
					conditions	: conditionsObj,
					updateData	: updateRecordObj,
					upsertOption: {upsert: true}
				}
				/** Save faq details */
				PushNotificationTypeModel.updateOnePushNotificationType(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						return res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					}

					/** Send success response */
					let msg = (isEditable) ? res.__("admin.push_notification_types.notification_has_been_updated_successfully") : res.__("admin.push_notification_types.notification_has_been_added_successfully");
					if(!isEditable) req.flash(STATUS_SUCCESS,msg);

					res.send({
						status			: STATUS_SUCCESS,
						redirect_url	: WEBSITE_ADMIN_URL + 'push_notification_type',
						message			: msg
					});
				});
		} else {
			/** Get language list */
			asyncParallel({
				languages : (callback)=>{
					/** Get language list */
					getLanguages().then(languageList=>{
						callback(null, languageList);
					}).catch(next);
				},
				notification_type_details : (callback)=>{
					if(!isEditable) return callback(null,{});

					/** Get language list */
					getPushNotificationTypeDetails(req,res,next).then(response=>{

						if(response.status != STATUS_SUCCESS) return callback(response);
						callback(null, response.result);
					}).catch(next);
				},
				notification_type: (callback)=>{
					let optionObj = {
						conditions	: {},
						fields		: {notification_type: 1},
					}

					PushNotificationTypeModel.getPushNotificationTypeFindOne(optionObj).then(notificationResult => {
						let tmpNotiType = (notificationResult.status==STATUS_SUCCESS && notificationResult.result) ? parseInt(notificationResult.result.notification_type) +1 :1;
						callback(null, tmpNotiType);
					});
				},
			},(err, response)=>{
				if(err) return next(err);

				let notificationTypeDetails = 	(response.notification_type_details) ? response.notification_type_details  : {};
				/**Render add / edit faq page */
				res.render('add_edit',{
					// layout				:false,
					result 			  	: notificationTypeDetails,
					language_list	  	: (response && response.languages) ? response.languages : [],
					notification_type	: response.notification_type,
					is_editable	  	  	: isEditable
				});
			});
		}
	};//End addPushNotificationType()

	/**
	 *  * Function for delete Notification Type
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 * **/
	this.deletePushNotificationType = (req,res,next)=>{
		var NotificationId	=	(req.params.id)	?	req.params.id	: "";

		let optionObj = {
			conditions: { _id: new ObjectId(NotificationId) },
		}

		/** delete faq detail **/
		PushNotificationTypeModel.deleteOnePushNotificationType(req,res,optionObj).then(deleteRes => {
			let responseStatus = (deleteRes.status) ? deleteRes.status : "";
			if (responseStatus == STATUS_ERROR) {
				/** Send error response **/
				return res.send({
					status	: STATUS_ERROR,
					message	: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}
			/** Send success response **/
			req.flash(STATUS_SUCCESS, res.__("admin.push_notification_type.notification_type_has_been_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL + "push_notification_type");

		});
	}; //End deletePushNotificationType()

}
module.exports = new PushNotificationTypeController();
