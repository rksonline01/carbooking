const OrderModel = require('../model/orderModel');
const UserAddressModel = require("../model/userAddressModel");
const ProductModel = require('../../../admin/products/model/ProductModel');
const RegistrationModel = require('../model/registrationModel');
const GiftTransactionModel = require("../model/giftTransactionModel");
const SlotModel = require(WEBSITE_ADMIN_MODULES_PATH + "/slot_management/model/Slot")
const LeaveManagementModel = require(WEBSITE_ADMIN_MODULES_PATH + "/leave_management/model/LeaveManagement");
const FranchiseContractsModel = require('../../../admin/franchise_contracts/model/contractsModel');
const userModel = require("../model/userModel");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require("mongodb");
const async = require("async");
const asyncParallel = require("async/parallel");
const asyncEach = require("async/each");

function OrderBookingController() {

    /**
    * Function for get booking list
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.getBookingList = async (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let areaId = (loginUserData.area_id) ? loginUserData.area_id : "";
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingStatus = (req.body.status !== undefined) ? req.body.status : null;
        let bookingDate = (req.body.booking_date) ? req.body.booking_date : "";
        let allAvailable = (req.body.all_available) ? req.body.all_available : false;
        let isToday = (req.body.is_today) ? req.body.is_today : false;
        let bookingStatusArray = null;

        if (!userId || !userType) {
            let finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /** Common Conditons */
        let commonConditions = {
            is_deleted: NOT_DELETED,
            order_status: ORDER_PLACED,
            $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }],
        };
        /**condition for customer login*/
        if (userType == CUSTOMER_USER_TYPE) {
            commonConditions['user_id'] = new ObjectId(userId)
            bookingStatusArray = BOOKING_STATUS_DROPDOWN_FOR_CUSTOMER;
        }

        /**condition for service provider login */
        if (userType == SERVICE_PROVIDER_USER_TYPE) {

            bookingStatusArray = BOOKING_STATUS_DROPDOWN_FOR_SP;

            if (allAvailable) {

                let providerType = (loginUserData.provider_type) ? loginUserData.provider_type : "";
                commonConditions['provider_type'] = providerType;

                /* GET ALL AVAILABLE BOOKINGS */
                let allAvailableOptoptions = { user_id: userId, area_id: areaId };
                let availableBookingsIds = await getAvailableBookings(req, res, allAvailableOptoptions);
                commonConditions['_id'] = { $in: availableBookingsIds };
            } else {
                commonConditions['service_provider_id'] = new ObjectId(userId)
                commonConditions['status'] = { $in: FOR_SERVICE_PROVIDERS_MY_BOOKING_STATUS }

                if (isToday) {
                    let date = new Date();
                    let todayDate = date.toISOString().split('T')[0];
                    commonConditions['booking_date'] = todayDate;
                    commonConditions['status'] = { $in: FOR_ALL_START_BOOKING_STATUS }
                }
            }
        }

        /**condition for service provider login */
        if (userType == FRNCHIES_USER_TYPE) {

            bookingStatusArray = BOOKING_STATUS_DROPDOWN_FOR_FRANCHISE;

            if (allAvailable) {
                /* GET ALL AVAILABLE BOOKINGS 
                    -> Get all active area_ids for this franchise from franchise_contracts collections
                    -> Get all bookings having status 0 and arear_id from abouve...........
                */

                let franchiseContractOptoptions = { franchise_id: userId };
                let allActiveAreaIds = await getAllActiveAreaIdsFromFranchise(franchiseContractOptoptions);

                commonConditions['status'] = BOOKING_STATUS_NEW;
                commonConditions['area_ids.area_id'] = { $in: allActiveAreaIds };
            }
            else {
                commonConditions['booking_franchise_id'] = new ObjectId(userId)
            }
        }



        /**filter by status */
        if (bookingStatus !== undefined && bookingStatus !== null) {
            if (userType == SERVICE_PROVIDER_USER_TYPE) {
                commonConditions['driver_status'] = { $in: bookingStatus };
            }
            else {
                commonConditions['status'] = { $in: bookingStatus };
            }
        }

        /**filter by booking date */
        if (bookingDate) {
            commonConditions['booking_date'] = bookingDate;
        }


        // Default case for unknown car types

        /** order list condition */
        let conditions = [{
            $facet: {
                "booking_list": [
                    { $match: commonConditions },
                    {
                        $lookup: {
                            from: TABLE_USERS,
                            let: { userId: "$user_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [{ $eq: ["$_id", "$$userId"] }]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        '_id': 0,
                                        'full_name': 1,
                                        'profile_image': 1
                                    }
                                }
                            ],
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: TABLE_ORDER_ITEMS,
                            let: { orderId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$order_id", "$$orderId"] },
                                                { $eq: ["$item_type", ITEM_TYPE_PRODUCT] }
                                            ]
                                        }
                                    }
                                }, {
                                    $project: {
                                        '_id': 1,
                                        'order_item_number': 1,
                                        'item_type': 1,
                                        'product_id': 1,
                                        'product_title': 1,
                                        'product_slug': 1,
                                        'product_image': 1,
                                        'product_sku': 1,
                                        'product_vat': 1,
                                        'product_category_name': 1,
                                        'sold_by': 1,
                                        'product_mrp': 1,
                                        'product_price': 1,
                                        'product_discount': 1,
                                        'product_cart_quantity': 1,
                                        'total_mrp': 1,
                                        'total_selling_amount': 1,
                                        'total_product_discount': 1,
                                        'total_promo_discount': 1,
                                        'item_status': 1,
                                    }
                                }
                            ],
                            as: "product_details"
                        }
                    },
                    {
                        $project: {
                            "_id": 1,
                            "order_number": 1,
                            "booking_number": 1,
                            "booking_date": 1,
                            "booking_time": 1,
                            "booking_start_timestamp": 1,
                            "booking_end_timestamp": 1,
                            "travelling_timestamp": 1,
                            "provider_type": 1,
                            "car_type": 1,
                            "duration": 1,
                            "price": 1,
                            "payment_by": 1,
                            "order_details": 1,
                            "service_provider_id": 1,
                            "total_numer_of_products": 1,
                            "total_quantity_of_products": 1,
                            "total_price_of_products": 1,
                            "total_numer_of_packages": 1,
                            "total_quantity_of_packages": 1,
                            "total_price_of_packages": 1,
                            "total_numer_of_subscriptions": 1,
                            "total_quantity_of_subscriptions": 1,
                            "total_price_of_subscriptions": 1,
                            "total_mrp_amount": 1,
                            "total_selling_amount": 1,
                            "total_product_discount": 1,
                            "total_extra_discount": 1,
                            "package_details": {
                                "_id": 1,
                                "package_image": 1,
                                "package_name": 1,
                                "provider_type": 1,
                                "car_type": 1,
                                "duration": 1,
                                "price": 1,
                                "short_description": 1,
                                'package_name': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".package_name", ''] }, then: "$package_details.pages_descriptions." + langCode + ".package_name", else: "$package_details.package_name" } },
                                'body': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".body", ''] }, then: "$package_details.pages_descriptions." + langCode + ".body", else: "$package_details.body" } },
                                'short_description': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$package_details.pages_descriptions." + langCode + ".short_description", else: "$package_details.short_description" } },
                                "description": 1,
                                "slug": 1,

                            },
                            "subscription_details": {
                                '_id': 1,
                                'subscription_image': 1,
                                'subscription_name': 1,
                                'provider_type': 1,
                                'car_type': 1,
                                'duration': 1,
                                'price': 1,
                                'slug': 1,
                                'total_service': 1,
                                'validity_period': 1,
                                'short_description': 1,
                                'description': 1,
                                'subscription_name': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$subscription_details.subscription_name" } },
                                'body': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".body", else: "$body" } },
                                'short_description': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".short_description", else: "$subscription_details.short_description" } },
                                'is_active': 1,
                            },
                            'user_package_id': 1,
                            'user_subscription_id': 1,
                            'is_store_order': 1,
                            'is_service_booking': 1,
                            'address_detail': 1,
                            'status': 1,
                            'order_status': 1,
                            "modified": 1,
                            "created": 1,
                            'user_name': { $arrayElemAt: ["$userDetails.full_name", 0] },
                            'profile_image': { $arrayElemAt: ["$userDetails.profile_image", 0] },
                            'product_details': 1,
                            "driver_status": 1,
                        }
                    },
                    { $sort: { "created": SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                "all_count": [
                    { $match: commonConditions },
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

        OrderModel.getBookingAggregateList(req, res, optionObj).then(bookingResponse => {
            let responseStatus = (bookingResponse.status) ? bookingResponse.status : "";
            if (responseStatus == STATUS_SUCCESS) {
                let responseResult = (bookingResponse.result && bookingResponse.result[0]) ? bookingResponse.result[0] : "";

                let bookingList = (responseResult && responseResult.booking_list) ? responseResult.booking_list : [];
                let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                /**send success response */

                let message = (bookingList.length > 0) ? "" : res.__("front.global.no_record_found");

                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        booking_status_array: bookingStatusArray,
                        result: bookingList,
                        total_record: totalRecord,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: Math.ceil(totalRecord / limit),
                        package_url: PACKAGE_URL,
                        subscription_url: SUBSCRIPTION_URL,
                        user_image_url: USERS_URL,
                        product_url: PRODUCT_URL,
                        message: message,
                        car_type: CAR_TYPE_DROPDOWN,
                        product_title: res.__("front.global.store_order")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                /**send error response */
                let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        booking_status_array: bookingStatusArray,
                        result: [],
                        total_record: DEACTIVE,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: DEACTIVE,
                        package_url: PACKAGE_URL,
                        subscription_url: SUBSCRIPTION_URL,
                        user_image_url: USERS_URL,
                        product_url: PRODUCT_URL,
                        car_type: CAR_TYPE_DROPDOWN,
                        message: res.__("front.global.no_record_found"),
                        product_title: res.__("front.global.store_order")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
    * Function for get order booking Detail 
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.getBookingDetails = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? req.body.booking_id : "";
        let areaId = (loginUserData.area_id) ? loginUserData.area_id : "";

        /* For available bookings */
        let isAvailable = (req.body.is_available) ? req.body.is_available : false;

        if (!userId || !bookingId) {
            let finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);

        }

        let commonConditions = {
            _id: new ObjectId(bookingId),
            is_deleted: NOT_DELETED,
            order_status: ORDER_PLACED,
            $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }],
        }

        if (userType == CUSTOMER_USER_TYPE) {
            commonConditions['user_id'] = new ObjectId(userId)
        }

        /**condition for service provider login */
        if (userType == SERVICE_PROVIDER_USER_TYPE) {

            if (isAvailable) {
                let date_time = new Date();
                let currentTimeStamp = date_time.getTime();

                commonConditions['status'] = { $in: [BOOKING_STATUS_NEW] };
                commonConditions['area_ids.area_id'] = areaId;
                commonConditions['$or'] = [{ booking_start_timestamp: { $gt: currentTimeStamp } }, { is_service_booking: { $ne: ACTIVE } }];
            }
            else {
                commonConditions['service_provider_id'] = new ObjectId(userId)
                commonConditions['status'] = { $in: FOR_SERVICE_PROVIDERS_MY_BOOKING_STATUS }
            }
        }

        let projectFields = {
            "_id": 1,
            "order_number": 1,
            "order_status": 1,
            "item_count": 1,
            "total_quantity": 1,
            "total_mrp_amount": 1,
            "total_selling_amount": 1,
            "total_received_amount": 1,
            "total_product_discount": 1,
            "total_extra_discount": 1,
            "total_shipping_amount": 1,
            "payment_status": 1,
            "booking_date": 1,
            "booking_time": 1,
            "booking_start_timestamp": 1,
            "booking_end_timestamp": 1,
            "booking_travelling_timestamp": 1,
            'is_service_booking': 1,
            'is_store_order': 1,
            "payment_by": 1,
            "package_details": {
                "_id": 1,
                "package_image": 1,
                "package_name": 1,
                "provider_type": 1,
                "car_type": 1,
                "duration": 1,
                "price": 1,
                "short_description": 1,
                'package_name': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".package_name", ''] }, then: "$package_details.pages_descriptions." + langCode + ".package_name", else: "$package_details.package_name" } },
                'body': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".body", ''] }, then: "$package_details.pages_descriptions." + langCode + ".body", else: "$package_details.body" } },
                'short_description': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$package_details.pages_descriptions." + langCode + ".short_description", else: "$package_details.short_description" } },
                "description": 1,
                "slug": 1,
                "total_selling_amount": 1,
                "total_product_discount": 1,

            },
            "subscription_details": {
                'id': 1,
                'subscription_image': 1,
                'subscription_name': 1,
                'provider_type': 1,
                'car_type': 1,
                'duration': 1,
                'price': 1,
                'slug': 1,
                'total_service': 1,
                'validity_period': 1,
                'short_description': 1,
                'description': 1,
                'subscription_name': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$subscription_details.subscription_name" } },
                'body': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".body", else: "$body" } },
                'short_description': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".short_description", else: "$subscription_details.short_description" } },
                'is_active': 1,
            },
            "my_subscription_details": {
                '_id': 1,
                'order_number': 1,
                'subscription_image': 1,
                'subscription_name': 1,
                'provider_type': 1,
                'car_type': 1,
                'duration': 1,
                'price': 1,
                'slug': 1,
                'total_service': 1,
                'validity_period': 1,
                'short_description': 1,
                'description': 1,
                'subscription_name': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$my_subscription_details.subscription_name" } },
                'body': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".body", else: "$my_subscription_details.body" } },
                'short_description': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".short_description", else: "$my_subscription_details.short_description" } },
            },
            'user_package_id': 1,
            'user_subscription_id': 1,
            'address_detail': 1,
            'area_details': 1,
            'product_details': 1,
            'user_name': { $arrayElemAt: ["$userDetails.full_name", 0] },
            'user_mobile_number': { $arrayElemAt: ["$userDetails.mobile_number", 0] },
            'profile_image': { $arrayElemAt: ["$userDetails.profile_image", 0] },
            'service_provider_name': { $arrayElemAt: ["$serviceProviderDetails.full_name", 0] },
            'service_provider_mobile_number': { $arrayElemAt: ["$serviceProviderDetails.mobile_number", 0] },
            'service_provider_profile_image': { $arrayElemAt: ["$serviceProviderDetails.profile_image", 0] },
            'service_provider_rating': { $arrayElemAt: ["$serviceProviderDetails.rating", 0] },
            'status': 1,
            "driver_status": 1,
            "modified": 1,
            "created": 1,
            "images": 1,
            "note": 1,
            "reviewRatingDetails": 1,
            'rating': { $arrayElemAt: ["$reviewRatingDetails.rating", 0] },
            'review': { $arrayElemAt: ["$reviewRatingDetails.review", 0] },

        }


        let aggregateCondition = [
            {
                $match: commonConditions
            },
            {
                $lookup: {
                    from: TABLE_USERS,
                    let: { userId: "$user_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$userId"] }]
                                }
                            }
                        },
                        {
                            $project: {
                                '_id': 0,
                                'full_name': 1,
                                'mobile_number': 1,
                                'profile_image': 1
                            }
                        }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: TABLE_USERS,
                    let: { userId: "$service_provider_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$userId"] }]
                                }
                            }
                        },
                        {
                            $project: {
                                '_id': 0,
                                'full_name': 1,
                                'mobile_number': 1,
                                'profile_image': 1,
                                'rating': 1

                            }
                        }
                    ],
                    as: "serviceProviderDetails"
                }
            },
            {
                $lookup: {
                    from: TABLE_AREAS,
                    let: { areaIds: "$area_ids" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $in: ["$_id", "$$areaIds"] }]
                                }
                            }
                        },
                        {
                            $project: {
                                '_id': 1,
                                'area_name': 1
                            }
                        }
                    ],
                    as: "area_details"
                }
            },
            {
                $lookup: {
                    from: TABLE_ORDER_ITEMS,
                    let: { orderId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$order_id", "$$orderId"] }]
                                }
                            }
                        }, {
                            $project: {
                                '_id': 1,
                                'order_item_number': 1,
                                'item_type': 1,
                                'product_id': 1,
                                'product_title': 1,
                                'product_slug': 1,
                                'product_image': 1,
                                'product_sku': 1,
                                'product_vat': 1,
                                'product_category_name': 1,
                                'sold_by': 1,
                                'product_mrp': 1,
                                'product_price': 1,
                                "start_delivery": 1,
                                "is_delivered": 1,
                                'product_discount': 1,
                                'product_cart_quantity': 1,
                                'total_mrp': 1,
                                'total_selling_amount': 1,
                                'total_product_discount': 1,
                                'total_promo_discount': 1,
                                'item_status': 1,
                            }
                        }
                    ],
                    as: "product_details"
                }
            },
            {
                $lookup: {
                    from: TABLE_RATING,
                    let: { bookingId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$booking_id", "$$bookingId"] },
                                        { $eq: ["$review_for", USER_REVIEW] },

                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                '_id': 0,
                                'rating': 1,
                                'review': 1,
                                'status': 1
                            }
                        }
                    ],
                    as: "reviewRatingDetails"
                }
            },

            {
                $project: projectFields
            }
        ]

        let optionObj = {
            conditions: aggregateCondition
        }

        OrderModel.getBookingAggregateList(req, res, optionObj).then(bookingRes => {
            let bookingDetails = (bookingRes.result && bookingRes.result[0]) ? bookingRes.result[0] : "";


            if (!bookingDetails) {
                /** Send error response */
                let finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        product_url: PRODUCT_URL,
                        package_url: PACKAGE_URL,
                        subscription_url: SUBSCRIPTION_URL,
                        user_image_url: USERS_URL,
                        car_type: CAR_TYPE_DROPDOWN,
                        message: res.__("front.global.no_record_found"),
                        product_title: res.__("front.global.store_order")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }


            let productBookingDetails = (bookingDetails.product_details) ? bookingDetails.product_details : [];
            let bookingDetailsStatus = (bookingDetails.status) ? bookingDetails.status : '';
            let bookingPaymentBy = (bookingDetails.payment_by) ? bookingDetails.payment_by : '';


            if (bookingPaymentBy == PAYMENT_BY_COD) {
                let totalDeliveredItemAmount = 0;
                let totalDeliveredItemDiscountAmount = 0;
                let totalPackageAmount = 0;
                let totalPackageDiscountAmount = 0;

                async.each(productBookingDetails, (itemRecords) => {

                    let selectedisDelivered = (itemRecords.is_delivered) && itemRecords.is_delivered == true ? true : false;
                    let selectedisStartDelivered = (itemRecords.start_delivery) && itemRecords.start_delivery == true ? true : false;
                    let selecteditemType = (itemRecords.item_type) ? itemRecords.item_type : '';

                    if (selectedisDelivered != true && selectedisStartDelivered != false && selecteditemType == ITEM_TYPE_PRODUCT) {
                        totalDeliveredItemAmount += (itemRecords.total_selling_amount) ? itemRecords.total_selling_amount : 0;
                        totalDeliveredItemDiscountAmount += (itemRecords.total_product_discount) ? itemRecords.total_product_discount : 0;
                    }

                    let notAllowStatus = [BOOKING_STATUS_SERVICE_FINISHED];
                    if (selecteditemType == ITEM_TYPE_PACKAGE && !notAllowStatus.includes(bookingDetailsStatus)) {
                        totalPackageAmount += (itemRecords.total_selling_amount) ? itemRecords.total_selling_amount : 0;
                        totalPackageDiscountAmount += (itemRecords.total_product_discount) ? itemRecords.total_product_discount : 0;
                    }
                })

                let totalReceivableAmount = totalDeliveredItemAmount + totalPackageAmount;
                let totalReceivableDiscountAmount = totalDeliveredItemDiscountAmount + totalPackageDiscountAmount;
                let priceBreakDownObj = {
                    'total_deliverable_product_amount': totalDeliveredItemAmount,
                    'total_deliverable_product_discount_amount': totalDeliveredItemDiscountAmount,
                    'total_deliverable_package_amount': totalPackageAmount,
                    'total_deliverable_package_discount_amount': totalPackageDiscountAmount,
                    'total_deliverable_amount': totalReceivableAmount,
                    'total_deliverable_discount_amount': totalReceivableDiscountAmount,
                }
                // SET BOOKING DETAILS PRICE BREAKDOWN OBJECT
                bookingDetails.price_breakdown = priceBreakDownObj;
                bookingDetails.total_receivable_amount = totalReceivableAmount;
            }

            if ((userType == SERVICE_PROVIDER_USER_TYPE) && isAvailable) {
                let startTimeStamp = bookingDetails.booking_start_timestamp || "";
                let endTimeStamp = bookingDetails.booking_end_timestamp || "";
                let is_service_booking = (bookingDetails && bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : "";
                let is_store_order = (bookingDetails && bookingDetails.is_store_order) ? bookingDetails.is_store_order : "";

                let optionsData = {
                    area_id: areaId,
                    user_id: userId,
                    start_time_stamp: startTimeStamp,
                    end_time_stamp: endTimeStamp,
                    is_service_booking: is_service_booking,
                    is_store_order: is_store_order,
                };

                /** check is booking available */
                checkIsAvailableBooking(req, res, optionsData).then(checkIsAvailable => {
                    if (checkIsAvailable.status) {
                        let finalResponse = {
                            data: {
                                status: STATUS_SUCCESS,
                                result: bookingDetails,
                                product_url: PRODUCT_URL,
                                package_url: PACKAGE_URL,
                                subscription_url: SUBSCRIPTION_URL,
                                user_image_url: USERS_URL,
                                car_type: CAR_TYPE_DROPDOWN,
                                message: "",
                                product_title: res.__("front.global.store_order")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                    else {
                        let finalResponse = {
                            data: {
                                status: STATUS_ERROR,
                                result: {},
                                product_url: PRODUCT_URL,
                                package_url: PACKAGE_URL,
                                subscription_url: SUBSCRIPTION_URL,
                                user_image_url: USERS_URL,
                                car_type: CAR_TYPE_DROPDOWN,
                                message: res.__("front.global.you_already_booked_for_another_order"),
                                product_title: res.__("front.global.store_order")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }

                });
            }
            else {
                let bookingStatus = (bookingDetails.status) ? (bookingDetails.status) : '0';
                let bookingStatuslabel = BOOKING_STATUS_LABLE_FOR_CUSTOMER[bookingStatus];
                let bookingEndTimestamp = (bookingDetails.booking_end_timestamp) ? bookingDetails.booking_end_timestamp : 0;
                let bookingStartTimestamp = (bookingDetails.booking_start_timestamp) ? bookingDetails.booking_start_timestamp : 0;
                let bookingTravellingTimestamp = (bookingDetails.booking_travelling_timestamp) ? bookingDetails.booking_travelling_timestamp : 0;



                let BookingEndTime = 0;
                let BookingStartTime = 0;

                if (bookingEndTimestamp && bookingStartTimestamp) {
                    BookingEndTime = newDate(bookingDetails.booking_end_timestamp, 'h:MM TT');
                    bookingActualStartTimestamp = bookingStartTimestamp + bookingTravellingTimestamp;
                    BookingStartTime = newDate(bookingActualStartTimestamp, 'dd/mm/yyyy h:MM TT');

                }

                /** Send error response */
                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: bookingDetails,
                        product_url: PRODUCT_URL,
                        package_url: PACKAGE_URL,
                        subscription_url: SUBSCRIPTION_URL,
                        user_image_url: USERS_URL,
                        car_type: CAR_TYPE_DROPDOWN,
                        message: "",
                        product_title: res.__("front.global.store_order"),
                        booking_label: res.__(bookingStatuslabel),
                        booking_start_on: BookingStartTime,
                        booking_end_on: BookingEndTime,
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

        });
    }


    /**
    * Function for change date - time booking
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.changeDateTimeOfBooking = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let bookingDate = (req.body.booking_date) ? req.body.booking_date : "";
        let bookingTime = (req.body.booking_time) ? req.body.booking_time : "";

        let finalResponse = {};

        if (!userId || !bookingId || !bookingDate || !bookingTime) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        if (userType != CUSTOMER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let date_time = new Date();
        let currentTimeStamp = date_time.getTime();

        let bookingDateTime = new Date(bookingDate + 'T' + bookingTime);
        let booking_timestamp = bookingDateTime.getTime();

        if (booking_timestamp <= currentTimeStamp) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.orders.select_feature_date_time.")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let optionObj = {
            conditions: {
                "_id": bookingId,
                "user_id": new ObjectId(userId),
                'status': BOOKING_STATUS_NEW,
                "order_status": ORDER_PLACED,
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, order_number: 1, booking_start_timestamp: 1, booking_end_timestamp: 1, booking_travelling_timestamp: 1, status: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let oldStartTimeStamp = bookingDetails.booking_start_timestamp || "";
        let oldEndTimeStamp = bookingDetails.booking_end_timestamp || "";
        let travellingTimestamp = bookingDetails.booking_travelling_timestamp || "";
        let bookingDuration = (oldEndTimeStamp - oldStartTimeStamp);
        let orderNumber = bookingDetails.order_number || "";
        let bookingStatus = bookingDetails.status || 0;

        let new_start_timestamp = booking_timestamp - travellingTimestamp;
        let new_end_timestamp = new_start_timestamp + bookingDuration;

        let updateData = {
            'booking_date': bookingDate,
            'booking_time': bookingTime,
            'booking_date_time': bookingDateTime,
            'booking_start_timestamp': new_start_timestamp,
            'booking_end_timestamp': new_end_timestamp,
            'modified': getUtcDate(),
            'is_rescheduled': ACTIVE,
        };

        let options = {
            conditions: { '_id': bookingId, 'status': BOOKING_STATUS_NEW, "user_id": new ObjectId(userId) },
            updateData: { $set: updateData }
        };
        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

            if (updateResponse.status == STATUS_SUCCESS) {

                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                let email = (loginUserData.email) ? loginUserData.email : "";

                let extraParametersObj = {
                    order_id: bookingId,
                    order_number: orderNumber,
                    user_id: new ObjectId(userId),
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    booking_date_time: bookingDateTime,
                    booking_start_timestamp: new_start_timestamp,
                    booking_end_timestamp: new_end_timestamp,
                    booking_id: bookingId.toString(),
                    booking_status: bookingStatus,
                }

                let notificationOptions = {
                    notification_data: {
                        notification_type: NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
                        message_params: [fullName, orderNumber, bookingDate, bookingTime],
                        user_id: userId,
                        user_ids: [userId],
                        parent_table_id: bookingId,
                        lang_code: langCode,
                        extra_parameters: extraParametersObj,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };

                /**send booking notification to user */
                await insertNotifications(req, res, notificationOptions);

                let pushNotificationOptions = {
                    notification_data: {
                        notification_type: PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
                        message_params: [fullName, orderNumber, bookingDate, bookingTime],
                        user_id: userId,
                        booking_id: bookingId.toString(),
                        booking_status: bookingStatus,
                        lang_code: langCode,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };
                await pushNotification(req, res, pushNotificationOptions);

                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                let currentDateTime = new Date();
                let optionObj = {
                    conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                }

                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                    let responseStatus = response.status ? response.status : "";
                    let contractData = response.result ? response.result : "";
                    if (responseStatus == STATUS_SUCCESS && contractData) {

                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                        let totalSellingAmount = 0;

                        if (franchiseId) {
                            let franchiseNotificationOptions = {
                                notification_data: {
                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
                                    message_params: [fullName, orderNumber, bookingDate, bookingTime],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };

                            await insertNotifications(req, res, franchiseNotificationOptions);

                            let franchisePushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
                                    message_params: [fullName, orderNumber, bookingDate, bookingTime],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    booking_id: bookingId.toString(),
                                    booking_status: BOOKING_STATUS_NEW,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                        }
                    }
                })
                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */

                let emailOptions = {
                    to: email,
                    action: "user_change_booking_date_time",
                    rep_array: [fullName, orderNumber, bookingDate, bookingTime],
                };
                sendMail(req, res, emailOptions);



                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: res.__("front.order.booking_date-time_changed")
                    }
                };
                return returnApiResult(req, res, finalResponse);

            }
            else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
    * Function for change booking location
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.changeBookingLocation = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let addressId = (req.body.address_id) ? req.body.address_id : '';
        let addressObject = req.body.user_address || {};
        let addressDetail = null;
        let areaIds = null;

        let fullName = (addressObject && addressObject.full_name) ? addressObject.full_name : "";
        let zipCode = (addressObject && addressObject.zip_code) ? addressObject.zip_code : "";
        let addressLine1 = (addressObject && addressObject.address_line_1) ? addressObject.address_line_1 : "";
        let addressLine2 = (addressObject && addressObject.address_line_2) ? addressObject.address_line_2 : "";
        let countryName = (addressObject && addressObject.country_name) ? (addressObject.country_name) : "";
        let stateName = (addressObject && addressObject.state_name) ? (addressObject.state_name) : "";
        let cityName = (addressObject && addressObject.city_name) ? (addressObject.city_name) : "";
        var longitude = (addressObject && addressObject.longitude) ? addressObject.longitude : "";
        var latitude = (addressObject && addressObject.latitude) ? addressObject.latitude : "";

        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        if (userType != CUSTOMER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        /**get address details*/
        if (addressId || (longitude && latitude && cityName && stateName)) {

            if (addressId) {
                let billingOption = {
                    conditions: { _id: new ObjectId(addressId), "user_id": new ObjectId(userId), is_deleted: NOT_DELETED },
                    fields: { is_deleted: 0, phone_number: 0, dial_code: 0, country_code: 0, country_dial_code: 0, country: 0, state: 0, is_default: 0, device_type: 0, api_type: 0, modified: 0, created: 0 }
                }

                let addressDetailResp = await UserAddressModel.getUserAddressDetail(billingOption);

                if (addressDetailResp.status == STATUS_ERROR) {
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.address_not_exists_please_save_address"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    addressDetail = addressDetailResp.result;
                }

                if (!addressDetail._id) {
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

                /* GET Area Ids */
                let areaOptions = {
                    "latitude": (addressDetail.latitude) ? addressDetail.latitude : "",
                    "longitude": (addressDetail.longitude) ? addressDetail.longitude : ""
                }
                areaIds = await getAreaIdsFromLatLong(req, res, areaOptions);

            } else if (addressObject) {
               
               
                let areaOptions = {
                    "latitude": latitude,
                    "longitude": longitude
                }
                /**area details */
                areaIds = await getAreaIdsFromLatLong(req, res, areaOptions);

                if (typeof areaIds !== 'undefined' && areaIds.length > 0) {

                    addressDetail = {
                        user_id: userId,
                        full_name: fullName,
                        country_name: countryName,
                        state_name: stateName,
                        city_name: cityName,
                        zip_code: zipCode,
                        address_line_1: addressLine1,
                        address_line_2: addressLine2,
                        area_id: areaIds,
                        latitude: latitude,
                        longitude: longitude,
                    };
                }
            }

        } else {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }





        let optionObj = {
            conditions: {
                "_id": bookingId,
                "user_id": new ObjectId(userId),
                'status': BOOKING_STATUS_NEW,
                "order_status": ORDER_PLACED,
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
        let orderNumber = (bookingDetails.order_number) ? bookingDetails.order_number : "";
        let bookingStatus = bookingDetails.status || 0;

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let updateData = {
            'address_detail': addressDetail,
            'area_ids': areaIds,
            'modified': getUtcDate(),
            'is_change_location': ACTIVE,
        };

        let options = {
            conditions: { '_id': bookingId, 'status': BOOKING_STATUS_NEW, "user_id": new ObjectId(userId) },
            updateData: { $set: updateData }
        };
        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

            if (updateResponse.status == STATUS_SUCCESS) {

                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                let email = (loginUserData.email) ? loginUserData.email : "";

                let extraParametersObj = {
                    order_id: bookingId,
                    order_number: orderNumber,
                    user_id: new ObjectId(userId),
                    booking_id: bookingId.toString(),
                    booking_status: bookingStatus,
                }

                let notificationOptions = {
                    notification_data: {
                        notification_type: NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
                        message_params: [fullName, orderNumber],
                        user_id: userId,
                        user_ids: [userId],
                        parent_table_id: bookingId,
                        lang_code: langCode,
                        extra_parameters: extraParametersObj,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };

                /**send booking notification to user */
                await insertNotifications(req, res, notificationOptions);
                /**send success response */



                let pushNotificationOptions = {
                    notification_data: {
                        notification_type: PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
                        message_params: [fullName, orderNumber],
                        user_id: userId,
                        booking_id: bookingId.toString(),
                        booking_status: bookingStatus,
                        lang_code: langCode,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };
                await pushNotification(req, res, pushNotificationOptions);

                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                let currentDateTime = new Date();
                let optionObj = {
                    conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                }

                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                    let responseStatus = response.status ? response.status : "";
                    let contractData = response.result ? response.result : "";
                    if (responseStatus == STATUS_SUCCESS && contractData) {

                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                        if (franchiseId) {
                            let franchiseNotificationOptions = {
                                notification_data: {
                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
                                    message_params: [fullName, orderNumber],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };

                            await insertNotifications(req, res, franchiseNotificationOptions);

                            let franchisePushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
                                    message_params: [fullName, orderNumber],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    booking_id: bookingId.toString(),
                                    booking_status: bookingStatus,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                        }
                    }
                })
                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */






                let emailOptions = {
                    to: email,
                    action: "user_change_booking_location",
                    rep_array: [fullName, orderNumber],
                };
                sendMail(req, res, emailOptions);



                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: res.__("front.order.booking_location_changed")
                    }
                };
                return returnApiResult(req, res, finalResponse);

            } else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
    * Function for cancel booking
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.cancelBooking = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let cancelReason = (req.body.cancel_reason) ? req.body.cancel_reason : '';

        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        if (userType != CUSTOMER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let optionObj = {
            conditions: {
                "_id": bookingId,
                "user_id": new ObjectId(userId),
                "order_status": ORDER_PLACED,
                'status': { $in: FOR_CUSTOMER_CANCEL_BOOKING_STATUS },
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        let orderNumber = (bookingDetails.order_number) ? bookingDetails.order_number : "";
        let bookingStatus = (bookingDetails.status) ? bookingDetails.status : 0;
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let serviceProviderId = (bookingDetails.service_provider_id) ? new ObjectId(bookingDetails.service_provider_id) : "";



        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let orderItemOption = {
            conditions: {
                'order_id': bookingId,
                "is_deliverd": true
            },
        };

        /**get order item lists */
        let orderItemResponse = await OrderModel.getOrderItemList(orderItemOption);
        let orderItemsResult = orderItemResponse.result || [];

        if (orderItemsResult.length > 0) {

            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.booking_cannot_cancel_some_products_deliverd")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {

            let paymentStatus = (bookingDetails.payment_status) ? bookingDetails.payment_status : PAYMENT_UNPAID;
            let totalSellingAmount = (bookingDetails.total_selling_amount) ? bookingDetails.total_selling_amount : 0;
            let orderNumber = (bookingDetails.order_number) ? bookingDetails.order_number : 0;
            let walletAmount = (loginUserData.wallet_amount) ? Number(loginUserData.wallet_amount) : 0;

            let currentDateTime = new Date().toISOString();

            let updateData = {
                'cancel_reason': cancelReason,
                'status': BOOKING_STATUS_CANCELLED,
                'booking_cancel_time': currentDateTime,
                'modified': getUtcDate()
            };

            let options = {
                conditions: {
                    '_id': bookingId,
                    'status': { $in: [BOOKING_STATUS_NEW, BOOKING_STATUS_ACCEPTED] },
                    'user_id': new ObjectId(userId)
                },
                updateData: {
                    $set: updateData,
                    $addToSet: {
                        'canceledBy': {
                            'user_id': new ObjectId(userId),
                            'booking_cancel_time': currentDateTime,
                            'cancel_reason': cancelReason
                        }
                    }
                }
            };

            /**update order booking */
            OrderModel.updateOrderBooking(req, res, options).then(async updateResponse => {

                if (updateResponse.status == STATUS_SUCCESS) {


                    if ((paymentStatus == PAYMENT_PAID) && (totalSellingAmount > 0)) {
                        /* Refund Amount into wallet */

                        let totalWalletAmount = Number(walletAmount) + Number(totalSellingAmount);

                        let options = {
                            'conditions': { _id: new ObjectId(userId) },
                            'updateData': {
                                $set: {
                                    'wallet_amount': Number(totalWalletAmount), 'modified': getUtcDate()
                                }
                            },
                        }

                        let transactionIdData = await getUniqueWalletTransactionId(req, res);
                        let transaction_id = (transactionIdData.result) || '';
                        /**query for update wallet amount */
                        RegistrationModel.updateUser(req, res, options).then(async (updateRes) => {

                            if (updateRes.status == STATUS_SUCCESS) {

                                let useOrderNumber = "#" + orderNumber;

                                await Promise.all([
                                    /**save wallet transaction and user point logs*/

                                    GiftTransactionModel.saveWalletTransactionLogs(req, res, {
                                        insertData: {
                                            'user_id': new ObjectId(userId),
                                            "order_id": bookingId,
                                            "order_number": orderNumber,
                                            'transaction_id': transaction_id,
                                            'amount': Number(totalSellingAmount),
                                            'type': AMOUNT_CREDIT,
                                            'transaction_type': REFUND_FOR_CANCEL_ORDER,
                                            'total_balance_after_transaction': Number(totalWalletAmount),
                                            'message': res.__("front.user.refund_for_cancel_order", useOrderNumber),
                                            'created': getUtcDate()
                                        }
                                    })
                                ]);


                                /** Send success response **/
                                finalResponse = {
                                    'data': {
                                        status: STATUS_SUCCESS,
                                        result: {},
                                        message: res.__("front.order.booking_cancelled")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);

                            } else {
                                /** Send error response **/
                                finalResponse = {
                                    'data': {
                                        status: STATUS_ERROR,
                                        result: {},
                                        message: res.__("front.system.something_going_wrong_please_try_again")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);

                            }

                        });
                    }

                    //// update cancel booking update product
                    let cancelOptionObj = {
                        user_id: userId,
                        booking_id: bookingId,
                    }

                    await addQuantityIntoProduct(req, res, cancelOptionObj);

                    let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                    let email = (loginUserData.email) ? loginUserData.email : "";

                    let extraParametersObj = {
                        order_id: bookingId,
                        order_number: orderNumber,
                        user_id: new ObjectId(userId),
                        booking_id: bookingId.toString(),
                        booking_status: bookingStatus,
                    }

                    let notificationOptions = {
                        notification_data: {
                            notification_type: NOTIFICATION_TO_USER_CANCEL_BOOKING,
                            message_params: [fullName, orderNumber, fullName],
                            user_id: customerId,
                            user_ids: [customerId],
                            parent_table_id: bookingId,
                            lang_code: langCode,
                            extra_parameters: extraParametersObj,
                            user_role_id: FRONT_ADMIN_ROLE_ID,
                            role_id: FRONT_ADMIN_ROLE_ID,
                            created_by: userId
                        }
                    };

                    /**send booking notification to user */
                    await insertNotifications(req, res, notificationOptions);


                    let pushNotificationOptionsUser = {
                        notification_data: {
                            notification_type: PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING,
                            message_params: [fullName, orderNumber, fullName],
                            user_id: customerId,
                            booking_id: bookingId.toString(),
                            booking_status: bookingStatus,
                            lang_code: langCode,
                            user_role_id: FRONT_ADMIN_ROLE_ID,
                            role_id: FRONT_ADMIN_ROLE_ID,
                            created_by: userId
                        }
                    };

                    /**send checkout push notification to user */
                    await pushNotification(req, res, pushNotificationOptionsUser);

                    /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                    let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                    let currentDateTime = new Date();
                    let optionObj = {
                        conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                    }
                    FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                        let responseStatus = response.status ? response.status : "";
                        let contractData = response.result ? response.result : "";
                        if (responseStatus == STATUS_SUCCESS && contractData) {
                            let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                            if (franchiseId) {
                                let franchiseNotificationOptions = {
                                    notification_data: {
                                        notification_type: FRANCHISE_NOTIFICATION_TO_USER_CANCEL_BOOKING,
                                        message_params: [fullName, orderNumber],
                                        user_id: franchiseId,
                                        user_ids: [franchiseId],
                                        extra_parameters: extraParametersObj,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };

                                await insertNotifications(req, res, franchiseNotificationOptions);

                                let franchisePushNotificationOptionsUser = {
                                    notification_data: {
                                        notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING,
                                        message_params: [fullName, orderNumber, fullName],
                                        user_id: franchiseId,
                                        user_ids: [franchiseId],
                                        booking_id: bookingId.toString(),
                                        booking_status: bookingStatus,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };
                                await pushNotification(req, res, franchisePushNotificationOptionsUser);
                            }
                        }
                    })
                    /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


                    let emailOptions = {
                        to: email,
                        action: "user_cancel_booking",
                        rep_array: [fullName, orderNumber],
                    };
                    sendMail(req, res, emailOptions);


                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: {},
                            message: res.__("front.order.booking_cancelled")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });
        }
    }


    /**
     * function for cancel service provider booking 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    this.cancelServiceProviderBooking = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let cancelReason = (req.body.cancel_reason) ? req.body.cancel_reason : '';

        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        /**check user type */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let optionObj = {
            conditions: {
                "_id": bookingId,
                'status': { $in: FOR_SERVICE_PROVIDER_CANCEL_BOOKING_STATUS },
                'service_provider_id': new ObjectId(userId),
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, status: 1, user_id: 1, address_detail: 1, order_number: 1, service_provider_id: 1, booking_area_id: 1, booking_contract_id: 1, booking_time: 1, booking_date: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
        let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
        let bookingTime = (bookingDetails && bookingDetails.booking_time) ? bookingDetails.booking_time : "";
        let bookingDate = (bookingDetails && bookingDetails.booking_date) ? bookingDetails.booking_date : "";

        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let bookingAreaId = (bookingDetails.booking_area_id) ? new ObjectId(bookingDetails.booking_area_id) : "";
        let bookingContractId = (bookingDetails.booking_contract_id) ? new ObjectId(bookingDetails.booking_contract_id) : "";
        let userDetails = (bookingDetails && bookingDetails.address_detail) ? bookingDetails.address_detail : "";
        let customerName = (userDetails && userDetails.full_name) ? userDetails.full_name : "";


        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        } else {
            let currentDateTime = new Date().toISOString();

            let options = {
                conditions: { "_id": bookingId, 'status': { $in: FOR_SERVICE_PROVIDER_CANCEL_BOOKING_STATUS }, 'service_provider_id': new ObjectId(userId) },
                updateData: {
                    $set: {
                        'status': BOOKING_STATUS_NEW,
                        'service_provider_id': null,
                        'booking_area_id': null,
                        'booking_contract_id': null,
                        'modified': getUtcDate()
                    },
                    $addToSet: {
                        'canceledBy': {
                            'user_id': new ObjectId(userId),
                            'booking_area_id': bookingAreaId,
                            'booking_contract_id': bookingContractId,
                            'booking_cancel_time': currentDateTime,
                            'cancel_reason': cancelReason
                        }
                    }
                }
            };

            /**update order booking */
            OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

                if (updateResponse.status == STATUS_SUCCESS) {


                    let updateObj = {
                        date: bookingDate,
                        slot_time: bookingTime,
                        booking_status: BOOKING_STATUS_CANCELLED,
                        service_provider_id: new ObjectId(userId),
                        booking_id: bookingId,
                        order_number: orderNumber,
                    }
                    await updateServiceProviderTimeSlot(req, res, updateObj);


                    let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                    let email = (loginUserData.email) ? loginUserData.email : "";

                    let extraParametersObj = {
                        order_id: bookingId,
                        booking_id: bookingId.toString(),
                        order_number: orderNumber,
                        user_id: new ObjectId(userId),
                    }

                    let notificationOptions = {
                        notification_data: {
                            notification_type: NOTIFICATION_TO_USER_CANCEL_BOOKING,
                            message_params: [customerName, orderNumber, fullName],
                            user_id: customerId,
                            user_ids: [customerId],
                            parent_table_id: bookingId,
                            lang_code: langCode,
                            extra_parameters: extraParametersObj,
                            user_role_id: FRONT_ADMIN_ROLE_ID,
                            role_id: FRONT_ADMIN_ROLE_ID,
                            created_by: userId
                        }
                    };

                    /**send booking notification to user 
                    await insertNotifications(req, res, notificationOptions);
                    */

                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: {},
                            message: res.__("front.order.booking_cancelled")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);

                } else {
                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });
        }
    }


    /**
    * Function for accept booking
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.acceptBooking = async (req, res, next) => {
        let isAutomaticAssign = (req.body.is_automatic_assign) ? req.body.is_automatic_assign : DEACTIVE;
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let userId = '';
        let areaId = '';
        let userType = '';
        let userProviderType = '';
        let fullName = '';
        let email = '';
        if (isAutomaticAssign == ACTIVE) {

            userId = (req.body.user_id) ? new ObjectId(req.body.user_id) : "";

            let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(userId) }, fields: { 'provider_type': 1, 'full_name': 1, 'area_id': 1, 'user_type': 1, 'provider_type': 1, 'email': 1 } });
            let userResult = (userDetails.result) ? userDetails.result : "";
            areaId = (userResult && userResult.area_id) ? userResult.area_id : "";
            userType = (userResult && userResult.user_type) ? userResult.user_type : "";
            userProviderType = (userResult && userResult.provider_type) ? userResult.provider_type : "";
            fullName = (userResult && userResult.full_name) ? userResult.full_name : "";
            email = (userResult && userResult.email) ? userResult.email : "";


        }
        else {

            let loginUserData = (req.user_data) ? req.user_data : "";
            userId = (loginUserData._id) ? loginUserData._id : "";
            areaId = (loginUserData.area_id) ? loginUserData.area_id : "";
            userType = (loginUserData.user_type) ? loginUserData.user_type : "";
            userProviderType = (loginUserData.provider_type) ? loginUserData.provider_type : "";
            fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
            email = (loginUserData.email) ? loginUserData.email : "";

        }


        let contractDetail = await getContractIdFromAreaANDProviderID({ area_id: areaId, service_provider_id: userId });
        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            if (isAutomaticAssign == ACTIVE) {
                return finalResponse;
            } else {
                return returnApiResult(req, res, finalResponse);
            }
        }

        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            if (isAutomaticAssign == ACTIVE) {
                return finalResponse;
            } else {
                return returnApiResult(req, res, finalResponse);
            }
        }

        let optionObj = {
            conditions: {
                "_id": bookingId,
                'status': BOOKING_STATUS_NEW,
                "order_status": ORDER_PLACED,
                "area_ids.area_id": new ObjectId(areaId),
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, order_number: 1, user_id: 1, address_detail: 1, booking_start_timestamp: 1, booking_end_timestamp: 1, booking_date: 1, booking_time: 1, is_service_booking: 1, is_store_order: 1, area_ids: 1, provider_type: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let serviceProviderId = (bookingDetails.service_provider_id) ? new ObjectId(bookingDetails.service_provider_id) : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            if (isAutomaticAssign == ACTIVE) {
                return finalResponse;
            } else {
                return returnApiResult(req, res, finalResponse);
            }
        }

        let startTimeStamp = bookingDetails.booking_start_timestamp || "";
        let endTimeStamp = bookingDetails.booking_end_timestamp || "";
        let orderNumber = bookingDetails.order_number || "";
        let orderProviderType = bookingDetails.provider_type || "";

        let bookingDate = bookingDetails.booking_date || "";
        let bookingTime = bookingDetails.booking_time || "";
        let is_service_booking = (bookingDetails && bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : "";
        let is_store_order = (bookingDetails && bookingDetails.is_store_order) ? bookingDetails.is_store_order : "";


        let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'provider_type': 1, 'full_name': 1 } });
        let customerResult = (userDetails.result) ? userDetails.result : "";
        let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";

        if (orderProviderType != userProviderType) {
            /** Send error response **/
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.provider_type_not_same")
                }
            };
            if (isAutomaticAssign == ACTIVE) {
                return finalResponse;
            } else {
                return returnApiResult(req, res, finalResponse);
            }
        }
        else {
            let optionsData = {
                area_id: areaId,
                user_id: userId,
                start_time_stamp: startTimeStamp,
                end_time_stamp: endTimeStamp,
                is_service_booking: is_service_booking,
                is_store_order: is_store_order,
            };

            /** check is booking available */
            let checkIsAvailable = await checkIsAvailableBooking(req, res, optionsData);

            if (checkIsAvailable.status) {

                let currentDateTime = new Date().toISOString();

                let contractId = (contractDetail.contract_id) ? contractDetail.contract_id : null;
                let franchiseId = (contractDetail.franchise_id) ? contractDetail.franchise_id : null;

                let updateData = {
                    'status': BOOKING_STATUS_ACCEPTED,
                    'driver_status': BOOKING_STATUS_ACCEPTED,
                    'driver_accept_time': currentDateTime,
                    'service_provider_id': new ObjectId(userId),
                    'booking_area_id': new ObjectId(areaId),
                    'booking_contract_id': new ObjectId(contractId),
                    'booking_franchise_id': new ObjectId(franchiseId),
                    'booking_accept_time': currentDateTime,
                    'modified': getUtcDate(),
                    'is_automatic_assign': isAutomaticAssign
                };

                let options = {
                    conditions: {
                        '_id': bookingId,
                        'status': BOOKING_STATUS_NEW,
                        "order_status": ORDER_PLACED,
                        "area_ids.area_id": new ObjectId(areaId),
                        $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
                    },
                    updateData: { $set: updateData }
                };

                /**update order booking */
                OrderModel.updateOrderBooking(req, res, options).then(async updateResponse => {

                    if (updateResponse.status == STATUS_SUCCESS) {

                        if (bookingDetails.is_service_booking == ACTIVE) {

                            let updateObj = {
                                date: bookingDate,
                                slot_time: bookingTime,
                                booking_status: BOOKING_STATUS_ACCEPTED,
                                service_provider_id: new ObjectId(userId),
                                booking_id: bookingId,
                                order_number: orderNumber,
                                booking_start_timestamp: bookingDetails.booking_start_timestamp,
                                booking_end_timestamp: bookingDetails.booking_end_timestamp
                            }
                            await updateServiceProviderTimeSlot(req, res, updateObj);
                        }



                        let extraParametersObj = {
                            order_id: bookingId,
                            order_number: orderNumber,
                            user_id: new ObjectId(userId),
                            booking_id: bookingId.toString(),
                            booking_status: BOOKING_STATUS_ACCEPTED,
                        }

                        let notificationOptions = {
                            notification_data: {
                                notification_type: NOTIFICATION_TO_USER_ACCEPT_BOOKING,
                                message_params: [customerName, orderNumber, fullName],
                                user_id: customerId,
                                user_ids: [customerId],
                                parent_table_id: bookingId,
                                lang_code: langCode,
                                extra_parameters: extraParametersObj,
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: userId
                            }
                        };

                        /**send booking notification to user */
                        await insertNotifications(req, res, notificationOptions);

                        let pushNotificationOptionsUser = {
                            notification_data: {
                                notification_type: PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
                                message_params: [customerName, orderNumber, fullName],
                                user_id: customerId,
                                booking_id: bookingId.toString(),
                                booking_status: BOOKING_STATUS_ACCEPTED,
                                lang_code: langCode,
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: userId
                            }
                        };

                        /**send checkout push notification to user */
                        await pushNotification(req, res, pushNotificationOptionsUser);

                        /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                        let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                        let currentDateTime = new Date();
                        let optionObj = {
                            conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                        }
                        FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                            let responseStatus = response.status ? response.status : "";
                            let contractData = response.result ? response.result : "";
                            if (responseStatus == STATUS_SUCCESS && contractData) {
                                let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                                if (franchiseId) {
                                    let franchiseNotificationOptions = {
                                        notification_data: {
                                            notification_type: FRANCHISE_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
                                            message_params: [customerName, orderNumber, fullName],
                                            user_id: franchiseId,
                                            user_ids: [franchiseId],
                                            extra_parameters: extraParametersObj,
                                            user_role_id: FRONT_ADMIN_ROLE_ID,
                                            role_id: FRONT_ADMIN_ROLE_ID,
                                            created_by: userId
                                        }
                                    };

                                    await insertNotifications(req, res, franchiseNotificationOptions);

                                    let franchisePushNotificationOptionsUser = {
                                        notification_data: {
                                            notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
                                            message_params: [customerName, orderNumber, fullName],
                                            user_id: franchiseId,
                                            user_ids: [franchiseId],
                                            booking_id: bookingId.toString(),
                                            booking_status: BOOKING_STATUS_ACCEPTED,
                                            user_role_id: FRONT_ADMIN_ROLE_ID,
                                            role_id: FRONT_ADMIN_ROLE_ID,
                                            created_by: userId
                                        }
                                    };
                                    await pushNotification(req, res, franchisePushNotificationOptionsUser);
                                }
                            }
                        })
                        /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


                        let emailOptions = {
                            to: email,
                            action: "user_accept_booking",
                            rep_array: [customerName, orderNumber, fullName],
                        };
                        sendMail(req, res, emailOptions);


                        /**send success response */
                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                result: {},
                                message: res.__("front.order.booking_accepted")
                            }
                        };
                        if (isAutomaticAssign == ACTIVE) {
                            return finalResponse;
                        } else {
                            return returnApiResult(req, res, finalResponse);
                        }


                    } else {
                        /**send success response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.system.something_going_wrong_please_try_again"),
                            }
                        };
                        if (isAutomaticAssign == ACTIVE) {
                            return finalResponse;
                        } else {
                            return returnApiResult(req, res, finalResponse);
                        }
                    }
                });
            } else {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.order.no_bookings_are_available_at_this_time")
                    }
                };
                if (isAutomaticAssign == ACTIVE) {
                    return finalResponse;
                } else {
                    return returnApiResult(req, res, finalResponse);
                }

            }
        }
    }


    /**
    * Function forupdate Booking Status GoTo Location 
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.updateBookingStatusGoToLocation = async (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let orderId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let orderItemIds = (req.body.order_item_ids) ? req.body.order_item_ids : [];
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let convertedOrderItemIds = orderItemIds.map(item => (
            new ObjectId(item._id)  // Convert string _id to ObjectId
        ));

        if (!userId || !orderId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.invalid_user_type")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let conditions = [
            { $match: { '_id': orderId, 'service_provider_id': new ObjectId(userId), 'is_deleted': NOT_DELETED } },
            {
                $lookup: {
                    from: TABLE_USERS, // Replace with actual collection name
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $addFields: {
                    customer_name: { $arrayElemAt: ["$user_details.full_name", 0] },
                    customer_phone: { $arrayElemAt: ["$user_details.mobile_number", 0] },
                    customer_email: { $arrayElemAt: ["$user_details.email", 0] },
                }
            },
            {
                $project: {
                    'order_id': 1,
                    'user_id': 1,
                    'order_number': 1,
                    'order_status': 1,
                    'status': { $ifNull: ["$status", DEACTIVE] },
                    'item_count': 1,
                    'total_quantity': 1,
                    'total_mrp_amount': 1,
                    'total_selling_amount': 1,
                    'total_product_discount': 1,
                    'total_extra_discount': 1,
                    'total_shipping_amount': 1,
                    'booking_date': 1,
                    'booking_time': 1,
                    'booking_from': 1,
                    "booking_start_timestamp": 1,
                    "booking_end_timestamp": 1,
                    "booking_travelling_timestamp": 1,
                    'order_item_details': 1,
                    'address_detail': 1,
                    'order_status': 1,
                    'payment_status': 1,
                    'payment_by': 1,
                    'service_provider_id': 1,
                    'area_ids': 1,
                    'created': 1,
                    'is_service_booking': 1,
                    'is_store_order': 1,
                    'customer_name': 1,
                    'customer_phone': 1,
                    'customer_email': 1,
                    'booking_car_type': 1,
                    'booking_duration': 1,
                    'driver_status': 1,

                }
            },
        ];

        let optionsForBookingDetails = {
            'conditions': conditions
        };


        let orderResponse = await OrderModel.getOrderAggregateList(req, res, optionsForBookingDetails);
        let responseStatus = (orderResponse.status) ? orderResponse.status : "";
        let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : {};

        if (!responseResult) {
            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {


            let bookingStatus = (responseResult.status) ? (responseResult.status) : "";
            let customerId = (responseResult.user_id) ? (responseResult.user_id) : "";
            let orderNumber = (responseResult.order_number) ? (responseResult.order_number) : "";
            let customerName = (responseResult.customer_name) ? (responseResult.customer_name) : "";
            let bookingStartTimestamp = (responseResult.booking_start_timestamp) ? (responseResult.booking_start_timestamp) : "";
            let isServiceBooking = (responseResult.is_service_booking) ? (responseResult.is_service_booking) : "";


            let date_time = new Date();
            let currentTimeStamp = date_time.getTime();

            /* 
            if (bookingStartTimestamp > currentTimeStamp && isServiceBooking == ACTIVE) {
                finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.your_service_schedule_today")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } 
            */

            if (convertedOrderItemIds.length > 0) {

                let orderItemOption = {
                    conditions: {
                        order_id: orderId,
                        item_type: ITEM_TYPE_PRODUCT
                    }
                };


                let orderItemResponse = await OrderModel.getOrderItemList(orderItemOption);


                if (orderItemResponse.status == STATUS_ERROR || (orderItemResponse.result && orderItemResponse.result.length == 0)) {

                    /** Send error response */
                    finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {

                    let itemList = [];
                    async.each(orderItemResponse.result, (records) => {
                        let itemType = (records.item_type) ? records.item_type : '';
                        let startDelivery = (records.start_delivery) && records.start_delivery == true ? true : false;
                        let isDelivered = (records.is_delivered) && records.is_delivered == true ? true : false;

                        if (itemType == ITEM_TYPE_PRODUCT && /* startDelivery != true && */ isDelivered != true) {
                            itemList.push(records._id);
                        }
                    });

                    if (itemList.length == 0) {

                        /** Send error response */
                        finalResponse = {
                            data: {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.global.no_record_found")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                    else {


                        let allExist = convertedOrderItemIds.every(item => itemList.some(listItem => listItem.equals(item)));

                        if (allExist == false) {
                            /** Send error response */
                            finalResponse = {
                                data: {
                                    status: STATUS_ERROR,
                                    result: {},
                                    message: res.__("front.global.no_record_found")
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }


                        let updateData = {
                            'start_delivery': true,
                            'start_delivery_time': getUtcDate()
                        };

                        let optionsForUpdateItems = {
                            conditions: { '_id': { $in: convertedOrderItemIds } },
                            updateData: { $set: updateData }
                        };

                        let updateOrderItemResponse = await OrderModel.updateOrderItems(req, res, optionsForUpdateItems);
                    }
                }
            }

            let currentDateTime = new Date().toISOString();

            let updateDataObj = {};

            if (bookingStatus == BOOKING_STATUS_ACCEPTED) {
                updateDataObj = {
                    $set: {
                        'status': BOOKING_STATUS_GO_TO_LOCATION,
                        'booking_go_to_location_time': currentDateTime,
                        'driver_status': BOOKING_STATUS_GO_TO_LOCATION,
                        'driver_booking_go_to_location_time': currentDateTime,
                        'modified': getUtcDate()
                    }
                }

            } else {
                updateDataObj = {
                    $set: {
                        'driver_status': BOOKING_STATUS_GO_TO_LOCATION,
                        'driver_booking_go_to_location_time': currentDateTime,
                        'modified': getUtcDate()
                    }
                }
            }


            let options = {
                conditions: { "_id": orderId, 'service_provider_id': new ObjectId(userId), /*'status': BOOKING_STATUS_ACCEPTED,*/ "order_status": ORDER_PLACED },
                updateData: updateDataObj
            };

            /**update order booking */
            let updateResponse = await OrderModel.updateOrderBooking(req, res, options);

            if (updateResponse.status == STATUS_SUCCESS) {

                let orderDeliveredItemOption = {
                    conditions: {
                        _id: { $in: convertedOrderItemIds },
                        item_type: ITEM_TYPE_PRODUCT
                    },
                };

                let orderDeliveredItemResponse = await OrderModel.getOrderItemList(orderDeliveredItemOption);
                let productTitles = '';
                if (orderDeliveredItemResponse.status == STATUS_SUCCESS) {
                    productTitles = orderDeliveredItemResponse.result.map(item => item.product_title).join(', ');
                }

                let extraParametersObj = {
                    order_id: orderId,
                    order_number: orderNumber,
                    user_id: new ObjectId(userId),
                    booking_id: orderId.toString(),
                    booking_status: BOOKING_STATUS_GO_TO_LOCATION,
                }

                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                let email = (loginUserData.email) ? loginUserData.email : "";

                let notificationOptions = {
                    notification_data: {
                        notification_type: NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                        message_params: [customerName, orderNumber, fullName, productTitles],
                        user_id: customerId,
                        user_ids: [customerId],
                        parent_table_id: orderId,
                        lang_code: langCode,
                        extra_parameters: extraParametersObj,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };

                await insertNotifications(req, res, notificationOptions);


                let pushNotificationOptions = {
                    notification_data: {
                        notification_type: PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                        message_params: [customerName, orderNumber, fullName, productTitles],
                        user_id: customerId,
                        booking_id: orderId.toString(),
                        booking_status: BOOKING_STATUS_GO_TO_LOCATION,
                        lang_code: langCode,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };
                await pushNotification(req, res, pushNotificationOptions);

                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                let areaIds = responseResult.area_ids ? responseResult.area_ids.map(item => item.area_id) : [];
                let currentDateTime = new Date();
                let optionObj = {
                    conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                }

                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                    let responseStatus = response.status ? response.status : "";
                    let contractData = response.result ? response.result : "";
                    if (responseStatus == STATUS_SUCCESS && contractData) {

                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                        if (franchiseId) {
                            let franchiseNotificationOptions = {
                                notification_data: {
                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                                    message_params: [customerName, orderNumber, fullName, productTitles],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };

                            await insertNotifications(req, res, franchiseNotificationOptions);

                            let franchisePushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                                    message_params: [customerName, orderNumber, fullName, productTitles],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    booking_id: orderId.toString(),
                                    booking_status: BOOKING_STATUS_GO_TO_LOCATION,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                        }
                    }
                })
                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


                let emailOptions = {
                    to: email,
                    action: "user_go_to_location_booking",
                    rep_array: [customerName, orderNumber, fullName],
                };
                sendMail(req, res, emailOptions);


                finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        message: ""
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            finalResponse = {
                data: {
                    status: STATUS_SUCCESS,
                    result: responseResult,
                    message: ""
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
    }


    /**
       * Function for get booking list
       *
       * @param req 	As 	Request Data
       * @param res 	As 	Response Data
       * @param next 	As 	Callback argument to the middleware function
       *
       * @return render/json
       */
    this.updateServiceProviderLatLong = async (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let orderId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let spLat = (req.body.sp_lat) ? req.body.sp_lat : "";
        let spLong = (req.body.sp_long) ? req.body.sp_long : "";

        if (!userId || !userType || !orderId || !spLat || !spLong) {
            let finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**check login user  */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let optionObj = {
            conditions: {
                "_id": orderId,
                "service_provider_id": new ObjectId(userId),
                'status': BOOKING_STATUS_GO_TO_LOCATION,
                "order_status": ORDER_PLACED,
            },
            fields: { _id: 1, order_number: 1, user_id: 1, address_detail: 1, status: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let previousSpLat = (bookingDetails.current_sp_location && bookingDetails.current_sp_location.latitude) ? bookingDetails.address_detail.latitude : "";
        let previousSpLong = (bookingDetails.current_sp_location && bookingDetails.current_sp_location.longitude) ? bookingDetails.address_detail.longitude : "";

        if (previousSpLat == spLat && previousSpLong == spLong) {
            finalResponse = {
                'data': {
                    status: STATUS_SUCCESS,
                    result: {},
                    message: "",
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let updateData = {
            'current_sp_location': { "latitude": spLat, "longitude": spLong },
            'modified': getUtcDate()
        };

        let options = {
            conditions: { '_id': orderId, 'status': BOOKING_STATUS_GO_TO_LOCATION, "service_provider_id": new ObjectId(userId) },
            updateData: { $set: updateData }
        };

        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateBookingResponse) => {

            if (updateBookingResponse.status == STATUS_SUCCESS) {

                let orderNumber = (updateBookingResponse.result.order_number) ? updateBookingResponse.result.order_number : "";

                await Promise.all([
                    /**save Order service provider Location*/
                    OrderModel.saveOrderSPLocationOrder(req, res, {
                        insertData: {
                            order_id: orderId,
                            order_number: orderNumber,
                            service_provider_id: new ObjectId(userId),
                            latitude: spLat,
                            longitude: spLong,
                            created: getUtcDate()
                        }
                    })
                ]);

                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: res.__("front.booking.latitude_longitude_updated"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        })
    }


    /**
     * Function for start booking
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.reachedOnLocationBooking = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";

        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        /**check login user  */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let optionObj = {
            conditions: {
                "_id": bookingId,
                /* 'status': BOOKING_STATUS_GO_TO_LOCATION, */
                'service_provider_id': new ObjectId(userId),
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, status: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
        let bookingStatus = (bookingDetails && bookingDetails.status) ? bookingDetails.status : "";
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let currentDateTime = new Date().toISOString();

        let customerResponse = await RegistrationModel.getUserDetail({ conditions: { '_id': customerId }, fields: { 'full_name': 1 } });
        let customerDetails = (customerResponse.result) ? customerResponse.result : "";
        let customerName = (customerDetails && customerDetails.full_name) ? customerDetails.full_name : "";


        let updateDataObj = {};

        if (bookingStatus == BOOKING_STATUS_GO_TO_LOCATION) {
            updateDataObj = {
                $set: {
                    'status': BOOKING_STATUS_REACHED_LOCATION,
                    'booking_reached_on_location_time': currentDateTime,
                    'driver_status': BOOKING_STATUS_REACHED_LOCATION,
                    'driver_reached_on_location_time': currentDateTime,
                    'modified': getUtcDate()
                }
            }

        } else {
            updateDataObj = {
                $set: {
                    'driver_status': BOOKING_STATUS_REACHED_LOCATION,
                    'driver_reached_on_location_time': currentDateTime,
                    'modified': getUtcDate()
                }
            }
        }




        let options = {
            conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), /* 'status': BOOKING_STATUS_GO_TO_LOCATION, */ "order_status": ORDER_PLACED },
            updateData: updateDataObj
        };

        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

            if (updateResponse.status == STATUS_SUCCESS) {

                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                let email = (loginUserData.email) ? loginUserData.email : "";

                let extraParametersObj = {
                    order_id: bookingId,
                    order_number: orderNumber,
                    user_id: new ObjectId(userId),
                    booking_id: bookingId.toString(),
                    booking_status: BOOKING_STATUS_REACHED_LOCATION,
                }

                let notificationOptions = {
                    notification_data: {
                        notification_type: NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
                        message_params: [customerName, orderNumber, fullName],
                        user_id: customerId,
                        user_ids: [customerId],
                        parent_table_id: bookingId,
                        lang_code: langCode,
                        extra_parameters: extraParametersObj,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };

                await insertNotifications(req, res, notificationOptions);

                let pushNotificationOptions = {
                    notification_data: {
                        notification_type: PUSH_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
                        message_params: [customerName, orderNumber, fullName],
                        user_id: customerId,
                        booking_id: bookingId.toString(),
                        booking_status: BOOKING_STATUS_REACHED_LOCATION,
                        lang_code: langCode,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };
                await pushNotification(req, res, pushNotificationOptions);



                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                let currentDateTime = new Date();
                let optionObj = {
                    conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                }

                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                    let responseStatus = response.status ? response.status : "";
                    let contractData = response.result ? response.result : "";
                    if (responseStatus == STATUS_SUCCESS && contractData) {

                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                        if (franchiseId) {
                            let franchiseNotificationOptions = {
                                notification_data: {
                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }

                            };

                            await insertNotifications(req, res, franchiseNotificationOptions);

                            let franchisePushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    booking_id: bookingId.toString(),
                                    booking_status: BOOKING_STATUS_REACHED_LOCATION,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                        }
                    }
                })
                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */

                let emailOptions = {
                    to: email,
                    action: "user_reached_on_location_booking",
                    rep_array: [customerName, orderNumber, fullName],
                };
                sendMail(req, res, emailOptions);


                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: ''
                    }
                };
                return returnApiResult(req, res, finalResponse);

            }
            else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.no_record_found"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
     * Function for start booking Service
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.startBookingService = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";

        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        /**check login user  */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let optionObj = {
            conditions: {
                "_id": bookingId,
                'status': { $in: FOR_START_BOOKING_STATUS },
                'service_provider_id': new ObjectId(userId),
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let isServiceBooking = (bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : false;

        if (!isServiceBooking) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_service_booking_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'provider_type': 1, 'full_name': 1 } });
        let customerResult = (userDetails.result) ? userDetails.result : "";
        let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
        let currentDateTime = new Date().toISOString();

        let options = {
            conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), 'status': { $in: FOR_START_BOOKING_STATUS }, "order_status": ORDER_PLACED },
            updateData: {
                $set: {
                    'status': BOOKING_STATUS_SERVICE_STARTED,
                    'booking_start_time': currentDateTime,
                    'driver_status': BOOKING_STATUS_SERVICE_STARTED,
                    'driver_booking_start_time': currentDateTime,
                    'modified': getUtcDate()
                }
            }
        };

        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

            if (updateResponse.status == STATUS_SUCCESS) {

                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                let email = (loginUserData.email) ? loginUserData.email : "";

                let extraParametersObj = {
                    order_id: bookingId,
                    order_number: orderNumber,
                    user_id: new ObjectId(userId),
                    booking_id: bookingId.toString(),
                }

                let notificationOptions = {
                    notification_data: {
                        notification_type: NOTIFICATION_TO_USER_START_BOOKING,
                        message_params: [customerName, orderNumber, fullName],
                        user_id: customerId,
                        user_ids: [customerId],
                        parent_table_id: bookingId,
                        lang_code: langCode,
                        extra_parameters: extraParametersObj,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };

                /**send booking notification to user */
                await insertNotifications(req, res, notificationOptions);
                /**send success response */



                let pushNotificationOptions = {
                    notification_data: {
                        notification_type: PUSH_NOTIFICATION_TO_USER_START_BOOKING,
                        message_params: [customerName, orderNumber, fullName],
                        user_id: customerId,
                        lang_code: langCode,
                        user_role_id: FRONT_ADMIN_ROLE_ID,
                        role_id: FRONT_ADMIN_ROLE_ID,
                        created_by: userId
                    }
                };
                await pushNotification(req, res, pushNotificationOptions);

                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                let currentDateTime = new Date();
                let optionObj = {
                    conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                }

                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                    let responseStatus = response.status ? response.status : "";
                    let contractData = response.result ? response.result : "";
                    if (responseStatus == STATUS_SUCCESS && contractData) {

                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                        if (franchiseId) {

                            let franchiseNotificationOptions = {
                                notification_data: {
                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_START_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };

                            await insertNotifications(req, res, franchiseNotificationOptions);

                            let franchisePushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_START_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: franchiseId,
                                    user_ids: [franchiseId],
                                    booking_id: bookingId.toString(),
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                        }
                    }
                })
                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


                let emailOptions = {
                    to: email,
                    action: "user_start_booking",
                    rep_array: [customerName, orderNumber, fullName],
                };
                sendMail(req, res, emailOptions);



                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: res.__("front.order.service_started")
                    }
                };
                return returnApiResult(req, res, finalResponse);

            } else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.no_record_found"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
     * Function for check Available Time Slot
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getTimeSlotList = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingDate = (req.body.booking_date) ? req.body.booking_date : new Date().toISOString().split('T')[0];
        let latitude = (req.body.latitude) ? req.body.latitude : null;
        let longitude = (req.body.longitude) ? req.body.longitude : null;
        let providerType = (req.body.provider_type) ? req.body.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;

        let finalResponse = {};

        let todayDate = new Date().toISOString().split('T')[0];

        let next7DaysDate = addDays(todayDate, 6);


        if (!userId || !bookingDate || !latitude || !longitude) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        /**check login user  */
        if (userType != CUSTOMER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }



        if (bookingDate < todayDate || bookingDate > next7DaysDate) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.invalid_date")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let leaveConditions = {
            date: bookingDate
        };

        let leaveDateOptions = {
            conditions: leaveConditions,
            fields: { _id: 1, date: 1, leave_reason: 1 }
        }

        LeaveManagementModel.getLeaveManagementFindOne(leaveDateOptions).then(leaveResponse => {
            let responseStatus = (leaveResponse.status) ? leaveResponse.status : "";
            let responseResult = (leaveResponse.result) ? leaveResponse.result : "";

            if (responseStatus == STATUS_SUCCESS && responseResult != '') {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: responseResult,
                        message: res.__("front.user.this_date_on_leave")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            const getDayName = (dateStr) => {
                const date = new Date(dateStr);
                const options = { weekday: 'long' };
                return date.toLocaleDateString('en-US', options).toLowerCase();
            };

            let dayName = getDayName(bookingDate);

            let optionsObj = {
                'conditions': {
                    is_deleted: NOT_DELETED
                }
            };

            SlotModel.getSlotFindOne(optionsObj).then(async slotResponse => {

                let responseStatus = (slotResponse.status) ? slotResponse.status : "";
                if (responseStatus == STATUS_SUCCESS) {

                    let responseResult = (slotResponse.result && slotResponse.result) ? slotResponse.result : "";
                    let timeSlots = (responseResult.time_slot) ? responseResult.time_slot : {};

                    let itemSlotList = [];

                    let latLongOptions = { latitude: latitude, longitude: longitude };
                    let areaIds = await getAreaIdsArrayFromLatLong(req, res, latLongOptions);
                    timeSlots = timeSlots[dayName] ? timeSlots[dayName] : '';
                    for (const [key, slot] of Object.entries(timeSlots)) {

                        let options = {
                            area_ids: areaIds,
                            user_id: userId,
                            booking_date: bookingDate,
                            time_slot: slot,
                            provider_type: providerType
                        };

                        try {
                            const timeSlotResponse = await checkAvailableTimeSlot(req, res, options);

                            let timeSlotResponsestatus = timeSlotResponse.status ? timeSlotResponse.status : null;
                            let timeSlotResponseResult = timeSlotResponse.result ? timeSlotResponse.result : false;
                            if (timeSlotResponseResult) {
                                itemSlotList.push({
                                    key: key,
                                    value: slot,
                                    time_slot_available: timeSlotResponseResult
                                });
                            }


                        } catch (error) {
                            // Handle any errors that occur during the checkAvailableTimeSlot call
                            console.error('Error fetching time slot availability:', error);
                        }

                    };

                    let response_message = "";
                    if (itemSlotList.length == 0) {
                        response_message = res.__("front.system.no_slots_available_for_this_date");
                    }

                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: itemSlotList,
                            message: response_message,
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            })
        })
    }


    /**
     * Function for update Booking Status Service Finished and upload images and review rating also
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.FinishBookingServiceWithImage = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let orderItemIds = (req.body.order_item_ids) ? req.body.order_item_ids : [];
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let providerType = (loginUserData.provider_type) ? loginUserData.provider_type : "";
        let rating = (req.body.rating) ? req.body.rating : 0;
        let review = (req.body.review) ? req.body.review : "";
        let totalDeliveredItemAmount = 0;
        let totalDeliveredItemDiscountAmount = 0;
        let totalPackageAmount = 0;
        let totalPackageDiscountAmount = 0;


        let image = (req.files && req.files.product_images) ? req.files.product_images : "";
        image = Array.isArray(image) ? image : image ? [image] : [];
        let files = req.files || '';

        if (Object.keys(files).length) {
            files = Object.keys(files).map(key => ({ image: files[key] }));
        }

        let totalImage = image.length;

        let finalResponse = {};
        if (!userId || !bookingId || (totalImage <= 0)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**check login user  */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let convertedOrderItemIds = orderItemIds.map(item => (
            new ObjectId(item._id)  // Convert string _id to ObjectId
        ));


        let optionObj = {
            conditions: {
                "_id": bookingId,
                'service_provider_id': new ObjectId(userId),
                $or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, is_store_order: 1, status: 1, total_selling_amount: 1, area_ids: 1, booking_contract_id: 1 }
        }


        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);

        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
        let isServiceBooking = (bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : false;
        let isSoreBooking = (bookingDetails.is_store_order) ? bookingDetails.is_store_order : false;
        let bookingStatus = bookingDetails.status;

        if (isServiceBooking && (bookingStatus == BOOKING_STATUS_REACHED_LOCATION)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.need_to_start_booking_service_first")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let totalSellingAmount = (bookingDetails && bookingDetails.total_selling_amount) ? Number(bookingDetails.total_selling_amount) : "";
        let currentDateTime = new Date().toISOString();

        if (rating || review) {
            let ratingItemOption = {
                rating: rating,
                review: review,
                reviewFor: USER_REVIEW,
                user_id: customerId,
                login_user_id: userId,
                booking_id: bookingId,
                booking_details: bookingDetails,
            };

            let submitReviewRatingResponse = await submitReviewRating(req, res, ratingItemOption);
            if (submitReviewRatingResponse.status == STATUS_ERROR) {
                /** Send error response */
                finalResponse = {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: submitReviewRatingResponse.message
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        }


        asyncParallel({
            product_images: (callback) => {
                if (!files) return callback(null, null);
                let productImages = []
                asyncEach(image, (records, eachCallback) => {

                    if (!records.name) return eachCallback(null);
                    /** Upload category image **/
                    moveUploadedFile(req, res, { filePath: PRODUCT_FILE_PATH, image: records }).then(imgRes => {
                        if (imgRes.status == STATUS_ERROR) return callback([{ 'param': 'images', 'msg': imgRes.message }]);

                        let obj = {
                            _id: new ObjectId(),
                            image: imgRes.fileName
                        }
                        productImages.push(obj);
                        eachCallback(null);
                    });

                }, () => {
                    callback(null, productImages);
                });
            },

        }, async (asyncError, asyncResponse) => {

            var product_images = (asyncResponse.product_images) ? asyncResponse.product_images : [];


            let options = {
                conditions: {
                    "_id": bookingId,
                    'service_provider_id': new ObjectId(userId),
                    $or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
                    "order_status": ORDER_PLACED
                },
                updateData: {
                    $set: {
                        'status': BOOKING_STATUS_SERVICE_FINISHED,
                        'booking_service_finished_time': currentDateTime,
                        'driver_status': BOOKING_STATUS_SERVICE_FINISHED,
                        'driver_booking_service_finished_time': currentDateTime,
                        'modified': getUtcDate()
                    },
                    $addToSet: {
                        images: {
                            $each: product_images
                        }
                    }
                }
            };

            /**update order booking */
            OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {


                /** PRODUCT NAME GET  */
                let productTitles = '';
                let orderDeliveredItemOption = {
                    conditions: {
                        order_id: bookingId,
                        item_type: ITEM_TYPE_PRODUCT,
                        start_delivery: true,
                        is_delivered: { $ne: true }
                    },
                };
                let orderDeliveredItemResponse = await OrderModel.getOrderItemList(orderDeliveredItemOption);
                if (orderDeliveredItemResponse.status == STATUS_SUCCESS) {
                    productTitles = orderDeliveredItemResponse.result.map(item => item.product_title).join(', ');
                }


                /** UPDATE PRODUCTS AS DELIVERED */
                let optionsForUpdateItems = {
                    conditions: {
                        order_id: bookingId,
                        item_type: ITEM_TYPE_PRODUCT,
                        start_delivery: true,
                        is_delivered: { $ne: true }
                    },

                    updateData: {
                        $set: {
                            'is_delivered': true,
                            'delivered_time': getUtcDate(),
                        },
                    },

                };

                await OrderModel.updateOrderItems(req, res, optionsForUpdateItems);


                /* CHECK IF THERE IS NO PRODUCT LEFT FOR DELIVERY AND REFUNDED MARK ORDER AS COMPLETED   */

                let deliveredOrderItemOption = {
                    conditions: {
                        order_id: bookingId,
                    }
                };
                let orderAllItemResponse = await OrderModel.getOrderItemList(deliveredOrderItemOption);

                async.each(orderAllItemResponse.result, (itemRecords) => {
                    let selectedisDelivered = (itemRecords.is_delivered) && itemRecords.is_delivered == true ? true : false;
                    let selecteditemType = (itemRecords.item_type) ? itemRecords.item_type : '';


                    if (selectedisDelivered == true && selecteditemType == ITEM_TYPE_PRODUCT) {
                        totalDeliveredItemAmount += (itemRecords.total_selling_amount) ? itemRecords.total_selling_amount : 0;
                        totalDeliveredItemDiscountAmount += (itemRecords.total_product_discount) ? itemRecords.total_product_discount : 0;
                    }

                    if (selecteditemType == ITEM_TYPE_PACKAGE) {
                        totalPackageAmount += (itemRecords.total_selling_amount) ? itemRecords.total_selling_amount : 0;
                        totalPackageDiscountAmount += (itemRecords.total_product_discount) ? itemRecords.total_product_discount : 0;
                    }
                });


                let totalReceivableAmount = totalDeliveredItemAmount + totalPackageAmount;
                let totalReceivableDiscountAmount = totalDeliveredItemDiscountAmount + totalPackageDiscountAmount;
                let priceBreakDownObj = {
                    'total_delivered_item_amount': totalDeliveredItemAmount,
                    'total_delivered_item_discount_amount': totalDeliveredItemDiscountAmount,
                    'total_package_amount': totalPackageAmount,
                    'total_package_discount_amount': totalPackageDiscountAmount,
                    'total_receivable_amount': totalReceivableAmount,
                    'total_receivable_discount_amount': totalReceivableDiscountAmount,
                }
                // SET BOOKING DETAILS PRICE BREAKDOWN OBJECT

                let orderItemDetails = await OrderModel.getOrderItemCount({
                    conditions: {
                        "order_id": bookingId,
                        'item_type': ITEM_TYPE_PRODUCT,
                        'is_delivered': false,
                    }
                });

                let orderItemResultCount = (orderItemDetails.result) ? orderItemDetails.result : 0;

                if ((isSoreBooking == false) || (isSoreBooking == true && orderItemResultCount == 0)) {
                    let options = {
                        conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), "order_status": ORDER_PLACED },
                        updateData: {
                            $set: {
                                'status': BOOKING_STATUS_COMPLETED,
                                'booking_complete_time': currentDateTime,
                                'driver_status': BOOKING_STATUS_COMPLETED,
                                'driver_booking_complete_time': currentDateTime,
                                'completed_by': new ObjectId(userId),
                                'modified': getUtcDate(),
                                'price_breakdown': priceBreakDownObj,
                                'total_received_amount': totalReceivableAmount,
                                'total_received_amount_for_store_order': totalDeliveredItemAmount,
                                'total_received_amount_for_service': totalPackageAmount,
                                'payment_status': PAYMENT_PAID
                            }
                        }
                    };

                    /**update order booking */
                    OrderModel.updateOrderBooking(req, res, options).then(async (updateOrdResponse) => {

                        if (updateOrdResponse.status == STATUS_SUCCESS) {

                            if (totalSellingAmount) {

                                let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1, 'full_name': 1 } });

                                let customerResult = (userDetails.result) ? userDetails.result : "";
                                let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;
                                let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;


                                let valuePerPoint = res.locals.settings["Site.value_per_coin"];

                                let pointsResp = calculatePoints(totalSellingAmount, valuePerPoint, totalBalanceForPoints);
                                let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
                                let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
                                let useOrderNumber = "#" + orderNumber;

                                let pointsOption = {
                                    "user_id": new ObjectId(customerId),
                                    "order_id": bookingId,
                                    "order_number": orderNumber,
                                    "points": points,
                                    "type": POINT_TYPE_EARNED,
                                    "transaction_reason": EARNED_BY_ORDER,
                                    "amount_for_single_point": valuePerPoint,
                                    "total_user_points": totalUserPoints,
                                    "total_selling_amount": totalSellingAmount,
                                    "total_balance_for_points": totalBalanceForPoints,
                                    "remainder": remainder,
                                    "note": res.__("front.user.points_earned_regarding_order_number", useOrderNumber)
                                }
                                /**save points while complete order */
                                await saveUserPoints(req, res, pointsOption);

                                /** Save points stats for user*/
                                await updatePointTransactionLogStats(req, res, {
                                    "user_id": userId,
                                    "points": points,
                                });


                                /**  add provider amount */

                                let currentDate = new Date().toISOString().split('T')[0];

                                await providerEarning(req, res, {
                                    booking_id: bookingId,
                                    provider_type: providerType,
                                    service_provider_id: userId,
                                    date: currentDate,
                                });
                                /**  add provider amount */




                                let extraParametersObj = {
                                    order_id: bookingId,
                                    order_number: orderNumber,
                                    user_id: new ObjectId(userId),
                                    booking_id: bookingId.toString(),
                                }
                                let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
                                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                                let email = (loginUserData.email) ? loginUserData.email : "";

                                let notificationOptions = {
                                    notification_data: {
                                        notification_type: NOTIFICATION_TO_USER_FINISH_BOOKING,
                                        message_params: [customerName, orderNumber, fullName],
                                        user_id: customerId,
                                        user_ids: [customerId],
                                        parent_table_id: bookingId,
                                        lang_code: langCode,
                                        extra_parameters: extraParametersObj,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };
                                await insertNotifications(req, res, notificationOptions);


                                let pushNotificationOptions = {
                                    notification_data: {
                                        notification_type: PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                        message_params: [customerName, orderNumber, fullName],
                                        user_id: customerId,
                                        lang_code: langCode,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };
                                await pushNotification(req, res, pushNotificationOptions);


                                let deliveredNotificationOptions = {
                                    notification_data: {
                                        notification_type: NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
                                        message_params: [fullName, orderNumber, productTitles],
                                        user_id: customerId,
                                        user_ids: [customerId],
                                        parent_table_id: bookingId,
                                        lang_code: langCode,
                                        extra_parameters: extraParametersObj,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };
                                await insertNotifications(req, res, deliveredNotificationOptions);

                                let deliveredPushNotificationOptions = {
                                    notification_data: {
                                        notification_type: PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
                                        message_params: [fullName, orderNumber, productTitles],
                                        user_id: customerId,
                                        lang_code: langCode,
                                        user_role_id: FRONT_ADMIN_ROLE_ID,
                                        role_id: FRONT_ADMIN_ROLE_ID,
                                        created_by: userId
                                    }
                                };
                                await pushNotification(req, res, deliveredPushNotificationOptions);


                                /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                                let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                                let bookingContractId = bookingDetails.booking_contract_id ? new ObjectId(bookingDetails.booking_contract_id) : '';
                                let currentDateTime = new Date();
                                let optionObj = {
                                    conditions: {
                                        area_id: { $in: areaIds },
                                        _id: bookingContractId,
                                        status: CONTRACT_STATUS_ACTIVE,
                                        end_date: { $gte: currentDateTime }
                                    },
                                }

                                FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                                    let responseStatus = response.status ? response.status : "";
                                    let contractData = response.result ? response.result : "";
                                    if (responseStatus == STATUS_SUCCESS && contractData) {

                                        let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                                        let purelyAmountCommissionStorePercentage = (contractData.purely_amount_commission_store) ? contractData.purely_amount_commission_store : 0;
                                        let purelyAmountCommissionServicePercentage = (contractData.purely_amount_commission) ? contractData.purely_amount_commission : 0;
                                        let contractId = (contractData._id) ? contractData._id : 0;

                                        if (franchiseId) {


                                            /* PURELY COMMINSSION BASED CODE START */
                                            let handleObject = {
                                                orderId: bookingId,
                                                franchiseId: franchiseId,
                                                contractId: contractId,
                                                purelyAmountCommissionStorePercentage: purelyAmountCommissionStorePercentage,
                                                purelyAmountCommissionServicePercentage: purelyAmountCommissionServicePercentage
                                            };
                                            await handlePurelyCommissionUpdate(req, res, handleObject);

                                            /* PURELY COMMINSSION BASED CODE END */

                                            let franchiseNotificationOptions = {
                                                notification_data: {
                                                    notification_type: FRANCHISE_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                                    message_params: [customerName, orderNumber, fullName],
                                                    user_id: franchiseId,
                                                    user_ids: [franchiseId],
                                                    extra_parameters: extraParametersObj,
                                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                                    role_id: FRONT_ADMIN_ROLE_ID,
                                                    created_by: userId
                                                }
                                            };

                                            await insertNotifications(req, res, franchiseNotificationOptions);

                                            let franchisePushNotificationOptionsUser = {
                                                notification_data: {
                                                    notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                                    message_params: [customerName, orderNumber, fullName],
                                                    user_id: franchiseId,
                                                    user_ids: [franchiseId],
                                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                                    role_id: FRONT_ADMIN_ROLE_ID,
                                                    created_by: userId
                                                }
                                            };
                                            await pushNotification(req, res, franchisePushNotificationOptionsUser);
                                        }
                                    }
                                })
                                /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


                                let emailOptions = {
                                    to: email,
                                    action: "user_finish_booking",
                                    rep_array: [customerName, orderNumber, fullName],
                                };
                                sendMail(req, res, emailOptions);



                                finalResponse = {
                                    'data': {
                                        status: STATUS_SUCCESS,
                                        result: {},
                                        message: res.__("front.order.service_complete")
                                    }
                                };

                                return returnApiResult(req, res, finalResponse);
                            }
                            else {
                                finalResponse = {
                                    'data': {
                                        status: STATUS_SUCCESS,
                                        result: {},
                                        message: res.__("front.order.service_complete")
                                    }
                                };

                                return returnApiResult(req, res, finalResponse);
                            }
                        }
                        else {
                            /**send success response */
                            finalResponse = {
                                'data': {
                                    status: STATUS_ERROR,
                                    result: {},
                                    message: res.__("front.global.no_record_found"),
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }
                    });
                }
                else if (updateResponse.status == STATUS_SUCCESS) {
                    let orderOptions = {
                        conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), "order_status": ORDER_PLACED },
                        updateData: {
                            $set: {
                                'modified': getUtcDate(),
                                'price_breakdown': priceBreakDownObj,
                                'total_received_amount': totalReceivableAmount,
                                'total_received_amount_for_store_order': totalDeliveredItemAmount,
                                'total_received_amount_for_service': totalPackageAmount,
                                'payment_status': PAYMENT_PARTIAL
                            }
                        }
                    };
                    /**update order booking */
                    OrderModel.updateOrderBooking(req, res, orderOptions).then(async (updateOrdResponse) => {


                        let extraParametersObj = {
                            order_id: bookingId,
                            order_number: orderNumber,
                            user_id: new ObjectId(userId),
                            booking_id: bookingId.toString(),
                        }

                        let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                        let email = (loginUserData.email) ? loginUserData.email : "";

                        let notificationOptions = {
                            notification_data: {
                                notification_type: NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
                                message_params: [fullName, orderNumber, productTitles],
                                user_id: customerId,
                                user_ids: [customerId],
                                parent_table_id: bookingId,
                                lang_code: langCode,
                                extra_parameters: extraParametersObj,
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: userId
                            }
                        };
                        await insertNotifications(req, res, notificationOptions);


                        let pushNotificationOptions = {
                            notification_data: {
                                notification_type: PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
                                message_params: [fullName, orderNumber, productTitles],
                                user_id: customerId,
                                lang_code: langCode,
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: userId
                            }
                        };
                        await pushNotification(req, res, pushNotificationOptions);


                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                result: {},
                                message: res.__("front.order.service_complete")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);

                    })
                }
                else {
                    /**send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.global.no_record_found"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });
        });
    }


    /**
     * Function to redeem Points
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.redeemPoints = async (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";

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

        let userWalletStatus = (loginUserData.wallet_status) ? loginUserData.wallet_status : DEACTIVE;
        let walletAmount = (loginUserData.wallet_amount) ? Number(loginUserData.wallet_amount) : 0;
        let totalPoints = (loginUserData.total_points) ? Number(loginUserData.total_points) : 0;
        let maximumConvertPoint = res.locals.settings["Site.site_maximum_convert_point"];

        if (userWalletStatus != ACTIVE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.wallet_deative_message")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**check total point is less the maximum convert point */
        if (totalPoints < Number(maximumConvertPoint)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.user.total_points_are_less_than_the_maximum_convertible_points")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {

            let perPointPrice = res.locals.settings["Site.site_per_point_price"];
            /**convert Points to amount */
            let amountFromPoints = convertPointsToAmount(totalPoints, perPointPrice);
            let totalWalletAmount = Number(walletAmount) + Number(amountFromPoints);

            let options = {
                'conditions': { _id: userId },
                'updateData': {
                    $set: {
                        'wallet_amount': Number(totalWalletAmount), 'total_points': DEACTIVE, 'modified': getUtcDate()
                    }
                },
            }

            let transactionIdData = await getUniqueWalletTransactionId(req, res);
            let transaction_id = (transactionIdData.result) || '';

            /**query for update wallet amount */
            RegistrationModel.updateUser(req, res, options).then(async (updateRes) => {

                if (updateRes.status == STATUS_SUCCESS) {


                    await Promise.all([
                        /**save wallet transaction and user point logs*/
                        GiftTransactionModel.saveWalletTransactionLogs(req, res, {
                            insertData: {
                                'user_id': userId,
                                'transaction_id': transaction_id,
                                'amount': Number(amountFromPoints),
                                'type': AMOUNT_CREDIT,
                                'transaction_type': REDEEM_POINS,
                                'total_balance_after_transaction': Number(totalWalletAmount),
                                'message': res.__("front.user.amount_redeem"),
                                'created': getUtcDate()
                            }
                        }),

                        /**save user points */
                        saveUserPoints(req, res, {
                            "user_id": userId,
                            "total_redeem_points": totalPoints,
                            "total_redeem_amount": amountFromPoints,
                            "amount_for_single_point": perPointPrice,
                            "type": POINT_TYPE_REDEEM,
                            "transaction_reason": REDEEMED,
                            "is_redeem": ACTIVE,
                            "note": res.__("front.user.point_convert_to_wallet")
                        }),

                        /** Save points stats  */
                        updatePointTransactionLogStats(req, res, {
                            "is_redeem": ACTIVE,
                            "user_id": userId,
                            "redeem_points": totalPoints,
                            "redeem_amount": amountFromPoints,
                        }),
                    ]);

                    /** Send success response **/
                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: {},
                            message: res.__("front.user.points_redeemed_successfully")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);

                } else {
                    /** Send error response **/
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });
        }
    }


    /**
    * Function for submit rating review
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.submitReviewRating = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let loginUserId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let rating = (req.body.rating) ? parseFloat(req.body.rating) : "";
        let review = (req.body.review) ? req.body.review : "";
        let reviewFor = (req.body.review_for) ? req.body.review_for : "";  /*product OR user*/
        let productId = (req.body.product_id) ? new ObjectId(req.body.product_id) : "";  /*product OR user*/
        let orderItemId = (req.body.order_item_id) ? new ObjectId(req.body.order_item_id) : "";  /*product OR user*/
        let finalResponse = {};
        if (!loginUserId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        //if ((reviewFor == USER_REVIEW)) {

        let optionObj = {
            conditions: {
                "_id": bookingId,
                'status': BOOKING_STATUS_COMPLETED,
                "order_status": ORDER_PLACED,
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { payment_details: 0, package_details: 0, subscription_details: 0, my_subscription_details: 0, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        // }



        let ratingOptionObj = {
            conditions: {
                "posted_by": loginUserId,
                "review_for": reviewFor,
                "booking_id": bookingId,
            },
            fields: { booking_id: 1, posted_by: 1, review_for: 1 }
        };

        if (reviewFor == PRODUCT_REVIEW) {
            ratingOptionObj.conditions.order_item_id = orderItemId

        }

        /**get booking details */
        let ratingResponse = await RegistrationModel.getRatingDetails(ratingOptionObj);
        let RatingDetails = (ratingResponse.result) ? ratingResponse.result : "";
        if (RatingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_rating_has_already_been_submited.")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }



        if ((reviewFor == PRODUCT_REVIEW) && (userType == SERVICE_PROVIDER_USER_TYPE)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let oppositeUserId = null;
        let is_rated_by_service_provider = null;
        let is_rated_by_customer = null;


        if (reviewFor == USER_REVIEW) {
            if (userType == CUSTOMER_USER_TYPE) {
                oppositeUserId = (bookingDetails.service_provider_id) ? new ObjectId(bookingDetails.service_provider_id) : "";
                is_rated_by_customer = ACTIVE;
            } else if (userType == SERVICE_PROVIDER_USER_TYPE) {
                oppositeUserId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
                is_rated_by_service_provider = ACTIVE;
            }
        }

        let option = {
            insertData: {
                'booking_id': bookingId,
                'user_id': oppositeUserId,
                'posted_by': loginUserId,
                'rating': rating,
                'review': review,
                'booking_details': bookingDetails,
                'product_id': productId,
                'order_item_id': orderItemId,
                'review_for': reviewFor,
                'status': DEACTIVE,
                'is_deleted': DEACTIVE,
                'created': getUtcDate(),
                'modified': getUtcDate()
            }
        };

        /**save service provider rating */
        RegistrationModel.saveRating(req, res, option).then(saveResponse => {
            if (saveResponse.status == STATUS_ERROR) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {
                if (reviewFor == USER_REVIEW) {
                    let bookingObj = {
                        conditions: { "_id": bookingId },
                        updateData: {
                            $set: {
                                "is_rated_by_customer": is_rated_by_customer,
                                "is_rated_by_service_provider": is_rated_by_service_provider,
                            }
                        }
                    };

                    // update user rating
                    OrderModel.updateOrderBooking(req, res, bookingObj).then(updateBookingResponse => {

                        if (updateBookingResponse.status == STATUS_ERROR) {
                            finalResponse = {
                                'data': {
                                    'status': STATUS_ERROR,
                                    'result': {},
                                    'message': res.__("front.system.something_going_wrong_please_try_again")
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }

                        finalResponse = {
                            'data': {
                                'status': STATUS_SUCCESS,
                                'result': {},
                                'message': res.__("front.review_add_successfully"),
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    });
                }
                else {
                    finalResponse = {
                        'data': {
                            'status': STATUS_SUCCESS,
                            'result': {},
                            'message': res.__("front.review_add_successfully"),
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            }
        });
    }


    /**
     * Function for upload image on booking
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addNoteOrderBooking = async (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let orderId = (req.body.order_id) ? new ObjectId(req.body.order_id) : "";
        let note = (req.body.note) ? req.body.note : "";

        let finalResponse = {};
        if (!userId || !orderId) {

            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let optionObj = {
            conditions: {
                "_id": orderId,
                "user_id": new ObjectId(userId),
            }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderDetail(optionObj);
        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

        if (!bookingDetails) {

            /** Send error response */
            finalResponse = {
                data: {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.order_not_found")
                }
            };
            return returnApiResult(req, res, finalResponse);

        }
        else {

            let notAllowedTypes = [BOOKING_STATUS_COMPLETED, BOOKING_STATUS_CANCELLED];
            if (!notAllowedTypes.includes(bookingDetails.status)) {
                let updateData = {
                    'note': note,
                    'modified': getUtcDate()
                };
                let options = {
                    conditions: { '_id': orderId },
                    updateData: {
                        $set: updateData,
                    }
                };
                /**update order booking */
                OrderModel.updateOrder(req, res, options).then(async updateResponse => {
                    if (updateResponse.status == STATUS_SUCCESS) {
                        finalResponse = {
                            data: {
                                status: STATUS_SUCCESS,
                                result: {},
                                message: res.__("front.order.note_has_been_added_successfully")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    } else {
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.system.something_going_wrong_please_try_again"),
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }
        }
    }


    /**
     * Function for update Booking Status Service Finished
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.FinishBookingService = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let orderItemIds = (req.body.order_item_ids) ? req.body.order_item_ids : [];
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let finalResponse = {};

        if (!userId || !bookingId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**check login user  */
        if (userType != SERVICE_PROVIDER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let convertedOrderItemIds = orderItemIds.map(item => (
            new ObjectId(item._id)  // Convert string _id to ObjectId
        ));

        let optionObj = {
            conditions: {
                "_id": bookingId,
                'service_provider_id': new ObjectId(userId),
                $or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, is_store_order: 1, status: 1, total_selling_amount: 1, area_ids: 1 }
        }

        /**get booking details */
        let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);

        let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
        let isServiceBooking = (bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : false;
        let isSoreBooking = (bookingDetails.is_store_order) ? bookingDetails.is_store_order : false;
        let bookingStatus = bookingDetails.status;

        if (isServiceBooking && (bookingStatus == BOOKING_STATUS_REACHED_LOCATION)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.need_to_start_booking_service_first")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        if (!bookingDetails) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.global.no_record_found")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
        let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
        let totalSellingAmount = (bookingDetails && bookingDetails.total_selling_amount) ? Number(bookingDetails.total_selling_amount) : "";
        let currentDateTime = new Date().toISOString();

        let options = {
            conditions: {
                "_id": bookingId,
                'service_provider_id': new ObjectId(userId),
                $or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
                "order_status": ORDER_PLACED
            },
            updateData: {
                $set: {
                    'status': BOOKING_STATUS_SERVICE_FINISHED,
                    'booking_service_finished_time': currentDateTime,
                    'driver_status': BOOKING_STATUS_SERVICE_FINISHED,
                    'driver_booking_service_finished_time': currentDateTime,
                    'modified': getUtcDate()
                }
            }
        };

        /**update order booking */
        OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {
            if (convertedOrderItemIds.length > 0) {
                let orderItemOption = {
                    conditions: {
                        order_id: bookingId,
                        item_type: ITEM_TYPE_PRODUCT,
                        /* start_delivery: true, */
                    }
                };
                let orderItemResponse = await OrderModel.getOrderItemList(orderItemOption);
                if (orderItemResponse.status == STATUS_ERROR || (orderItemResponse.result && orderItemResponse.result.length == 0)) {
                    /** Send error response */
                    finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.global.no_record_found")
                        }
                    };
                } else {
                    let itemList = [];
                    async.each(orderItemResponse.result, (records) => {
                        let itemType = (records.item_type) ? records.item_type : '';
                        let isDelivered = (records.is_delivered) && records.is_delivered == true ? true : false;
                        if (itemType == ITEM_TYPE_PRODUCT && isDelivered != true) {
                            itemList.push(records._id);

                        }
                    });
                    if (itemList.length == 0) {
                        /** Send error response */
                        finalResponse = {
                            data: {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.global.no_record_found")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                    else {
                        let allExist = convertedOrderItemIds.every(item => itemList.some(listItem => listItem.equals(item)));
                        if (allExist == false) {
                            /** Send error response */
                            finalResponse = {
                                data: {
                                    status: STATUS_ERROR,
                                    result: {},
                                    message: res.__("front.global.no_record_found")
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }
                        let updateData = {
                            'is_delivered': true,
                            'delivered_time': getUtcDate(),

                        };
                        let optionsForUpdateItems = {
                            conditions: {
                                '_id': { $in: convertedOrderItemIds }
                            },
                            updateData: {
                                $set: updateData,
                            },

                        };
                        let updateOrderItemResponse = await OrderModel.updateOrderItems(req, res, optionsForUpdateItems);

                    }
                }
            }

            /* CHECK IF THERE IS NO PRODUCT LEFT FOR DELIVERY AND REFUNDED MARK ORDER AS COMPLETED   */

            let orderItemDetails = await OrderModel.getOrderItemCount({
                conditions: {
                    "order_id": bookingId,
                    'item_type': ITEM_TYPE_PRODUCT,
                    'is_delivered': false,
                }
            });

            let orderItemResultCount = (orderItemDetails.result) ? orderItemDetails.result : 0;

            if ((isSoreBooking == false) || (isSoreBooking == true && orderItemResultCount == 0)) {
                let options = {
                    conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), "order_status": ORDER_PLACED },
                    updateData: {
                        $set: {
                            'status': BOOKING_STATUS_COMPLETED,
                            'booking_complete_time': currentDateTime,
                            'driver_status': BOOKING_STATUS_COMPLETED,
                            'driver_booking_complete_time': currentDateTime,
                            'completed_by': new ObjectId(userId),
                            'modified': getUtcDate()
                        },
                    }
                };

                /**update order booking */
                OrderModel.updateOrderBooking(req, res, options).then(async (updateOrdResponse) => {

                    if (updateOrdResponse.status == STATUS_SUCCESS) {

                        if (totalSellingAmount) {
                            let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1, 'full_name': 1 } });

                            let customerResult = (userDetails.result) ? userDetails.result : "";
                            let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;
                            let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;


                            let valuePerPoint = res.locals.settings["Site.value_per_coin"];

                            let pointsResp = calculatePoints(totalSellingAmount, valuePerPoint, totalBalanceForPoints);
                            let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
                            let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
                            let useOrderNumber = "#" + orderNumber;

                            let pointsOption = {
                                "user_id": new ObjectId(customerId),
                                "order_id": bookingId,
                                "order_number": orderNumber,
                                "points": points,
                                "type": POINT_TYPE_EARNED,
                                "transaction_reason": EARNED_BY_ORDER,
                                "amount_for_single_point": valuePerPoint,
                                "total_user_points": totalUserPoints,
                                "total_selling_amount": totalSellingAmount,
                                "total_balance_for_points": totalBalanceForPoints,
                                "remainder": remainder,
                                "note": res.__("front.user.points_earned_regarding_order_number", useOrderNumber)
                            }
                            /**save points while complete order */
                            await saveUserPoints(req, res, pointsOption);

                            /** Save points stats for user*/
                            await updatePointTransactionLogStats(req, res, {
                                "user_id": userId,
                                "points": points,
                            });

                            let extraParametersObj = {
                                order_id: bookingId,
                                order_number: orderNumber,
                                user_id: new ObjectId(userId),
                                booking_id: bookingId.toString(),
                            }
                            let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
                            let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                            let email = (loginUserData.email) ? loginUserData.email : "";

                            let notificationOptions = {
                                notification_data: {
                                    notification_type: NOTIFICATION_TO_USER_FINISH_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: customerId,
                                    user_ids: [customerId],
                                    parent_table_id: bookingId,
                                    lang_code: langCode,
                                    extra_parameters: extraParametersObj,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await insertNotifications(req, res, notificationOptions);


                            let pushNotificationOptions = {
                                notification_data: {
                                    notification_type: PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                    message_params: [customerName, orderNumber, fullName],
                                    user_id: customerId,
                                    lang_code: langCode,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: userId
                                }
                            };
                            await pushNotification(req, res, pushNotificationOptions);


                            /* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
                            let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
                            let currentDateTime = new Date();
                            let optionObj = {
                                conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                            }

                            FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                                let responseStatus = response.status ? response.status : "";
                                let contractData = response.result ? response.result : "";
                                if (responseStatus == STATUS_SUCCESS && contractData) {

                                    let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                                    if (franchiseId) {
                                        let franchiseNotificationOptions = {
                                            notification_data: {
                                                notification_type: FRANCHISE_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                                message_params: [customerName, orderNumber, fullName],
                                                user_id: franchiseId,
                                                user_ids: [franchiseId],
                                                extra_parameters: extraParametersObj,
                                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                                role_id: FRONT_ADMIN_ROLE_ID,
                                                created_by: userId
                                            }
                                        };

                                        await insertNotifications(req, res, franchiseNotificationOptions);

                                        let franchisePushNotificationOptionsUser = {
                                            notification_data: {
                                                notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
                                                message_params: [customerName, orderNumber, fullName],
                                                user_id: franchiseId,
                                                user_ids: [franchiseId],
                                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                                role_id: FRONT_ADMIN_ROLE_ID,
                                                created_by: userId
                                            }
                                        };
                                        await pushNotification(req, res, franchisePushNotificationOptionsUser);
                                    }
                                }
                            })
                            /* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */




                            let emailOptions = {
                                to: email,
                                action: "user_finish_booking",
                                rep_array: [customerName, orderNumber, fullName],
                            };
                            sendMail(req, res, emailOptions);


                        }




                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                result: {},
                                message: res.__("front.order.service_complete")
                            }
                        };

                        return returnApiResult(req, res, finalResponse);

                    }
                    else {
                        /**send success response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.global.no_record_found"),
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }

            if (updateResponse.status == STATUS_SUCCESS) {
                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: ''
                    }
                };
                return returnApiResult(req, res, finalResponse);

            }
            else {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.global.no_record_found"),
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        });
    }


    /**
       * Function for check Available Time Slot
       *
       * @param req 	As 	Request Data
       * @param res 	As 	Response Data
       * @param next 	As 	Callback argument to the middleware function
       *
       * @return render/json
       */
    this.checkAvailableTimeSlot = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingDate = (req.body.booking_date) ? req.body.booking_date : new Date().toISOString().split('T')[0];
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let timeSlot = (req.body.time_slot) ? req.body.time_slot : "";
        let areaIds = (req.body.area_ids) ? req.body.area_ids : [];

        let finalResponse = {};

        if (!userId || !bookingDate || !timeSlot) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }

        /**check login user  */
        if (userType != CUSTOMER_USER_TYPE) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.you_are_not_allowed_to_access_this_page")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        let options = {
            area_ids: areaIds,
            user_id: userId,
            booking_date: bookingDate,
            time_slot: timeSlot
        };


        checkAvailableTimeSlot(req, res, options).then(async (timeSlotResponse) => {

            let timeSlotResponseResult = (timeSlotResponse.result) ? timeSlotResponse.result : {};
            let message = (timeSlotResponse.message) ? timeSlotResponse.message : "";

            if (timeSlotResponse.status == STATUS_SUCCESS) {
                /**send success response */
                finalResponse = {
                    'data': {
                        status: STATUS_SUCCESS,
                        result: timeSlotResponseResult,
                        message: message
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                /** Send error response **/
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: timeSlotResponseResult,
                        message: message
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

        });
    }


}
module.exports = new OrderBookingController(); 