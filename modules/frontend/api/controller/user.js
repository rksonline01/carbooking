const { ObjectId } = require('mongodb');
var async = require('async');
const UserModel = require("../model/userModel");
const B2BDiscountModel = require(WEBSITE_ADMIN_MODULES_PATH + "/company_management/model/b2bDiscountModel")
const OrderModel = require('../model/orderModel');
const GiftTransactionModel = require("../model/giftTransactionModel");

function User() {


    /**
     * Function for get My Subscription list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getMySubscriptionList = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let filter = (req.body.filter) ? req.body.filter : FILTER_ALL;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (userId == "") {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {

            /** Common Conditons */
            let commonConditions = {
                user_id: new ObjectId(userId)
            };
           
            let currentDateTime = new Date().toISOString();
			
            if (filter == FILTER_EXPIRED) {              
                commonConditions = {
                   user_id: new ObjectId(userId),
				   end_date: { $lt: currentDateTime }
                };
				
            }
			else if (filter == FILTER_ACTIVE) {               
				commonConditions = {
					user_id: new ObjectId(userId),
					end_date: { $gt: currentDateTime }
                };
            }
 
            /** my subscription list condition */
            let conditions = [
                {
                    $facet: {
                        "my_subscription_list": [
                            { $match: commonConditions }, 
                            { $sort: { "created": SORT_DESC } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    let: { subscriptionId: "$_id" },
                                    pipeline: [{
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$user_subscription_id", "$$subscriptionId"] },
                                                    { $eq: ["$is_service_booking", ACTIVE] },
                                                    { $eq: ["$order_status", ORDER_PLACED] },
                                                    { $in: ["$status", [BOOKING_STATUS_NEW, BOOKING_STATUS_ACCEPTED, BOOKING_STATUS_COMPLETED]] }
                                                ],
                                            },
                                        },
                                    },
                                    ],
                                    as: "bookingdetails",
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    let: { orderId: "$order_id" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [{ $eq: ["$_id", "$$orderId"] }]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                '_id': 1,
                                                'payment_by': 1,
                                                'payment_transaction_id': 1
                                            }
                                        }
                                    ],
                                    as: "booking"
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    subscription_image: 1,
                                    subscription_video: 1,
                                    subscription_name: 1,
                                    car_type: 1,
                                    duration: 1,
                                    provider_type: 1,
                                    travel_time: 1,
                                    price: 1,
                                    mrp_price: 1,
                                    offer_price: 1,
                                    offer_type: 1,
                                    vat_included: 1,
                                    slug: 1,
                                    total_service: 1,
                                    validity_period: 1,
                                    short_description: 1,
                                    description: 1,
                                    order_id: 1,
                                    start_date: 1,
                                    end_date: 1,
                                    status: 1,
                                    subscription_name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$pages_descriptions." + langCode + ".subscription_name", else: "$subscription_name" } },
                                    body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$body" } },
                                    short_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".short_description", ''] }, then: "$pages_descriptions." + langCode + ".short_description", else: "$short_description" } },
                                    modified: 1,
                                    created: 1,
                                    total_booking_used: { $size: "$bookingdetails" },
                                    payment_by: { $arrayElemAt: ["$booking.payment_by", 0] },
                                    payment_transaction_id: { $arrayElemAt: ["$booking.payment_transaction_id", 0] },
                                }
                            },
                        ],
                        "all_count": [
                            { $match: commonConditions }, 
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
                    }
                }
            ];

            let optionObj = {
                conditions: conditions
            }

            UserModel.getAggregateMySubscriptionList(req, res, optionObj).then(subscriptionRes => {
                let responseStatus = (subscriptionRes.status) ? subscriptionRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {

                    let responseResult = (subscriptionRes.result && subscriptionRes.result[0]) ? subscriptionRes.result[0] : "";
                    let subscriptionList = (responseResult && responseResult.my_subscription_list) ? responseResult.my_subscription_list : [];
                    let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: subscriptionList,
                            total_record: totalRecord,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: Math.ceil(totalRecord / limit),
                            image_url: SUBSCRIPTION_URL,
                            filter_type: FILTER_TYPE,
							car_type_dropdown: CAR_TYPE_DROPDOWN,                           
                            message: "",
                            active_label: res.__("front.global.active"),
                            expire_label: res.__("front.global.expire")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    /**send error response */
                    let finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: [],
                            total_record: DEACTIVE,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: DEACTIVE,
                            image_url: SUBSCRIPTION_URL,
                            filter_type: FILTER_TYPE,
                            message: res.__("front.global.no_record_found"),
                            active_label: res.__("front.global.active"),
                            expire_label: res.__("front.global.expire")

                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

            });
        }
    }


    /**
     * Function for get My Subscription Detail 
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getMySubscriptionDetail = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let mySubscriptionId = (req.body.my_subscription_id) ? req.body.my_subscription_id : "";
        let finalResponse = {};
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (mySubscriptionId == "" && userId) {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {


            let currentDateTime = new Date().toISOString(); 
            let conditions = [
                {
                    $facet: {
                        "my_subscription_list": [
                            { $match: { _id: new ObjectId(mySubscriptionId), user_id: new ObjectId(userId) } },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    let: { subscriptionId: "$_id" },
                                    pipeline: [{
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$user_subscription_id", "$$subscriptionId"] },
                                                    { $eq: ["$is_service_booking", ACTIVE] },
                                                    { $eq: ["$order_status", ORDER_PLACED] },
                                                    { $in: ["$status", [BOOKING_STATUS_NEW, BOOKING_STATUS_ACCEPTED, BOOKING_STATUS_COMPLETED]] }
                                                ],
                                            },
                                        },
                                    },
                                    ],
                                    as: "bookingdetails",
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    let: { orderId: "$order_id" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [{ $eq: ["$_id", "$$orderId"] }]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                '_id': 1,
                                                'payment_by': 1,
                                                'payment_transaction_id': 1
                                            }
                                        }
                                    ],
                                    as: "booking"
                                }
                            },
                            {
                                $project: {
                                    id: 1,
                                    subscription_image: 1,
                                    subscription_video: 1,
                                    subscription_name: 1,
                                    car_type: 1,
                                    duration: 1,
									provider_type: 1,
                                    price: 1,
                                    travel_time: 1,
                                    mrp_price: 1,
                                    offer_price: 1,
                                    offer_type: 1,
                                    vat_included: 1,
                                    slug: 1,
                                    order_id: 1,
                                    start_date: 1,
                                    end_date: 1,
                                    status: 1,
                                    total_service: 1,
                                    validity_period: 1,
                                    short_description: 1,
                                    description: 1,
                                    subscription_name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$pages_descriptions." + langCode + ".subscription_name", else: "$subscription_name" } },
                                    body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$body" } },
                                    short_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".short_description", ''] }, then: "$pages_descriptions." + langCode + ".short_description", else: "$short_description" } },
                                    modified: 1,
                                    is_active: 1,
                                    created: 1,
                                    bookingdetails: 1,
                                    total_booking_used: { $size: "$bookingdetails" },
                                    payment_by: { $arrayElemAt: ["$booking.payment_by", 0] },
                                    payment_transaction_id: { $arrayElemAt: ["$booking.payment_transaction_id", 0] },
                                    subscription_status: { 
                                        $cond: { 
                                            if: { $lt: ["$end_date", currentDateTime] }, 
                                            then: res.__("front.global.expire"), 
                                            else: res.__("front.global.active") 
                                        } 
                                    }
                                }
                            }
                        ]
                    }
                }
            ];

            let optionSubObj = {
                conditions: conditions
            }


            UserModel.getAggregateMySubscriptionList(req, res, optionSubObj).then(subscriptionRes => {

                let responseStatus = (subscriptionRes.status) ? subscriptionRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {

                    let responseResult = (subscriptionRes.result && subscriptionRes.result[0]) ? subscriptionRes.result[0] : "";
                    let subscriptionList = (responseResult && responseResult.my_subscription_list && responseResult.my_subscription_list[0]) ? responseResult.my_subscription_list[0] : [];


                    let currentDateTime = new Date().toISOString(); 
                    let subscription_status =   res.__("front.global.active");
                    subscriptionList.subscription_status    = subscription_status;
                    if (subscriptionList.end_date < currentDateTime) {              
                        subscriptionList.subscription_status = res.__("front.global.expire");
                    }

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: subscriptionList,
                            image_url: SUBSCRIPTION_URL,
							car_type_dropdown: CAR_TYPE_DROPDOWN,                            
                            message: "",
                            active_label: res.__("front.global.active"),
                            expire_label: res.__("front.global.expire"),
                           
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            })
        }

    }// End getMySubscriptionDetail()


    /**
     * Function for get My Package list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getMyPackageList = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (userId == "") {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {

            /** Common Conditons */
            let commonConditions = {
                user_id: new ObjectId(userId)
            };

            /** my Package list condition */
            let conditions = [
                {
                    $facet: {
                        "my_package_list": [
                            { $match: commonConditions },
                            { $sort: { "created": SORT_DESC } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    id: 1,
                                    package_image: 1,
                                    package_video: 1,
                                    package_name: 1,
                                    car_type: 1,
                                    duration: 1,
									provider_type: 1,
                                    travel_time: 1,
                                    price: 1,
                                    slug: 1,
                                    mrp_price: 1,
                                    offer_price: 1,
                                    offer_type: 1,
                                    vat_included: 1,
                                    order_id: 1,
                                    status: 1,
                                    short_description: 1,
                                    description: 1,
                                    package_name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".package_name", ''] }, then: "$pages_descriptions." + langCode + ".package_name", else: "$package_name" } },
                                    body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$description" } },
                                    short_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".short_description", ''] }, then: "$pages_descriptions." + langCode + ".short_description", else: "$short_description" } },
                                    modified: 1,
                                    is_active: 1,
                                    created: 1,
                                }
                            }
                        ],
                        "all_count": [
                            { $match: commonConditions },
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
                    }
                }
            ];

            let optionObj = {
                conditions: conditions
            }

            UserModel.getAggregateMyPackageList(req, res, optionObj).then(packageRes => {
                let responseStatus = (packageRes.status) ? packageRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {

                    let responseResult = (packageRes.result && packageRes.result[0]) ? packageRes.result[0] : "";
                    let subscriptionList = (responseResult && responseResult.my_package_list) ? responseResult.my_package_list : [];
                    let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: subscriptionList,
                            total_record: totalRecord,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: Math.ceil(totalRecord / limit),
                            image_url: PACKAGE_URL,
							car_type_dropdown: CAR_TYPE_DROPDOWN,
                            duration_type_dropdown: DURATION_TYPE_DROPDOWN,
                            message: "",
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    /**send error response */
                    let finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: [],
                            total_record: DEACTIVE,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: DEACTIVE,
                            image_url: PACKAGE_URL,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

            });
        }
    }


    /**
     * Function for get My Package Detail 
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getMyPackageDetail = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let myPackageId = (req.body.my_package_id) ? req.body.my_package_id : "";
        let finalResponse = {};
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (myPackageId == "" && userId) {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {

            let optionObj = {
                conditions: { _id: new ObjectId(myPackageId), user_id: new ObjectId(userId), },
                fields: {
                    id: 1,
                    package_image: 1,
                    package_video: 1,
                    package_name: 1,
                    car_type: 1,
                    duration: 1,
					provider_type: 1,
                    travel_time: 1,
                    price: 1,
                    mrp_price: 1,
                    offer_price: 1,
                    offer_type: 1,
                    vat_included: 1,
                    slug: 1,
                    order_id: 1,
                    status: 1,
                    short_description: 1,
                    description: 1,
                    package_name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".package_name", ''] }, then: "$pages_descriptions." + langCode + ".package_name", else: "$package_name" } },
                    body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$description" } },
                    short_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".short_description", ''] }, then: "$pages_descriptions." + langCode + ".short_description", else: "$short_description" } },
                    modified: 1,
                    is_active: 1,
                    created: 1,
                }
            }

            UserModel.getMyPackageFindOne(optionObj).then(packageRes => {
                let packageDetails = (packageRes.result) ? packageRes.result : "";

                if (!packageDetails) {
                    /** Send error response */
                    finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: {},
                            image_url: PACKAGE_URL,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

                /** Send error response */
                finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: packageDetails,
                        image_url: PACKAGE_URL,
						car_type_dropdown: CAR_TYPE_DROPDOWN,
						duration_type_dropdown: DURATION_TYPE_DROPDOWN,
                        message: ""
                    }
                };
                return returnApiResult(req, res, finalResponse);
            });

        }

    }// End getMyPackageDetail()


    /**
    * Function to get wallet Transaction Logs List
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    this.walletTransactionLogsList = (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let type = (req.body.type) ? req.body.type : "";
        let skip = (limit * page) - limit;

        if (!userId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let commonCondition = {
            'user_id': userId
        }

        if (type == ALL_TYPE) {
            commonCondition['type'] = { $in: [AMOUNT_CREDIT, AMOUNT_DEBIT] }
        } else if (type == AMOUNT_CREDIT) {
            commonCondition['type'] = AMOUNT_CREDIT
        } else if (type == AMOUNT_DEBIT) {
            commonCondition['type'] = AMOUNT_DEBIT
        }

        /** wallet tranction list condition */
        let conditions = [{
            $facet: {
                "wallet_logs_list": [
                    { $match: commonCondition },
                    {
                        $lookup: {
                            from: TABLE_USERS,
                            let: { user_id: "$user_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $or: [{ $eq: ["$_id", "$$user_id"] }]
                                        }
                                    }
                                },
                                { $project: { _id: 0, full_name: 1, } }
                            ],
                            as: "user_details"
                        }
                    },
                    {
                        $project: {
                            'id': 1,
                            'amount': 1,
                            'type': 1,
                            'message': 1,
                            'total_balance_after_transaction': 1,
                            "user_full_name": { $arrayElemAt: ["$user_details.full_name", 0] },
                            'created': 1,
                        }
                    },
                    { $sort: { "created": SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                "all_count": [
                    { $match: commonCondition },
                    {
                        $group: {
                            _id: null,
                            count: { $count: {} }
                        }
                    },
                    { $project: { _id: 0, count: 1 } }
                ]
            }
        }];

        let optionObj = {
            conditions: conditions
        }

        GiftTransactionModel.getWalletTransationAggregateList(req, res, optionObj).then(giftRes => {

            let responseStatus = (giftRes.status) ? giftRes.status : "";
            if (responseStatus == STATUS_SUCCESS) {
                let responseResult = (giftRes.result && giftRes.result[0]) ? giftRes.result[0] : "";
                let walletList = (responseResult && responseResult.wallet_logs_list) ? responseResult.wallet_logs_list : [];
                let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
				
				let userWalletAmount = (loginUserData.wallet_amount) ? loginUserData.wallet_amount : 0;

                /**send success response */
                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        total_wallet_balance: userWalletAmount,
                        result: walletList,
                        total_record: totalRecord,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: Math.ceil(totalRecord / limit),
                        message: "",
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                /**send error response */
                let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: [],
                        total_record: DEACTIVE,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: DEACTIVE,
                        message: res.__("front.global.no_record_found")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }
	
	
	/**
     * Function for get payment transaction list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getPaymentTransactionList = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (userId == "") {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {

            /** Common Conditons */
            let commonConditions = {
                user_id: new ObjectId(userId)
            };

            /** payment transaction list */
            let conditions = [
                {
                    $facet: {
                        "transaction_list": [
                            { $match: commonConditions },
                            { $sort: { "created": SORT_DESC } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    id: 1,
                                    order_number: 1,
                                    order_id: 1,
                                    transaction_id: 1,
                                    amount: 1,
                                    status: 1,
                                    response: 1,
                                    order_details: 1,
                                    modified: 1,
                                    created: 1,
                                }
                            }
                        ],
                        "all_count": [
                            { $match: commonConditions },
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
                    }
                }
            ];

            let optionObj = {
                conditions: conditions
            }

            UserModel.getMyPaymentTransactionList(req, res, optionObj).then(paymentRes => {
                let responseStatus = (paymentRes.status) ? paymentRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {

                    let responseResult = (paymentRes.result && paymentRes.result[0]) ? paymentRes.result[0] : "";
                    let paymentTransactionList = (responseResult && responseResult.transaction_list) ? responseResult.transaction_list : [];
                    let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: paymentTransactionList,
                            total_record: totalRecord,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: Math.ceil(totalRecord / limit),
                            message: "",
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    /**send error response */
                    let finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: [],
                            total_record: DEACTIVE,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: DEACTIVE,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

            });
        }
    }

    
	/**
    * Function to get user points logs list
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    this.userPointsLogsList = (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        if (!userId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let commonCondition = {
            'user_id': userId
        }

        /** points logs list */
        let conditions = [{
            $facet: {
                "points_logs_list": [
                    { $match: commonCondition },
                    {
                        $lookup: {
                            from: TABLE_USERS,
                            let: { user_id: "$user_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $or: [{ $eq: ["$_id", "$$user_id"] }]
                                        }
                                    }
                                },
                                { $project: { _id: 0, full_name: 1, } }
                            ],
                            as: "user_details"
                        }
                    },
                    {
                        $project: {
                            'id': 1,
                            "user_id": 1,
                            "order_id": 1,
                            "order_number": 1,
                            "points": 1,
                            "type": 1,
							"note": 1,
                            "transaction_reason": 1,
                            "total_user_points": 1,
                            "total_selling_amount": 1,
                            "previous_balance_for_points": 1,
                            "total_amount_for_points": 1,
                            "now_remaining_amount_for_point": 1,
                            "amount_for_single_point": 1,
                            "is_redeem": 1,
                            "total_redeem_points": 1,
                            "total_redeem_amount": 1,
                            "created": 1,
                            'user_full_name': { $arrayElemAt: ["$user_details.full_name", 0] },
                        }
                    },
                    { $sort: { "created": SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                "all_count": [
                    { $match: commonCondition },
                    {
                        $group: {
                            _id: null,
                            count: { $count: {} }
                        }
                    },
                    { $project: { _id: 0, count: 1 } }
                ],
            }
        }];

        let optionObj = {
            conditions: conditions
        }

        OrderModel.getPointAggregateList(req, res, optionObj).then(pointsRes => {

            let responseStatus = (pointsRes.status) ? pointsRes.status : "";
            if (responseStatus == STATUS_SUCCESS) {
                let responseResult = (pointsRes.result && pointsRes.result[0]) ? pointsRes.result[0] : "";
                let pointList = (responseResult && responseResult.points_logs_list) ? responseResult.points_logs_list : [];
                let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
				
				let userTotalPoints = (loginUserData.total_points) ? loginUserData.total_points : 0;
				
                /**send success response */
                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
						total_points: userTotalPoints,
                        result: pointList,
                        total_record: totalRecord,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: Math.ceil(totalRecord / limit),
                        message: "",
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                /**send error response */
                let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: [],
                        total_record: DEACTIVE,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: DEACTIVE,
                        message: res.__("front.global.no_record_found")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }
	
	
	/**
       * Function for check Organization Code 
       *
       * @param req 	As 	Request Data
       * @param res 	As 	Response Data
       * @param next 	As 	Callback argument to the middleware function
       *
       * @return render/json
       */
    this.applyOrganizationCode = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let b2bCode = (req.body.b2b_code) ? req.body.b2b_code : "";
        let finalResponse = {};
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        if (!userId || !b2bCode) {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {
            var responseData = {};

            let optionObj = {
                user_id: userId,
                promo_code: b2bCode
            }

            responseData = checkOrganizationCode(req, res, optionObj).then(codeRes => {
                let responseStatus = (codeRes.status) ? codeRes.status : "";


                if (responseStatus == STATUS_SUCCESS) {
                    let companyId = (codeRes.promoCodeDetails.company_id) ? new ObjectId(codeRes.promoCodeDetails.company_id) : "";
                    let b2bStatus = ACTIVE;
                    let b2bOrderNumber = DEACTIVE;

                    let promoCodeDetails = (codeRes.promoCodeDetails && codeRes.promoCodeDetails) ? codeRes.promoCodeDetails : "";

                    if (promoCodeDetails != "") {
                        let updateCondition = {
                            _id: new ObjectId(userId)
                        };
                        let optionObjUpdate = {
                            b2b_code: b2bCode,
                            b2b_code_details: promoCodeDetails,
                            company_id: companyId,
                            b2b_status: b2bStatus,
                            b2b_order_number: b2bOrderNumber,
                            b2b_code_created: getUtcDate(),
                        }

                        let optionsUpdate = {
                            conditions: updateCondition,
                            updateData: { $set: optionObjUpdate }
                        };

                        UserModel.findAndupdateOneUser(req, res, optionsUpdate).then(userUpdateDetails => {

                            let status = (userUpdateDetails.status) ? userUpdateDetails.status : "";
                            let userResult = (userUpdateDetails.result) ? userUpdateDetails.result : {};
                            if (status == STATUS_SUCCESS) {

                                finalResponse = {
                                    data: {
                                        status: STATUS_SUCCESS,
                                        result: userResult,
                                        message: res.__("api.user.code_applied")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            } else {

                                finalResponse = {
                                    data: {
                                        status: STATUS_ERROR,
                                        result: [],
                                        message: res.__("front.global.no_record_found")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            }
                        });

                    }
                    else {
                        finalResponse = {
                            data: {
                                status: STATUS_ERROR,
                                result: [],
                                message: res.__("front.system.invalid_promo_code")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }

                }
                else {
                    /**send error response */
                    let finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: [],
                            message: codeRes.message
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });

        }

    }// End checkOrganizationCode()

}

module.exports = new User();