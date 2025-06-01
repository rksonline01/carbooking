const crypto 	= 	require("crypto");
const async		= 	require("async");

function PushNotification() {

	/**
	 * Function for get list of push notification
	 * @param req As Request Data
	 * @param res As Response Data
	 * @return render/json
	 */
    this.getPushNotificationList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) 		? parseInt(req.body.length) 		: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)  		? parseInt(req.body.start)  		: DEFAULT_SKIP;
			let fromDate 		= (req.body.fromDate) 	 	? req.body.fromDate 				: "";
			let toDate 			= (req.body.toDate) 	 	? req.body.toDate 					: "";
			let statusSearch	= (req.body.status_search)	? parseInt(req.body.status_search)	: "";
			let sendStatus		= (req.body.send_status)	? parseInt(req.body.send_status)	: "";
			
			const collection	= db.collection(TABLE_PUSH_NOTIFICATIONS);
			/** Configure DataTable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				/** Set conditions **/
				let commonConditions = {
					is_deleted	: NOT_DELETED,					
				};


				/** Conditions for date */
				if (fromDate != "" && toDate != "") {
					dataTableConfig.conditions["created"] = {
						$gte 	: newDate(fromDate),
						$lte 	: newDate(toDate),
					}
				}
			
				if (statusSearch != "") {
					switch(statusSearch){
						case SEARCHING_ACTIVE:
							dataTableConfig.conditions["is_active"] = ACTIVE;
						break;

						case SEARCHING_DEACTIVE:
							dataTableConfig.conditions["is_active"] = DEACTIVE;
						break;
					}
				}

				if (sendStatus != "") {
					switch(sendStatus){
						case SEARCHING_ACTIVE:
							dataTableConfig.conditions["is_send"] 	= ACTIVE;
						break;

						case SEARCHING_DEACTIVE:
							dataTableConfig.conditions["is_send"] 	= DEACTIVE;
						break;
					}
				}
		
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
				
				async.parallel([
					(callback)=>{
						/** Get list of notification's **/
						collection.find(dataTableConfig.conditions).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).skip(skip).limit(limit).toArray((err, result)=>{
							callback(err, result);
						});
					},
					(callback)=>{
						/** Get total number of records in notification collection **/
						collection.find(commonConditions).count((err,countResult)=>{
							callback(err, countResult);
						});
					},
					(callback)=>{
						/** Get filtered records couting in notification **/
						collection.find(dataTableConfig.conditions).count((err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				],
				(err,response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response[0]) ? response[0] : [],
						recordsFiltered	: (response[2]) ? response[2] : 0,
						recordsTotal	: (response[1]) ? response[1] : 0
					});
				});
			});
		}else{
			req.breadcrumbs(BREADCRUMBS["admin/push_notification/list"]);
			res.render("list",{});
		}
	};//End getPushNotificationList()
	
	
	/**
	 * Function for notification's Detail
	 *
	 * @param req			As Request Data
	 * @param res 			As Response Data
	 *
	 * @return json
	 */
	let getNotificationDetails = (req,res)=>{
		return new Promise(resolve=>{
			let notificationId	= (req.params.id)	? req.params.id	: "";
			if(!notificationId || notificationId ==""){
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.invalid_access")
				};
				resolve(response);
			}else{
				const collection	= db.collection(TABLE_PUSH_NOTIFICATIONS);
				collection.findOne(
					{
						_id 		: ObjectId(notificationId),
						is_deleted	: NOT_DELETED,
					},(err, result)=>{
						if(result){
							/** Send success response **/
							let response = {
								status	: STATUS_SUCCESS,
								result	: result,
							};
							resolve(response);
						}else{
							/** Send error response **/
							let response = {
								status	: STATUS_ERROR,
								message	: res.__("admin.system.invalid_access")
							};
							resolve(response);
						}
					}
				);
			}
		});
	};//End getNotificationDetails()
	
	

	/**
	 * Function for update push notifications Detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.updateNotificationsDetails = (req,res,next)=>{
		let id 	= (req.params.id)	? req.params.id		: "";
		if(isPost(req)){
			/** Sanitize Data **/
			req.body 			= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			var userType 		= (req.body.user_type)			? req.body.user_type			: "";
			var message			= (req.body.message)			? req.body.message				: "";
			var selectedUserIds	= (req.body.selected_user_ids)	? req.body.selected_user_ids	: [];
			
			/** select user ids mongo id convert */
			var selectedUserIdsArray = [];
			if(selectedUserIds.length>0){
				if(selectedUserIds.constructor === Array){
					selectedUserIdsArray = selectedUserIds.map(function(records){
						return (records) ? ObjectId(records) :"";
					});
				}else{
					selectedUserIdsArray.push(ObjectId(selectedUserIds));
				}	
			}
			
			/** without selected all user send push notification*/
			var conditions	=	{
				active 				: ACTIVE,
				is_deleted			: NOT_DELETED,
				is_admin_approved	: ACTIVE,
				is_email_verified	: ACTIVE,
				is_mobile_verified	: ACTIVE
			};

			if( userType == ALL_DRIVERS ){
				conditions['user_role_id']	= DRIVER_USER_ROLE_ID;			
			}else if( userType == ALL_SELLERS ){
				conditions['user_role_id']	= FRONT_SITE_USER_TYPE;
				conditions['is_seller']		= ACTIVE;
			}else if( userType == ALL_BUYERS ){
				conditions['user_role_id']	= FRONT_SITE_USER_TYPE;
				conditions['is_seller']		= DEACTIVE;
			}
			
			/** all user send notification without not selected users*/
			var userCollection	= db.collection(TABLE_USERS);
			userCollection.distinct("_id", conditions,(errAllResultUsersIds,allResultUsersIds)=>{
				var userIds	= (selectedUserIds.length>0) ? selectedUserIdsArray	: allResultUsersIds;
			
				if(userIds.length==0){
					errMessageArray=[];
					errMessageArray.push({'param':'selected_user_ids','msg':res.__("admin.push_notification.no_user_found")});
					return res.send({ status	: STATUS_ERROR, message	: errMessageArray, });
				}else{
					/** Set Update data */
					let updateData	= {
						user_type	: userType,
						message		: message,
						user_ids	: userIds,
						modified 	: getUtcDate(),
					};
					
					const collection =	db.collection(TABLE_PUSH_NOTIFICATIONS);
					collection.updateOne({
						_id : ObjectId(id)
					},{$set : updateData},(updateErr,result)=>{
						if(updateErr) return next(updateErr);
						
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.push_notification.push_notification_details_has_been_updated_successfully"));
						res.send({
							status		: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL+"push_notification",
							message		: res.__("admin.push_notification.push_notification_details_has_been_updated_successfully"),
						});
					});
				}
			});	
		}else{
			/** Get banner details **/
			getNotificationDetails(req, res).then(response=>{
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					res.redirect(WEBSITE_ADMIN_URL+"push_notification");
					return;
				}				
				
				/** Render edit page **/
				req.breadcrumbs(BREADCRUMBS["admin/push_notification/edit"]);
				res.render("edit",{
					result : (response.result) ? response.result :{}
				});
			}).catch(next);
		}	
	};//End updateNotificationsDetails()
	
	
	
	/**
	 *  Function for get user list for dropdown	 
	 */
	this.getUserListUserTypeWise = (req,res)=>{
		var collection	= db.collection(TABLE_USERS);
		var userType	= (req.params.user_type) ? req.params.user_type : "";		
		
		var conditions	=	{
			active 				: ACTIVE,
			is_admin_approved	: ACTIVE,
			is_email_verified	: ACTIVE,
			is_mobile_verified	: ACTIVE,
			is_deleted			: NOT_DELETED,
		};
		
		/*
		if( userType == ALL_DRIVERS ){
			conditions['user_role_id']	= DRIVER_USER_ROLE_ID;		
		}else if( userType == ALL_SELLERS ){
			conditions['user_role_id']	= FRONT_SITE_USER_ROLE_ID;
			conditions['is_seller']		= ACTIVE;
		}else if( userType == ALL_BUYERS ){
			conditions['user_role_id']	= FRONT_SITE_USER_ROLE_ID;
			conditions['is_seller']		= DEACTIVE;
		}else{
			conditions	= {};
		}
		*/
		collection.find(conditions, {_id:1, full_name:1,email:1}).toArray(function (err, result){
			if(!err){
				res.send({
					status : STATUS_SUCCESS,
					result : result
				});
			}else{
				res.send({
					status  : STATUS_ERROR,
					message : text_settings["admin.system.something_going_wrong_please_try_again"]
				});
			}
		});
	};// getUserListUserTypeWise
	
	
	
	/**
	 * Function for add push notification
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addPushNotification = (req,res,next)=>{
		if(isPost(req)){
			/** Sanitize Data **/
			req.body = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			if(req.body.notification_descriptions == undefined || req.body.notification_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == undefined || req.body.notification_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone	= require('clone');
			let allData	= req.body;
			req.body	= clone(allData.notification_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
			
			req.body.user_type	= (allData.user_type) 	? allData.user_type 	: "";
			var userType 		= (req.body.user_type)	? req.body.user_type	: "";
			var message			= (req.body.message)	? req.body.message		: "";
			 	if(message!= ""){
				req.body.description = message.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}

			var selectedUserIds	= (allData.selected_user_ids)	? allData.selected_user_ids	: [];
			 
			/** select user ids mongo id convert */
			var selectedUserIdsArray = [];
			//if(selectedUserIds.length>0){
				if(selectedUserIds.constructor === Array){
					selectedUserIdsArray = selectedUserIds.map(function(records){
						return (records) ? ObjectId(records) :"";
					});
				}else{
					selectedUserIdsArray.push(ObjectId(selectedUserIds));
				}	
			//}
			
			/** without selected all user send push notification*/
			var conditions	=	{
				active 				: ACTIVE,
				is_admin_approved	: ACTIVE,
				is_email_verified	: ACTIVE,
				is_mobile_verified	: ACTIVE,
				is_deleted			: NOT_DELETED,
			};
			
			if( userType == ALL_DRIVERS ){
				conditions['user_role_id']	= DRIVER_USER_ROLE_ID;		
			}else if( userType == ALL_SELLERS ){
				conditions['user_role_id']	= FRONT_SITE_USER_ROLE_ID;
				conditions['is_seller']		= ACTIVE;
			}else if( userType == ALL_BUYERS ){
				conditions['user_role_id']	= FRONT_SITE_USER_ROLE_ID;
				conditions['is_seller']		= DEACTIVE;
			}else{
				conditions	= {};
			}

			/** all user send notification without not selected users*/
			var userCollection	= db.collection(TABLE_USERS);
			userCollection.distinct("_id", conditions,(errAllResultUsersIds,allResultUsersIds)=>{
				var userIds	= (selectedUserIds.length>0)	? selectedUserIdsArray	: allResultUsersIds;

				if( userIds.length == 0 ){
					errMessageArray = [];
					errMessageArray.push({'param':'selected_user_ids','msg':res.__("admin.push_notification.no_user_found")});
					return res.send({ status : STATUS_ERROR, message	: errMessageArray, });
				}else{
					/** update push notification**/
					const collection = db.collection(TABLE_PUSH_NOTIFICATIONS);
					collection.insertOne({
						user_type					: userType,
						message						: message,
						user_ids					: userIds,
						is_active					: ACTIVE,
						is_send						: DEACTIVE,
						is_deleted					: NOT_DELETED,
						default_language_id			: DEFAULT_LANGUAGE_MONGO_ID,
						notification_descriptions	: (allData.notification_descriptions) ? allData.notification_descriptions :{},
						created 					: getUtcDate(),
						modified 					: getUtcDate(),
					},(err,result)=>{
						if(err) return next(err);
						req.flash(STATUS_SUCCESS,res.__("admin.push_notification.push_notification_has_been_save_successfully"));
						res.send({
							status		: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL+"push_notification",
							message		: res.__("admin.push_notification.push_notification_has_been_save_successfully"),
						});
					});
				}
			});
		}else{
			/** Render add page **/
			getLanguages().then((languageList)=>{
				req.breadcrumbs(BREADCRUMBS["admin/push_notification/add"]);
				res.render("add",{
					language_list : languageList
				});	
			});
		}	
	};//End addPushNotification()
		

	/**
	 * Function for delete push notification
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.deleteNotifications = (req,res)=>{
		try{
			let id = (req.params.id) ? req.params.id : "";
			if(id){
				/** Delete user*/
				const collection = db.collection(TABLE_PUSH_NOTIFICATIONS);
				collection.deleteOne({ _id : ObjectId(id) },(err,result)=>{
					if(!err){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.push_notification.push_notification_deleted_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+"push_notification");
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"push_notification");
					}
				});
			}else{
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
				res.redirect(WEBSITE_ADMIN_URL+"push_notification");
			}
		}catch(e){
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
			res.redirect(WEBSITE_ADMIN_URL+"push_notification");
		}
	};//End deleteNotifications()
	
	
	
	/**
	 * Function for update notification's status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateNotificationStatus = (req,res)=>{
		let notificationId	= (req.params.id) 			? req.params.id 			: "";
		let userStatus		= (req.params.status) 		? req.params.status	 		: "";
		let statusType		= (req.params.status_type) 	? req.params.status_type	: "";

		if(notificationId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))){
			try{
				let updateData = {
					modified : getUtcDate()
				};
				if(statusType == ACTIVE_INACTIVE_STATUS){
					updateData["is_active"]	= (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;
				}
				
				/** notification user status*/
				const collection = db.collection(TABLE_PUSH_NOTIFICATIONS);
				collection.updateOne({_id : ObjectId(notificationId)},{$set :updateData},(err,result)=>{
					if(!err){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.push_notification.push_notification_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+"push_notification");
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"push_notification");
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"push_notification");
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"push_notification");
		}
	};//End updateNotificationStatus()
	
	
	
	/**
	 *  Function for get user list for dropdown	(Ajax)
	 */
	this.getUserListUserTypeWiseAjax = (req,res)=>{
		var collection	= db.collection(TABLE_USERS);
		req.body 		= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
		var userType	= (req.body.user_type) 	? req.body.user_type 	: "";		
		var userEmail	= (req.body.q) 			? req.body.q 			: ((req.query.q) ? req.query.q : 0);
		
		if( userType == '' ){
			return res.send({
				status : STATUS_SUCCESS,
				result : []
			});
		}
		
		var conditions = {
			status: ACTIVE,                      // User should be active
			is_deleted: NOT_DELETED,                // User should not be deleted
			email: { "$regex": new RegExp(userEmail, "i") }  // Search for the email with case-insensitive match
		};
		
		
	   	if( userType == CUSTOMER_USER_TYPE ){
	        conditions['user_type']	= CUSTOMER_USER_TYPE;			
		}else if( userType == SERVICE_PROVIDER_USER_TYPE ){
		    conditions['user_type']	= SERVICE_PROVIDER_USER_TYPE;					
		}else if( userType == FRNCHIES_USER_TYPE ){
		   conditions['user_type']	= FRNCHIES_USER_TYPE;					
		}else{
			conditions	= {};
		}
	
		/* Get the user list */
		collection.find(conditions,{_id:1, full_name:1,email:1,mobile_number:1}).toArray(function (err, result) {

			console.log("result",result);


			if(!err){
				res.send({
					status : STATUS_SUCCESS,
					result : result
				});
			}else{
				res.send({
					status  : STATUS_ERROR,
					message : text_settings["admin.system.something_going_wrong_please_try_again"]
				});
			}
		});
	};// getUserListUserTypeWiseAjax
	
}
module.exports = new PushNotification();
