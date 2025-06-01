const NotificationModel = require('./model/NotificationModel')
function NotificationController(){

    Notification = this;

	/**
	 * Function to get notification list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res)=>{
        if(isPost(req)){
            let limit			= 	(req.body.length)		? 	parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)		? 	parseInt(req.body.start)	: DEFAULT_SKIP;
            let fromDate 		= 	"";
			let toDate 			= 	"";
			let search_data 	= req.body.search_data;

            /** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

                if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "from_date" && formdata.value != ""){
                                fromDate = formdata.value;
                            }else if(formdata.name == "to_date" && formdata.value != ""){
                                toDate = formdata.value;
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                            }
                            
                        }
                
                    })
                    if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
                }

            

                let conditions = [{
                    $facet : {
                        "notification_list" : [
                            {$match	: dataTableConfig.conditions},
							{$lookup :{
								"from" 			: "users",
								"localField"	: "created_by",
								"foreignField"	: "_id",
								"as" 			: "users_created_by"
							}},
							{$project :{
								_id:1,message:1,created:1,created_by:1,created_role_id:1,user_role_id:1,user_id:1,url:1,extra_parameters:1,is_read:1,
								created_by_name	: {$arrayElemAt : ["$users_created_by.full_name",0]},
							}},
							{$match	: dataTableConfig.conditions},
							{$sort  : dataTableConfig.sort_conditions},
							{$skip 	: skip},
							{$limit : limit},
                        ],
                        "notification_all_count" : [
                            {
                                $group : {
                                    _id : null,
                                    count : {$count : {}}
                                }
                            },
                            {
                                $project : {_id:0,count :1}
                            }
                        ],
                        "notification_filter_count" : [
                            {$match : dataTableConfig.conditions},
                            {
                                $group : {
                                    _id : null,
                                    count : {$count : {}}
                                }
                            },
                            {
                                $project : {_id:0,count :1}
                            }
                        ]
                    }
                }];

                let option = {
                    conditions : conditions
                }

                NotificationModel.getNotificationAggregateList(req,res,option).then(notificationResponse=>{
                    let responseStatus = (notificationResponse.status) ? notificationResponse.status : "";
                    let responseResult = (notificationResponse.result && notificationResponse.result[0]) ? notificationResponse.result[0] : "";

                    let notification_list = (responseResult && responseResult.notification_list) ? responseResult.notification_list : [];
                    let notification_all_count = (responseResult && responseResult.notification_all_count && responseResult.notification_all_count[0] && responseResult.notification_all_count[0]["count"]) ? responseResult.notification_all_count[0]["count"] : DEACTIVE;
                    let notification_filter_count = (responseResult && responseResult.notification_filter_count && responseResult.notification_filter_count[0] && responseResult.notification_filter_count[0]["count"]) ? responseResult.notification_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   notification_list,
                        recordsTotal	:	notification_all_count,
                        recordsFiltered	:  	notification_filter_count,
                    });
                })
            })
        }else{
            req.breadcrumbs(BREADCRUMBS['admin/notification/list']);
			res.render('list');
        }
    }

    /**
	 * Function to get header notifications
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getHeaderNotifications = (req, res)=>{
		let authId			= 	(req.session.user && req.session.user._id) ? req.session.user._id 	:"";
		let authUserRoleId	= 	(req.session.user.user_role_id)	?	req.session.user.user_role_id	:"";
		if(authId){
			try{
				/** Set common conditions **/
				let commonConditions	={
					user_id	:	ObjectId(authId)
				};

                let options = {
                    conditions : commonConditions,
                    fields     : {_id:1,message:1,url:1,created:1,is_seen:1,notification_type:1,extra_parameters:1},
                    sort       : {created : SORT_DESC},
                    limit      : ADMIN_HEADER_NOTIFICATION_DISPLAY_LIMIT
                };

                NotificationModel.getNotificationList(options).then(notificationListResponse=>{
                    if(notificationListResponse.status == STATUS_SUCCESS){
                        let updateNotificationConditions = Object.assign({is_seen : NOT_SEEN},commonConditions);

                        let updateData = {
							is_seen		: SEEN,
							is_read		: READ,
							modified 	: getUtcDate()
						};

                        let option = {
                            conditions : updateNotificationConditions,
                            updateData : {$set : updateData}
                        };

                        NotificationModel.updateNotifications(req,res,option).then(updateResponse=>{});


                        /**Function to genrate notification url */
						generateNotificationUrl(req,res,{result:notificationListResponse.result}).then((response)=>{
							res.send({
								status 	: STATUS_SUCCESS,
								result 	: (response.data) ? response.data : [],
							});
						});
                    }else{
                        /** Send error response **/
						res.send({
							status	: STATUS_ERROR,
							result	: [],
							message	: res.__("admin.system.something_going_wrong_please_try_again")
						});
                    }
                })
			}catch(e){
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					result	: [],
					message	: res.__("admin.system.something_going_wrong_please_try_again")
				});
			}
		}else{
			/** Send error response **/
			res.send({
				status	: STATUS_ERROR,
				result	: [],
				message	: res.__("admin.system.invalid_access")
			});
		}
	};//End getHeaderNotifications()

	/**
	 * Function to get header notifications counter
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getHeaderNotificationsCounter = (req, res)=>{
		let authId			= 	(req.session.user && req.session.user._id) ? req.session.user._id 	:"";
		let authUserRoleId	= 	(req.session.user.user_role_id)	?	req.session.user.user_role_id	:"";
		if(authId){
			try{
				/** Set common conditions **/
				let	commonConditions	={
					user_id	:	ObjectId(authId),
					is_seen	:	NOT_SEEN
				};

                let countOptions = {
                    conditions : commonConditions
                }

                NotificationModel.getNotificationsCount(countOptions).then(countResponse=>{
                    if(countResponse.status == STATUS_SUCCESS){
						res.send({
							status 	: STATUS_SUCCESS,
							counter : (countResponse.result) ? countResponse.result : 0,
						});
					}else{
						/** Send error response **/
						res.send({
							status	: STATUS_ERROR,
							counter : 0,
							message	: res.__("admin.system.something_going_wrong_please_try_again")
						});
					}
                })
			}catch(e){
				res.send({
					status	: STATUS_ERROR,
					counter : 0,
					message	: res.__("admin.system.something_going_wrong_please_try_again")
				});
			}
		}else{
			/** Send error response **/
			res.send({
				status	: STATUS_ERROR,
				counter : 0,
				message	: res.__("admin.system.invalid_access")
			});
		}
	};//End getHeaderNotificationsCounter()
}

module.exports = new NotificationController();