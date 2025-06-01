const CompanyModel = require("./model/companyModel");
const B2BDiscountModel = require("./model/b2bDiscountModel");
const CategoryModel = require("../category/model/category");
const PackageModel = require("../package_management/model/Package");
const SubscriptionModel = require("../subscription_management/model/Subscription");
const asyncParallel = require("async/parallel");
const UserModel = require("./../users/model/user");
const { ObjectId } = require('mongodb');
const clone = require('clone');


function Company() {

    let exportCompanyCommonConditions = {};
    let exportB2BDiscountConditions = {};
    let exportB2BDiscountEmployeeConditions = {};


    /**
     * Function to get Company list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getCompanyList = (req, res, next) => {
        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let search_data = req.body.search_data;

            /** Configure Datatable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                exportCompanyCommonConditions = dataTableConfig.conditions;

                let commoncondition = {
                    is_deleted: NOT_DELETED
                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commoncondition);
 
                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "is_active") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }
                    })
                }

                let conditions = [
                    {
                        $facet: {
                            "list": [
                                {
                                    $match: dataTableConfig.conditions
                                },								
								{
                                    $lookup: {
                                        from: TABLE_USERS,
                                        let: { company_id: "$_id" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
															{ $eq: ["$company_id", "$$company_id"] },
                                                            { $eq: ["$is_deleted", NOT_DELETED] }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                $count: "b2bEmployeeCount"
                                            }
                                        ],
                                        as: "b2bEmployeeCount"
                                    }
                                },
								{
                                    $lookup: {
                                        from: TABLE_B2B_DISCOUNT,
                                        let: { company_id: "$_id" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
															{ $eq: ["$company_id", "$$company_id"] },
                                                            { $eq: ["$is_deleted", NOT_DELETED] }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                $count: "b2bCodeCount"
                                            }
                                        ],
                                        as: "b2bCodeCount"
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1, image: 1, is_active: 1, is_deleted: 1, created: 1, company_name: 1, contact_person_name: 1, contact_person_email: 1, contact_person_phone: 1,
										b2bCodeCount: { $ifNull: [{ $arrayElemAt: ["$b2bCodeCount.b2bCodeCount", 0] }, 0] },
										b2bEmployeeCount: { $ifNull: [{ $arrayElemAt: ["$b2bEmployeeCount.b2bEmployeeCount", 0] }, 0] },
                                    }
                                },
                                {
                                    $sort: dataTableConfig.sort_conditions
                                },
                                { $skip: skip },
                                { $limit: limit },
                            ],
                            "all_count": [
                                {
                                    $match: commoncondition
                                },
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
                            "filter_count": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $count: {} }
                                    }
                                },
                                {
                                    $project: { _id: 0, count: 1 }
                                }
                            ]
                        }
                    }
                ];

                let optionObj = {
                    conditions: conditions
                }

                CompanyModel.getAggregateCompanyList(req, res, optionObj).then(companyResponse => {
                    let responseStatus = (companyResponse.status) ? companyResponse.status : "";
                    let responseResult = (companyResponse.result && companyResponse.result[0]) ? companyResponse.result[0] : "";

                    let list = (responseResult && responseResult.list) ? responseResult.list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
					
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })

            });
        } else {
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS['admin/company_management/list']);
            res.render('list', {
                image_url: COMPANY_URL
            });
        }
    };//End getCompanyList()


    /**
     * Function for addCompany
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addCompany = (req, res, next) => {
        convertMultipartFormData(req, res).then(() => {
            if (isPost(req)) {

                /** Sanitize Data */
                req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
                if (req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '') {
                    /** Send error response */
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }

                let allData = req.body;
                req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
                req.body.contact_person_email = allData.contact_person_email;
                req.body.contact_person_phone = allData.contact_person_phone;
                let companyName = (req.body.company_name) ? req.body.company_name : "";
                let contactPersonName = (req.body.contact_person_name) ? req.body.contact_person_name : "";
                let contactPersonEmail = (req.body.contact_person_email) ? req.body.contact_person_email : "";
                let contactPersonPhone = (req.body.contact_person_phone) ? req.body.contact_person_phone : "";


                /** parse Validation array  */
                var errMessageArray = [];
                asyncParallel({
                    upload_logo: (callback) => {
                        /** Set options for upload image **/
                        let image = (req.files && req.files.image) ? req.files.image : "";
                        let options = {
                            'image': image,
                            'filePath': COMPANY_FILE_PATH
                        };

                        moveUploadedFile(req, res, options)
                            .then(response => {
                                if (response.status == STATUS_ERROR) {
                                    errMessageArray.push({ 'path': 'image', 'msg': response.message });
                                    return callback(true, null);
                                }
                                let imageName = response.fileName || '';
                                callback(null, imageName);
                            })
                    },

                    upload_contract_file: (callback) => {
                        /** Set options for upload contract file **/
                        let contractFile = (req.files && req.files.contract_file) ? req.files.contract_file : "";
                        let options = {
                            image: contractFile,
                            filePath: COMPANY_FILE_PATH,
                            allowedExtensions: ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS,
                            allowedImageError: ALLOWED_CONTRACT_DOCUMENT_ERROR_MESSAGE,
                            allowedMimeTypes: ALLOWED_CONTRACT_DOCUMENT_MIME_EXTENSIONS,
                            allowedMimeError: ALLOWED_CONTRACT_DOCUMENT_MIME_ERROR_MESSAGE,
                        };

                        moveUploadedFile(req, res, options)
                            .then(response => {
                                if (response.status == STATUS_ERROR) {
                                    errMessageArray.push({ 'path': 'contract_file', 'msg': response.message });
                                    return callback(true, null);
                                }
                                let fileName = response.fileName || '';
                                callback(null, fileName);
                            })
                    },

                    get_slug: (callback) => {
                        /** Set slug options **/
                        let slugOptions = {
                            title: companyName,
                            table_name: TABLE_COMPANY,
                            slug_field: "company_name"
                        };

                        getDatabaseSlug(slugOptions)
                            .then(slugResponse => {
                                callback(null, slugResponse.title);
                            })
                    }
                }, (asyncErr, asyncRes) => {
                    if (asyncErr && errMessageArray.length > 0) {
                        /** Send error response **/
                        return res.send({
                            status: STATUS_ERROR,
                            message: errMessageArray,
                        });
                    }

                    let imageName = asyncRes.upload_logo || '';
                    let fileName = asyncRes.upload_contract_file || '';
                    let slug = asyncRes.get_slug || '';

                    let insertData = {
                        slug: slug,
                        company_name: companyName,
                        contact_person_name: contactPersonName,
                        contact_person_email: contactPersonEmail,
                        contact_person_phone: contactPersonPhone,
                        image: imageName,
                        contract_file: fileName,
                        default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
                        pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
                        is_deleted: NOT_DELETED,
                        is_active: ACTIVE,
                        created: getUtcDate(),
                        modified: getUtcDate()
                    }

                    let options = {
                        insertData: insertData
                    }

                    CompanyModel.addCompanyData(req, res, options).then(companyResponse => {
                        if (companyResponse.status == STATUS_SUCCESS) {
                            req.flash(STATUS_SUCCESS, res.__("admin.company.company_has_been_added_successfully"));
                            res.send({
                                status: STATUS_SUCCESS,
                                redirect_url: WEBSITE_ADMIN_URL + 'company_management',
                                message: res.__("admin.company.company_has_been_added_successfully")
                            });
                        } else {
                            /** Send error response **/
                            req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                            res.redirect(WEBSITE_ADMIN_URL + 'company_management/add');
                            return;
                        }
                    })
                })

            } else {

                /** Get language list */
                getLanguages().then(languageList => {
                    req.breadcrumbs(BREADCRUMBS['admin/company_management/add']);
                    /**Render add company page */
                    res.render('add', {
                        language_list: languageList
                    });
                }).catch(next);
            }
        });
    }


    /**
     * Function to update company detail
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editCompany = (req, res, next) => {
        let companyId = (req.params.id) ? req.params.id : "";
        convertMultipartFormData(req, res).then(() => {
            if (isPost(req)) {

                req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

                if (req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '') {
                    /** Send error response */
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }

                let allData = req.body;
                req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
                req.body.old_image = allData.old_image;
                let oldimage = (req.body.old_image) ? req.body.old_image : "";
                req.body.contact_person_email = allData.contact_person_email;
                req.body.contact_person_phone = allData.contact_person_phone;
                let companyName = (req.body.company_name) ? req.body.company_name : "";
                let contactPersonName = (req.body.contact_person_name) ? req.body.contact_person_name : "";
                let contactPersonEmail = (req.body.contact_person_email) ? req.body.contact_person_email : "";
                let contactPersonPhone = (req.body.contact_person_phone) ? req.body.contact_person_phone : "";
                let image = (req.files && req.files.image) ? req.files.image : "";
                let contractFile = (req.files && req.files.contract_file) ? req.files.contract_file : "";

                var errMessageArray = [];
                asyncParallel({
                    upload_logo: (callback) => {
                        if (!image) return callback(null, null);
                        /** Set options for upload image **/
                        let options = {
                            'image': image,
                            'filePath': COMPANY_FILE_PATH,
                            'oldPath': oldimage
                        };

                        moveUploadedFile(req, res, options).then(response => {
                            if (response.status == STATUS_ERROR) {
                                errMessageArray.push({ 'path': 'image', 'msg': response.message });
                                return callback(true, null);
                            }
                            let imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';

                            callback(null, imageName)
                        })
                    },
                    upload_contract_file: (callback) => {
                        if (!contractFile) return callback(null, null);

                        /** Set options for upload image **/
                        let options = {
                            image: contractFile,
                            filePath: COMPANY_FILE_PATH,
                            allowedExtensions: ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS,
                            allowedImageError: ALLOWED_CONTRACT_DOCUMENT_ERROR_MESSAGE,
                            allowedMimeTypes: ALLOWED_CONTRACT_DOCUMENT_MIME_EXTENSIONS,
                            allowedMimeError: ALLOWED_CONTRACT_DOCUMENT_MIME_ERROR_MESSAGE,
                        };

                        moveUploadedFile(req, res, options).then(response => {
                            if (response.status == STATUS_ERROR) {
                                errMessageArray.push({ 'path': 'contract_file', 'msg': response.message });
                                return callback(true, null);
                            }
                            let fileName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';

                            callback(null, fileName)
                        })
                    }
                }, (asyncErr, asyncRes) => {
                    if (asyncErr && errMessageArray.length > 0) {
                        /** Send error response **/
                        return res.send({
                            status: STATUS_ERROR,
                            message: errMessageArray,
                        });
                    }


                    let imageName = asyncRes.upload_logo || '';
                    let fileName = asyncRes.upload_contract_file || '';

                    /** Update slider record */
                    let updateData = {
                        company_name: companyName,
                        contact_person_name: contactPersonName,
                        contact_person_email: contactPersonEmail,
                        contact_person_phone: contactPersonPhone,
                        default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
                        pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
                        modified: getUtcDate()
                    }

                    if (imageName) updateData['image'] = imageName;
                    if (fileName) updateData['contract_file'] = fileName;

                    let updateCondition = {
                        _id: new ObjectId(companyId)
                    };

                    let options = {
                        conditions: updateCondition,
                        updateData: { $set: updateData }
                    }

                    CompanyModel.updateOneCompany(req, res, options).then(updateResponse => {
                        if (updateResponse.status == STATUS_SUCCESS) {
                            req.flash(STATUS_SUCCESS, res.__("admin.company.company_has_been_updated_successfully"));
                            res.send({
                                status: STATUS_SUCCESS,
                                redirect_url: WEBSITE_ADMIN_URL + 'company_management',
                                message: res.__("admin.company.company_has_been_updated_successfully"),
                            });
                        } else {
                            let message = res.__("admin.system.something_going_wrong_please_try_again");
                            req.flash(STATUS_ERROR, message);
                            res.redirect(WEBSITE_ADMIN_URL + 'company_management/edit');
                            return;
                        }
                    });
                })
            } else {
                /** Get language list **/
                getLanguages().then(languageList => {

                    let detailConditions = {
                        _id: new ObjectId(companyId)
                    };
                    let options = {
                        conditions: detailConditions
                    }

                    CompanyModel.CompanyDetails(req, res, options).then(companyResponse => {
                        if (companyResponse == STATUS_ERROR) {
                            /** Send error response **/
                            req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                            res.redirect(WEBSITE_ADMIN_URL + "company");

                        } else {

                            let details = (companyResponse.result) ? companyResponse.result : {};
                            let companyImage = (details.image) ? details.image : "";

                            /** Render edit page **/
                            req.breadcrumbs(BREADCRUMBS["admin/company/edit"]);
                            res.render('edit', {
                                result: details,
                                image_url: COMPANY_URL,
                                company_image: companyImage,
                                language_list: languageList,
                            });
                        }
                    })
                })
            }
        });
    }


    /**
     * Function for update company's status
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return null
     */
    this.updateCompanyStatus = (req, res, next) => {
        let companyStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";
        let companyId = (req.params.id) ? req.params.id : "";

        if (!companyId || !statusType || (statusType != ACTIVE_INACTIVE_STATUS)) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "company_management/list");
            return;
        } else {

            /** Set update data **/
            let updateData = {
                $set: {
                    modified: getUtcDate()
                }
            };

            if (statusType == ACTIVE_INACTIVE_STATUS) {
                updateData["$set"]["is_active"] = (companyStatus == ACTIVE) ? DEACTIVE : ACTIVE;
            }

            let condition = {
                _id: new ObjectId(companyId)
            }

            let optionObj = {
                conditions: condition,
                updateData: updateData
            }

            CompanyModel.updateOneCompany(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.company.company_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + "company_management");

                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + "company_management");
                }
            });

        }

    };//End updateCompanyStatus()


    /**
    * Function to get  B2B Discount  list
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    this.getB2BDiscountList = (req, res, next) => {
        let companyId = (req.params.companyid) ? req.params.companyid : "";
        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let search_data = req.body.search_data;

            /** Configure Datatable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                exportB2BDiscountConditions = dataTableConfig.conditions;

                let commoncondition = {
                    is_deleted: NOT_DELETED,
                    company_id: new ObjectId(companyId),
                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commoncondition);

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "is_active") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }
                    })
                }

                let conditions = [
                    {
                        $facet: {
                            "list": [
                                {
                                    $match: dataTableConfig.conditions
                                },
                                {
                                    $lookup: {
                                        from: TABLE_ORDERS,
                                        let: { promo_code: "$promo_code" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$b2b_code", "$$promo_code"] },
                                                            { $eq: ["$is_b2b_code", true] },
                                                            { $eq: ["$order_status", ORDER_PLACED] },
                                                            { $ne: ["$status", BOOKING_STATUS_CANCELLED] }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                $count: "b2bCodeOrderCount"
                                            }
                                        ],
                                        as: "b2bCodeOrderCount"
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1, image: 1, is_active: 1, is_deleted: 1, created: 1,
                                        promo_code: 1, company_id: 1, code_valid_from: 1, code_valid_to: 1,maximum_number_of_washes:1, 
                                        b2bCodeOrderCount: { $ifNull: [{ $arrayElemAt: ["$b2bCodeOrderCount.b2bCodeOrderCount", 0] }, 0] } // Default to 0 if no orders

                                    }
                                },
                                {
                                    $sort: dataTableConfig.sort_conditions
                                },
                                { $skip: skip },
                                { $limit: limit },
                            ],
                            "all_count": [
                                {
                                    $match: commoncondition
                                },
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
                            "filter_count": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $count: {} }
                                    }
                                },
                                {
                                    $project: { _id: 0, count: 1 }
                                }
                            ]
                        }
                    }
                ];

                let optionObj = {
                    conditions: conditions
                }

                B2BDiscountModel.getAggregateB2BDiscountList(req, res, optionObj).then(companyResponse => {
                    let responseStatus = (companyResponse.status) ? companyResponse.status : "";
                    let responseResult = (companyResponse.result && companyResponse.result[0]) ? companyResponse.result[0] : "";
                    let list = (responseResult && responseResult.list) ? responseResult.list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;

                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })

            });
        } else {
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS['admin/company_management/B2B_Discount/list']);
            res.render('B2B_Discount/list', {
                image_url: COMPANY_URL,
                dynamic_url: companyId,
                company_id: companyId
            });
        }
    };//End getB2BDiscountList()



    /**
   * Function for addB2BDiscount
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
    this.addB2BDiscount = (req, res, next) => {
        let companyId = (req.params.companyid) ? req.params.companyid : "";
        if (isPost(req)) {
            /** Sanitize Data */
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            const fromdate = new Date(req.body.code_valid_from + " 00:00");
            const todate = new Date(req.body.code_valid_to + " 23:59");
            let promoCode = (req.body.promo_code) ? req.body.promo_code : "";
            let couponsValidFrom = (req.body.code_valid_from) ? getUtcDate(fromdate) : "";
            let couponsValidTo = (req.body.code_valid_to) ? getUtcDate(todate) : "";
            let code_discount_type = (req.body.code_discount_type) ? req.body.code_discount_type : "";
            let numberOfWashes = (req.body.number_of_washes_per_user) ? req.body.number_of_washes_per_user : "";
            let number_of_user = (req.body.number_of_user) ? req.body.number_of_user : "";
            let maximumNumberOfWashes = (req.body.maximum_number_of_washes) ? req.body.maximum_number_of_washes : "";
            let discount_amount = (req.body.discount_amount) ? req.body.discount_amount : "";
            let min_order_value = (req.body.min_order_value) ? req.body.min_order_value : "";
            let category_id = (req.body.category_id && Array.isArray(req.body.category_id)) ? (req.body.category_id).map(id => new ObjectId(id)) : ""
            let package_id = (req.body.package_id && Array.isArray(req.body.package_id)) ? (req.body.package_id).map(id => new ObjectId(id)) : ""
            let subscription_id = (req.body.subscription_id && Array.isArray(req.body.subscription_id)) ? (req.body.subscription_id).map(id => new ObjectId(id)) : '';

            /** parse Validation array  */
            let insertData = {
                promo_code: promoCode,
                code_discount_type: code_discount_type,
                company_id: new ObjectId(companyId),
                code_valid_from: couponsValidFrom,
                code_valid_to: couponsValidTo,
                number_of_washes_per_user: numberOfWashes,
                number_of_user: number_of_user,
                maximum_number_of_washes: maximumNumberOfWashes,
                discount_amount: discount_amount,
                min_order_value: min_order_value,
                category_id: category_id,
                package_id: package_id,
                subscription_id: subscription_id,
                is_deleted: NOT_DELETED,
                is_active: ACTIVE,
                created: getUtcDate(),
                modified: getUtcDate()
            }
            let options = {
                insertData: insertData
            }

            B2BDiscountModel.addB2BDiscountData(req, res, options).then(companyResponse => {
                if (companyResponse.status == STATUS_SUCCESS) {
                    req.flash(STATUS_SUCCESS, res.__("admin.company.b2b_discount_has_been_added_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + companyId,
                        message: res.__("admin.company.company_has_been_added_successfully")
                    });
                } else {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + companyId + '/add');
                    return;
                }
            })
        } else {



 
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
            }, (error, response) => {              

             let categories = (response.categories) ? response.categories : [];
             let packages = (response.packages) ? response.packages : [];
             let subscriptions = (response.subscriptions) ? response.subscriptions : [];
          
                /** Get language list */
                getLanguages().then(languageList => {
                    req.breadcrumbs(BREADCRUMBS['admin/company_management/B2B_Discount/add']);
                    /**Render add company page */
                    res.render('B2B_Discount/add', {
                        language_list: languageList,
                        company_id: companyId,
                        dynamic_url: companyId,
                        'categories':categories,
                        'packages':packages,
                        'subscriptions':subscriptions,
                    });
                }).catch(next);
           

          });



        }
    }



    /**
     * Function to update editB2BDiscount detail
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editB2BDiscount = (req, res, next) => {
        let companyid = (req.params.companyid) ? req.params.companyid : "";
        let id = (req.params.id) ? req.params.id : "";
        if (isPost(req)) {
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            const fromdate = new Date(req.body.code_valid_from + " 00:00");
            const todate = new Date(req.body.code_valid_to + " 23:59");
            let promoCode = (req.body.promo_code) ? req.body.promo_code : "";
            let couponsValidFrom = (req.body.code_valid_from) ? getUtcDate(fromdate) : "";
            let couponsValidTo = (req.body.code_valid_to) ? getUtcDate(todate) : "";
            let code_discount_type = (req.body.code_discount_type) ? req.body.code_discount_type : "";
            let numberOfWashes = (req.body.number_of_washes_per_user) ? req.body.number_of_washes_per_user : "";
            let discount_amount = (req.body.discount_amount) ? req.body.discount_amount : "";
            let min_order_value = (req.body.min_order_value) ? req.body.min_order_value : ""; 
            let number_of_user = (req.body.number_of_user) ? req.body.number_of_user : "";
            let maximumNumberOfWashes = (req.body.maximum_number_of_washes) ? req.body.maximum_number_of_washes : "";
            let category_id = (req.body.category_id && Array.isArray(req.body.category_id)) ? (req.body.category_id).map(id => new ObjectId(id)) : ""
            let package_id = (req.body.package_id && Array.isArray(req.body.package_id)) ? (req.body.package_id).map(id => new ObjectId(id)) : ""
            let subscription_id = (req.body.subscription_id && Array.isArray(req.body.subscription_id)) ? (req.body.subscription_id).map(id => new ObjectId(id)) : '';

            /** Update slider record */
            let updateData = {
                promo_code: promoCode,
                code_discount_type: code_discount_type,
                code_valid_from: couponsValidFrom,
                code_valid_to: couponsValidTo,
                number_of_washes_per_user: numberOfWashes,
                number_of_user: number_of_user,
                maximum_number_of_washes: maximumNumberOfWashes,
                discount_amount: discount_amount,
                min_order_value: min_order_value,
                category_id: category_id,
                package_id: package_id,
                subscription_id: subscription_id,
                modified: getUtcDate()
            }
            let updateCondition = {
                _id: new ObjectId(id),
                company_id: new ObjectId(companyid)
            };
            let options = {
                conditions: updateCondition,
                updateData: { $set: updateData }
            }

            B2BDiscountModel.updateOneB2BDiscount(req, res, options).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    req.flash(STATUS_SUCCESS, res.__("admin.company.b2b_discount_has_been_updated_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + companyid,
                        message: res.__("admin.company.company_has_been_updated_successfully"),
                    });
                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + companyid + '/edit' + id);
                    return;
                }
            });

        } else {
            /** Get language list **/
            let detailConditions = {
                _id: new ObjectId(id),
                company_id: new ObjectId(companyid)
            };
            let options = {
                conditions: detailConditions
            }
            B2BDiscountModel.B2BDiscountDetails(req, res, options).then(companyResponse => {
                if (companyResponse == STATUS_ERROR) {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + companyid + '/edit' + id);
                } else {
                    let details = (companyResponse.result) ? companyResponse.result : {};                  


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
                    }, (error, response) => {              
        
                     let categories = (response.categories) ? response.categories : [];
                     let packages = (response.packages) ? response.packages : [];
                     let subscriptions = (response.subscriptions) ? response.subscriptions : [];

                  
                        /** Render edit page **/
                        req.breadcrumbs(BREADCRUMBS["admin/company_management/B2B_Discount/edit"]);
                        res.render('B2B_Discount/edit', {
                            result: details,
                            dynamic_url: companyid,
                            'categories':categories,
                            'packages':packages,
                            'subscriptions':subscriptions,
                        });
                  
                  });
                }
            })
        }
    }


    /**
     * Function for update B2BDiscount status
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return null
     */
    this.updateB2BDiscountStatus = (req, res, next) => {
        let B2BDiscountStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";
        let discountId = (req.params.id) ? req.params.id : "";
        let company_id = (req.params.company_id) ? req.params.company_id : "";

        if (!discountId || !company_id || !statusType || (statusType != ACTIVE_INACTIVE_STATUS)) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + company_id);
            return;
        } else {

            /** Set update data **/
            let updateData = {
                $set: {
                    modified: getUtcDate()
                }
            };

            if (statusType == ACTIVE_INACTIVE_STATUS) {
                updateData["$set"]["is_active"] = (B2BDiscountStatus == ACTIVE) ? DEACTIVE : ACTIVE;
            }

            let condition = {
                _id: new ObjectId(discountId)
            }

            let optionObj = {
                conditions: condition,
                updateData: updateData
            }

            B2BDiscountModel.updateOneB2BDiscount(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.company.discount_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + company_id);

                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + 'company_management/b2b_discount_configuration/' + company_id);
                }
            });

        }

    };//End updateCompanyStatus()


    /**
         * Function to get  B2B Discount employee  list
         *
         * @param req As Request Data
         * @param res As Response Data
         *
         * @return render/json
         */

    this.getB2BDiscountEmployeeList = (req, res, next) => {
        let companyId = (req.params.companyid) ? new ObjectId(req.params.companyid) : "";


        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;

            let search_data = req.body.search_data;


            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {


                exportB2BDiscountEmployeeConditions = dataTableConfig.conditions;

                /** Set conditions **/
                let commonConditions = {
                    is_deleted: NOT_DELETED,
                    company_id: companyId
                };


                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "is_active") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }
                    })
                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                let conditions = [{
                    $facet: {
                        "user_list": [
                            { $match: dataTableConfig.conditions },
                            {
                                $project: {
                                    _id: 1, full_name: 1, email: 1, is_email_verified: 1, is_mobile_verified: 1, account_type: 1, status: 1, is_blocked: 1, is_deleted: 1, created: 1, slug: 1, mobile_number: 1, company_id: 1, b2b_status: 1, b2b_code: 1
                                }
                            },
                            { $sort: dataTableConfig.sort_conditions },
                            { $limit: limit },
                            { $skip: skip },
                        ],
                        "user_all_count": [
                            { $match: commonConditions },
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
                        "user_filter_count": [
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
                }];

                let optionObj = {
                    conditions: conditions
                }

                UserModel.userAggregateResult(req, res, optionObj).then(userResponse => {

                    let responseStatus = (userResponse.status) ? userResponse.status : "";
                    let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
                    let user_list = (responseResult && responseResult.user_list) ? responseResult.user_list : [];

                    let user_all_count = (responseResult && responseResult.user_all_count && responseResult.user_all_count[0] && responseResult.user_all_count[0]["count"]) ? responseResult.user_all_count[0]["count"] : DEACTIVE;
                    let user_filter_count = (responseResult && responseResult.user_filter_count && responseResult.user_filter_count[0] && responseResult.user_filter_count[0]["count"]) ? responseResult.user_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: user_list,
                        recordsTotal: user_all_count,
                        recordsFiltered: user_filter_count,
                    });
                })
            });
        } else {

            let options = {
                collections: [
                    {
                        collection: TABLE_LANGUAGES,
                        columns: ["lang_code", "title"],
                        conditions: { active: ACTIVE },
                        sort_conditions: { lang_code: -1 }
                    },
                    {
                        collection: TABLE_B2B_DISCOUNT,
                        columns: ["promo_code", "promo_code"],
                        conditions: { is_active: ACTIVE, company_id: companyId },
                    }
                ]
            };
            getDropdownList(req, res, options).then(response => {

                req.breadcrumbs(BREADCRUMBS["admin/users/list"]);
                res.render("employee/employee_list", {
                    lang_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                    b2b_discount_list: (response && response.final_html_data && response.final_html_data["1"]) ? response.final_html_data["1"] : "",
                    company_id: companyId,
                    dynamic_variable: "B2B Discount",
                });
            });
        }
    };//End getUserList()


    /*
         * Function for view details
         *
         * @param req 	As 	Request Data
         * @param res 	As 	Response Data
         * @param next 	As 	Callback argument to the middleware function
         *
         * @return render
         */
    this.getB2BDiscountEmployeeView = (req, res, next) => {

        let companyid = (req.params.companyid) ? (req.params.companyid) : "";
        let userId = (req.params.userId) ? (req.params.userId) : "";
        let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
        let userType = (req.params.user_type) ? req.params.user_type : "";
        /** Get details **/
        // let conditions = [
        //     { $match: { '_id': new ObjectId(userId) } },
        // ];

        // let optionObj = {
        //     'conditions': conditions
        // };
        let matchCondition = {
            _id: new ObjectId(userId)
        }

        let projectFields = {
            _id: 1,
            first_name: 1,
            last_name: 1,
            full_name: 1,
            dob: 1,
            age: 1,
            email: 1,
            gender: 1,
            mobile_number: 1,
            wallet_balance: 1,
            status: 1,
            is_email_verified: 1,
            is_mobile_verified: 1,
            is_admin_approved: 1,
            created: 1,
            is_verified: 1,
            zip: 1,
            profile_image: 1,
            wallet_amount: 1,
            total_coins: 1,
            b2b_status: 1,
            country_name: { $arrayElemAt: ["$countryDetail.country_name", 0] },
            state_name: { $arrayElemAt: ["$stateDetail.state_name", 0] },
            city_name: { $arrayElemAt: ["$cityDetail.city_name", 0] },
            lang_name: { $arrayElemAt: ["$langDetail.title", 0] },
            companyDetail: "$companyDetail",
            b2bDiscountDetail: "$b2bDiscountDetail",
         
        }

        let aggregateCondition = [
            {
                $match: matchCondition
            },
            {
                $lookup: {
                    from: TABLE_COUNTRY,
                    let: { countryId: "$country_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$countryId"] }]
                                }
                            }
                        }
                    ],
                    as: "countryDetail"
                }
            },
            {
                $lookup: {
                    from: TABLE_STATES,
                    let: { stateId: "$state_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$stateId"] }]
                                }
                            }
                        }
                    ],
                    as: "stateDetail"
                }
            },
            {
                $lookup: {
                    from: TABLE_CITY,
                    let: { cityId: "$city_id" },
                    pipeline: [
                            


    {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$cityId"] }]
                                }
                            }
                        }
                    ],
                    as: "cityDetail"
                }
            },
            {
                $lookup: {
                    from: TABLE_LANGUAGES,
                    let: { language: "$language" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$lang_code", "$$language"] }]
                                }
                            }
                        }
                    ],
                    as: "langDetail"
                }
            },
            {
                $lookup: {
                    from: TABLE_COMPANY,
                    let: { company_id: "$company_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$company_id"] }]
                                }
                            }
                        }
                    ],
                    as: "companyDetail"
                }
            },
            {
                $lookup: {
                    from: TABLE_B2B_DISCOUNT,
                    let: { promo_code: "$b2b_code" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$promo_code", "$$promo_code"] }]
                                }
                            }
                        }
                    ],
                    as: "b2bDiscountDetail"
                }
            }, 

            {
                $project: projectFields
            }
        ]


        let optionObj = {
            conditions: aggregateCondition
        }

        UserModel.getUserViewDetails(req, res, optionObj).then(response => {

            let result = (response.result) ? response.result : {};
            let status = (response.status) ? response.status : "";

            if (status == STATUS_SUCCESS) {

                /** Set options for append image full path **/
                let options = {
                    "file_url": USERS_URL,
                    "file_path": USERS_FILE_PATH,
                    "result": [result],
                    "database_field": "profile_image"
                };
                /** Append image with full path **/
                appendFileExistData(options).then(fileResponse => {

                    /** Render view page*/
                    req.breadcrumbs(BREADCRUMBS["admin/company_management/view"]);
                    res.render("employee/view", {
                        //result				:	result[0],
                        result: (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {},
                        language: language,
                        companyid: companyid
                    });

                });
            } else {
                req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
                return res.redirect(WEBSITE_ADMIN_URL + "company_management/" + companyid);
            }
        });

    };//End getB2BDiscountEmployeeView()


    /**
         * Function for update user's status
         *
         * @param req 	As Request Data
         * @param res 	As Response Data
         * @param next 	As 	Callback argument to the middleware function
         *
         * @return null
         */
    this.chanceB2bStatus = (req, res, next) => {
        let companyid = (req.params.companyid) ? req.params.companyid : "";
        let userId = (req.params.userId) ? req.params.userId : "";
        let userStatus = (req.params.status) ? req.params.status : "";

        if (!userId || !companyid) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        /** Set update data **/
        let updateData = {
            $set: {
                modified: getUtcDate()
            }
        };

        updateData["$set"]["b2b_status"] = (userStatus == ACTIVE) ? DEACTIVE : ACTIVE;

        let condition = {
            _id: new ObjectId(userId)
        }

        let optionObj = {
            conditions: condition,
            updateData: updateData
        }
        /** Update user status*/
        UserModel.updateOneUser(req, res, optionObj).then(updateResponse => {
            if (updateResponse.status == STATUS_SUCCESS) {
                let message = res.__("admin.user.b2b_discount_status_has_been_updated_successfully");
                req.flash(STATUS_SUCCESS, message);
                res.redirect(WEBSITE_ADMIN_URL + "company_management/b2b_discount_employee_list/" + companyid);
            } else {
                let message = res.__("admin.system.something_going_wrong_please_try_again");
                req.flash(STATUS_SUCCESS, message);
                res.redirect(WEBSITE_ADMIN_URL + "company_management/b2b_discount_employee_list/" + companyid);
            }
        });
    };//End chanceB2bStatus()


    this.exportCompanyData = async (req, res) => {
        let conditionsexp = exportCompanyCommonConditions;
        let limit = ADMIN_LISTING_LIMIT;
        let skip = DEFAULT_SKIP;

        let conditions = [
            {
                $facet: {
                    "list": [
                        {
                            $match: conditionsexp
                        },
						
						{
							$lookup: {
								from: TABLE_USERS,
								let: { company_id: "$_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ["$company_id", "$$company_id"] },
													{ $eq: ["$is_deleted", NOT_DELETED] }
												]
											}
										}
									},
									{
										$count: "b2bEmployeeCount"
									}
								],
								as: "b2bEmployeeCount"
							}
						},
						{
							$lookup: {
								from: TABLE_B2B_DISCOUNT,
								let: { company_id: "$_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ["$company_id", "$$company_id"] },
													{ $eq: ["$is_deleted", NOT_DELETED] }
												]
											}
										}
									},
									{
										$count: "b2bCodeCount"
									}
								],
								as: "b2bCodeCount"
							}
						},
						{
							$project: {
								_id: 1, image: 1, is_active: 1, is_deleted: 1, created: 1, company_name: 1, contact_person_name: 1, contact_person_email: 1, contact_person_phone: 1,
								b2bCodeCount: { $ifNull: [{ $arrayElemAt: ["$b2bCodeCount.b2bCodeCount", 0] }, 0] },
								b2bEmployeeCount: { $ifNull: [{ $arrayElemAt: ["$b2bEmployeeCount.b2bEmployeeCount", 0] }, 0] },
							}
						},
                        { $skip: skip },
                        { $limit: limit },
                    ],
                }
            }
        ];

        let optionObj = {
            conditions: conditions
        }

        CompanyModel.getAggregateCompanyList(req, res, optionObj).then(companyResponse => {

            let responseResult = (companyResponse.result && companyResponse.result[0]) ? companyResponse.result[0] : "";
            let companyList = (responseResult && responseResult.list) ? responseResult.list : [];

            /**Set variable for export */
            let temp = [];
            /** Define excel heading label **/
            let commonColls = [
                res.__("admin.company.company_name"),
                res.__("admin.company.contact_person_name"),
                res.__("admin.company.email"),
                res.__("admin.company.mobile"),
                res.__("admin.company.number_of_discount_codes"),
                res.__("admin.company.number_of_employees"),
                res.__("admin.system.created"),
            ];
            if (companyList && companyList.length > 0) {
                companyList.map(records => {
                    let buffer = [
                        (records.company_name) ? records.company_name : "N/A",
                        (records.contact_person_name) ? records.contact_person_name : "N/A",
                        (records.contact_person_email) ? records.contact_person_email : "N/A",
                        (records.contact_person_phone) ? records.contact_person_phone : "N/A",
                        (records.b2bCodeCount) ? records.b2bCodeCount : 0,
                        (records.b2bEmployeeCount) ? records.b2bEmployeeCount : 0,
                        (records.created) ? newDate(records.created, DATE_TIME_FORMAT_EXPORT) : "",
                    ];
                    temp.push(buffer);
                });
            }

            /**  Function to export data in excel format **/
            exportToExcel(req, res, {
                file_prefix: "company_list",
                heading_columns: commonColls,
                export_data: temp
            });
        })
    };//End exportCompanyData()


    this.exportB2BDiscountData = async (req, res) => {
        let conditionsexp = exportB2BDiscountConditions;
        let limit = ADMIN_LISTING_LIMIT;
        let skip = DEFAULT_SKIP;

        let conditions = [
            {
                $facet: {
                    "list": [
                        {
                            $lookup: {
                                from: TABLE_COMPANY,
                                let: { company_id: "$company_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $eq: ["$_id", "$$company_id"] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            company_name: 1,
                                            contact_person_phone: 1,
                                            contact_person_email: 1
                                        }
                                    }
                                ],
                                as: "company_details"
                            },

                        },
                        {
                            $lookup: {
                                from: TABLE_CATEGORIES,
                                let: { category_id: "$category_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $in: ["$_id", "$$category_id"] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            category_name: 1,
                                        }
                                    }
                                ],
                                as: "category_details"
                            }
                        },
                        {
                            $lookup: {
                                from: TABLE_SUBSCRIPTIONS,
                                let: { subscription_id: "$subscription_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $in: ["$_id", "$$subscription_id"] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            subscription_name: 1,
                                        }
                                    }
                                ],
                                as: "subscription_details"
                            }
                        },
                        {
                            $lookup: {
                                from: TABLE_PACKAGES,
                                let: { package_id: "$package_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $in: ["$_id", "$$package_id"] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            package_name: 1,
                                        }
                                    }
                                ],
                                as: "package_details"
                            }
                        },
                        {
                            $match: conditionsexp
                        },
                        { $skip: skip },
                        { $limit: limit },
                    ],

                }
            }
        ];

        let optionObj = {
            conditions: conditions
        }

        B2BDiscountModel.getAggregateB2BDiscountList(req, res, optionObj).then(companyResponse => {

            let responseResult = (companyResponse.result && companyResponse.result[0]) ? companyResponse.result[0] : "";
            let companyList = (responseResult && responseResult.list) ? responseResult.list : [];


            /**Set variable for export */
            let temp = [];
            /** Define excel heading label **/
            let commonColls = [
                res.__("admin.company.promo_code"),
                res.__("admin.company.valid_from"),
                res.__("admin.company.valid_to"),
                res.__("admin.company.code_discount_type"),
                res.__("admin.company.company_name"),
                res.__("admin.company.company_email"),
                res.__("admin.company.company_contact_number"),
                res.__("admin.company.number_of_washes_per_user"),
                res.__("admin.company.number_of_user"),
                res.__("admin.company.discount_amount"),
                res.__("admin.company.min_order_amount"),
                res.__("admin.company.category"),
                res.__("admin.company.package"),
                res.__("admin.company.subscription"),
                res.__("admin.system.created"),
            ];
            if (companyList && companyList.length > 0) {
                companyList.map(records => {

                    const category_details = records.category_details.map(item => item.category_name);
                    const package_details = records.package_details.map(item => item.package_name);
                    const subscription_details = records.subscription_details.map(item => item.subscription_name);

                    let buffer = [
                        (records.promo_code) ? records.promo_code : "N/A",
                        (records.code_valid_from) ? newDate(records.code_valid_from, DATE_TIME_FORMAT_EXPORT) : "",
                        (records.code_valid_to) ? newDate(records.code_valid_to, DATE_TIME_FORMAT_EXPORT) : "",
                        (records.code_discount_type) ? records.code_discount_type : "N/A",
                        (records.company_details[0].company_name) ? records.company_details[0].company_name : "N/A",
                        (records.company_details[0].contact_person_email) ? records.company_details[0].contact_person_email : "N/A",
                        (records.company_details[0].contact_person_phone) ? records.company_details[0].contact_person_phone : "N/A",
                        (records.number_of_washes_per_user) ? records.number_of_washes_per_user : "N/A",
                        (records.number_of_user) ? records.number_of_user : "N/A",
                        (records.discount_amount) ? records.discount_amount : "N/A",
                        (records.min_order_value) ? records.min_order_value : "N/A",
                        category_details.join(', '),
                        package_details.join(', '),
                        subscription_details.join(', '),

                        (records.created) ? newDate(records.created, DATE_TIME_FORMAT_EXPORT) : "",
                    ];
                    temp.push(buffer);
                });
            }

            /**  Function to export data in excel format **/
            exportToExcel(req, res, {
                file_prefix: "B2B_discount_list",
                heading_columns: commonColls,
                export_data: temp
            });
        })
    };//End exportB2BDiscountData()


    this.exportB2BDiscountEmployeeListData = async (req, res) => {

        let conditionsexp = exportB2BDiscountEmployeeConditions;
        let limit = ADMIN_LISTING_LIMIT;
        let skip = DEFAULT_SKIP;

        let conditions = [{
            $facet: {
                "user_list": [
                    {
                        $lookup: {
                            from: TABLE_COMPANY,
                            let: { company_id: "$company_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $or: [
                                                { $eq: ["$_id", "$$company_id"] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        company_name: 1,
                                        contact_person_phone: 1,
                                        contact_person_email: 1
                                    }
                                }
                            ],
                            as: "company_details"
                        },

                    },
                    { $match: conditionsexp },
                    {
                        $project: {
                            _id: 1, full_name: 1, email: 1, is_email_verified: 1, is_mobile_verified: 1, account_type: 1, status: 1, is_blocked: 1, is_deleted: 1, created: 1, slug: 1, mobile_number: 1, company_id: 1, b2b_status: 1, b2b_code: 1,
                            company_details: "$company_details",
                        }
                    },
                    { $limit: limit },
                    { $skip: skip },
                ],

            }
        }];

        let optionObj = {
            conditions: conditions
        }

        UserModel.userAggregateResult(req, res, optionObj).then(userResponse => {

            let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
            let userList = (responseResult && responseResult.user_list) ? responseResult.user_list : [];

            /**Set variable for export */
            let temp = [];
            /** Define excel heading label **/
            let commonColls = [
                res.__("admin.user.name"),
                res.__("admin.user.mobile_number"),
                res.__("admin.user.email"),
                res.__("admin.user.b2b_discount_code"),
                res.__("admin.company.company_name"),
                res.__("admin.company.company_email"),
                res.__("admin.company.company_contact_number"),
                res.__("admin.system.created"),
            ];
            if (userList && userList.length > 0) {
                userList.map(records => {

                    let buffer = [
                        (records.full_name) ? records.full_name : "N/A",
                        (records.mobile_number) ? records.mobile_number : "",
                        (records.email) ? records.email : "",
                        (records.b2b_code) ? records.b2b_code : "",
                        (records.company_details[0].company_name) ? records.company_details[0].company_name : "N/A",
                        (records.company_details[0].contact_person_email) ? records.company_details[0].contact_person_email : "N/A",
                        (records.company_details[0].contact_person_phone) ? records.company_details[0].contact_person_phone : "N/A",
                        (records.created) ? newDate(records.created, DATE_TIME_FORMAT_EXPORT) : "",
                    ];
                    temp.push(buffer);
                });
            }

            /**  Function to export data in excel format **/
            exportToExcel(req, res, {
                file_prefix: "B2B_discount_employee_list",
                heading_columns: commonColls,
                export_data: temp
            });
        })
    };//End exportB2BDiscountEmployeeListData()


}
module.exports = new Company();
