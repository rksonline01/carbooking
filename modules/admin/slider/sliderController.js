const SliderModel = require("./model/sliderModel");
const { ObjectId } = require('mongodb');
const clone = require('clone');

function Sliders() {

    /**
     * Function to get sms logs list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getSliderList = (req, res, next) => {
        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let search_data = req.body.search_data;

            /** Configure Datatable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

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
                                    $project: {
                                        _id: 1, image: 1, is_active: 1, is_deleted: 1, created: 1, title: 1, sub_title: 1, order_number: 1, label_text: 1
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

                SliderModel.getAggregateSliderList(req, res, optionObj).then(sliderResponse => {
                    let responseStatus = (sliderResponse.status) ? sliderResponse.status : "";
                    let responseResult = (sliderResponse.result && sliderResponse.result[0]) ? sliderResponse.result[0] : "";

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
            req.breadcrumbs(BREADCRUMBS['admin/slider/list']);
            res.render('list', {
                image_url: SLIDERS_URL
            });
        }
    };//End getSliderList()


    /**
     * Function for addSlider
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addSlider = (req, res, next) => {
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

                req.body.order_number = allData.order_number;
                req.body.start_time = allData.start_time;
                req.body.end_time = allData.end_time;
                req.body.redirect_link = allData.redirect_link;
                req.body.status = allData.status;
                
             

                let screenTitle = (req.body.title) ? req.body.title : "";
                let screenSubTitle = (req.body.sub_title) ? req.body.sub_title : "";
                let screenOrderNumber = (req.body.order_number) ? req.body.order_number : "";
                let startTime = (req.body.start_time) ? req.body.start_time : "";
                let endTime = (req.body.end_time) ? req.body.end_time : "";
                let redirectLink = (req.body.redirect_link) ? req.body.redirect_link : "";
                let status = (req.body.status) ? parseInt(req.body.status) : ACTIVE;
                let screenLabelText = (req.body.label_text) ? req.body.label_text : "";

                if (screenLabelText != "") {
                    req.body.body = screenLabelText.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
                }

                /** parse Validation array  */
                let errMessageArray = [];

                if ((typeof req.files == typeof undefined) || (!req.files) || (typeof req.files.image == typeof undefined)) {

                    errMessageArray.push({ 'param': 'image', 'msg': res.__("admin.slider.please_select_image") });
                }

                if (errMessageArray.length == 0) {
                    /** Set options for upload image **/
                    let image = (req.files && req.files.image) ? req.files.image : "";
                    let options = {
                        'image': image,
                        'filePath': SLIDER_FILE_PATH
                    };

                    /** Upload image **/
                    var imageName = '';
                    moveUploadedFile(req, res, options).then(response => {                     
                    
                        if (response.status == STATUS_ERROR) {
                            errMessageArray.push({ 'param': 'image', 'msg': response.message });
                        } else {
                            imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                        }

                        if (errMessageArray.length > 0) {
                            /** Send error response **/
                            return res.send({
                                status: STATUS_ERROR,
                                message: errMessageArray,
                            });
                        }

                        /** Set slug options **/
                        let slugOptions = {
                            title: screenTitle,
                            table_name: TABLE_SLIDER,
                            slug_field: "title"
                        };

                        /** Make slugs */
                        getDatabaseSlug(slugOptions).then(slugResponse => {

                            let insertData = {
                                slug: (slugResponse && slugResponse.title) ? slugResponse.title : "",
                                title: screenTitle,
                                sub_title: screenSubTitle,
                                order_number: parseInt(screenOrderNumber),
                                label_text: screenLabelText,
                                image: imageName,
                                default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
                                pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
                                is_deleted: NOT_DELETED,
                                start_time: startTime,
                                end_time: endTime,
                                redirect_link: redirectLink,
                                is_active: status,
                                created: getUtcDate(),
                                modified: getUtcDate()
                            }

                            let options = {
                                insertData: insertData
                            }

                            SliderModel.addSliderData(req, res, options).then(sliderResponse => {
                                if (sliderResponse.status == STATUS_SUCCESS) {
                                    req.flash(STATUS_SUCCESS, res.__("admin.slider.slider_has_been_added_successfully"));
                                    res.send({
                                        status: STATUS_SUCCESS,
                                        redirect_url: WEBSITE_ADMIN_URL + 'slider',
                                        message: res.__("admin.slider.slider_has_been_added_successfully")
                                    });
                                } else {
                                    /** Send error response **/
                                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                                    res.redirect(WEBSITE_ADMIN_URL + 'slider/add');
                                    return;
                                }
                            })

                        }).catch(next);

                    }).catch(next);
                }
            } else {

                /** Get language list */
                getLanguages().then(languageList => {
                    req.breadcrumbs(BREADCRUMBS['admin/slider/add']);
                    /**Render add slider page */
                    res.render('add', {
                        language_list: languageList
                    });
                }).catch(next);

            }
        });

    }


    /**
     * Function to update Slider detail
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editSlider = (req, res, next) => {
        let sliderId = (req.params.id) ? req.params.id : "";
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

                req.body.order_number = allData.order_number;
                req.body.start_time = allData.start_time;
                req.body.end_time = allData.end_time;
                req.body.redirect_link = allData.redirect_link;
                req.body.status = allData.status;

                req.body.old_image = allData.old_image;

                let oldimage = (req.body.old_image) ? req.body.old_image : "";
                let screenTitle = (req.body.title) ? req.body.title : "";
                let screenSubTitle = (req.body.sub_title) ? req.body.sub_title : "";
                let screenOrderNumber = (req.body.order_number) ? req.body.order_number : "";
                let startTime = (req.body.start_time) ? req.body.start_time : "";
                let endTime = (req.body.end_time) ? req.body.end_time : "";
                let redirectLink = (req.body.redirect_link) ? req.body.redirect_link : "";
                let status = (req.body.status) ? parseInt(req.body.status) : ACTIVE;
                let screenLabelText = (req.body.label_text) ? req.body.label_text : "";

                if (screenLabelText != "") {
                    req.body.body = screenLabelText.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
                }
                /** Set options for upload image **/
                let image = (req.files && req.files.image) ? req.files.image : "";
                let options = {
                    'image': image,
                    'filePath': SLIDER_FILE_PATH,
                    'oldPath': oldimage
                };

                /** Upload  image **/
                var imageName = '';

                moveUploadedFile(req, res, options).then(response => {


                    let errMessageArray = [];
                    if (response.status == STATUS_ERROR) {
                        errMessageArray.push({ 'param': 'image', 'msg': response.message });
                    } else {
                        imageName = (typeof response.fileName !== typeof undefined) ? response.fileName : '';
                    }

                    if (errMessageArray.length > 0) {
                        /** Send error response **/
                        return res.send({
                            status: STATUS_ERROR,
                            message: errMessageArray,
                        });
                    }

                    /** Update slider record */
                    let updateData = {
                        title: screenTitle,
                        sub_title: screenSubTitle,
                        order_number: parseInt(screenOrderNumber),
                        label_text: screenLabelText,
                        default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
                        pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
                        image: imageName,
                        start_time: startTime,
                        end_time: endTime,
                        redirect_link: redirectLink,
                        is_active: status,
                        modified: getUtcDate()
                    }

                    let updateCondition = {
                        _id: new ObjectId(sliderId)
                    };


                    let options = {
                        conditions: updateCondition,
                        updateData: { $set: updateData }
                    }

                    SliderModel.updateOneSlider(req, res, options).then(updateResponse => {
                        if (updateResponse.status == STATUS_SUCCESS) {
                            req.flash(STATUS_SUCCESS, res.__("admin.slider.slider_has_been_updated_successfully"));
                            res.send({
                                status: STATUS_SUCCESS,
                                redirect_url: WEBSITE_ADMIN_URL + 'slider',
                                message: res.__("admin.slider.slider_has_been_updated_successfully"),
                            });
                        } else {
                            let message = res.__("admin.system.something_going_wrong_please_try_again");
                            req.flash(STATUS_ERROR, message);
                            res.redirect(WEBSITE_ADMIN_URL + 'slider/edit');
                            return;
                        }
                    });
                }).catch(next);
            } else {
                /** Get language list **/
                getLanguages().then(languageList => {

                    let detailConditions = {
                        _id: new ObjectId(sliderId)
                    };
                    let options = {
                        conditions: detailConditions
                    }

                    SliderModel.SliderDetails(req, res, options).then(testmonialResponse => {
                        if (testmonialResponse == STATUS_ERROR) {
                            /** Send error response **/
                            req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                            res.redirect(WEBSITE_ADMIN_URL + "slider");

                        } else {

                            let details = (testmonialResponse.result) ? testmonialResponse.result : {};
                            let sliderImage = (details.image) ? details.image : "";

                            /** Render edit page **/
                            req.breadcrumbs(BREADCRUMBS["admin/slider/edit"]);
                            res.render('edit', {
                                result: details,
                                image_url: SLIDERS_URL,
                                slider_image: sliderImage,
                                language_list	:	languageList,

                            });

                        }
                    })
                })

            }
        });
    }


    /**
     * Function for update slider's status
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return null
     */
    this.updateSliderStatus = (req, res, next) => {
        let sliderStatus = (req.params.status) ? req.params.status : "";
        let statusType = (req.params.status_type) ? req.params.status_type : "";
        let sliderId = (req.params.id) ? req.params.id : "";

        if (!sliderId || !statusType || (statusType != ACTIVE_INACTIVE_STATUS)) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "blog/list");
            return;
        } else {

            /** Set update data **/
            let updateData = {
                $set: {
                    modified: getUtcDate()
                }
            };

            if (statusType == ACTIVE_INACTIVE_STATUS) {
                updateData["$set"]["is_active"] = (sliderStatus == ACTIVE) ? DEACTIVE : ACTIVE;
            }

            let condition = {
                _id: new ObjectId(sliderId)
            }

            let optionObj = {
                conditions: condition,
                updateData: updateData
            }

            SliderModel.updateOneSlider(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.slider.slider_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + "slider");

                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + "slider");
                }
            });

        }

    };//End updateSliderStatus()




    /**
     * Function for delete slider's
     *
     * @param req 	As Request Data
     * @param res 	As Response Data
     * @param next 	As Callback argument to the middleware function
     *
     * @return null
     */
    this.deleteSlider = (req, res, next) => {
        let sliderId = (req.params.id) ? req.params.id : "";

        if (!sliderId) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "slider");
            return;
        } else {

            /** Set update data **/
            let updateData = {
                $set: {
                    is_deleted: DELETED,
                    modified: getUtcDate()
                }
            };

            let condition = {
                _id: new ObjectId(sliderId)
            }

            let optionObj = {
                conditions: condition,
                updateData : updateData
            }

            SliderModel.updateOneSlider(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.slider.slider_has_been_deleted_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + "slider");

                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + "slider");
                }
            });

        }

    };//End deleteSlider()




    /**
     * Function for update order number status
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.changeOrderNumber = (req, res, next) => {
        let masterId = (req.body.id) ? req.body.id : "";
        let priority = (req.body.new_priority) ? req.body.new_priority : ""
        var error = 0;
        var message = "";
        var isPriority = Number.isInteger(Number(priority));
        if (priority == "") {
            error = 1;
            message = "Please enter order number.";
        } else if (isNaN(priority)) {
            error = 1;
            message = "Order number should be numeric";
        } else if (priority < ACTIVE) {
            error = 1;
            message = "Order number should be greater than zero";
        } else if (isPriority == false) {
            error = 1;
            message = "Order number should be an integer";
        }

        if (error == 1) {
            res.send({
                status: STATUS_ERROR,
                message: message,
            });
        } else {
            /** Update master status **/
            let updateCondition = {
                _id: new ObjectId(masterId)
            }

            let updateData = {
                order_number: parseInt(priority),
            }

            let optionObj = {
                conditions: updateCondition,
                updateData: { $set: updateData }
            };

            SliderModel.updateOneSlider(req, res, optionObj).then(updateMasterResponse => {
                if (updateMasterResponse.status === STATUS_SUCCESS) {
                    /** Send success response **/
                    message = res.__("Order number has been updated successfully");
                    res.send({
                        status: STATUS_SUCCESS,
                        message: message,
                    });
                } else {
                    /** Send success response **/
                    res.send({
                        status: STATUS_SUCCESS,
                        message: res.__("admin.system.something_going_wrong_please_try_again"),
                    });
                }
            });
        }
    };// end changeOrderNumber()
}
module.exports = new Sliders();
