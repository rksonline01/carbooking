const crypto = require("node:crypto");
const async = require("async");
const userService = require(WEBSITE_SERVICES_FOLDER_PATH + 'user_service');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const UserModel = require("./model/user");

const OrderModel = require("../orders/model/OrderModel");

const GiftTransactionModel = require("../../frontend/api/model/giftTransactionModel");

const Socket = require("../../frontend/socket/model/socket");

const { ObjectId } = require('mongodb');


function UserController() {

    GlobalUserController = this;

    let exportFilterConditions = {};
    let exportCommonConditions = {};
    let exportWalletCommonConditions = {};
    let exportPointCommonConditions = {};
    let exportSortConditions = { _id: SORT_ASC };

    /**
     * Function for login
     *
     * @param req 	As	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/jsonthis
     */
    this.login = (req, res, next) => {
        if (isPost(req)) {

            /** Sanitize Data **/
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            let username = (req.body.username) ? req.body.username : "";
            let simplePassword = (req.body.password) ? req.body.password : "";

            /** Set login options **/
            let loginOptions = {
                user_name: username,
                password: simplePassword
            };

            /** call login function **/
            GlobalUserController.adminLoginFunction(req, res, next, loginOptions).then(responseData => {

                if (responseData.status != STATUS_SUCCESS) {
                    /** Send error response **/
                    return res.send({
                        status: STATUS_ERROR,
                        message: (responseData.errors) ? responseData.errors : [],
                    });
                }
                else {
                    var userData = responseData.result ? (responseData.result) : "";
                    /** Send success response **/
                    return res.send({
                        redirect_url: WEBSITE_ADMIN_URL + "dashboard",
                        status: STATUS_SUCCESS,
                    });
                }
            }).catch(next);
        } else {
            if (ALLOWED_ADMIN_TO_SET_COOKIE != ACTIVE) {
                res.render("login");
                return;
            }

            /** Login user using cookie*/
            let cookie = req.cookies.adminLoggedIn;
            if (!cookie) {
                res.render("login");
                return;
            }

            let username = (cookie.username) ? cookie.username : "";
            let password = (cookie.password) ? cookie.password : "";
            let decipherUser = crypto.createDecipher("aes256", "username");
            let decryptedUsername = decipherUser.update(username, "hex", "utf8") + decipherUser.final("utf8");
            let decipherPassword = crypto.createDecipher("aes256", "password");
            let decryptedPassword = decipherPassword.update(password, "hex", "utf8") + decipherPassword.final("utf8");

            /** Set login options **/
            let loginOptions = {
                user_name: decryptedUsername,
                password: decryptedPassword
            };

            /** call login function **/
            GlobalUserController.adminLoginFunction(req, res, next, loginOptions).then(responseData => {
                if (responseData.status != STATUS_SUCCESS) {
                    /** Delete cookie*/
                    res.clearCookie("adminLoggedIn");
                    res.render("login");
                    return;
                }
                /** Redirect to dashboard*/
                res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            }).catch(next);
        }
    };//End login()


    /**
     * Function for login
     *
     * @param req 		As	Request Data
     * @param res 		As 	Response Data
     * @param next 		As 	Callback argument to the middleware function
     * @param options	As 	Object that have user name and password
     *
     * @return json
     */
    this.adminLoginFunction = (req, res, next, options) => {
        return new Promise(async resolve => {

            let username = (options.user_name) ? options.user_name : "";
            let simplePassword = (options.password) ? options.password : "";
            let rememberMe = (req.body.remember_me) ? req.body.remember_me : false;
            const users = db.collection(TABLE_USERS);
            /** Get user Details **/
            let conditions = {
                is_deleted: NOT_DELETED,
                email: { $regex: "^" + username + "$", $options: "i" },
                user_role_id: { $nin: [FRONT_ADMIN_ROLE_ID] }
            }

            let fields = { user_role_id: 1, first_name: 1, last_name: 1, full_name: 1, email: 1, slug: 1, password: 1, active: 1, created: 1, is_mobile_verified: 1, is_email_verified: 1, is_admin_approved: 1, is_profile_complete: 1, profile_staps: 1, company_name: 1, module_ids: 1 }
            try {
                let resultData = await users.findOne(conditions, { projection: fields });
                if (Object.keys(resultData).length == 0) {
                    /** Send error response **/
                    let response = {
                        status: STATUS_ERROR,
                        errors: [{ "path": "password", "msg": res.__("admin.user.please_enter_correct_email_or_password") }],
                        options: options
                    };
                    return resolve(response);
                }
                /**Compare password */
                let password = (resultData.password) ? resultData.password : "";
                bcryptCheckPasswordCompare(simplePassword, password).then(function (passwordMatch) {
                    if (!passwordMatch) {
                        /** Send error response **/
                        let response = {
                            status: STATUS_ERROR,
                            errors: [{ "path": "password", "msg": res.__("admin.user.please_enter_correct_email_or_password") }],
                            options: options
                        };
                        return resolve(response);
                    }

                    if (resultData.active != ACTIVE) {
                        /** Send error response **/
                        return resolve({
                            status: STATUS_ERROR,
                            options: options,
                            errors: [{ "path": "password", "msg": res.__("admin.user.account_temporarily_disabled") }]
                        });
                    }
                    if (resultData.is_email_verified != ACTIVE) {
                        /** Send error response **/
                        return resolve({
                            status: STATUS_ERROR,
                            options: options,
                            errors: [{ "path": "password", "msg": res.__("admin.user.your_email_verification_is_pending") }]
                        });
                    }
                    if (resultData.is_mobile_verified != ACTIVE) {
                        /** Send error response **/
                        return resolve({
                            status: STATUS_ERROR,
                            options: options,
                            errors: [{ "path": "password", "msg": res.__("admin.user.your_mobile_verification_is_pending") }]
                        });
                    }

                    /** If user check stay sign in check box*/
                    if (rememberMe == true) {
                        let cookie = req.cookies.adminLoggedIn;
                        if (cookie === undefined) {
                            let userCipher = crypto.createCipher("aes256", "username");
                            let encryptedUserName = userCipher.update(username, "utf8", "hex") + userCipher.final("hex");
                            let passwordCipher = crypto.createCipher("aes256", "password");
                            let encryptedPassword = passwordCipher.update(simplePassword, "utf8", "hex") + passwordCipher.final("hex");

                            /**set a new cookie*/
                            res.cookie("adminLoggedIn", { username: encryptedUserName, password: encryptedPassword }, { maxAge: ADMIN_LOGGED_IN_COOKIE_EXPIRE_TIME, httpOnly: true });
                        }
                    }

                    req.session.user = resultData;

                    /** Send success response **/
                    let response = {
                        status: STATUS_SUCCESS,
                        options: options,
                        result: resultData
                    };
                    resolve(response);
                });
            } catch (error) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: true,
                    message: "in error case"
                };
                return resolve(response);
            }
        });
    };//End adminLoginFunction()


    /**
     * Function for show dashboard
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render
     */
    this.dashboard = async (req, res, next) => {

        const users = db.collection(TABLE_USERS);
        const asyncParallel = require("async/parallel");
        asyncParallel({
            user_graph_data: (callback) => {
                /** Set conditions **/
                let conditionsObj = [
                    {
                        $match: {
                            "is_deleted": NOT_DELETED,
                            "user_role_id": { $in: [FRONT_ADMIN_ROLE_ID] }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                "year": { "$substr": ["$created", 0, 4] },
                                "month": { "$substr": ["$created", 5, 2] }
                            },
                            total_users: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                // { $eq : ["$user_role_id",FRONT_ADMIN_ROLE_ID] },
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                        }
                    },
                    { $sort: { _id: SORT_DESC } }
                ]
                let optionObj = {
                    conditions: conditionsObj,
                    collection: TABLE_USERS
                }

                UserModel.userAggregateResult(req, res, optionObj).then(graphRes => {

                    let graphResStatus = (graphRes.status) ? graphRes.status : "";
                    if (graphResStatus == STATUS_ERROR) {
                        callback(null, graphResStatus);
                    }
                    let graphResult = (graphRes.result) ? graphRes.result : "";
                    callback(null, graphResult);
                });

            },
            count_customer_data: (callback) => {
                /** Set conditions **/
                let conditionsObj = [
                    {
                        $match: {
                            "is_deleted": NOT_DELETED,
                            "user_type": CUSTOMER_USER_TYPE,
                            "user_role_id": { $in: [FRONT_ADMIN_ROLE_ID] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total_users: { $sum: 1 },

                        }
                    }
                ]
                let optionObj = {
                    conditions: conditionsObj,
                    collection: TABLE_USERS
                }
                UserModel.userAggregateResult(req, res, optionObj).then(countRes => {

                    let countResStatus = (countRes.status) ? countRes.status : "";
                    if (countResStatus == STATUS_ERROR) {
                        callback(null, countResStatus);
                    }
                    let countResult = (countRes.result) ? countRes.result : "";
                    callback(null, countResult);
                });
            },
            count_service_provider_data: (callback) => {
                /** Set conditions **/
                let conditionsObj = [
                    {
                        $match: {
                            "is_deleted": NOT_DELETED,
                            "user_type": SERVICE_PROVIDER_USER_TYPE,
                            "user_role_id": { $in: [FRONT_ADMIN_ROLE_ID] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total_users: { $sum: 1 },
                        }
                    }
                ]
                let optionObj = {
                    conditions: conditionsObj,
                    collection: TABLE_USERS
                }
                UserModel.userAggregateResult(req, res, optionObj).then(countRes => {

                    let countResStatus = (countRes.status) ? countRes.status : "";
                    if (countResStatus == STATUS_ERROR) {
                        callback(null, countResStatus);
                    }
                    let countResult = (countRes.result) ? countRes.result : "";
                    callback(null, countResult);
                });
            },


        }, (error, response) => {

            /**Render dashboard page*/
            req.breadcrumbs(BREADCRUMBS["admin/dashboard"]);
            res.render("dashboard", {
                result: (response['user_graph_data']) ? response['user_graph_data'] : [],
                total_customers: (response['count_customer_data'] && response['count_customer_data'][0]) ? response['count_customer_data'][0] : {},
                total_service_provider: (response['count_service_provider_data'] && response['count_service_provider_data'][0]) ? response['count_service_provider_data'][0] : {},
                user_role_id: req.session.user._id
            });
        });

    };//End dashboard()


    /**
     * Function for edit admin' s profile details
     * @param req As Request Data
     * @param res As Response Data
     * @return render/json
     */
    this.editProfile = (req, res, next) => {
        let userId = (req.session.user) ? req.session.user._id : "";

        if (isPost(req)) {
            /** Sanitize Data **/
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            let password = (req.body.password) ? req.body.password : "";
            let oldPassword = (req.body.old_password) ? req.body.old_password : "";

            /** parse Validation array  **/
            let fullName = (req.body.full_name) ? req.body.full_name : "";

            try {

                let findCondition = {
                    is_deleted: NOT_DELETED,
                    _id: new ObjectId(userId)
                };
                let projectFields = {
                    _id: 1, email: 1, password: 1
                };

                let option = {
                    conditions: findCondition,
                    fields: projectFields
                };

                UserModel.getUserDetails(option).then(userResponse => {
                    if (userResponse.status == STATUS_SUCCESS) {
                        let userDetail = userResponse.result;
                        if (oldPassword != "") {
                            try {
                                bcryptCheckPasswordCompare(oldPassword, userDetail.password).then(function (passwordMatch) {

                                    if (!passwordMatch) {
                                        /** Send error response **/
                                        res.send({
                                            status: STATUS_ERROR,
                                            message: [{ "path": "old_password", "msg": res.__("admin.user_profile.old_password_you_entered_did_not_matched") }],
                                        });
                                    }

                                    /** update admin's profile details **/
                                    bcryptPasswordGenerate(password).then(function (bcryptPassword) {
                                        let updateData = {
                                            full_name: fullName,
                                            password: bcryptPassword,
                                            modified: getUtcDate()
                                        };
                                        updateAdminProfile(updateData, req, res);
                                    }).catch(next);
                                });
                            } catch (e) {
                                /** Send error response **/
                                res.send({
                                    status: STATUS_ERROR,
                                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                                });
                            }
                        } else {

                            /** update admin 's profile details **/
                            let updateData = {
                                full_name: fullName,
                                modified: getUtcDate()
                            };
                            updateAdminProfile(updateData, req, res);
                        }

                    } else {
                        /** Send error response **/
                        req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "dashboard");
                    }
                })

            } catch (e) {
                /** Send error response **/
                res.send({
                    status: STATUS_ERROR,
                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                });
            }
        } else {

            let detailConditions = {
                _id: new ObjectId(userId)
            };
            let detailProject = {
                _id: 1, full_name: 1, email: 1, mobile_number: 1, user_role_id: 1, company_name: 1
            }
            let option = {
                conditions: detailConditions,
                fields: detailProject
            };

            UserModel.getUserDetails(option).then(userResponse => {
                if (userResponse.status == STATUS_SUCCESS) {
                    req.breadcrumbs(BREADCRUMBS["admin/user_profile/edit"]);

                    res.render("edit_profile", {
                        result: userResponse.result
                    });

                } else {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "dashboard");
                }
            })
        }
    };//End editProfile()


    /**
     * Function for update admin 's profile details
     *
     * @param insertData As Data to be insert in database
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return json
     */
    let updateAdminProfile = (insertData, req, res) => {
        try {
            let id = (req.session.user) ? req.session.user._id : "";
            let fullName = (req.body.full_name) ? req.body.full_name : "";
            let companyName = (req.body.company_name) ? req.body.company_name : "";
            let mobileNumber = (req.body.mobile_number) ? req.body.mobile_number : "";

            let updateCondition = {
                _id: new ObjectId(id)
            };

            let options = {
                conditions: updateCondition,
                updateData: { $set: insertData }
            };

            UserModel.findAndupdateOneUser(req, res, options).then(userUpdateDetails => {
                if (userUpdateDetails.status == STATUS_SUCCESS) {
                    req.session.user.full_name = fullName;
                    req.session.user.company_name = companyName;
                    req.session.user.mobile_number = mobileNumber;
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, res.__("admin.user.your_profile_has_been_updated_successfully"))
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "dashboard",
                        message: res.__("admin.user.your_profile_has_been_updated_successfully"),
                    });
                } else {
                    /** Send error response **/
                    res.send({
                        status: STATUS_ERROR,
                        message: res.__("admin.system.something_going_wrong_please_try_again")
                    });
                }
            });
        } catch (e) {
            /** Send error response **/
            res.send({
                status: STATUS_ERROR,
                message: res.__("admin.system.something_going_wrong_please_try_again")
            });
        }
    }//End updateAdminProfile()


    /**
     * Function for recover forgot password
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.forgotPassword = (req, res) => {
        if (isPost(req)) {

            try {
                /** Sanitize Data **/
                req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
                let email = (req.body.email) ? req.body.email : "";


                let conditionsObj = {
                    email: email,
                    is_deleted: NOT_DELETED,
                    user_role_id: { $nin: [FRONT_ADMIN_ROLE_ID] }
                };

                let optionObj = {
                    conditions: conditionsObj,
                    collection: TABLE_USERS,
                    fields: {},
                }
                UserModel.getUserDetails(optionObj).then(response => {

                    if (response.status != STATUS_SUCCESS) {
                        /** Send error response **/
                        req.flash(STATUS_ERROR, response.message);
                        res.redirect(WEBSITE_ADMIN_URL + "forgot-password");
                        return;
                    }

                    let result = (response.result) ? response.result : "";

                    if (result) {

                        let currentTimeStamp = new Date().getTime();
                        let validate_string = crypto.createHash("md5").update(currentTimeStamp + req.body.email).digest("hex");

                        let condition = {
                            _id: result._id
                        }

                        let updateData = {
                            $set: {
                                forgot_password_validate_string: validate_string,
                                modified: getUtcDate()
                            }
                        };

                        let optionObj = {
                            conditions: condition,
                            updateData: updateData
                        }
                        /** Update user status*/
                        UserModel.updateOneUser(req, res, optionObj).then(updateResponse => {
                            if (updateResponse.status == STATUS_SUCCESS) {

                                let link = WEBSITE_ADMIN_URL + 'reset-password?validate_string=' + validate_string;

                                let emailOptions = {
                                    to: email,
                                    action: "forgot_password_email_admin",
                                    rep_array: [result.full_name, link, link]
                                };


                                sendMail(req, res, emailOptions);


                                req.flash(STATUS_SUCCESS, res.__("admin.user.receive_email_with_link").replace(RegExp("{EMAIL}", "g"), email));
                                res.send({
                                    status: STATUS_SUCCESS,
                                    redirect_url: WEBSITE_ADMIN_URL + "forgot-password",
                                    message: res.__("admin.user.receive_email_with_link").replace(RegExp("{EMAIL}", "g"), email)
                                });

                            }
                            else {
                                res.send({
                                    status: STATUS_ERROR,
                                    message: [{ "param": "email", "msg": res.__("admin.system.something_going_wrong_please_try_again") }],
                                });
                            }
                        });
                    }
                    else {
                        res.send({
                            status: STATUS_ERROR,
                            message: [{ "param": "email", "msg": res.__("admin.system.something_going_wrong_please_try_again") }],
                        });
                    }
                })
            } catch (e) {
                /** Send error response **/
                res.send({
                    status: STATUS_ERROR,
                    message: [{ "param": "email", "msg": res.__("admin.system.something_going_wrong_please_try_again") }],
                });
            }
        } else {
            res.render("forgot_password");
        }
    };// end forgotPassword()


    /**
     * Function for reset password
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.resetPassword = (req, res, next) => {
        if (req.query && typeof req.query.validate_string !== typeof undefined && req.query.validate_string != "") {
            if (isPost(req)) {
                let validateString = (req.body.validate_string) ? req.body.validate_string : "";
                if (validateString != "") {

                    let password = (req.body.password) ? req.body.password : "";
                    bcryptPasswordGenerate(password).then(function (bcryptPassword) {
                        let newPassword = bcryptPassword;
                        try {

                            let conditionsObj = { forgot_password_validate_string: validateString };

                            let optionObj = {
                                conditions: conditionsObj,
                                collection: TABLE_USERS,
                                fields: {},
                            }

                            UserModel.getUserDetails(optionObj).then(response => {
                                let result = (response.result) ? response.result : "";

                                if (result) {

                                    let condition = {
                                        _id: result._id
                                    }

                                    let updateData = {
                                        $set: {
                                            password: newPassword,
                                            modified: getUtcDate()
                                        }
                                    };

                                    let optionObj = {
                                        conditions: condition,
                                        updateData: updateData
                                    }
                                    /** Update user status*/
                                    UserModel.updateOneUser(req, res, optionObj).then(updateResponse => {
                                        req.flash(STATUS_SUCCESS, res.__("admin.user.your_password_has_been_reset_successfully"));
                                        res.send({
                                            status: STATUS_SUCCESS,
                                            redirect_url: WEBSITE_ADMIN_URL + "login",
                                            message: res.__("admin.user.your_password_has_been_reset_successfully"),
                                        });
                                    })
                                }
                            });
                        }
                        catch (e) {
                            /** Send error response **/
                            res.send({
                                status: STATUS_ERROR,
                                message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                            });
                        }

                    }).catch(next);

                } else {
                    /** Send error response **/
                    res.send({
                        status: STATUS_ERROR,
                        message: [{ "param": "confirm_password", "msg": res.__("admin.user.link_expired_or_wrong_link") }],
                    });
                }
            }
            else {
                try {
                    /** Get user details **/
                    let validateString = (req.query.validate_string) ? req.query.validate_string : "";

                    let condition = {
                        forgot_password_validate_string: validateString
                    }

                    let optionObj = {
                        conditions: condition
                    }

                    UserModel.getUserDetails(optionObj).then(response => {

                        let result = (response.result) ? response.result : "";

                        if (result) {
                            /** Render reset password page **/
                            res.render("reset_password", {
                                validate_string: validateString
                            });
                        }
                        else {
                            /** Send error response **/
                            req.flash(STATUS_ERROR, res.__("admin.user.link_expired_or_wrong_link"));
                            res.redirect(WEBSITE_ADMIN_URL + "login");
                        }
                    });

                }
                catch (e) {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.user.link_expired_or_wrong_link"));
                    res.redirect(WEBSITE_ADMIN_URL + "login");
                }
            }
        }
        else {
            /** Send error response **/
            req.flash("error", res.__("admin.user.link_expired_or_wrong_link"));
            res.redirect(WEBSITE_ADMIN_URL + "login");
        }
    };//End resetPassword()

    /********************************* ADMIN Section End *********************/



    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getUserList = (req, res) => {
        let statusType = (req.query.type) ? req.query.type : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";


        //let statusType	= (req.params.type)			? 	req.params.type			:"";

        if (!userType) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        if (![CUSTOMER_USER_TYPE, SERVICE_PROVIDER_USER_TYPE, FRNCHIES_USER_TYPE].includes(userType)) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }


        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;

            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;


            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                /** Set conditions **/
                let commonConditions = {
                    is_deleted: NOT_DELETED,
                    user_role_id: FRONT_ADMIN_ROLE_ID,
                    user_type: userType
                };

                exportCommonConditions = dataTableConfig.conditions;
                exportFilterConditions = dataTableConfig.conditions;
                exportSortConditions = dataTableConfig.sort_conditions;

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else if (formdata.name == "status" || formdata.name == "gender") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else if (formdata.name == "registration_date") {

                            } else if (formdata.name == "rating") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);

                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
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
                const today = new Date();
                let conditions = [{
                    $facet: {
                        "user_list": [
                            { $match: dataTableConfig.conditions },
                            {
                                $lookup: {
                                    from: TABLE_CITY,
                                    let: { city_id: "$city_id" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [{ $eq: ["$_id", "$$city_id"] }]
                                                }
                                            }
                                        }
                                    ],
                                    as: "cityDetail"
                                }
                            },

                            {
                                $project: {
                                    _id: 1,
                                    full_name: 1,
                                    email: 1,
                                    is_email_verified: 1,
                                    is_mobile_verified: 1,
                                    account_type: 1,
                                    status: 1,
                                    is_blocked: 1,
                                    is_deleted: 1,
                                    created: 1,
                                    slug: 1,
                                    wallet_amount: 1,
                                    total_points: 1,
                                    profile_image: 1,
                                    mobile_number: 1,
                                    rating: { $ifNull: ["$rating", 0] },
                                    city_name: { $ifNull: [{ $arrayElemAt: ["$cityDetail.city_name", 0] }, "N/A"] },

                                }
                            },
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit },

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
                ]
            };
            getDropdownList(req, res, options).then(response => {

                let commonConditions = {
                    is_deleted: NOT_DELETED,
                    user_role_id: FRONT_ADMIN_ROLE_ID,
                    user_type: userType
                };
                let conditions = [
                    { $match: commonConditions },
                    {
                        $group: {
                            _id: "$city_id",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $match: {
                            _id: { $ne: null }
                        }
                    },
                    {
                        $lookup: {
                            from: TABLE_CITY,
                            let: { city_id: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [{ $eq: ["$_id", "$$city_id"] }]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        city_name: 1
                                    }
                                }
                            ],
                            as: "cityDetail"
                        }
                    },
                    {
                        $match: {
                            cityDetail: { $ne: [] }
                        }
                    },
                    {
                        $project: {
                            city_id: "$_id",
                            city_name: { $ifNull: [{ $arrayElemAt: ["$cityDetail.city_name", 0] }, "N/A"] },
                            count: 1
                        }
                    }
                ];

                let optionObj = {
                    conditions: conditions
                };

                UserModel.userAggregateResult(req, res, optionObj).then(userResponse => {

                    req.breadcrumbs(BREADCRUMBS["admin/users/list"]);
                    res.render("list", {
                        lang_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                        city_list: (userResponse && userResponse.result && userResponse.result) ? userResponse.result : [],
                        status_type: statusType,
                        user_type: userType,
                        dynamic_variable: toTitleCase(userType),
                        dynamic_url: userType,
                    });
                });
            });
        }
    };//End getUserList()


    /**
     * Function for add  user's Detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addUser = (req, res, next) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        if (!userType) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        if (isPost(req)) {
            req.body.user_role_id = FRONT_ADMIN_ROLE_ID
            req.body.request_from = REQUEST_FROM_ADMIN;
            req.body.is_mobile_verified = VERIFIED;
            req.body.is_email_verified = VERIFIED;
            /** Call user service function to add rider user**/
            userService.addUser(req, res, next).then(async (response) => {

                if (response.status == STATUS_ERROR_INVALID_ACCESS) {
                    /** Send error response  **/
                    res.send({
                        status: STATUS_ERROR,
                        redirect_url: WEBSITE_ADMIN_URL + "users/" + userType,
                        message: res.__("admin.system.something_going_wrong_please_try_again"),
                    });
                }
                /** Form validation Errors**/
                if (response.status == STATUS_ERROR_FORM_VALIDATION) {
                    /** parse Validation array  **/
                    let formErrors = (response.errors) ? response.errors : {};
                    let errors = parseValidation(formErrors, req);
                    /** Send error response **/
                    if (errors) return res.send({ status: STATUS_ERROR, message: errors });
                }


                /** Success Return**/
                if (response.status == STATUS_SUCCESS) {
                    let lastInsertId = (response.result.lastInsertId) ? response.result.lastInsertId : "";
                    let userTypeTitle = (response.result.userTypeTitle) ? response.result.userTypeTitle : "";
                    let email = (response.result.email) ? response.result.email : "";
                    let fullName = (response.result.fullName) ? response.result.fullName : "";
                    let messageStr = res.__("admin.user.user_has_been_added_successfully");

                    if (email != "") {
                        /******* Send mail to user *******/
                        /** Set options for send email **/
                        // let emailOptions = {
                        //     to: email,
                        //     action: "new_user_added_by_admin",
                        //     rep_array: [fullName, email, password]
                        // };
                        /** Send email **/
                        //sendMail(req, res, emailOptions);
                        /******* Send mail to user *******/
                    }

                    /***Start Send Notification**/
                    // let notificationMessageParams = [fullName];
                    // let notificationOptions = {
                    //     notification_data: {
                    //         notification_type: NOTIFICATION_NEW_USER_ADDED_BY_ADMIN,
                    //         message_params: notificationMessageParams,
                    //         parent_table_id: ADMIN_ID,
                    //         user_id: lastInsertId,
                    //         user_ids: [lastInsertId],
                    //         user_role_id: SUPER_ADMIN_ROLE_ID,
                    //         role_id: SUPER_ADMIN_ROLE_ID,
                    //         extra_parameters: {
                    //             user_id: new ObjectId(lastInsertId),
                    //         }
                    //     }
                    // };
                    //insertNotifications(req, res, notificationOptions).then(notificationResponse => { });

                    req.flash(STATUS_SUCCESS, messageStr);
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "users/" + userType,
                        message: messageStr,
                    });

                }
            });
        } else {

            let options = {
                collections: [
                    {
                        collection: TABLE_COUNTRY_CODE,
                        columns: ["dial_code", "dial_code"],
                        selected: [DEFAULT_COUNTRY_CODE],
                    },
                    {
                        collection: TABLE_COUNTRY,
                        columns: ["_id", "country_name"],
                        conditions: { status: ACTIVE },
                        sort_conditions: { country_name: 1 }
                    },
                    {
                        collection: TABLE_LANGUAGES,
                        columns: ["lang_code", "title"],
                        conditions: { active: ACTIVE },
                        sort_conditions: { lang_code: -1 }
                    },
                ]
            };
            getDropdownList(req, res, options).then(response => {
                /** Render add page **/

                req.breadcrumbs(BREADCRUMBS["admin/users/add"]);
                res.render("add", {
                    user_type: userType,
                    dynamic_variable: toTitleCase(userType),
                    dynamic_url: userType,
                    country_code_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                    country_list: (response && response.final_html_data && response.final_html_data["1"]) ? response.final_html_data["1"] : "",
                    lang_list: (response && response.final_html_data && response.final_html_data["2"]) ? response.final_html_data["2"] : "",

                });
            });
        }
    };//End addUser()


    /**
     * Function for add or edit user's Detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editUser = (req, res, next) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let isEditable = (req.params.id) ? true : false;
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        if (isPost(req)) {

            /** Sanitize Data **/
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

            req.body.id = (req.params.id) ? new ObjectId(req.params.id) : ObjectId();
            req.body.created_by = (req.session.user) ? req.session.user._id : "";
            req.body.user_type = userType;
            req.body.request_from = REQUEST_FROM_ADMIN;

            userService.editUser(req, res, next).then(response => {

                if (response.status == STATUS_ERROR_INVALID_ACCESS) {
                    /** Send error response  **/
                    res.send({
                        status: STATUS_ERROR,
                        redirect_url: WEBSITE_ADMIN_URL + "users/" + userType,
                        message: res.__("admin.system.something_going_wrong_please_try_again"),
                    });
                }
                /** Form validation Errors**/
                if (response.status == STATUS_ERROR_FORM_VALIDATION) {
                    /** parse Validation array  **/
                    let formErrors = (response.errors) ? response.errors : {};
                    let errors = parseValidation(formErrors, req);
                    /** Send error response **/
                    if (errors) return res.send({ status: STATUS_ERROR, message: errors });
                }

                /** Success Return**/
                if (response.status == STATUS_SUCCESS) {
                    let lastInsertId = (req.body.id) ? req.body.id : "";
                    let userTypeTitle = (req.body.user_type) ? req.body.user_type : "";
                    let mobileNumber = (req.body.mobileNumber) ? req.body.mobileNumber : "";
                    let fullName = (req.body.full_name) ? req.body.full_name : "";
                    let user = 'User';
                    let messageStr = res.__("admin.user.user_details_has_been_updated_successfully", user);

                    /***Start Send Notification
                    let notificationMessageParams = [fullName];
                    let notificationOptions = {
                        notification_data: {
                            notification_type: NOTIFICATION_NEW_USER_ADDED_BY_ADMIN,
                            message_params: notificationMessageParams,
                            parent_table_id: ADMIN_ID,
                            user_id: lastInsertId,
                            user_ids: [lastInsertId],
                            user_role_id: SUPER_ADMIN_ROLE_ID,
                            role_id: SUPER_ADMIN_ROLE_ID,
                            extra_parameters: {
                                user_id: new ObjectId(lastInsertId),
                            }
                        }
                    };**/
                    //insertNotifications(req, res, notificationOptions).then(notificationResponse => { });
                    req.flash(STATUS_SUCCESS, messageStr);
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "users/" + userType,
                        message: messageStr,
                    });

                }
            });
        } else {
            /** Get user details **/
            let conditionsObj = { _id: userId };

            let optionObj = {
                conditions: conditionsObj,
                collection: TABLE_USERS,
                fields: {},
            }
            UserModel.getUserDetails(optionObj).then(response => {

                if (response.status != STATUS_SUCCESS) {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, response.message);
                    res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                    return;
                }

                let profile_image = (response.result) ? response.result.profile_image : "";

                let country_code = response.result.mobile_code;
                let countryId = response.result.country_id;
                let stateId = response.result.state_id;
                let cityId = response.result.city_id;
                let language = (response.result && response.result.language) ? response.result.language : "";


                let options = {
                    collections: [
                        {
                            collection: "country_code",
                            columns: ["dial_code", "dial_code"],
                            selected: [country_code],
                        },
                        {
                            collection: TABLE_COUNTRY,
                            columns: ["_id", "country_name"],
                            conditions: { status: ACTIVE },
                            selected: [countryId],
                        },
                        {
                            collection: TABLE_STATES,
                            columns: ["_id", "state_name"],
                            conditions: { status: ACTIVE, country_id: countryId },
                            selected: [stateId],
                        },
                        {
                            collection: TABLE_CITY,
                            columns: ["_id", "city_name"],
                            conditions: { status: ACTIVE, state_id: stateId },
                            selected: [cityId],
                        },
                        {
                            collection: TABLE_LANGUAGES,
                            columns: ["lang_code", "title"],
                            conditions: { active: ACTIVE },
                            sort_conditions: { lang_code: -1 },
                            selected: [language],
                        }

                    ]
                };

                getDropdownList(req, res, options).then(async (responseData) => {
                    /** Render edit page **/
                    req.breadcrumbs(BREADCRUMBS["admin/users/edit"]);
                    res.render("edit", {
                        country_code_list: (responseData && responseData.final_html_data && responseData.final_html_data["0"]) ? responseData.final_html_data["0"] : "",
                        country_list: (responseData && responseData.final_html_data && responseData.final_html_data["1"]) ? responseData.final_html_data["1"] : "",
                        state_list: (responseData && responseData.final_html_data && responseData.final_html_data["2"]) ? responseData.final_html_data["2"] : "",
                        city_list: (responseData && responseData.final_html_data && responseData.final_html_data["3"]) ? responseData.final_html_data["3"] : "",
                        lang_list: (responseData && responseData.final_html_data && responseData.final_html_data["4"]) ? responseData.final_html_data["4"] : "",

                        result: (response.result) ? response.result : {},
                        user_type: userType,
                        dynamic_variable: toTitleCase(userType),
                        dynamic_url: userType,
                        is_editable: isEditable,
                        user_id: userId,
                        profile_image: (profile_image) ? profile_image : "",
                        image_url: USERS_URL,
                    });
                });
            }).catch(next);
        }
    };//End addEditUser()


    /**
     * Function for view user's Detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render
     */
    this.viewUserDetails = (req, res, next) => {
        let userId = (req.params.id) ? req.params.id : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;

        if (!userId) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        let matchCondition = {
            _id: new ObjectId(userId)
        }


        let lookupForFranchiseOfServiceProvider = []
        let projectFieldsObject = {}
        if (userType == SERVICE_PROVIDER_USER_TYPE) {

            const today = new Date();


            projectFieldsObject = {
                rating: 1,
                rating_count: 1,

            }

        }

        let projectFields = {
            _id: 1,
            // first_name: 1,
            // last_name: 1,
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
            b2b_code_details: 1,
            company_id: 1,
            country_name: { $arrayElemAt: ["$countryDetail.country_name", 0] },
            state_name: { $arrayElemAt: ["$stateDetail.state_name", 0] },
            city_name: { $arrayElemAt: ["$cityDetail.city_name", 0] },
            lang_name: { $arrayElemAt: ["$langDetail.title", 0] },


            ...(userType == SERVICE_PROVIDER_USER_TYPE ? projectFieldsObject : {})
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
            }, {
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
            ...(userType == SERVICE_PROVIDER_USER_TYPE ? lookupForFranchiseOfServiceProvider : []),
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
                if (result.is_deleted == DELETED) {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.user.this_user_is_deleted_from_the_system", userTypeTitle.toLowerCase()));
                    res.redirect(WEBSITE_ADMIN_URL + "users/all");
                    return;
                }
                /** Set options for append image full path **/
                let options = {
                    "file_url": USERS_URL,
                    "file_path": USERS_FILE_PATH,
                    "result": [result],
                    "database_field": "profile_image"
                };

                /** Append image with full path **/
                appendFileExistData(options).then(async fileResponse => {

                    // Get the count of assigned orders (both store and service) for a specific service provider
                    let assignOrderResult = await OrderModel.getOrderCount({
                        conditions: {
                            service_provider_id: new ObjectId(userId), // Filter by service provider ID
                            $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }], // Either store or service booking
                            status: { $ne: BOOKING_STATUS_CANCELLED } // Exclude cancelled orders
                        }
                    });

                    let assignOrderCount = (assignOrderResult.result) ? assignOrderResult.result : 0; // Default to 0 if no result

                    // Get the count of completed orders (both store and service) for a specific service provider
                    let completeOrderResult = await OrderModel.getOrderCount({
                        conditions: {
                            service_provider_id: new ObjectId(userId), // Filter by service provider ID
                            $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }], // Either store or service booking
                            status: BOOKING_STATUS_COMPLETED // Only completed orders
                        }
                    });

                    let completeOrderCount = (completeOrderResult.result) ? completeOrderResult.result : 0; // Default to 0 if no result



                    /** Render view page*/
                    req.breadcrumbs(BREADCRUMBS["admin/users/view"]);
                    res.render("view", {
                        //result				:	result[0],
                        result: (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {},
                        user_type: userType,
                        dynamic_variable: toTitleCase(userType),
                        dynamic_url: userType,
                        language: language,
                        assignOrderCount,
                        completeOrderCount,
                    });

                });
            } else {
                req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
                return res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
            }
        });
    };//End viewUserDetails()


    /**
     * Function for update user's status
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.updateUserStatus = (req, res, next) => {
        let userId = (req.params.id) ? req.params.id : "";
        let userStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";

        if (!userId || !statusType || (statusType != ACTIVE_INACTIVE_STATUS && statusType != VERIFIED_STATUS)) {
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

        if (statusType == ACTIVE_INACTIVE_STATUS) {
            updateData["$set"]["status"] = (userStatus == ACTIVE) ? DEACTIVE : ACTIVE;
        } else if (statusType == VERIFIED_STATUS) {
            updateData["$unset"] = {};
            updateData["$set"]["is_verified"] = VERIFIED;
            updateData["$unset"]["validate_string"] = 1;
        }

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
                let message = (statusType == VERIFIED_STATUS) ? res.__("admin.user.user_has_been_verified_successfully", "user") : res.__("admin.user.user_status_has_been_updated_successfully", "user");
                req.flash(STATUS_SUCCESS, message);
                res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
            } else {
                let message = res.__("admin.system.something_going_wrong_please_try_again");
                req.flash(STATUS_SUCCESS, message);
                res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
            }
        });
    };//End updateUserStatus()


    /**
     * Function to send new login credentials to user
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.sendLoginCredentials = (req, res, next) => {
        let userId = (req.params.id) ? req.params.id : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";

        if (!userType || !userId) {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        let condition = {
            _id: new ObjectId(userId)
        }

        let optionObj = {
            conditions: condition,
            fields: {}
        }

        /** Get user details **/
        UserModel.getUserDetails(optionObj).then(response => {
            if (response.status != STATUS_SUCCESS || !response.result) {
                /** Send error response  **/
                req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
                res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                return;
            }

            /** Generate random string for password **/
            getRandomString(req, res, null).then(randomResponse => {
                if (randomResponse.status != STATUS_SUCCESS) {
                    /** Send error response  **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                    return;
                }

                /** Generate new password **/
                let password = (randomResponse.result) ? randomResponse.result : "";
                let newpassword = crypto.createHash('md5').update(password).digest("hex");

                /** Update password **/

                let updateData = {
                    password: newpassword,
                    modified: getUtcDate()
                }

                let updateObj = {
                    conditions: condition,
                    updateData: { $set: updateData }
                }

                UserModel.findAndupdateOneUser(req, res, updateObj).then(updateResponse => {
                    let status = (updateResponse.status) ? updateResponse.status : "";
                    let userResult = (updateResponse.result) ? updateResponse.result : {};
                    if (status == STATUS_SUCCESS) {
                        /************ Send reset password mail *************/

                        let userEmail = (userResult.email) ? userResult.email : "";
                        let userName = (userResult.full_name) ? userResult.full_name : "";
                        let mobileNumber = (userResult.mobile_number) ? userResult.mobile_number : "";
                        /** Set requested data for send email **/
                        let emailRequestedData = {
                            to: userEmail,
                            action: "send_login_credentials",
                            rep_array: [userName, mobileNumber, password]
                        };

                        /** Send email **/
                        sendMail(req, res, emailRequestedData);
                        /************ Send reset password mail *************/

                        req.flash(STATUS_SUCCESS, res.__("admin.user.login_credentials_send_successfully"));
                        res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                    } else {
                        /** Send error response  **/
                        req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                    }
                });
            });
        });
    };//End sendLoginCredentials()


    /**
     * Function for delete User 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.deleteUser = (req, res, next) => {
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";

        if (!userId) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
            return;
        }
        else {

            /** Set update data **/
            let updateData = {
                $set: {
                    is_deleted: DELETED,
                    modified: getUtcDate()
                }
            };

            let condition = {
                _id: userId
            }

            let optionObj = {
                conditions: condition,
                updateData: updateData
            }

            UserModel.updateOneUser(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {


                    let optionForUser = {
                        collection: TABLE_USERS,
                        conditions: { _id: userId },
                    }

                    DbClass.getFindOne(optionForUser).then((userResponse) => {
                        let userData = (userResponse?.result) || {}
                        let userType = (userData?.user_type) ? userData.user_type : '';

                        let message = res.__("admin.user.user_deleted_successfully");
                        req.flash(STATUS_SUCCESS, message);
                        res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);

                    });
                }
                else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + "users/" + userType);
                }
            });
        }
    }


















































    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getUserWalletList = async (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }


        if (isPost(req)) {

            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;

            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                /** Set conditions **/
                let commonConditions = {
                    'user_id': userId,
                };

                exportWalletCommonConditions = dataTableConfig.conditions;

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }

                    });

                    if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
                }

                let conditions = [{
                    $facet: {
                        "wallet_list": [
                            { $match: dataTableConfig.conditions },
                            {
                                $project: {
                                    _id: 1, amount: 1, type: 1, message: 1, total_balance_after_transaction: 1, transaction_id: 1, order_number: 1, created: 1, note: 1
                                }
                            },
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit },
                        ],
                        "all_count": [
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
                        "filter_count": [
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

                UserModel.getWalletTransationAggregateList(req, res, optionObj).then(userResponse => {
                    let responseStatus = (userResponse.status) ? userResponse.status : "";
                    let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";

                    let wallet_list = (responseResult && responseResult.wallet_list) ? responseResult.wallet_list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: wallet_list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })
            });
        } else {
            const options = {
                collection: TABLE_USERS,
                conditions: [
                    { $match: { _id: userId } },
                    {
                        $project: {
                            full_name: { $ifNull: ["$full_name", "N/A"] },
                            email: { $ifNull: ["$email", "N/A"] },
                            mobile_number: { $ifNull: ["$mobile_number", "N/A"] },
                            wallet_status: { $ifNull: ["$wallet_status", DEACTIVE] }
                        }
                    }
                ]
            };

            const [userDetails] = await Promise.all([
                DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
            ]);



            req.breadcrumbs(BREADCRUMBS["admin/users/view_wallet_list"]);
            res.render("view_wallet_history", {
                user_type: userType,
                user_details: userDetails,
                user_id: userId,
                dynamic_variable: toTitleCase(userType),
                dynamic_url: userType,
            });
        }
    };//End getUserWalletList()


    /**
     * Function for export User Wallet History
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.exportUserWalletHistory = async (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        let conditionsexp = exportWalletCommonConditions;
        conditionsexp.user_id = userId;

        let conditions = [{
            $facet: {
                "wallet_list": [
                    { $match: conditionsexp },
                    {
                        $lookup: {
                            from: TABLE_USERS,
                            localField: 'user_id',
                            foreignField: '_id',
                            as: "userdetails",
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: 1,
                            amount: 1,
                            type: 1,
                            message: 1,
                            total_balance_after_transaction: 1,
                            created: 1,
                            note: 1,
                            transaction_id: 1,
                            order_number: 1,
                            user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
                            user_email: { $arrayElemAt: ["$userdetails.email", 0] },
                            mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] }
                        }
                    },
                    { $sort: { 'created': 1 } },
                ],
                "all_count": [
                    { $match: conditionsexp },
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
                "filter_count": [
                    { $match: conditionsexp },
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

        UserModel.getWalletTransationAggregateList(req, res, optionObj).then(userResponse => {

            let responseStatus = (userResponse.status) ? userResponse.status : "";
            let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
            let result = (responseResult && responseResult.wallet_list) ? responseResult.wallet_list : [];

            /**Set variable for export */
            let temp = [];
            /** Define excel heading label **/
            let commonColls = [
                res.__("admin.system.user_name"),
                res.__("admin.user.email"),
                res.__("admin.user.mobile_number"),
                res.__("admin.wallet.transaction_id"),
                res.__("admin.wallet.order_number"),
                res.__("admin.user.amount"),
                res.__("admin.wallet.type"),
                res.__("admin.wallet.message"),
                res.__("admin.wallet.total_balance_after_transaction"),
                res.__("admin.wallet.reason"),
                res.__("admin.system.created"),
            ];
            if (result && result.length > 0) {
                result.map(records => {
                    let buffer = [
                        (records.user_name) ? records.user_name : "N/A",
                        (records.user_email) ? records.user_email : "N/A",
                        (records.mobile_number) ? records.mobile_number : "N/A",
                        (records.transaction_id) ? records.transaction_id : "N/A",
                        (records.order_number) ? records.order_number : "N/A",
                        (records.amount) ? records.amount : "N/A",
                        (records.type) ? toTitleCase(records.type) : "N/A",
                        (records.message) ? records.message : "N/A",
                        (records.total_balance_after_transaction) ? records.total_balance_after_transaction : "N/A",
                        (records.note) ? records.note : "N/A",
                        (records.created) ? newDate(records.created, DATE_TIME_FORMAT_EXPORT) : "",
                    ];
                    temp.push(buffer);
                });
            }

            /**  Function to export data in excel format **/
            exportToExcel(req, res, {
                file_prefix: "User_Wallet_Report",
                heading_columns: commonColls,
                export_data: temp
            });
        })
    };//End exportUserWalletHistory()


    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addAmountUserWallet = (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";
        let adminId = (req?.session?.user?._id) ? new ObjectId(req.session.user._id) : "";
        const asyncParallel = require("async/parallel");

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        if (isPost(req)) {
            let amount = req.body.amount ? parseFloat(req.body.amount).toFixed('2') : '';
            let note = req.body.note ? req.body.note.trim() : '';


            asyncParallel({
                user_data: (callback) => {
                    let options = {
                        collection: TABLE_USERS,
                        conditions: { _id: userId },
                    }
                    DbClass.getFindOne(options).then((response) => {
                        callback(null, (response?.result) || {})
                    })
                },
                transaction_id_data: (callback) => {
                    getUniqueWalletTransactionId(req, res).then(response => {
                        if (response.status == STATUS_ERROR) {
                            return callback(response.message || res.__("system.something_going_wrong_please_try_again"), null)
                        }

                        callback(null, response.result)
                    })
                }
            }, (asyncError, asyncResponse) => {

                // })

                // DbClass.getFindOne(options).then((response)=>{
                let userData = (asyncResponse?.user_data) || {}
                let walletAmount = (userData?.wallet_amount) ? userData.wallet_amount : '';
                let transaction_id = (asyncResponse?.transaction_id_data) || '';

                let totalUserWalletAmount = Number(walletAmount) + Number(amount)

                asyncParallel({
                    save_wallet_transaction: (callback) => {
                        /**save wallet amount */
                        GiftTransactionModel.saveWalletTransactionLogs(req, res, {
                            insertData: {
                                'user_id': userId,
                                'amount': Number(amount),
                                'note': note,
                                'type': AMOUNT_CREDIT,
                                'transaction_id': transaction_id,
                                'transaction_type': ADDED_BY_ADMIN,
                                'total_balance_after_transaction': totalUserWalletAmount,
                                'message': res.__("admin.wallet.created_by_administrator"),
                                'amount_added_by': adminId,
                                'created': getUtcDate()
                            }
                        }).then(result => {
                            callback(null, null)
                        })
                    },
                    update_user: (callback) => {
                        let options = {
                            'collection': TABLE_USERS,
                            'conditions': { _id: userId },
                            'updateData': {
                                $set: { 'wallet_amount': Number(totalUserWalletAmount), 'modified': getUtcDate() }
                            },
                        }

                        DbClass.updateOneRecord(req, res, options).then(result => {
                            callback(null, null)
                        })
                    }
                }, (asyncErr, asyncRes) => {


                    UserModel.getUserDetails({
                        conditions: { _id: userId },
                        fields: { _id: 1, full_name: 1, email: 1 },
                    }).then(async userRes => {
                        if (userRes || userRes.status != STATUS_SUCCESS || !userRes.result) {

                            let fullName = (userRes.result.full_name) ? userRes.result.full_name : "";
                            let email = (userRes.result.email) ? userRes.result.email : "";

                            let notificationOptions = {
                                notification_data: {
                                    notification_type: NOTIFICATION_TO_USER_FOR_ADMIN_ADD_WALLET_AMOUNT,
                                    message_params: [fullName, Number(amount)],
                                    user_id: userId,
                                    user_ids: [userId],
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: adminId
                                }
                            };

                            /**send booking notification to user */
                            await insertNotifications(req, res, notificationOptions);


                            let pushNotificationOptionsUser = {
                                notification_data: {
                                    notification_type: PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_ADD_WALLET_AMOUNT,
                                    message_params: [fullName, Number(amount)],
                                    user_id: userId,
                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                    role_id: FRONT_ADMIN_ROLE_ID,
                                    created_by: adminId
                                }
                            };

                            /**send checkout push notification to user */
                            await pushNotification(req, res, pushNotificationOptionsUser);


                            let emailOptions = {
                                to: email,
                                action: "admin_add_wallet_amount",
                                rep_array: [fullName, Number(amount)],
                            };
                            sendMail(req, res, emailOptions);



                            res.send({
                                status: STATUS_SUCCESS,
                                message: res.__("admin.wallet.amount_has_been_added_to_wallet")
                            })
                        }
                    });


                })

            })
        } else {
            /** Render add/edit page  **/
            res.render('add_wallet_amount', {
                layout: false,
                user_type: userType,
                user_id: userId,
            });
        }
    }// end addAmountUserWallet()

    /**
    * Function for update customer wallet status
    *
    * @param req 	As Request Data
    * @param res 	As Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return null
    */
    this.changeWalletStatus = (req, res, next) => {
        let userId = (req.params.id) ? req.params.id : "";
        let walletStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let adminId = (req?.session?.user?._id) ? new ObjectId(req.session.user._id) : "";
        if (!userId || !statusType || (statusType != ACTIVE_INACTIVE_STATUS)) {
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

        if (statusType == ACTIVE_INACTIVE_STATUS) {
            updateData["$set"]["wallet_status"] = (walletStatus == ACTIVE) ? DEACTIVE : ACTIVE;
        }

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

                UserModel.getUserDetails({
                    conditions: { _id: new ObjectId(userId) },
                    fields: { _id: 1, full_name: 1, email: 1 },
                }).then(async userRes => {
                    if (userRes || userRes.status != STATUS_SUCCESS || !userRes.result) {

                        let fullName = (userRes.result.full_name) ? userRes.result.full_name : "";
                        let email = (userRes.result.email) ? userRes.result.email : "";

                        let statusMessage = (walletStatus == ACTIVE) ? res.__("admin.wallet.deactive") : res.__("admin.wallet.active");

                        let notificationOptions = {
                            notification_data: {
                                notification_type: NOTIFICATION_TO_USER_FOR_ADMIN_CHANGE_WALLET_STATUS,
                                message_params: [fullName, statusMessage],
                                user_id: userId,
                                user_ids: [userId],
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: adminId
                            }
                        };

                        /**send booking notification to user */
                        await insertNotifications(req, res, notificationOptions);



                        let pushNotificationOptions = {
                            notification_data: {
                                notification_type: PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_CHANGE_WALLET_STATUS,
                                message_params: [fullName, statusMessage],
                                user_id: userId,
                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                role_id: FRONT_ADMIN_ROLE_ID,
                                created_by: adminId
                            }
                        };
                        await pushNotification(req, res, pushNotificationOptions);


                        let emailOptions = {
                            to: email,
                            action: "change_wallet_status",
                            rep_array: [fullName, statusMessage],
                        };
                        sendMail(req, res, emailOptions);





                        let message = (walletStatus == ACTIVE) ? res.__("admin.wallet.customer_wallet_has_been_deactive") : res.__("admin.wallet.customer_wallet_has_been_active");
                        req.flash(STATUS_SUCCESS, message);
                        res.redirect(WEBSITE_ADMIN_URL + "users/" + userType + '/view-wallet-history/' + userId);
                    }
                });


            } else {
                let message = res.__("admin.system.something_going_wrong_please_try_again");
                req.flash(STATUS_SUCCESS, message);
                res.redirect(WEBSITE_ADMIN_URL + "users/" + userType + '/view-wallet-history/' + userId);
            }
        });
    };//End changeWalletStatus()


    /**
     * Function for get points list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getUserPointsList = async (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }


        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;

            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                /** Set conditions **/
                let commonConditions = {
                    'user_id': userId,
                };

                exportPointCommonConditions = dataTableConfig.conditions;

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);


                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }

                        }

                    });

                    if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
                }

                let conditions = [{
                    $facet: {
                        "point_list": [
                            {
                                $project: {
                                    _id: 1,
                                    points: 1,
                                    user_id: 1,
                                    order_id: 1,
                                    is_redeem: 1,
                                    total_user_points: 1,
                                    total_selling_amount: 1,
                                    total_balance_for_points: 1,
                                    total_amount_for_points: 1,
                                    total_redeem_points: 1,
                                    total_redeem_amount: 1,
                                    created: 1,
                                    modified: 1,
                                    order_number: 1,
                                }
                            },
                            { $match: dataTableConfig.conditions },
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        "all_count": [
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
                        "filter_count": [
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    localField: "order_id", // Using franchise_id from TABLE_FRANCHISE_CONTRACTS
                                    foreignField: "_id", // Matching with _id in TABLE_USERS
                                    as: "order_detail"
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    points: 1,
                                    user_id: 1,
                                    order_id: 1,
                                    is_redeem: 1,
                                    total_selling_amount: 1,
                                    total_balance_for_points: 1,
                                    total_amount_for_points: 1,
                                    total_redeem_points: 1,
                                    total_redeem_amount: 1,
                                    created: 1,
                                    modified: 1,
                                    order_number: { $arrayElemAt: ["$order_detail.order_number", 0] }
                                }
                            },
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

                UserModel.getPointsAggregateList(req, res, optionObj).then(userResponse => {
                    let responseStatus = (userResponse.status) ? userResponse.status : "";
                    let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";

                    let point_list = (responseResult && responseResult.point_list) ? responseResult.point_list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: point_list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })
            });
        } else {
            const options = {
                collection: TABLE_USERS,
                conditions: [
                    { $match: { _id: userId } },
                    {
                        $project: {
                            full_name: { $ifNull: ["$full_name", "N/A"] },
                            email: { $ifNull: ["$email", "N/A"] },
                            mobile_number: { $ifNull: ["$mobile_number", "N/A"] }
                        }
                    }
                ]
            };

            const [userDetails] = await Promise.all([
                DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
            ]);
            req.breadcrumbs(BREADCRUMBS["admin/users/view_points_list"]);
            res.render("view_points_list", {
                user_type: userType,
                user_id: userId,
                user_details: userDetails,
                dynamic_variable: toTitleCase(userType),
                dynamic_url: userId,
            });
        }
    };//End getUserList()


    /**
     * Function for export User Points List
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.exportUserPointsList = async (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        let conditionsexp = exportPointCommonConditions;
        conditionsexp.user_id = userId;

        let conditions = [{
            $facet: {

                "point_list": [
                    { $match: conditionsexp },
                    {
                        $lookup: {
                            from: TABLE_USERS,
                            localField: 'user_id',
                            foreignField: '_id',
                            as: "userdetails",
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            points: 1,
                            user_id: 1,
                            order_id: 1,
                            is_redeem: 1,
                            total_user_points: 1,
                            total_selling_amount: 1,
                            total_balance_for_points: 1,
                            total_amount_for_points: 1,
                            total_redeem_points: 1,
                            total_redeem_amount: 1,
                            created: 1,
                            modified: 1,
                            order_number: 1,
                            user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
                            user_email: { $arrayElemAt: ["$userdetails.email", 0] },
                            mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] }
                        }
                    },
                    { $sort: { 'created': -1 } },
                ],
            }
        }];

        let optionObj = {
            conditions: conditions
        }

        UserModel.getPointsAggregateList(req, res, optionObj).then(userResponse => {

            let responseStatus = (userResponse.status) ? userResponse.status : "";
            let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
            let result = (responseResult && responseResult.point_list) ? responseResult.point_list : [];

            /**Set variable for export */
            let temp = [];
            /** Define excel heading label **/
            let commonColls = [
                res.__("admin.system.user_name"),
                res.__("admin.user.email"),
                res.__("admin.user.mobile_number"),
                res.__("admin.admin.user_point.order_number"),
                res.__("admin.user_point.type"),
                res.__("admin.user_point.point"),
                res.__("admin.user_point.amount"),
                res.__("admin.user_point.balance"),
                res.__("admin.system.created"),
            ];
            if (result && result.length > 0) {
                result.map(records => {

                    let showing_point = records.points;
                    if (records.is_redeem == 1) {
                        showing_point = records.total_redeem_points;
                    }

                    let buffer = [
                        (records.user_name) ? records.user_name : "N/A",
                        (records.user_email) ? records.user_email : "N/A",
                        (records.mobile_number) ? records.mobile_number : "N/A",
                        (records.order_number) ? records.order_number : "N/A",
                        (records.is_redeem) ? 'Redeem' : "Credit",
                        (records.total_selling_amount) ? records.total_selling_amount : "N/A",
                        showing_point,
                        (records.total_user_points) ? records.total_user_points : "N/A",
                        (records.created) ? newDate(records.created, DATE_TIME_FORMAT_EXPORT) : "",
                    ];
                    temp.push(buffer);
                });
            }

            /**  Function to export data in excel format **/
            exportToExcel(req, res, {
                file_prefix: "User_Point_Report",
                heading_columns: commonColls,
                export_data: temp
            });
        })
    };//End exportUserPointsList()


    /**
     * Function for get user subscription list 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getUserSubscriptionList = async (req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId = (req.params.id) ? new ObjectId(req.params.id) : "";

        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }

        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;

            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                /** Set conditions **/
                let commonConditions = {
                    'user_id': userId,
                };

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }

                        }

                    });

                    if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
                }

                let conditions = [{
                    $facet: {
                        "subscription_list": [
                            { $match: dataTableConfig.conditions },
                            { $sort: dataTableConfig.sort_conditions },
                            { $limit: limit },
                            { $skip: skip },
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
                                $project: {
                                    _id: 1,
                                    subscription_image: 1,
                                    subscription_video: 1,
                                    subscription_name: 1,
                                    car_type: 1,
                                    duration: 1,
                                    price: 1,
                                    slug: 1,
                                    total_service: 1,
                                    validity_period: 1,
                                    short_description: 1,
                                    description: 1,
                                    order_id: 1,
                                    start_date: 1,
                                    end_date: 1,
                                    status: 1,
                                    modified: 1,
                                    created: 1,
                                    total_booking_used: { $size: "$bookingdetails" }
                                }
                            }
                        ],
                        "all_count": [
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
                        "filter_count": [
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

                UserModel.getAggregateUserSubscription(req, res, optionObj).then(userResponse => {
                    let responseStatus = (userResponse.status) ? userResponse.status : "";
                    let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";

                    let subscription_list = (responseResult && responseResult.subscription_list) ? responseResult.subscription_list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;


                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: subscription_list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })
            });
        }
        else {
            const options = {
                collection: TABLE_USERS,
                conditions: [
                    { $match: { _id: userId } },
                    {
                        $project: {
                            full_name: { $ifNull: ["$full_name", "N/A"] },
                            email: { $ifNull: ["$email", "N/A"] },
                            mobile_number: { $ifNull: ["$mobile_number", "N/A"] }
                        }
                    }
                ]
            };

            const [userDetails] = await Promise.all([
                DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
            ]);


            req.breadcrumbs(BREADCRUMBS["admin/users/view_subscription_list"]);
            res.render("subscription_list", {
                user_type: userType,
                user_id: userId,
                user_details: userDetails,
                dynamic_variable: toTitleCase(userType),
                dynamic_url: userType,
                image_url: SUBSCRIPTION_URL
            });
        }
    };//End getUserList()




}
module.exports = new UserController();
