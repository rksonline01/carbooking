const async = require('async');
const PromoCodeModel = require("./model/PromoCode");
const CategoryModel = require("../category/model/category");
const PackageModel = require("../package_management/model/Package");
const SubscriptionModel = require("../subscription_management/model/Subscription");
const AreaModel = require("../area_management/model/Area");

const { ObjectId } = require('mongodb');
function PromoCodeController() {
    let exportFilterConditions = {};
    let exportCommonConditions = {};
    let exportSortConditions = { _id: SORT_ASC };
    /**
     * Function to  promo code list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.list = async (req, res, next) => {

        if (isPost(req)) {
            const collection = db.collection(TABLE_PROMO_CODES);
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;

            /** Configure Datatable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {
                let websiteSearch = (req.body.website_id) ? ObjectId(req.body.website_id) : "";
                let commonConditions = {
                    is_deleted: NOT_DELETED,
                };

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else if (formdata.name == "status") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }

                        }

                    })
                    if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created_at"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
                }

                let conditions = [
                    {
                        $facet: {
                            "promo_code_list": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $lookup: {
                                        from: TABLE_ORDERS,
                                        let: { promo_code: "$promo_code" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$order_status", ORDER_PLACED] },
                                                            { $eq: ["$promo_code_detail.promo_code", "$$promo_code"] },
                                                            { $ne: ["$status", BOOKING_STATUS_CANCELLED] },
                                                            { $ne: ["$promo_code_detail", null] }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                $count: "total_orders"
                                            }
                                        ],
                                        as: "promoCodeOrderCount"
                                    }
                                },
                                { $sort: dataTableConfig.sort_conditions },
                                { $skip: skip },
                                { $limit: limit },
                                {
                                    $project: {
                                        _id: 1,
                                        code_description: 1,
                                        code_valid_from: 1,
                                        code_valid_to: 1,
                                        code_discount_type: 1,
                                        discount_percent: 1,
                                        discount_value: 1,
                                        promo_code: 1,
                                        modified: 1,
                                        status: 1,
                                        unlimited: 1,
                                        quantity: 1,
                                        used_quantity: 1,
                                        created_at: 1,
                                        promoCodeOrderCount: { $ifNull: [{ $arrayElemAt: ["$promoCodeOrderCount.total_orders", 0] }, 0] }
                                    }
                                },


                            ],
                            "promo_code_all_count": [
                                { $match: dataTableConfig.conditions },
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
                            "promo_code_filter_count": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 }
                                    }
                                },
                                {
                                    $project: { count: 1, _id: 0 }
                                }
                            ]
                        }
                    }
                ];

                let optionObj = {
                    conditions: conditions
                }

                PromoCodeModel.getPromocodeAggregateList(req, res, optionObj).then(promoCodeResponse => {
                    let responseStatus = (promoCodeResponse.status) ? promoCodeResponse.status : "";
                    let responseResult = (promoCodeResponse.result && promoCodeResponse.result[0]) ? promoCodeResponse.result[0] : "";
                    let promo_code_list = (responseResult && responseResult.promo_code_list) ? responseResult.promo_code_list : [];

                    let promo_code_all_count = (responseResult && responseResult.promo_code_all_count && responseResult.promo_code_all_count[0] && responseResult.promo_code_all_count[0]["count"]) ? responseResult.promo_code_all_count[0]["count"] : DEACTIVE;

                    let promo_code_filter_count = (responseResult && responseResult.promo_code_filter_count && responseResult.promo_code_filter_count[0] && responseResult.promo_code_filter_count[0]["count"]) ? responseResult.promo_code_filter_count[0]["count"] : DEACTIVE;

                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: promo_code_list,
                        recordsTotal: promo_code_all_count,
                        recordsFiltered: promo_code_filter_count,
                    });
                })


            });
        } else {
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS['admin/promo_code/list']);
            res.render("list", {

            });
        }
    };//End list()

    /**
     * Function for add or edit promo code's detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addEditPromoCode = async (req, res, next) => {
        let isEditable = (req.params.id) ? true : false;
        let language        =   (req.session.lang)  ?   req.session.lang            : DEFAULT_LANGUAGE_CODE;
        if (isPost(req)) {
            /** Sanitize Data */
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            req.user_data = (req.session.user) ? req.session.user : "";
            req.body.id = (req.params.id) ? req.params.id : "";

            req.body.isEditable = isEditable;
            const fromdate = new Date(req.body.code_valid_from + " 00:00");
            const todate = new Date(req.body.code_valid_to + " 23:59");
            isEditable = req.body.isEditable;
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

            let promoCode = (req.body.promo_code) ? req.body.promo_code : "";
            let discountValue = (req.body.discount_value) ? req.body.discount_value : "";
            let couponsValidFrom = (req.body.code_valid_from) ? getUtcDate(fromdate) : "";
            let couponsValidTo = (req.body.code_valid_to) ? getUtcDate(todate) : "";
            let statusVal = (req.body.status) ? Number(req.body.status) : Number(ACTIVE);
            let code_description = (req.body.code_description) ? req.body.code_description : "";
            let code_discount_type = (req.body.code_discount_type) ? req.body.code_discount_type : "";
            let discount_percent = (req.body.discount_percent) ? req.body.discount_percent : "";
            let min_order_value = (req.body.min_order_value) ? req.body.min_order_value : "";
            let max_discount_amount = (req.body.max_discount_amount) ? req.body.max_discount_amount : "";
            let code_type = (req.body.code_type) ? req.body.code_type : '';
            let search_users = (req.body.search_users) ? req.body.search_users : '';
            let quantity = (req.body.quantity) ? Number(req.body.quantity) : '';
            let weekDays = (req.body.week_days) ? req.body.week_days : '';
            let startHours = (req.body.start_hours) ? req.body.start_hours : '';
            let endHours = (req.body.end_hours) ? req.body.end_hours : '';
            let categoryIdsArray = (req.body.category_id) ? req.body.category_id : [];
            let packageIdsArray = (req.body.package_id) ? req.body.package_id : [];
            let subscriptionIdsArray = (req.body.subscription_id) ? req.body.subscription_id : [];
            let areaIdsArray = (req.body.area_id) ? req.body.area_id : [];
            let cuponType = (req.body.cupon_type) ? req.body.cupon_type : '';
            let unlimited = (req.body.unlimited && req.body.unlimited == 'true') ? true : false;

            if (req.body.unlimited == 'true') {
                quantity = "";
            }

            let selectEmails = [];
            if (code_type == COUPON_TYPE_USER_SPECIFIC) {
                let selectUsers = search_users.split(",");
                selectUsers.map((user, index) => {
                    if (selectUsers.length - 1 != index) {
                        let userARR = user.split("-");
                        selectEmails.push(userARR[1]);
                    }
                })
            }

            var categoryIds = [];
            if (categoryIdsArray.length > 0) {
                categoryIdsArray.map(recordsIds => {
                    categoryIds.push(new ObjectId(recordsIds));
                });
            }


            var packageIds = [];
            if (packageIdsArray.length > 0) {
                packageIdsArray.map(recordsIds => {
                    packageIds.push(new ObjectId(recordsIds));
                });
            }

            var subscriptionIds = [];
            if (subscriptionIdsArray.length > 0) {
                subscriptionIdsArray.map(recordsIds => {
                    subscriptionIds.push(new ObjectId(recordsIds));
                });
            }

            var areaIds = [];
            if (areaIdsArray.length > 0) {
                areaIdsArray.map(recordsIds => {
                    areaIds.push(new ObjectId(recordsIds));
                });
            }


            



            let optionObj = {
                insertData: {
                    promo_code: promoCode,
                    code_discount_type: code_discount_type,
                    discount_value: Number(discountValue),
                    discount_percent: Number(discount_percent),
                    min_order_value: Number(min_order_value),
                    max_discount_amount: Number(max_discount_amount),
                    code_type: code_type,
                    code_valid_from: couponsValidFrom,
                    code_valid_to: couponsValidTo,
                    is_deleted: DEACTIVE,
                    created: getUtcDate(),
                    modified: getUtcDate(),
                    status: statusVal,
                    code_description: code_description,
                    selected_users: selectEmails,
                    quantity: quantity,
                    week_days: weekDays,
                    start_hours: startHours,
                    end_hours: endHours,
                    category_id: categoryIds,
                    package_id: packageIds,
                    subscription_id: subscriptionIds,
                    area_id: areaIds,
                    cupon_type: cuponType,
                    unlimited: unlimited
                }
            }
            if (isEditable === false) {
                PromoCodeModel.savePromoCode(req, res, optionObj).then(saveResult => {
                    let responseStatus = (saveResult.status) ? saveResult.status : "";
                    if (responseStatus == STATUS_ERROR) {
                        /** Send error response **/
                        res.send({
                            status: STATUS_ERROR,
                            message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                        });
                    } else {
                        /** Send success response */
                        req.flash('success', res.__("admin.promocode_has_been_save_successfully"));
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + 'promo_codes',
                            message: res.__("admin.promocode_has_been_save_successfully")
                        });
                    }
                })
            } else {
                let promoCodeId = (req.params.id) ? new ObjectId(req.params.id) : new ObjectId();
                let conditionsObj = { _id: promoCodeId };
                let updateRecordObj = {
                    $set: {
                        code_discount_type: code_discount_type,
                        discount_value: Number(discountValue),
                        discount_percent: Number(discount_percent),
                        min_order_value: Number(min_order_value),
                        max_discount_amount: Number(max_discount_amount),
                        code_type: code_type,
                        code_valid_from: couponsValidFrom,
                        code_valid_to: couponsValidTo,
                        is_deleted: DEACTIVE,
                        modified: getUtcDate(),
                        code_description: code_description,
                        selected_users: selectEmails,
                        quantity: quantity,
                        week_days: weekDays,
                        start_hours: startHours,
                        end_hours: endHours,
                        category_id: categoryIds,
                        package_id: packageIds,
                        subscription_id: subscriptionIds,
                        area_id: areaIds,
                        cupon_type: cuponType,
                        unlimited: unlimited
                    }
                }
                let optionObj = {
                    conditions: conditionsObj,
                    updateData: updateRecordObj,
                }
                PromoCodeModel.updateOnePromoCode(req, res, optionObj).then(updateResult => {
                    let responseStatus = (updateResult.status) ? updateResult.status : "";
                    if (responseStatus == STATUS_ERROR) {
                        /** Send error response **/
                        res.send({
                            status: STATUS_ERROR,
                            message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                        });
                    } else {
                        /** Send success response **/
                        req.flash("success", res.__("admin.promo_codes.promo_codes_details_has_been_updated_successfully"));
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + "promo_codes",
                            message: res.__("admin.promo_codes.promo_codes_details_has_been_updated_successfully"),
                        });
                    }
                })
            }

        } else {

            let detailResponse = {};
            if (isEditable) {
                /** Get promo code details **/
                detailResponse = await getPromoCodeDetails(req, res, next);

                if (detailResponse.status != STATUS_SUCCESS) {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, detailResponse.message);
                    res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                    return;
                }
            }

            let promoCodeDetails = (detailResponse.result) ? detailResponse.result : {};
            // let selectedCategoryId = (promoCodeDetails && promoCodeDetails.category_id) ? promoCodeDetails.category_id : [];
            // let selectedPackagesId = (promoCodeDetails && promoCodeDetails.package_id) ? promoCodeDetails.package_id : [];
            // let selectedSubscriptionId = (promoCodeDetails && promoCodeDetails.subscription_id) ? promoCodeDetails.subscription_id : [];



            const asyncParallel = require("async/parallel");
            asyncParallel({
                categories: (callback) => {

                    let conditions = {                      
                        status: ACTIVE,
                    }
                    let sort_conditions = {
                        category_name: SORT_ASC
                    }                    

                    let categoryOptionObj = {
                        conditions: conditions,
                        sort_conditions: sort_conditions,
                        
                    }

                    CategoryModel.getCategoriesList(categoryOptionObj).then(categoryResponse => {

                        let categoryResponseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                        if (categoryResponseStatus == STATUS_ERROR) {
                            callback(null, letcategoryResponseStatus);
                        }

                        let categoryResponseResult = (categoryResponse.result) ? categoryResponse.result : "";
                        callback(null, categoryResponseResult);
                    })

                },
                packages: (callback) => {

                    let conditions = {
                        is_deleted:DEACTIVE,
                        is_active: ACTIVE,
                    }
                    let sort_conditions = {
                        package_name: SORT_ASC
                    }
                    let fields = {
                        _id			    :	1,
                        package_name	:	1,
                    };
                    let packageOptionObj = {
                        conditions: conditions,
                        sort_conditions: sort_conditions, 
                        fields:fields                       
                    }
                    PackageModel.getAllPackageList(req, res,packageOptionObj).then(packageResponse => {
                        let packageResponseStatus = (packageResponse.status) ? packageResponse.status : "";
                        if (packageResponseStatus == STATUS_ERROR) {
                            callback(null, letcategoryResponseStatus);
                        }
                        let packageResponseResult = (packageResponse.result) ? packageResponse.result : "";
                        callback(null, packageResponseResult);
                    })
                },
                subscriptions: (callback) => {

                    let conditions = {
                        is_deleted:DEACTIVE,
                        is_active: ACTIVE,
                    }
                    let sort_conditions = {
                        subscription_name: SORT_ASC
                    }
                    let fields = {
                        _id			    :	1,
                        subscription_name	:	1,
                    };
                    let subscriptionOptionObj = {
                        conditions: conditions,
                        sort_conditions: sort_conditions, 
                        fields:fields                       
                    }
                  
                    SubscriptionModel.getAllSubscriptionList(req, res,subscriptionOptionObj).then(subscriptionResponse => {
                        let subscriptionResponseStatus = (subscriptionResponse.status) ? subscriptionResponse.status : "";
                        if (subscriptionResponseStatus == STATUS_ERROR) {
                            callback(null, letcategoryResponseStatus);
                        }
                        let subscriptionResponseResult = (subscriptionResponse.result) ? subscriptionResponse.result : "";
                        callback(null, subscriptionResponseResult);
                    })
                },
                areas: (callback) => {

                    let conditions = {
                        is_deleted:DEACTIVE,
                        status: ACTIVE,
                    }
                    let sort_conditions = {
                        title: SORT_ASC
                    }
                    let fields = {
                        _id			    :	1,
                        title	:	1,
                    };
                    let areaOptionObj = {
                        conditions: conditions,
                        sort_conditions: sort_conditions, 
                        fields:fields                       
                    }
                  
                    AreaModel.getAllAreaList(req, res,areaOptionObj).then(areaResponse => {
                        let areaResponseStatus = (areaResponse.status) ? areaResponse.status : "";
                        if (areaResponseStatus == STATUS_ERROR) {
                            callback(null, letcategoryResponseStatus);
                        }
                        let areaResponseResult = (areaResponse.result) ? areaResponse.result : "";
                        callback(null, areaResponseResult);
                    })
                },
            }, (error, response) => {              

             let categories = (response.categories) ? response.categories : [];
             let packages = (response.packages) ? response.packages : [];
             let subscriptions = (response.subscriptions) ? response.subscriptions : [];
             let areas = (response.areas) ? response.areas : [];            

                if (!isEditable) {
                    /** Render add page **/
                    req.breadcrumbs(BREADCRUMBS["admin/promo_code/add"]);
                    res.render("add_edit", {                       
                        'categories':categories,
                        'packages':packages,
                        'subscriptions':subscriptions,
                        'areas':areas

                    });
                } else {
                    req.breadcrumbs(BREADCRUMBS["admin/promo_code/edit"]);
                    res.render("add_edit", {
                        'result': promoCodeDetails,
                        'is_editable': isEditable,                                             
                        'categories':categories,
                        'packages':packages,
                        'subscriptions':subscriptions,
                        'areas':areas
                    });

                }

          
        });
            // }).catch(next);

        }
    };//End addEditPromoCode()

    /**
     * Function to get promo code detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return json
     */
    let getPromoCodeDetails = (req, res, next) => {
        return new Promise(resolve => {

            let promocodeId = (req.params.id) ? new ObjectId(req.params.id) : "";
            /** Get promo code details **/
            let aggereCondition = [
                {
                    $match: { '_id': promocodeId }
                },
                {
                    $lookup: {
                        from: TABLE_USERS,
                        let: { selectedEmails: "$selected_users" },
                        pipeline: [
                            {
                                '$match':
                                {
                                    '$expr': {
                                        '$and': [
                                            { '$in': ['$email', '$$selectedEmails'] },
                                        ]
                                    },
                                }
                            },
                            {
                                $project: {
                                    _id: 1, email: 1, full_name: 1
                                }
                            }
                        ],
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: TABLE_CATEGORIES,
                        let: { categoryId: "$category_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        '$and': [
                                            { '$in': ['$_id', '$$categoryId'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1, category_name: 1
                                }
                            }
                        ],
                        as: "categoryDetails"
                    }
                },
                {
                    $lookup: {
                        from: TABLE_PACKAGES,
                        let: { packageId: "$package_id" },
                        pipeline: [
                            {
                                '$match':
                                {
                                    '$expr': {
                                        '$and': [
                                            { '$in': ['$_id', '$$packageId'] },
                                        ]
                                    },
                                }
                            },
                            {
                                $project: {
                                    _id: 1, package_name: 1
                                }
                            }
                        ],
                        as: "packageDetails"
                    }
                },
                {
                    $lookup: {
                        from: TABLE_SUBSCRIPTIONS,
                        let: { subscriptionId: "$subscription_id" },
                        pipeline: [
                            {
                                '$match':
                                {
                                    '$expr': {
                                        '$and': [
                                            { '$in': ['$_id', '$$subscriptionId'] },
                                        ]
                                    },
                                }
                            },
                            {
                                $project: {
                                    _id: 1, subscription_name: 1
                                }
                            }
                        ],
                        as: "subscriptionDetails"
                    }
                },

            ];

            let option = {
                conditions: aggereCondition
            }

            PromoCodeModel.getPromocodeAggregateList(req, res, option).then(response => {
                let result = (response.result) ? response.result : [];
                if (result.length > 0) {
                    let codeDetail = result[0];
                    let selectedUsers = (codeDetail.userDetails) ? codeDetail.userDetails : [];

                    let selectedUserEmail = [];
                    if (selectedUsers.length > 0) {
                        selectedUsers.map(user => {
                            selectedUserEmail.push(user.full_name + '-' + user.email);
                        })
                    }

                    codeDetail['selected_user_email'] = selectedUserEmail;

                    let response = {
                        status: STATUS_SUCCESS,
                        result: codeDetail
                    };
                    return resolve(response);
                } else {
                    /** Send error response */
                    let response = {
                        status: STATUS_ERROR,
                        message: res.__("admin.system.invalid_access")
                    };
                    return resolve(response);
                }
            })
        });
    };// End getPromoCodeDetails()

    /**
     * Function for view promo code's detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.view = (req, res, next) => {
        /** Get promo code details **/

        getPromoCodeDetails(req, res, next).then(response => {
            if (response.status != STATUS_SUCCESS) {
                /** Send error response **/
                req.flash(STATUS_ERROR, response.message);
                res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                return;
            }

            /** Render edit page **/
            req.breadcrumbs(BREADCRUMBS["admin/promo_code/view"]);
            res.render("view", {
                result: (response.result) ? response.result : {},
            });
        }).catch(next);



    };//End view()

    /**
     * Function for update promo code status
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.updatePromoCodeStatus = function (req, res, next) {
        var promoId = req.params.id;
        var promoStatus = (req.params.status == PROMO_CODE_PUBLISHED) ? PROMO_CODE_UNPUBLISHED : PROMO_CODE_PUBLISHED;
        if (promoId) {

            let condition = {
                _id: new ObjectId(promoId)
            };

            let updateData = {
                status: promoStatus,
                modified: getUtcDate(),
                updated_by: new ObjectId(req.session.user._id)
            }

            let updateOption = {
                conditions: condition,
                updateData: { $set: updateData }
            }

            PromoCodeModel.updateOnePromoCode(req, res, updateOption).then(promoResponse => {
                if (promoResponse.status == STATUS_SUCCESS) {
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, res.__("admin.promo_code.status_updated_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                } else {
                    /** Send success response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                }
            })

        } else {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
            return;
        }
    };//End updatePromoCodeStatus()

    /**
     * Function for delete promo code
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.deletePromoCode = function (req, res, next) {
        var promoId = req.params.id;
        if (promoId) {
            let condition = {
                _id: new ObjectId(promoId)
            };

            let updateData = {
                is_deleted: DELETED,
                deleted_by: new ObjectId(req.session.user._id),
                modified: getUtcDate(),
            }

            let updateOption = {
                conditions: condition,
                updateData: { $set: updateData }
            }

            PromoCodeModel.updateOnePromoCode(req, res, updateOption).then(promoResponse => {
                if (promoResponse.status == STATUS_SUCCESS) {
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, res.__("admin.promo_code.promo_code_deleted_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                } else {
                    /** Send success response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
                }
            })
        } else {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "promo_codes");
            return;
        }

    };//End deletePromoCode()

    /**
    * Function for delete promo code
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return null
    */
    this.getRandomCode = async (req, res) => {
        let options = {
            srting_length: 9
        }
        let randomStringDetails = await getRandomString(req, res, options);
        let randomstring = randomStringDetails.result;
        res.send({
            status: STATUS_SUCCESS,
            result: randomstring
        });
    }



}
module.exports = new PromoCodeController();
