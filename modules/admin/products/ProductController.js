const ProductModel = require("./model/ProductModel");
const { ObjectId } = require('mongodb');
const CategoryModel = require("../category/model/category")
const dbClass = require('../../../classes/dbClass');
const ffmpeg = require('fluent-ffmpeg');
function ProductContoller() {

    /**
     * Function for get product list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getProductList = (req, res) => {
        if (isPost(req)) {

            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let productTitle = (req.body.product_title) ? req.body.product_title : "";
            let fromDate = (req.body.from_date) ? req.body.from_date : "";
            let toDate = (req.body.to_date) ? req.body.to_date : "";
            let statusSearch = (req.body.status_search) ? req.body.status_search : "";



            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                /** Set conditions **/
                let commonConditions = {
                    "is_deleted": NOT_DELETED
                };


                if (productTitle != "") {
                    dataTableConfig.conditions["product_title"] = { "$regex": productTitle, "$options": "i" };
                }

                if (fromDate != "" && toDate != "") {
                    dataTableConfig.conditions["created"] = {
                        $gte: newDate(fromDate),
                        $lte: newDate(toDate),
                    }
                }

                if (statusSearch != "") {

                    if (statusSearch == ACTIVE) {
                        dataTableConfig.conditions["is_active"] = ACTIVE;
                    } else {
                        dataTableConfig.conditions["is_active"] = DEACTIVE;
                    }

                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

                let conditions = [{
                    $facet: {
                        product_list: [
                            { $match: dataTableConfig.conditions },
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: 'user_id',
                                    foreignField: '_id',
                                    as: 'userdetails'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    main_image_name: 1,
                                    slug: 1,
                                    product_title: 1,
                                    description: 1,
                                    parent_category_name: 1,
                                    sub_category_1_name: 1,
                                    sub_category_2_name: 1,
                                    quantity: 1,
                                    is_sold: 1,
                                    is_active: 1,
                                    is_block: 1,
                                    status: 1,
                                    created: 1,
                                    user_name: { "$arrayElemAt": ["$userdetails.full_name", 0] }
                                }
                            },

                        ],
                        all_count: [
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
                        filter_count: [
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

                ProductModel.getProductAggregateList(req, res, optionObj).then(productResponse => {
                    let responseStatus = (productResponse.status) ? productResponse.status : "";
                    let responseResult = (productResponse.result && productResponse.result[0]) ? productResponse.result[0] : "";

                    let product_list = (responseResult && responseResult.product_list) ? responseResult.product_list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: product_list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                    });
                })
            });
        } else {
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
            res.render('list', {
                image_path: PRODUCT_URL,
            });
        }
    }

    /**
     * Function for get product add
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.productAdd = (req, res) => {
        let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
        if (isPost(req)) {
            req.body.slug = (req.session.user.slug) ? req.session.user.slug : "admin";
            ProductModel.saveProduct(req, res).then(saveResponse => {

                if (saveResponse.status == STATUS_ERROR) {
                    res.send({
                        status: STATUS_ERROR,
                        message: saveResponse.message
                    });
                } else {
                    req.flash(STATUS_SUCCESS, saveResponse.message);
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "products/",
                        message: saveResponse.message,
                    });
                }

            })

        } else {

            req.body.lang_code = language;

            CategoryModel.getParentCategory(req, res).then(parentCategoryResponse => {
                if (parentCategoryResponse.status == STATUS_SUCCESS) {
                    /** Get language list */
                    getLanguages().then(languageList => {
                        /** render listing page **/
                        req.breadcrumbs(BREADCRUMBS["admin/products/add"]);
                        res.render('add', {
                            parent_category: parentCategoryResponse.result,
                            language_list: languageList,
                        });
                    });
                } else {
                    /** Send error response **/
                    req.flash("error", parentCategoryResponse.message);
                    res.redirect(WEBSITE_ADMIN_URL + "products");
                    return;
                }

            })

        }
    }


    /**
     * Function for get sub category list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getSubCategoryList = (req, res) => {
        let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
        let categoryId = (req.body.parent_id) ? req.body.parent_id : "";
        if (categoryId) {
            req.body.lang_code = language;
            CategoryModel.getSubCategory(req, res).then(categoryResponse => {
                if (categoryResponse.status == STATUS_SUCCESS) {
                    /** Get language list */
                    res.send({
                        status: STATUS_SUCCESS,
                        result: categoryResponse.result
                    });
                } else {
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }

            })
        } else {
            return res.send({
                status: STATUS_ERROR,
                message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
            });
        }

    }

    /**
     * Function for get attribute list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getAttributeOptionList = (req, res) => {
        let language = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
        let categoryId = (req.body.category_id) ? req.body.category_id : "";
        if (categoryId) {
            req.body.lang_code = language;
            ProductModel.getAttributesAndOptions(req, res).then(attributeOptionResponse => {
                if (attributeOptionResponse.status == STATUS_SUCCESS) {
                    /** Get language list */
                    res.send({
                        status: STATUS_SUCCESS,
                        result: attributeOptionResponse.result
                    });
                } else {
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }

            })
        } else {
            return res.send({
                status: STATUS_ERROR,
                message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
            });
        }

    }


    /**
     * Function for get product details
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.viewProductDetail = (req, res, next) => {
        let productId = (req.params.id) ? req.params.id : "";
        if (!productId) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "products");
            return;
        } else {

            /** Get details **/
            let conditions = [
                { $match: { _id: new ObjectId(productId) } },
                {
                    $lookup: {
                        from: TABLE_USERS,
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'userdetails'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        main_image_name: 1,
                        images: 1,
                        slug: 1,
                        product_title: 1,
                        product_sku: 1,
                        detailed_description: 1,
                        brief_description: 1,
                        parent_category_name: 1,
                        sub_category_1_name: 1,
                        sub_category_2_name: 1,
                        price_without_discount: 1,
                        pages_descriptions: 1,
                        price: 1,
                        vat_included: 1,
                        attribute: 1,
                        quantity: 1,
                        is_sold: 1,
                        is_active: 1,
                        is_block: 1,
                        status: 1,
                        created: 1,
                        user_name: { "$arrayElemAt": ["$userdetails.full_name", 0] }
                    }
                }
            ];

            let options = {
                'conditions': conditions
            };

            ProductModel.getProductAggregateList(req, res, options).then(detailResponse => {
                let detailStatus = (detailResponse.status) ? detailResponse.status : "";
                let productDetail = (detailResponse.result && detailResponse.result[0]) ? detailResponse.result[0] : {};
                if (detailStatus == STATUS_SUCCESS) {
                    req.breadcrumbs(BREADCRUMBS['admin/products/view']);
                    /** Render view page*/
                    res.render('view', {
                        result: productDetail,
                        image_url: PRODUCT_URL,
                    });
                } else {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "products");
                }
            })

        }

    }


    /**
     * Function for update product status
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.updateProductStatus = (req, res, next) => {
        let productId = (req.params.id) ? req.params.id : "";
        let productStatus = (req.params.status) ? req.params.status : "";

        if (!productId) {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "products");
            return;
        } else {

            /** Set update data **/
            let updateData = {
                $set: {
                    is_active: (productStatus == ACTIVE) ? DEACTIVE : ACTIVE,
                    modified: getUtcDate()
                }
            };


            let condition = {
                _id: new ObjectId(productId)
            }

            let optionObj = {
                conditions: condition,
                updateData: updateData
            }

            ProductModel.updateOneProduct(req, res, optionObj).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.product.product_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + "products");
                } else {
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL + "products");
                }
            });

        }

    }

    /**
    * Function for update product 
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    this.productEdit = (req, res) => {
        let productId = (req.params.id) ? req.params.id : '';
        if (productId) {
            if (isPost(req)) {
                req.body.id = productId
                ProductModel.updateProduct(req, res).then(updateResponse => {
                    if (updateResponse.status == STATUS_ERROR) {
                        res.send({
                            status: STATUS_ERROR,
                            message: updateResponse.message
                        });
                    } else {
                        req.flash(STATUS_SUCCESS, updateResponse.message);
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + "products/",
                            message: updateResponse.message,
                        });
                    }
                })

            } else {
                let productConditions = {
                    _id: new ObjectId(productId)
                };
                let productDetailOption = {
                    conditions: productConditions
                };
                ProductModel.productFindOne(productDetailOption).then(detailResponse => {
                    if (detailResponse.status == STATUS_ERROR) {
                        /** Send error response **/
                        req.flash("error", res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "products");
                        return;
                    } else {
                        let productDetail = (detailResponse.result) ? detailResponse.result : {};
                        let options = {
                            collections: [
                                {
                                    collection: TABLE_CATEGORIES,
                                    columns: ["_id", "category_name"],
                                    selected: [productDetail.parent_category],
                                    conditions: {
                                        status: ACTIVE
                                    }
                                }
                            ]
                        };
                        getDropdownList(req, res, options).then(response => {
                            getLanguages().then(languageList => {
                                /** render listing page **/
                                req.breadcrumbs(BREADCRUMBS["admin/products/edit"]);
                                res.render("edit", {
                                    productDetail: productDetail,
                                    parent_category: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                                    language_list: languageList
                                });
                            });
                        });
                    }
                })
            }
        } else {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "products");
            return;
        }
    }

    this.getSearchProductList = (req, res) => {
        let serachKeyword = (req.params.term) ? req.params.term : "";
        let user_id = (req.session.user._id) ? req.session.user._id : "";
        let condition = {
            "product_title": { "$regex": serachKeyword, "$options": "i" },
            "user_id": new ObjectId(user_id)
        }
        let option = {
            conditions: condition,
            fields: { _id: 1, product_title: 1 }
        }
        ProductModel.productFindAllList(option).then(productListResponse => {
            if (productListResponse.status == STATUS_ERROR) {
                return res.send({
                    status: STATUS_ERROR,
                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                });
            } else {
                res.send({
                    status: STATUS_SUCCESS,
                    result: productListResponse.result
                });
            }
        })
    }

    this.getSearchProductDetail = (req, res) => {
        let productId = (req.body.product_id) ? req.body.product_id : "";
        let condition = {
            _id: new ObjectId(productId)
        }
        let option = {
            conditions: condition,
        }
        ProductModel.productFindOne(option).then(productDetailResponse => {
            if (productDetailResponse.status == STATUS_ERROR) {
                return res.send({
                    status: STATUS_ERROR,
                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                });
            } else {
                res.send({
                    status: STATUS_SUCCESS,
                    result: productDetailResponse.result
                });
            }
        })
    }

    this.addProductVideo = (req, res) => {


        let productId = (req.params.id) ? req.params.id : '';
        if (isPost(req)) {
            let video = (req.files && req.files.product_video) ? req.files.product_video : "";

            let videoOptions = {
                'image': video,
                'allowedExtensions': ALLOWED_VIDEO_EXTENSIONS,
                'allowedImageError': ALLOWED_VIDEO_ERROR_MESSAGE,
                'allowedMimeTypes': ALLOWED_VIDEO_MIME_EXTENSIONS,
                'allowedMimeError': ALLOWED_VIDEO_MIME_ERROR_MESSAGE,
                'filePath': PRODUCT_FILE_PATH,
            };

            moveUploadedFile(req, res, videoOptions).then(videoResponse => {

                if (videoResponse.status == STATUS_ERROR) {
                    res.send({
                        status: STATUS_ERROR,
                        message: videoResponse.message
                    });
                }
                let videoName = (videoResponse.fileName) ? videoResponse.fileName : '';


                let videoNameWithoutExtension = videoName.split('.').slice(0, -1).join('.');
                let audioFilePath = PRODUCT_FILE_PATH + "abc" + '.mp3';

                // Conversion
                ffmpeg(PRODUCT_FILE_PATH + videoNameWithoutExtension)
                    .noVideo() // remove video stream
                    .audioCodec('libmp3lame') // specify audio codec
                    .on('end', function () {
                        console.log('Conversion finished');
                    })
                    .on('error', function (err) {
                        console.error('Error during conversion:', err);
                    })
                    .save(audioFilePath);

                let options = {
                    insertData: {
                        product_id: new ObjectId(productId),
                        video_name: videoName,
                    },
                    collection: TABLE_PRODUCT_VIDEO
                };

                dbClass.saveInsertOne(req, res, options).then(response => {
                    if (response.status == STATUS_SUCCESS) {
                        req.flash(STATUS_SUCCESS, 'Video uploaded.');
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + "products/",
                            message: 'Video uploaded.',
                        });
                    } else {
                        res.send({
                            status: STATUS_ERROR,
                            message: res.__("admin.system.something_going_wrong_please_try_again")
                        });
                    }
                })

            });

        } else {
            res.render("add_video");
        }
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
    this.stockManage = async (req, res) => {
        var adminUser = (req.session.user) ? req.session.user : {};
        var adminUserId = new ObjectId(adminUser._id);

        if (isPost(req)) {

            let quantity = (req.body.quantity) ? Number(req.body.quantity) : '';
            let productId = (req.body.product_id) ? new ObjectId(req.body.product_id) : '';
            let action = (req.body.action) ? req.body.action : '';

            let condition = {
                _id: productId
            }
            let option = {
                conditions: condition,
            }
            ProductModel.productFindOne(option).then(productDetailResponse => {
                if (productDetailResponse.status == STATUS_ERROR) {
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                } else {


                    let product_quantity = (productDetailResponse.result.quantity) ? Number(productDetailResponse.result.quantity) : 0;

                    let new_product_quantity = null;

                    let note = "";
                    if (action === ADD) {
                        new_product_quantity = product_quantity + quantity;
                        note = res.__("admin.system.add_product_by_admin");

                    } else {

                        new_product_quantity = product_quantity - quantity;
                        note = res.__("admin.system.remove_product_by_admin")
                    }

                    /** Set update data **/
                    let updateData = {
                        $set: {
                            quantity: new_product_quantity,
                            modified: getUtcDate()
                        }
                    };
                    let condition = {
                        _id: productId
                    }

                    let optionObj = {
                        conditions: condition,
                        updateData: updateData
                    }

                    ProductModel.updateOneProduct(req, res, optionObj).then(updateResponse => {
                        if (updateResponse.status == STATUS_SUCCESS) {
                            let optionObj = {
                                insertData: {
                                    create_by: adminUserId,
                                    product_id: productId,
                                    post_quantity: product_quantity,
                                    new_quantity: new_product_quantity,
                                    quantity: quantity,
                                    action: action,
                                    note: note,
                                    created: getUtcDate(),
                                    modified: getUtcDate(),
                                }
                            }

                            ProductModel.saveOneStockLog(req, res, optionObj).then(saveResponse => {

                                if (saveResponse.status == STATUS_ERROR) {
                                    res.send({
                                        status: STATUS_ERROR,
                                        message: saveResponse.message
                                    });
                                } else {

                                    let message = res.__("admin.product.product_quantity_updated_successfully");
                                    req.flash(STATUS_SUCCESS, message);
                                    res.send({
                                        status: STATUS_SUCCESS,
                                        message: message
                                    });
                                }
                            })

                        } else {
                            let message = res.__("admin.system.something_going_wrong_please_try_again");
                            req.flash(STATUS_ERROR, message);
                            res.redirect(WEBSITE_ADMIN_URL + "products");
                        }
                    });
                }
            })
        }
    }




}
module.exports = new ProductContoller();