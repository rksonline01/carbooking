const { ObjectId } = require('mongodb');
var async = require('async');
const SubscriptionModel = require("../../../admin/subscription_management/model/Subscription");

function Subscription() {


    /**
     * Function for get Subscription list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getSubscriptionList = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;
        let carType = (req.body.car_type) ? req.body.car_type : "";

        if (carType == "") {
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
                is_deleted: NOT_DELETED,
                is_active: ACTIVE,
                car_type: carType
            };

            /** subscription list condition */
            let conditions = [
                {
                    $facet: {
                        "subscription_list": [
                            { $match: commonConditions },
                            { $sort: { "created": SORT_DESC } },
                            { $skip: skip },
                            { $limit: limit },
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
									mrp_price : 1,
									offer_price : 1,
									offer_type : 1,
									vat_included : 1,
                                    slug: 1,
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

            SubscriptionModel.getAggregateSubscriptionList(req, res, optionObj).then(subscriptionRes => {
                let responseStatus = (subscriptionRes.status) ? subscriptionRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {
                    let responseResult = (subscriptionRes.result && subscriptionRes.result[0]) ? subscriptionRes.result[0] : "";

                    let subscriptionList = (responseResult && responseResult.subscription_list) ? responseResult.subscription_list : [];
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
                            car_type_dropdown: CAR_TYPE_DROPDOWN,                           
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
                            image_url: SUBSCRIPTION_URL,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

            });
        }

    }


    /**
     * Function for get Subscription Detail 
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getSubscriptionDetail = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.subscription_slug) ? req.body.subscription_slug : "";
        let finalResponse = {};
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        if (slug == "") {
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
                conditions: { slug: slug, is_active: ACTIVE, is_deleted: NOT_DELETED },
                fields: {
                    id: 1,
                    subscription_image: 1,
                    subscription_video: 1,
                    subscription_name: 1,
                    car_type: 1,
                    duration: 1,
					provider_type: 1,
                    price: 1,
					mrp_price : 1,
					offer_price : 1,
					offer_type : 1,
					vat_included : 1,
                    slug: 1,
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
                }
            }

            SubscriptionModel.getSubscriptionFindOne(optionObj).then(subscriptionRes => {
                let subscriptionDetails = (subscriptionRes.result) ? subscriptionRes.result : "";

                if (!subscriptionDetails) {
                    /** Send error response */
                    finalResponse = {
                        data: {
                            status: STATUS_ERROR,
                            result: {},
                            image_url: SUBSCRIPTION_URL,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }

                /** Send error response */
                finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: subscriptionDetails,
                        image_url: SUBSCRIPTION_URL,
						car_type_dropdown: CAR_TYPE_DROPDOWN,						
                        message: ""
                    }
                };
                return returnApiResult(req, res, finalResponse);
            });

        }

    }// End getPackageDetail()

}

module.exports = new Subscription();