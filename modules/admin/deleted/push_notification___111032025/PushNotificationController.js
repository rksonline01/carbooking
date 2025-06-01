const PushNotificationModel = require("./model/PushNotificationModel");
const clone			= require('clone');
const { ObjectId } = require('mongodb');
function PushNotificationController(){

    this.pushNotificationController = PushNotificationController;

    /**
	 * Function for get list of push notification
	 * @param req As Request Data
	 * @param res As Response Data
	 * @return render/json
	 */
    this.getPushNotificationList = (req, res)=>{
        if(isPost(req)){
            let limit			= 	(req.body.length) 				? 	parseInt(req.body.length) 			:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)  				?	parseInt(req.body.start)  			:DEFAULT_SKIP;
            let language        =   (req.session.lang)  ?   req.session.lang            : DEFAULT_LANGUAGE_CODE; 

            /** Configure DataTable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
                /** Set conditions **/
				let commonConditions = {
					is_deleted		: 	NOT_DELETED,					
				};

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

                let conditions = [{
                    $facet : {
                        "pn_list" : [
                            {$match : dataTableConfig.conditions},
                            {
                                $project : {
                                    _id : 1, is_active:1, created:1,
                                    message : { $cond : {if: { $ne : ["$pages_descriptions."+language+".message",'']},then:"$pages_descriptions."+language+".message",else:"$message"}}
                                }
                            },
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit : limit} 
                        ],
                        "pn_all_count" : [
                            {$match : commonConditions},
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "pn_filter_count" : [
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
                };

                PushNotificationModel.getPushNotificationAggregateList(req,res,options).then(pnResponse=>{
					let responseStatus = (pnResponse.status) ? pnResponse.status : "";
                    let responseResult = (pnResponse.result && pnResponse.result[0]) ? pnResponse.result[0] : "";

                    let pn_list = (responseResult && responseResult.pn_list) ? responseResult.pn_list : [];
                    let pn_all_count = (responseResult && responseResult.pn_all_count && responseResult.pn_all_count[0] && responseResult.pn_all_count[0]["count"]) ? responseResult.pn_all_count[0]["count"] : DEACTIVE;
                    let pn_filter_count = (responseResult && responseResult.pn_filter_count && responseResult.pn_filter_count[0] && responseResult.pn_filter_count[0]["count"]) ? responseResult.pn_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   pn_list,
                        recordsTotal	:	pn_all_count,
                        recordsFiltered	:  	pn_filter_count,
                    });
				})
            });

        }else{
            req.breadcrumbs(BREADCRUMBS["admin/push_notification/list"]);
			res.render("list",{});
        }
    }

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
            req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			if(req.body.notification_descriptions == undefined || req.body.notification_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.notification_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

           
			let allData			= req.body;
			req.body			= clone(allData.notification_descriptions[DEFAULT_LANGUAGE_CODE]);
		
			var message			= 	(req.body.message)				?	req.body.message			:	"";

            if(message!= ""){
				req.body.description =  message.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}

            var selectedUserIds	= 	(req.body.selected_user_ids)	?	req.body.selected_user_ids	:	[];
			 
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
				status 			:	ACTIVE,
				is_deleted		:	NOT_DELETED,
                user_role_id    :   {$ne : SUPER_ADMIN_ROLE_ID},
			};


			let option = {
                conditions : conditions,
                field : "_id"
            };

            PushNotificationModel.getDistinctUserList(option).then(userResponse=>{
                if(userResponse.status == STATUS_SUCCESS){
                    var userIds	=	(selectedUserIds.length>0)	?	selectedUserIdsArray	:	userResponse.result;

                    if(userIds.length==0){
                        errMessageArray=[];
                        errMessageArray.push({'path':'selected_user_ids','msg':res.__("admin.push_notification.no_user_found")});
                        return res.send({ status	: STATUS_ERROR, message	: errMessageArray, });
                    }else{
                        let insertData = {
                            message						: 	message,
                            user_ids					: 	userIds,
                            is_active					: 	ACTIVE,
                            is_send						: 	DEACTIVE,
                            is_deleted					: 	NOT_DELETED,
                            default_language_id			:   DEFAULT_LANGUAGE_MONGO_ID,
                            pages_descriptions	        :   (allData.notification_descriptions) ? allData.notification_descriptions :{},
                            created 					: 	getUtcDate(),
                            modified 					: 	getUtcDate(),
                        };
    
                        let options={
                            insertData : insertData
                        }
    
                        PushNotificationModel.savePushNotification(req,res,options).then(pnResponse=>{
                            let responseStatus = (pnResponse.status) ? pnResponse.status : "";
                            if (responseStatus == STATUS_ERROR) {
                                /** Send error response **/
                                res.send({
                                    status: STATUS_ERROR,
                                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                                });
                            }else{
                                /** Send success response */
                                req.flash('success', res.__("admin.push_notification.push_notification_has_been_save_successfully"));
                                res.send({
                                    status: STATUS_SUCCESS,
                                    redirect_url: WEBSITE_ADMIN_URL + 'push_notification',
                                    message: res.__("admin.push_notification.push_notification_has_been_save_successfully")
                                });
                            }
                        })
                    }
                }else{
                    res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }
               
            })
        }else{
            /** Render add page **/
			getLanguages().then((languageList)=>{
                req.breadcrumbs(BREADCRUMBS["admin/push_notification/add"]);
                res.render("add",{
                    language_list	: languageList
                });	
            });
        }
    }

    /**
	 *  Function for get user list for dropdown	 
	 */
	this.getUserListUserTypeWise	= 	(req,res)=>{ 

        var userEmail	= (req.body.q) 			? req.body.q 			: ((req.query.q) ? req.query.q : 0);
        let conditions = {
            status 			:	ACTIVE,
			is_deleted		:	NOT_DELETED,
            user_role_id    :   {$ne : SUPER_ADMIN_ROLE_ID},
            email		    :   { "$regex": new RegExp(userEmail, "i") }
        };

        let projectField = {
            _id:1, full_name:1,email:1
        };

        let options = {
            conditions : conditions,
            fields : projectField
        }
        
        PushNotificationModel.getUserList(options).then(userResponse=>{
            if(userResponse.status == STATUS_SUCCESS){
				res.send({
					status:STATUS_SUCCESS,
					result:userResponse.result
				});
			}else{
				res.send({
					status:STATUS_ERROR,
					message:res.__("admin.system.something_going_wrong_please_try_again")
				});
			}
        })
    }

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
			let id		 = (req.params.id) ? req.params.id : "";
			if(id){
				/** Delete user*/
				let conditions = {
                    _id : new ObjectId(id)
                }

                let optionObj = {
                    conditions : conditions
                };

                PushNotificationModel.deletePushNotification(req,res,optionObj).then(deleteResponse=>{
                    let deleteStatus = deleteResponse.status
                    if(deleteStatus == STATUS_SUCCESS){
                        /** Send success response **/
                        req.flash(STATUS_SUCCESS,res.__("admin.push_notification.push_notification_deleted_successfully"));
                        res.redirect(WEBSITE_ADMIN_URL+"push_notification");
                    }else{
                        /** Send error response **/
                        req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL+"push_notification");
                    }
                })

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
		let notificationId	= 	(req.params.id) 		?	req.params.id 			:"";
		let userStatus	=	(req.params.status) 		? 	req.params.status	 	:"";
		let statusType	=	(req.params.status_type) 	? 	req.params.status_type	:"";

		if(notificationId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))){
			try{
				let updateData = {
					modified 	:	getUtcDate()
				};
				if(statusType == ACTIVE_INACTIVE_STATUS){
					updateData["is_active"]			=	(userStatus==ACTIVE) ? DEACTIVE :ACTIVE;
				}
				
                let condition = {
                    _id : new ObjectId(notificationId)
                }
				/** notification user status*/

                let updateOption = {
                    conditions : condition,
                    updateData : {$set : updateData}
                };

                PushNotificationModel.updatePushNotification(req,res,updateOption).then(updateResponse=>{
                    if(updateResponse.status == STATUS_SUCCESS){
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
}

module.exports = new PushNotificationController();