const { ObjectId } = require('mongodb');
var async = require('async');
const ProductModel = require("../../../admin/products/model/ProductModel");
const CategoryModel = require("../../../admin/category/model/category");
const CategoryController = require("../../../admin/category/CategoryController");

function Product() {


    /**
     * Function for get product list
     *  We can get all products or filter by category.
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getProductList = (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let parentCategory = (req.body.parent_category) ? new ObjectId(req.body.parent_category) : "";

        /** Common Conditons */
        let commonConditions = {
            is_deleted: NOT_DELETED,
            is_active: ACTIVE,
            quantity:{$gte : ACTIVE}
        };

        if(parentCategory != ""){
            commonConditions['parent_category'] = parentCategory;
        }

        /** Product list condition */
        let conditions = [{
            $facet: {
                "product_list": [
                    { $match: commonConditions },
                    { $sort: { "created": SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            id: 1,
                            parent_category:1,
                            main_image_name: 1,
                            price: 1,
							mrp_price : 1,
							offer_price : 1,
							offer_type : 1,
							vat_included : 1,
							product_sku : 1,
                            slug: 1,
                            quantity: 1,
                            average_rating: 1,
                            parent_category_name:{ $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".parent_category_name", ''] }, then: "$pages_descriptions." + langCode + ".parent_category_name", else: "$parent_category_name" } },
                            product_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".product_title", ''] }, then: "$pages_descriptions." + langCode + ".product_title", else: "$product_title" } },
                            brief_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".brief_description", ''] }, then: "$pages_descriptions." + langCode + ".bottom_content", else: "$brief_description" } }, 
                            detailed_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".detailed_description", ''] }, then: "$pages_descriptions." + langCode + ".detailed_description", else: "$detailed_description" } }, 
                            modified: 1,
                            pages_descriptions: 1
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
                    { $project: { _id: 0, count: 1 } }
                ],
            }
        }];

        let options = {
            conditions: conditions
        };
        /** Get product list */
        ProductModel.getProductAggregateList(req, res, options).then(productResponse => {
            let responseStatus = (productResponse.status) ? productResponse.status : "";

            if (responseStatus == STATUS_SUCCESS) {

                let responseResult = (productResponse.result && productResponse.result[0]) ? productResponse.result[0] : "";

                let productList = (responseResult && responseResult.product_list) ? responseResult.product_list : [];
                let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                /**send success response */
                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: productList,
                        total_record: totalRecord,
                        limit: limit,
                        skip: skip,
                        current_page: page,
                        total_page: Math.ceil(totalRecord / limit),
                        image_url: PRODUCT_URL,
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
                        image_url: PRODUCT_URL,
                        message: res.__("front.global.no_record_found")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

        });

    }


    /**
     * Function for get product detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getProductDetail = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : "";
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
                conditions: { slug: slug, is_active: ACTIVE, is_deleted: NOT_DELETED, quantity:{$gte : ACTIVE} },
                fields: {
                    id: 1,
					parent_category:1,
					main_image_name: 1,
					price: 1,
					product_sku: 1,
					mrp_price : 1,
					offer_price : 1,
					offer_type : 1,
					vat_included : 1, 
					slug: 1,
					quantity: 1,
					average_rating: 1,
					parent_category_name:{ $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".parent_category_name", ''] }, then: "$pages_descriptions." + langCode + ".parent_category_name", else: "$parent_category_name" } },
					product_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".product_title", ''] }, then: "$pages_descriptions." + langCode + ".product_title", else: "$product_title" } },
					brief_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".brief_description", ''] }, then: "$pages_descriptions." + langCode + ".bottom_content", else: "$brief_description" } }, 
					detailed_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".detailed_description", ''] }, then: "$pages_descriptions." + langCode + ".detailed_description", else: "$detailed_description" } }, 
					modified: 1,
					pages_descriptions: 1
                }
            }

            /** calling get product details function from product model */
            ProductModel.productFindOne(optionObj).then(detailResponse => {
                let detailStatus = (detailResponse.status) ? detailResponse.status : "";

                /** Send error response */
                if (detailStatus == STATUS_SUCCESS) {
                    let productDetail = (detailResponse.result && detailResponse.result) ? detailResponse.result : {};
                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: productDetail,
                            image_url: PRODUCT_URL,
                            message: ""
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                } else {

                    /** Send success response */
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: [],
                            image_url: PRODUCT_URL,
                            message: res.__("front.global.no_record_found")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
            });
        }
    }// End getProductDetail()


    /**
     * Function for get category list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getCategoryList = (req, res, next) => {
        let language = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let commonCondition = {
            "status": ACTIVE
        }

        let conditions = [{
            $facet: {
                "category_list": [
                    {
                        $graphLookup: {
                            from: TABLE_CATEGORIES,
                            startWith: "$parent_id",
                            connectFromField: "parent_id",
                            connectToField: "_id",
                            as: "parent_category",
                            maxDepth: 5 // Specify the maximum depth of the hierarchy
                        }

                    },
                    {
                        $project: {
                            _id: 1,
                            parent_id: 1,
                            category_name: { $cond: { if: { $ne: ["$pages_descriptions." + language + ".category_name", ''] }, then: "$pages_descriptions." + language + ".category_name", else: "$category_name" } },
                            parent_category: 1,
                            image: 1,
                            slug: 1,
                            status: 1,
                            modified: 1
                        }
                    },
                    { $match: commonCondition },
                    { $sort: { created: SORT_DESC } },
                    { $skip: skip },
                    { $limit: limit },

                ],
                "total_count": [
                    { $match: commonCondition },
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

        let optionObj = {
            conditions: conditions
        }

        CategoryModel.getCategoryAggregateList(req, res, optionObj).then(categoryResponse => {

            let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";

            if (responseStatus == STATUS_SUCCESS) {

                let responseResult = (categoryResponse.result && categoryResponse.result[0]) ? categoryResponse.result[0] : "";

                let category_list = (responseResult && responseResult.category_list) ? responseResult.category_list : [];
                let totalRecord = (responseResult && responseResult.total_count && responseResult.total_count[0] && responseResult.total_count[0]["count"]) ? responseResult.total_count[0]["count"] : DEACTIVE;

                CategoryController.formatCategoryList(category_list, language).then(formatedCategoryList => {

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: formatedCategoryList,
							image_url: CATEGORY_URL,
                            total_record: totalRecord,
                            limit: limit,
                            skip: skip,
                            current_page: page,
                            total_page: Math.ceil(totalRecord / limit),
                            message: "",
                        }
                    };
                    return returnApiResult(req, res, finalResponse);

                });

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


}

module.exports = new Product();