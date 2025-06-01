
const { ObjectId } = require("mongodb");
const async = require("async");
const NotificationModel = require("../model/notificationModel");

function Notification() {

    /**
     * Function for get user notifications list
     *
     * @param req As Request Data
     * @param res As Response Data
     * @param next	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getNotificationsList = (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        /** Set conditions */
        let conditions = { user_id: userId };

        /** Get scan url list or count */
        let aggConditions = [{
            $facet: {
                "notification_list": [
                    { $match: conditions },
                    { $project: { _id: 1, title: 1, message: 1, created: 1, extra_parameters: 1, notification_type: 1,icon_image:1 } },
                    
                    { $sort: { 'created': SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                "notification_count": [
                    { $match: conditions },
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
            }
        }];
        let userOptions = {
            conditions: aggConditions,
        }

        /**get aggregate result */
        NotificationModel.getNotificationAggregateList(req, res, userOptions).then(userResponse => {
            if (userResponse.status == STATUS_SUCCESS) {

                let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
                let result = (responseResult && responseResult.notification_list) ? responseResult.notification_list : [];
                let totalRecords = (responseResult && responseResult.notification_count && responseResult.notification_count[0] && responseResult.notification_count[0]["count"]) ? responseResult.notification_count[0]["count"] : DEACTIVE;

                /**send success response */
                let finalResponse = {
                    'data': {
                        'status': STATUS_SUCCESS,
                        'result': result,
                        'total_record': totalRecords,
                        'limit': limit,
                        'skip': skip,
                        'current_page': page,
                        'total_page': Math.ceil(totalRecords / limit),
                        'message': "",
                        'notification_image_url' : WEBSITE_PUBLIC_NOTIFICATION_IMG_URL
                    }
                };
				
                return returnApiResult(req, res, finalResponse);

            } else {
                let finalResponse = {
                    'data': {
                        'status': STATUS_ERROR,
                        'result': [result],
                        'total_record': DEACTIVE,
                        'limit': limit,
                        'skip': skip,
                        'current_page': page,
                        'total_page': DEACTIVE,
                        'message': res.__("front.global.no_record_found")

                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });

    };//End getNotificationsList()


    /**
     * Function to update notification read status
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next	As Callback argument to the middleware function
     *
     * @return json
     */
    this.markAsReadAllNotification = (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let finalResponse = {};

        if (!userId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**set update object */
        let optionObj = {
            conditions: {
                user_id: new ObjectId(userId),
            },
            updateData: {
                $set: {
                    is_read: READ,
                    is_seen: SEEN,
                    modified: getUtcDate()
                }
            },
        };

        NotificationModel.updateAllNotifications(req, res, optionObj).then(updateResult => {
            let responseStatus = (updateResult.status) ? updateResult.status : "";

            if (responseStatus == STATUS_SUCCESS) {
                /**send success response */
                finalResponse = {
                    'data': {
                        'status': STATUS_SUCCESS,
                        'message': ''

                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                /** Send error response **/
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        message: res.__("front.system.something_going_wrong_please_try_again")
                    }
                }
                returnApiResult(req, res, finalResponse);
            }

        });
    };//End updateNotificationReadStatus()


}
module.exports = new Notification();
