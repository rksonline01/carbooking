
const { ObjectId } = require("mongodb");
const async = require("async");
const asyncParallel = require("async/parallel");
const OrderModel = require('../model/orderModel');

function dashboard() {


    /**
   * Function for home page data
   * @param req As Request Data
   * @param res As Response Data
   * @param next	As Callback argument to the middleware function
   * @return json
   */
    this.dashboard = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : '';
        let providerType = (loginUserData.provider_type) ? loginUserData.provider_type : '';
        let dateForBooking = (req.body.current_date && req.body.current_date != "") ? req.body.current_date : new Date().toISOString().split('T')[0];

        let currentDate = new Date(dateForBooking);
        let nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        nextDate = nextDate.toISOString().split('T')[0]

        asyncParallel({
            total_services: (callback) => {
                let options = {
                    conditions: {
                        service_provider_id: userId,
                        status: BOOKING_STATUS_COMPLETED,
                        is_service_booking: ACTIVE,
                        provider_type: providerType,
                        booking_service_finished_time: { $gte: dateForBooking, $lt: nextDate }
                    }
                };

                OrderModel.getOrderBookingCount(options).then(async (bookingCountRes) => {
                    let bookingCount = (bookingCountRes.result) ? bookingCountRes.result : 0;
                    callback(null, bookingCount);
                });
            },
            total_earning_amount: (callback) => {
                let options = [
                    {
                        $match: {
                            user_id: userId,
                            provider_type: providerType,
                            date: { $eq: dateForBooking }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            earningAmount: { $sum: "$earning_amount" }
                        }
                    }
                ]
                let optionObj = {
                    conditions: options,
                }

                OrderModel.getProviderEarningAggregateList(req, res, optionObj).then(async (earningResponse) => {
                    let earningAmount = (earningResponse.result[0]) ? earningResponse.result[0].earningAmount : 0;
                    callback(null, earningAmount);
                });
            },
            list: (callback) => {
                let options = [
                    {
                        $match: {
                            service_provider_id: userId,
                            status: BOOKING_STATUS_COMPLETED,
                            is_service_booking: ACTIVE,
                            provider_type: providerType,
                            booking_service_finished_time: { $gte: dateForBooking, $lt: nextDate }
                        }
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
                                        'profile_image': 1
                                    }
                                }
                            ],
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: TABLE_RATING,
                            let: { id: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [{ $eq: ["$booking_id", "$$id"] }]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        '_id': 1,
                                        "rating": 1,
                                        "booking_id": 1,
                                        "review": 1,
                                        "created": 1,
                                        "status": 1,
                                    }
                                }
                            ],
                            as: "ratingDetails"
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
                            "package_details": {
                                "_id": 1,
                                "package_image": 1,
                                "package_name": 1,
                                "car_type": 1,
                                "duration": 1,
                                "price": 1,
                                'package_name': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".package_name", ''] }, then: "$package_details.pages_descriptions." + langCode + ".package_name", else: "$package_details.package_name" } },
                                "slug": 1,

                            },
                            "subscription_details": {
                                '_id': 1,
                                'subscription_image': 1,
                                'subscription_name': 1,
                                'car_type': 1,
                                'duration': 1,
                                'price': 1,
                                'slug': 1,
                                'total_service': 1,
                                'validity_period': 1,
                                'short_description': 1,
                                'description': 1,
                                'subscription_name': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$subscription_details.subscription_name" } },
                                'is_active': 1,
                            },
                            'user_package_id': 1,
                            'user_subscription_id': 1,
                            'is_store_order': 1,
                            'is_service_boratingDetailsoking': 1,
                            'address_detail': 1,
                            'status': 1,
                            'order_status': 1,
                            "modified": 1,
                            "created": 1,
                            'user_name': { $arrayElemAt: ["$userDetails.full_name", 0] },
                            'profile_image': { $arrayElemAt: ["$userDetails.profile_image", 0] },
                            'ratingDetails': { $arrayElemAt: ["$ratingDetails", 0] },
                        }
                    },
                ]
                let optionObj = {
                    conditions: options,
                }

                OrderModel.getBookingAggregateList(req, res, optionObj).then(async (bookingResponse) => {
                    let bookingAmount = (bookingResponse.result) ? bookingResponse.result : 0;
                    callback(null, bookingAmount);
                });
            },
        }, function (err, response) {
            if (err) return next(err);
            let finalResponse = {
                'data': {
                    status: STATUS_SUCCESS,
                    total_services: response.total_services || 0,
                    total_earning_amount: response.total_earning_amount || 0,
                    list: response.list || [],
                    message: "",
                }
            };
            return returnApiResult(req, res, finalResponse);
        });
    }// end dashboard();

}
module.exports = new dashboard();
