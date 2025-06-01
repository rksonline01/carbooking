const CustomNotificationModel = require("./model/CustomNotificationModel");
const clone = require('clone');
const { ObjectId } = require('mongodb');
const asyncParallel 		 = require('async/parallel');
function CustomNotificationController() {

    this.CustomNotificationController = CustomNotificationController;

    /**
     * Function for get list of custom notification
     * @param req As Request Data
     * @param res As Response Data
     * @return render/json
     */
    this.getCustomNotificationList = (req, res) => {
        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
            let search_data = req.body.search_data;


            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {
                /** Set conditions **/
                let commonConditions = {
                    is_deleted: NOT_DELETED,
                };

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);


                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "title" && formdata.value != "") {
                                dataTableConfig.conditions[formdata.name] ={ "$regex": formdata.value, "$options": "i" };
                            }  else if (formdata.name == "is_active") {

                                console.log("formdata.name",formdata.name);
                                console.log("formdata.value",formdata.value);

                                dataTableConfig.conditions['is_active'] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }

                        }

                    })                   
                }


                let conditions = [{
                    $facet: {
                        "pn_list": [
                            { $match: dataTableConfig.conditions },
                           /* {
                                $project: {
                                    _id: 1, is_active: 1, created: 1, type: 1,
                                    message: 1,
                                }
                            },*/
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        "pn_all_count": [
                            { $match: commonConditions },
                            {
                                $group: {
                                    _id: null,
                                    count: { $count: {} }
                                }
                            },
                            {
                                $project: { count: 1, _id: 0 }
                            }
                        ],
                        "pn_filter_count": [
                            { $match: dataTableConfig.conditions },
                            {
                                $group: {
                                    _id: null,
                                    count: { $count: {} }
                                }
                            },
                            {
                                $project: { count: 1, _id: 0 }
                            }
                        ]
                    }
                }];

                let options = {
                    conditions: conditions
                };

                CustomNotificationModel.getCustomNotificationAggregateList(req, res, options).then(pnResponse => {
                    let responseStatus = (pnResponse.status) ? pnResponse.status : "";
                    let responseResult = (pnResponse.result && pnResponse.result[0]) ? pnResponse.result[0] : "";

                    let pn_list = (responseResult && responseResult.pn_list) ? responseResult.pn_list : [];
                    let pn_all_count = (responseResult && responseResult.pn_all_count && responseResult.pn_all_count[0] && responseResult.pn_all_count[0]["count"]) ? responseResult.pn_all_count[0]["count"] : DEACTIVE;
                    let pn_filter_count = (responseResult && responseResult.pn_filter_count && responseResult.pn_filter_count[0] && responseResult.pn_filter_count[0]["count"]) ? responseResult.pn_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: pn_list,
                        recordsTotal: pn_all_count,
                        recordsFiltered: pn_filter_count,
                    });
                })
            });

        } else {
            req.breadcrumbs(BREADCRUMBS["admin/custom_notification/list"]);
            res.render("list", {});
        }
    }

    /**
     * Function for add custom notification
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addCustomNotification = (req, res, next) => {
        if (isPost(req)) {

            let image = (req.files && req.files.image) ? req.files.image : "";
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
         
           
            if (req.body.pages_descriptions == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '') {
                /** Send error response */
                return res.send({
                    status: STATUS_ERROR,
                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                });
            }
         

            let allData = req.body;   

            asyncParallel({
                image: (callback) => {
                    if (!image) return callback(null, null);
                    moveUploadedFile(req, res, {
                        image: image,
                        filePath: CUSTOM_NOTIFICATION_FILE_PATH,
                        oldPath: ""

                    }).then(imgRes => {
                        callback(null, imgRes)
                    });
                },

            }, (asyncErr, asyncRes) => {

                if (asyncErr) return next(asyncErr);
                let errMessageArray = [];

                if (asyncRes && asyncRes.image && asyncRes.image.status != STATUS_SUCCESS) {
                    errMessageArray.push({ param: 'image', path: 'image', msg: asyncRes.image.message });
                }

                let image = (asyncRes && asyncRes.image && asyncRes.image.fileName) ? asyncRes.image.fileName : '';
                var selectedUserIds = (req.body.selected_user_ids) ? req.body.selected_user_ids : [];
                var userType = (req.body.user_type) ? req.body.user_type : "";
                var scheduleType = (req.body.schedule_type) ? req.body.schedule_type : "";
                var startTime = (req.body.start_time) ? req.body.start_time : "";
                var status = (req.body.status) ? req.body.status : "";
                var notificationType = (req.body.notification_type) ? req.body.notification_type : "";
                    
                
                let date = new Date(startTime);
                let startTimeTimeStamp = date.getTime();
                

                let date_time = new Date();
                let currentTimeStamp = date_time.getTime(); 

                if(scheduleType == SCHEDULE_TYPE_IMMEDIATELY){
                    startTimeTimeStamp = currentTimeStamp;
                }






                req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]); 

                var message = (req.body.message) ? req.body.message : "";
                var title = (req.body.title) ? req.body.title : "";
                var redirect_link = (req.body.redirect_link) ? req.body.redirect_link : "";

                if (message != "") {
                    req.body.description = message.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
                }

                var selectedUserIdsArray = [];

                if (selectedUserIds && selectedUserIds.length > 0) {
                    if (Array.isArray(selectedUserIds)) {                      
                        selectedUserIdsArray = selectedUserIds.map(function (record) {
                            return record ? new ObjectId(record) : null;
                        });
                    } else {                     
                        selectedUserIdsArray.push(new ObjectId(selectedUserIds));
                    }
                }
                /** without selected all user send custom notification*/
                var conditions = {
                    status: ACTIVE,
                    is_deleted: NOT_DELETED,
                    user_role_id: { $ne: SUPER_ADMIN_ROLE_ID },
                };

                if (userType == CUSTOMER_USER_TYPE) {
                    conditions['user_type'] = CUSTOMER_USER_TYPE;
                } else if (userType == SERVICE_PROVIDER_USER_TYPE) {
                    conditions['user_type'] = SERVICE_PROVIDER_USER_TYPE;
                } else if (userType == FRNCHIES_USER_TYPE) {
                    conditions['user_type'] = FRNCHIES_USER_TYPE;
                }

                let option = {
                    conditions: conditions,
                    field: "_id"
                };

                CustomNotificationModel.getDistinctUserList(option).then(userResponse => {

                    if (userResponse.status == STATUS_SUCCESS) {
                        var userIds = (selectedUserIds.length > 0) ? selectedUserIdsArray : userResponse.result;

                        if (userIds.length == 0) {
                            errMessageArray = [];
                            errMessageArray.push({ 'path': 'selected_user_ids', 'msg': res.__("admin.email_notification.no_user_found") });
                            return res.send({ status: STATUS_ERROR, message: errMessageArray, });
                        }else{

                           

                            let insertData = {                        

                                image: image,
                                title: title,
                                redirect_link: redirect_link,
                                message: message,
                                user_ids: userIds,
                                user_type: userType, 
                                notification_type:notificationType,                              
                                is_active: status,
                                is_send: DEACTIVE,
                                is_deleted: NOT_DELETED,
                                default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
                                pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
                                schedule_type: scheduleType,
                                start_time: startTimeTimeStamp,                               
                               
                            };
    
                            let options = {
                                insertData: insertData
                            }    


                            CustomNotificationModel.saveCustomNotification(req, res, options).then(pnResponse => {
                                let responseStatus = (pnResponse.status) ? pnResponse.status : "";
                                if (responseStatus == STATUS_ERROR) {
                                    /** Send error response **/
                                    res.send({
                                        status: STATUS_ERROR,
                                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                                    });
                                } else {
                                    /** Send success response */
                                    req.flash('success', res.__("admin.custom_notification.custom_notification_has_been_save_successfully"));
                                    res.send({
                                        status: STATUS_SUCCESS,
                                        redirect_url: WEBSITE_ADMIN_URL + 'custom-notification',
                                        message: res.__("admin.custom_notification.custom_notification_has_been_save_successfully")
                                    });
                                }
                            })
                        }
                    }
                })
            })

        } else {
            /** Render add page **/
            getLanguages().then((languageList) => {
                req.breadcrumbs(BREADCRUMBS["admin/custom_notification/add"]);
                res.render("add", {
                    language_list: languageList
                });
            });
        }
    }

    /**
     *  Function for get user list for dropdown	 
     */
    this.getUserListUserTypeWise = (req, res) => {

        var userEmail = (req.body.q) ? req.body.q : ((req.query.q) ? req.query.q : "");
        var userType = (req.body.user_type) ? req.body.user_type : "";


        let conditions = {
            status: ACTIVE,
            is_deleted: NOT_DELETED,
            user_role_id: { $ne: SUPER_ADMIN_ROLE_ID },
            //  email: { "$regex": new RegExp(userEmail, "i") }
        };


        if (userType == CUSTOMER_USER_TYPE) {
            conditions['user_type'] = CUSTOMER_USER_TYPE;
        } else if (userType == SERVICE_PROVIDER_USER_TYPE) {
            conditions['user_type'] = SERVICE_PROVIDER_USER_TYPE;
        } else if (userType == FRNCHIES_USER_TYPE) {
            conditions['user_type'] = FRNCHIES_USER_TYPE;
        } else {
            conditions = {}
        }


        let projectField = {
            _id: 1, full_name: 1, email: 1
        };

        let options = {
            conditions: conditions,
            fields: projectField
        }

        CustomNotificationModel.getUserList(options).then(userResponse => {
            if (userResponse.status == STATUS_SUCCESS) {
                res.send({
                    status: STATUS_SUCCESS,
                    result: userResponse.result
                });
            } else {
                res.send({
                    status: STATUS_ERROR,
                    message: res.__("admin.system.something_going_wrong_please_try_again")
                });
            }
        })
    }

    /**
     * Function for delete custom notification
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return null
     */
    this.deleteNotifications = (req, res) => {
        try {
            let id = (req.params.id) ? req.params.id : "";
            if (id) {
                /** Delete user*/
                let conditions = {
                    _id: new ObjectId(id)
                }

                let optionObj = {
                    conditions: conditions
                };

                CustomNotificationModel.deleteCustomNotification(req, res, optionObj).then(deleteResponse => {
                    let deleteStatus = deleteResponse.status
                    if (deleteStatus == STATUS_SUCCESS) {
                        /** Send success response **/
                        req.flash(STATUS_SUCCESS, res.__("admin.custom_notification.custom_notification_deleted_successfully"));
                        res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
                    } else {
                        /** Send error response **/
                        req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
                    }
                })

            } else {
                /** Send error response **/
                req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
                res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
            }
        } catch (e) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
            res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
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
    this.updateNotificationStatus = (req, res) => {
        let notificationId = (req.params.id) ? req.params.id : "";
        let userStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";

        if (notificationId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))) {
            try {
                let updateData = {
                    modified: getUtcDate()
                };
                if (statusType == ACTIVE_INACTIVE_STATUS) {
                    updateData["is_active"] = (userStatus == ACTIVE) ? DEACTIVE : ACTIVE;
                }

                let condition = {
                    _id: new ObjectId(notificationId)
                }
                /** notification user status*/

                let updateOption = {
                    conditions: condition,
                    updateData: { $set: updateData }
                };

                CustomNotificationModel.updateCustomNotification(req, res, updateOption).then(updateResponse => {
                    if (updateResponse.status == STATUS_SUCCESS) {
                        /** Send success response **/
                        req.flash(STATUS_SUCCESS, res.__("admin.custom_notification.custom_notification_status_has_been_updated_successfully"));
                        res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
                    } else {
                        /** Send error response **/
                        req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
                    }
                });
            } catch (e) {
                /** Send error response **/
                req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
            }
        } else {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "custom-notification");
        }
    };//End updateNotificationStatus()



 /**
	 * Function for view detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
 this.viewDetails = (req,res,next)=>{
   
    getNotifactionDetails(req, res, next).then((response)=>{       
        if(response.status != STATUS_SUCCESS){
            /** Send error response **/
            req.flash(STATUS_ERROR,response.message);
            res.redirect(WEBSITE_ADMIN_URL+"custom-notification");
            return;
        }

        /** Render view page  **/
        req.breadcrumbs(BREADCRUMBS['admin/custom_notification/view']);
        res.render('view',{
            result	:	(response.result) ? response.result	:{},
        });
    }).catch(next);
};//End ()



/**
     * Function to get detail
     *
     * @param req	As	Request Data
     * @param res	As	Response Data
     * @param next	As 	Callback argument to the middleware function
     *
     * @return json
     */
    let getNotifactionDetails = (req,res,next)=>{
        return new Promise(resolve=>{
            let id = (req.params.id) ? req.params.id : "";           
            let conditionsObj = { _id: new ObjectId(id) };
            let optionObj = {
                conditions: conditionsObj, is_deleted: NOT_DELETED
            }
            CustomNotificationModel.getCustomNotification(optionObj).then(packageRes => {
                let result = (packageRes.result) ? packageRes.result : "";

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
    };// End().



}

module.exports = new CustomNotificationController();