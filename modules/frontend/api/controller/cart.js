const { ObjectId } = require('mongodb');
var async = require('async');
const CartModel = require("../model/cartModel");
const ProductModel = require("../../../admin/products/model/ProductModel");
const PackageModel = require("../../../admin/package_management/model/Package");
const SubscriptionModel = require("../../../admin/subscription_management/model/Subscription");
const PromoCodeModel = require("../../../admin/promo_code/model/PromoCode")
const OrderModel = require('../model/orderModel');
const cartModel = require('../model/cartModel');
const UserModel = require("../model/userModel");

function Cart() {

    /**
     * Function for add to cart
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addToCart = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : "";
        let productId = (req.body.product_id) ? req.body.product_id : "";
        let isDirect = (req.body.is_direct) ? req.body.is_direct : "";
        let quantity = (req.body.quantity) ? parseInt(req.body.quantity) : "";
        let fromMySubscription = (req.body.from_my_subscription) ? parseInt(req.body.from_my_subscription) : null;

        let finalResponse = {};

        if (slug == "" || productId == "" || quantity == "") {
            /**send error response */
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };

            return returnApiResult(req, res, finalResponse);

        }
        else {

            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {

                let userId = (userResult._id) ? new ObjectId(userResult._id) : "";

                let options = {
                    conditions: { _id: new ObjectId(productId) },
                    fields: { "_id": 1, "product_title": 1, "quantity": 1 },
                }

                /**get product details */
                ProductModel.productFindOne(options).then(async productResponse => {
                    let productData = (productResponse.result) ? productResponse.result : "";

                    if (productData != "") {

                        let productQuantity = (productData.quantity) ? productData.quantity : DEACTIVE;
                        if (productQuantity < 1) {

                            let cartDetailResponse = await getCartDetail(req, res, userId);
                            let cartResponse = cartDetailResponse.result || {};

                            if (cartResponse.package_data) {
                                delete cartResponse.package_data;
                            }

                            if (cartResponse.subscription_data) {
                                delete cartResponse.subscription_data;
                            }

                            /**send error response */
                            finalResponse = {
                                'data': {
                                    status: STATUS_ERROR,
                                    result: cartResponse,
                                    message: res.__("front.cart.product_not_available")
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }
                        else {
                            let checkItemoptions = {
                                conditions: {
                                    user_id: userId,
                                    product_id: new ObjectId(productId),
                                    item_type: ITEM_TYPE_PRODUCT,
                                }
                            };

                            CartModel.getCartItemDetails(checkItemoptions).then(async cartItemsResponse => {
                                if (cartItemsResponse.status == STATUS_SUCCESS) {

                                    let cartDetailResponse = await getCartDetail(req, res, userId);
                                    let cartResponse = cartDetailResponse.result || {};

                                    if (cartResponse.package_data) {
                                        delete cartResponse.package_data;
                                    }

                                    if (cartResponse.subscription_data) {
                                        delete cartResponse.subscription_data;
                                    }

                                    /**send error response */
                                    finalResponse = {
                                        'data': {
                                            status: STATUS_ERROR,
                                            result: cartResponse,
                                            message: res.__("front.cart.item_already_exists_in_cart")
                                        }
                                    };
                                    return returnApiResult(req, res, finalResponse);
                                }

                                let cartItemsData = {
                                    user_id: userId,
                                    product_id: new ObjectId(productId),
                                    quantity: quantity,
                                    item_type: ITEM_TYPE_PRODUCT,
                                    created: getUtcDate(),
                                    modified: getUtcDate()
                                };

                                let options = {
                                    insertData: cartItemsData
                                }
                                /**save cart items data */
                                CartModel.saveCartItemsData(req, res, options).then(async cartItemsResponse => {
                                    if (cartItemsResponse.status == STATUS_SUCCESS) {


                                        /* DELETE SUBSCRIPTION ITEMS FROM CART  */
                                        let checkSubscriptionItemoptions = {
                                            conditions: {
                                                user_id: new ObjectId(userId),
                                                item_type: ITEM_TYPE_SUBSCRIPTION
                                            }
                                        };
                                        await CartModel.deleteCartItem(req, res, checkSubscriptionItemoptions);
                                        /* DELETE SUBSCRIPTION ITEMS FROM CART  */


                                        if (fromMySubscription) {
                                            /* DELETE PACKAGE And SUBSCRIPTION ITEMS FROM CART if booking from MySubscription */
                                            let checkPackageItemoptions = {
                                                conditions: {
                                                    user_id: new ObjectId(userId),
                                                    item_type: { $in: [ITEM_TYPE_PACKAGE, ITEM_TYPE_SUBSCRIPTION] }
                                                }
                                            };
                                            await CartModel.deleteCartItem(req, res, checkPackageItemoptions);
                                            /* DELETE PACKAGE ITEMS FROM CART  */
                                        }



                                        /** Set update data **/
                                        let updateData = {
                                            $set: { 'modified': getUtcDate() },
                                            $setOnInsert: { 'user_id': new ObjectId(userId), 'created': getUtcDate() }
                                        };

                                        let optionObj = {
                                            conditions: { "user_id": new ObjectId(userId) },
                                            updateData: updateData,
                                            upsertOption: { upsert: true },
                                        }
                                        /**save and update cart data */
                                        CartModel.updateCartData(req, res, optionObj).then(async updateResponse => {

                                            if (updateResponse.status == STATUS_SUCCESS) {

                                                /*  GET CART DETAILS, IF CART HAVE ANY PROMOCODE THEN CHECK IT AGAIN  */
                                                let cartDetail = await getCartDetail(req, res, userId);

                                                let optionsForCoupon = {
                                                    'user_result': userResult,
                                                    'user_id': userId,
                                                    'cart_detail': cartDetail,
                                                }

                                                let responseForCoupon = await checkB2BDiscountCodeORpromoCode(req, res, optionsForCoupon);

                                                let cartDetailResponse = await getCartDetail(req, res, userId);
                                                let cartResponse = cartDetailResponse.result || {};

                                                if (cartResponse.package_data) {
                                                    delete cartResponse.package_data;
                                                }

                                                if (cartResponse.subscription_data) {
                                                    delete cartResponse.subscription_data;
                                                }

                                                if (responseForCoupon.status == STATUS_SUCCESS) {
                                                    finalResponse = {
                                                        'data': {
                                                            status: STATUS_SUCCESS,
                                                            result: cartResponse,
                                                            message: res.__("front.product.successfully_added_to_cart")
                                                        }
                                                    };
                                                    return returnApiResult(req, res, finalResponse);
                                                }
                                                else {
                                                    finalResponse = {
                                                        'data': {
                                                            status: STATUS_SUCCESS,
                                                            result: cartResponse,
                                                            message: res.__("front.product.successfully_added_to_cart")
                                                        }
                                                    };
                                                    return returnApiResult(req, res, finalResponse);
                                                }
                                            }
                                            else {
                                                /**send error response */
                                                finalResponse = {
                                                    'data': {
                                                        status: STATUS_ERROR,
                                                        message: res.__("front.system.something_going_wrong_please_try_again")
                                                    }
                                                };
                                                return returnApiResult(req, res, finalResponse);
                                            }
                                        });

                                    }
                                    else {
                                        /**send error response */
                                        finalResponse = {
                                            'data': {
                                                status: STATUS_ERROR,
                                                message: res.__("front.system.something_going_wrong_please_try_again")
                                            }
                                        };
                                        return returnApiResult(req, res, finalResponse);
                                    }
                                });

                            });
                        }
                    }
                    else {
                        /**send error response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                message: res.__("front.system.something_going_wrong_please_try_again")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }
        }
    }


    /**
     * Function for add to cart
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addPackageToCart = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : "";
        let packageId = (req.body.package_id) ? req.body.package_id : "";
        let quantity = (req.body.quantity) ? parseInt(req.body.quantity) : 1;

        let finalResponse = {};

        if (slug == "" || packageId == "" || quantity == "") {
            /**send error response */
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);

        } else {

            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {

                let userId = (userResult._id) ? new ObjectId(userResult._id) : "";

                let options = {
                    conditions: { _id: new ObjectId(packageId), is_deleted: DEACTIVE, is_active: ACTIVE }
                }

                /**get product details */
                PackageModel.getPackageFindOne(options).then(packageResponse => {
                    let packageData = (packageResponse.result) ? packageResponse.result : "";

                    if (packageData != "") {

                        let checkItemoptions = {
                            conditions: {
                                user_id: userId,
                                item_type: { $in: [ITEM_TYPE_PACKAGE, ITEM_TYPE_SUBSCRIPTION] },
                            }
                        };

                        CartModel.getCartItemDetails(checkItemoptions).then(async cartItemsResponse => {
                            if (cartItemsResponse.status == STATUS_SUCCESS) {
                                await CartModel.deleteCartItem(req, res, checkItemoptions);
                            }

                            let cartItemsData = {
                                user_id: userId,
                                package_id: new ObjectId(packageId),
                                quantity: quantity,
                                item_type: ITEM_TYPE_PACKAGE,
                                created: getUtcDate(),
                                modified: getUtcDate()
                            };

                            let options = {
                                insertData: cartItemsData
                            }
                            /**save cart items data */
                            CartModel.saveCartItemsData(req, res, options).then(cartItemsResponse => {
                                if (cartItemsResponse.status == STATUS_SUCCESS) {
                                    /** Set update data **/
                                    let updateData = {
                                        $set: { 'modified': getUtcDate(), 'package_data': packageData },
                                        $setOnInsert: { 'user_id': new ObjectId(userId), 'created': getUtcDate() }
                                    };

                                    let optionObj = {
                                        conditions: { "user_id": new ObjectId(userId) },
                                        updateData: updateData,
                                        upsertOption: { upsert: true },
                                    }
                                    /**save and update cart data */
                                    CartModel.updateCartData(req, res, optionObj).then(async updateResponse => {
                                        if (updateResponse.status == STATUS_SUCCESS) {

                                            /*  GET CART DETAILS, IF CART HAVE ANY PROMOCODE THEN CHECK IT AGAIN  */
                                            let cartDetail = await getCartDetail(req, res, userId);

                                            let optionsForCoupon = {
                                                'user_result': userResult,
                                                'user_id': userId,
                                                'cart_detail': cartDetail,
                                            }

                                            let responseForCoupon = await checkB2BDiscountCodeORpromoCode(req, res, optionsForCoupon);

                                            let cartDetailResponse = await getCartDetail(req, res, userId);
                                            let cartResponse = cartDetailResponse.result || {};

                                            if (cartResponse.package_data) {
                                                delete cartResponse.package_data;
                                            }

                                            if (cartResponse.subscription_data) {
                                                delete cartResponse.subscription_data;
                                            }

                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_SUCCESS,
                                                    result: cartResponse
                                                }
                                            };
                                            return returnApiResult(req, res, finalResponse);
                                        }
                                        else {
                                            /**send error response */
                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_ERROR,
                                                    message: res.__("front.system.something_going_wrong_please_try_again")
                                                }
                                            };
                                            return returnApiResult(req, res, finalResponse);
                                        }
                                    });
                                }
                                else {
                                    /**send error response */
                                    finalResponse = {
                                        'data': {
                                            status: STATUS_ERROR,
                                            message: res.__("front.system.something_going_wrong_please_try_again")
                                        }
                                    };
                                    return returnApiResult(req, res, finalResponse);
                                }
                            });
                        });
                    }
                    else {
                        /**send error response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                message: res.__("front.system.something_going_wrong_please_try_again")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }
        }
    }


    /**
     * Function for add to cart
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addSubscriptionToCart = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : "";
        let subscriptionId = (req.body.subscription_id) ? req.body.subscription_id : "";
        let quantity = (req.body.quantity) ? parseInt(req.body.quantity) : 1;

        let finalResponse = {};

        if (slug == "" || subscriptionId == "" || quantity == "") {
            /**send error response */
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);

        } else {

            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {

                let userId = (userResult._id) ? new ObjectId(userResult._id) : "";

                let options = {
                    conditions: { _id: new ObjectId(subscriptionId), is_deleted: DEACTIVE, is_active: ACTIVE }
                }

                /**get product details */
                SubscriptionModel.getSubscriptionFindOne(options).then(subscriptionResponse => {
                    let subscriptionData = (subscriptionResponse.result) ? subscriptionResponse.result : "";
                    if (subscriptionData != "") {

                        let checkItemoptions = {
                            conditions: {
                                user_id: userId
                            }
                        };

                        CartModel.getCartItemDetails(checkItemoptions).then(async cartItemsResponse => {
                            if (cartItemsResponse.status == STATUS_SUCCESS) {
                                await emptyUserCart(req, res, userId);
                            }

                            let cartItemsData = {
                                user_id: userId,
                                subscription_id: new ObjectId(subscriptionId),
                                quantity: quantity,
                                item_type: ITEM_TYPE_SUBSCRIPTION,
                                created: getUtcDate(),
                                modified: getUtcDate()
                            };

                            let options = {
                                insertData: cartItemsData
                            }
                            /**save cart items data */
                            CartModel.saveCartItemsData(req, res, options).then(cartItemsResponse => {
                                if (cartItemsResponse.status == STATUS_SUCCESS) {
                                    /** Set update data **/
                                    let updateData = {
                                        $set: { 'modified': getUtcDate(), 'subscription_data': subscriptionData },
                                        $setOnInsert: { 'user_id': new ObjectId(userId), 'created': getUtcDate() }
                                    };

                                    let optionObj = {
                                        conditions: { "user_id": new ObjectId(userId) },
                                        updateData: updateData,
                                        upsertOption: { upsert: true },
                                    }
                                    /**save and update cart data */
                                    CartModel.updateCartData(req, res, optionObj).then(async updateResponse => {
                                        if (updateResponse.status == STATUS_SUCCESS) {

                                            /*  GET CART DETAILS, IF CART HAVE ANY PROMOCODE THEN CHECK IT AGAIN  */
                                            let cartDetail = await getCartDetail(req, res, userId);

                                            let optionsForCoupon = {
                                                'user_result': userResult,
                                                'user_id': userId,
                                                'cart_detail': cartDetail,
                                            }

                                            let responseForCoupon = await checkB2BDiscountCodeORpromoCode(req, res, optionsForCoupon);

                                            let cartDetailResponse = await getCartDetail(req, res, userId);
                                            let cartResponse = cartDetailResponse.result || {};

                                            if (cartResponse.package_data) {
                                                delete cartResponse.package_data;
                                            }

                                            if (cartResponse.subscription_data) {
                                                delete cartResponse.subscription_data;
                                            }

                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_SUCCESS,
                                                    result: cartResponse
                                                }
                                            };

                                            return returnApiResult(req, res, finalResponse);
                                        }
                                        else {
                                            /**send error response */
                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_ERROR,
                                                    message: res.__("front.system.something_going_wrong_please_try_again")
                                                }
                                            };
                                            return returnApiResult(req, res, finalResponse);
                                        }
                                    });
                                }
                                else {
                                    /**send error response */
                                    finalResponse = {
                                        'data': {
                                            status: STATUS_ERROR,
                                            message: res.__("front.system.something_going_wrong_please_try_again")
                                        }
                                    };
                                    return returnApiResult(req, res, finalResponse);
                                }
                            });

                        });
                    }
                });
            }
        }
    }


    /** 
     * function for get user cart data
     *
     * @param req	As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.getCartList = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : "";
        let languageCode = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

        let finalResponse = {};

        if (slug == "") {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);

        } else {

            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } else {
                let userId = (userResult._id) ? new ObjectId(userResult._id) : "";

                getCartDetail(req, res, userId).then(cartDetailResponse => {
                    if (cartDetailResponse.status == STATUS_ERROR) {
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: [],
                                message: res.__("front.global.no_record_found")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    } else {
                        let cartResponse = cartDetailResponse.result || {};

                        if (cartResponse.package_data) {
                            delete cartResponse.package_data;
                        }

                        if (cartResponse.subscription_data) {
                            delete cartResponse.subscription_data;
                        }

                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                result: cartDetailResponse.result,
                                message: ""
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                })
            }
        }
    };// getCartList


    /** 
     * function for remove from cart
     *
     * @param req	As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.removeFromCart = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let productId = (req.body.product_id) ? req.body.product_id : '';
        let slug = (req.body.slug) ? req.body.slug : '';

        let finalResponse = {};

        if (!productId || !slug) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {
            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";
            let userId = (userResult._id) ? new ObjectId(userResult._id) : "";

            let checkCartItemOptions = {
                conditions: {
                    user_id: new ObjectId(userId),
                    product_id: new ObjectId(productId),
                }
            };

            let cartItemDetail = await CartModel.getCartItemDetails(checkCartItemOptions);
            let cartItem = (cartItemDetail.result) ? cartItemDetail.result : "";
            let item_type = (cartItem.item_type) ? cartItem.item_type : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {

                let condition = {
                    product_id: new ObjectId(productId),
                    user_id: new ObjectId(userId)
                }

                let optionObj = {
                    conditions: condition,
                }
                /**function is used to delete cart item */
                CartModel.deleteCartItem(req, res, optionObj).then(deleteResponse => {
                    if (deleteResponse.status == STATUS_SUCCESS) {

                        let updateData = {
                            $set: { 'modified': getUtcDate() },
                        };

                        if (item_type == ITEM_TYPE_SUBSCRIPTION) {
                            updateData = {
                                $set: { 'modified': getUtcDate(), 'subscription_data': null },
                            };
                        }
                        else if (item_type == ITEM_TYPE_PACKAGE) {
                            updateData = {
                                $set: { 'modified': getUtcDate(), 'package_data': null },
                            };
                        }

                        let optionObj = {
                            conditions: { "user_id": new ObjectId(userId) },
                            updateData: updateData,
                        }

                        /**function is used to update cart data */
                        CartModel.updateCartData(req, res, optionObj).then(async updateResponse => {
                            if (updateResponse.status == STATUS_SUCCESS) {

                                /*  GET CART DETAILS, IF CART HAVE ANY PROMOCODE THEN CHECK IT AGAIN  */
                                let cartDetail = await getCartDetail(req, res, userId);


                                let optionsForCoupon = {
                                    'user_result': userResult,
                                    'user_id': userId,
                                    'cart_detail': cartDetail,
                                }

                                let responseForCoupon = await checkB2BDiscountCodeORpromoCode(req, res, optionsForCoupon);

                                let cartDetailResponse = await getCartDetail(req, res, userId);
                                let cartResponse = cartDetailResponse.result || {};

                                if (cartResponse.package_data) {
                                    delete cartResponse.package_data;
                                }

                                if (cartResponse.subscription_data) {
                                    delete cartResponse.subscription_data;
                                }

                                finalResponse = {
                                    'data': {
                                        status: STATUS_SUCCESS,
                                        result: cartResponse
                                    }
                                };

                                return returnApiResult(req, res, finalResponse);
                            }
                            else {
                                /**send error response */
                                finalResponse = {
                                    'data': {
                                        status: STATUS_ERROR,
                                        message: res.__("front.system.something_going_wrong_please_try_again")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            }
                        });
                    } else {
                        /**send error response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                message: res.__("front.system.something_going_wrong_please_try_again")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);

                    }
                });

            }
        }
    }; //End removeFromCart


    /** 
     * function for update cart
     *
     * @param req	As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.updateCartData = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let productId = (req.body.product_id) ? req.body.product_id : '';
        let slug = (req.body.slug) ? req.body.slug : '';
        let action = (req.body.action) ? req.body.action : '';

        let finalResponse = {};

        if (!productId || !slug || !action) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);

        } else {

            let optionObj = {
                conditions: { "slug": slug },
                fields: { "_id": 1 },
            }

            let userDetail = await getUserDetailBySlug(req, res, optionObj);
            let userResult = (userDetail.result) ? userDetail.result : "";

            if (userResult == "") {
                /**send error response */
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR_INVALID_ACCESS,
                        message: res.__("front.invalid_access")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {

                let userId = (userResult._id) ? new ObjectId(userResult._id) : "";


                let options = {
                    conditions: { _id: new ObjectId(productId) },
                    fields: { "_id": 1, "product_title": 1, "quantity": 1 },
                }

                /**get product details */
                ProductModel.productFindOne(options).then(async productResponse => {
                    let productData = (productResponse.result) ? productResponse.result : "";
                    let productQuantity = (productData.quantity) ? productData.quantity : DEACTIVE;
                    if (productQuantity < 1) {

                        let cartDetailResponse = await getCartDetail(req, res, userId);
                        let cartResponse = cartDetailResponse.result || {};

                        if (cartResponse.package_data) {
                            delete cartResponse.package_data;
                        }

                        if (cartResponse.subscription_data) {
                            delete cartResponse.subscription_data;
                        }

                        /**send error response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: cartResponse,
                                message: res.__("front.cart.product_not_available")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                    else {


                        let checkItemoptions = {
                            conditions: {
                                user_id: userId,
                                product_id: new ObjectId(productId),
                                item_type: ITEM_TYPE_PRODUCT,
                            }
                        };

                        CartModel.getCartItemDetails(checkItemoptions).then(async cartItemsResponse => {
                            if (cartItemsResponse.status == STATUS_SUCCESS) {

                                let cartItemsData = (cartItemsResponse.result) ? cartItemsResponse.result : "";
                                let cartItemQuantity = (cartItemsData.quantity) ? cartItemsData.quantity : DEACTIVE;

                                if ((action == CART_ADD) && (cartItemQuantity == productQuantity)) {
                                    let cartDetailResponse = await getCartDetail(req, res, userId);
                                    let cartResponse = cartDetailResponse.result || {};

                                    if (cartResponse.package_data) {
                                        delete cartResponse.package_data;
                                    }

                                    if (cartResponse.subscription_data) {
                                        delete cartResponse.subscription_data;
                                    }

                                    /**send error response */
                                    finalResponse = {
                                        'data': {
                                            status: STATUS_ERROR,
                                            result: cartResponse,
                                            message: res.__("front.cart.product_not_available")
                                        }
                                    };
                                    return returnApiResult(req, res, finalResponse);
                                }
                                else {
                                    /*** update cart data **/
                                    let cartData = {};
                                    let updateDetail = {};

                                    /** increase cart quantity */
                                    if (action == CART_ADD) {
                                        cartData['user_id'] = new ObjectId(userId),
                                            cartData['product_id'] = new ObjectId(productId),
                                            updateDetail = { '$inc': { quantity: 1 } }
                                    }

                                    /** decrease cart quantity */
                                    if (action == CART_REMOVE) {
                                        cartData['user_id'] = new ObjectId(userId),
                                            cartData['product_id'] = new ObjectId(productId),
                                            cartData['quantity'] = { $gt: 1 },
                                            updateDetail = { '$inc': { quantity: -1 } }
                                    }

                                    let optionData = {
                                        conditions: cartData,
                                        updateData: updateDetail,
                                    }

                                    /**update cart item data */
                                    CartModel.updateCartItemData(req, res, optionData).then(cartItemResponse => {

                                        if (cartItemResponse.status == STATUS_SUCCESS) {

                                            let optionObj = {
                                                conditions: { "user_id": new ObjectId(userId) },
                                                updateData: { $set: { 'modified': getUtcDate() } },
                                            }

                                            /**update cart data */
                                            CartModel.updateCartData(req, res, optionObj).then(async updateResponse => {
                                                if (updateResponse.status == STATUS_SUCCESS) {
                                                    /**send success response 
                                                    finalResponse = {
                                                        'data': {
                                                            status: STATUS_SUCCESS,
                                                            message: res.__("front.product.cart_has_been_updated_successfully")
                                                        }
                                                    };
                                                    return returnApiResult(req, res, finalResponse);
                                                    */

                                                    let cartDetailResponse = await getCartDetail(req, res, new ObjectId(userId));
                                                    let cartResponse = cartDetailResponse.result || {};

                                                    if (cartResponse.package_data) {
                                                        delete cartResponse.package_data;
                                                    }

                                                    if (cartResponse.subscription_data) {
                                                        delete cartResponse.subscription_data;
                                                    }

                                                    finalResponse = {
                                                        'data': {
                                                            status: STATUS_SUCCESS,
                                                            result: cartResponse
                                                        }
                                                    };

                                                    return returnApiResult(req, res, finalResponse);

                                                }
                                                else {
                                                    /**send error response */
                                                    finalResponse = {
                                                        'data': {
                                                            status: STATUS_ERROR,
                                                            message: res.__("front.system.something_going_wrong_please_try_again")
                                                        }
                                                    };
                                                    return returnApiResult(req, res, finalResponse);
                                                }
                                            });

                                        } else {
                                            /**send error response */
                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_ERROR,
                                                    message: res.__("front.system.something_going_wrong_please_try_again")
                                                }
                                            };
                                            return returnApiResult(req, res, finalResponse);
                                        }

                                    });
                                }
                            }
                        })
                    }
                });
            }

        }

    } //End updateCartData


    /** 
     * function for empty cart
     *
     * @param req	As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.emptyCart = async (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let slug = (req.body.slug) ? req.body.slug : "";
        let languageCode = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";

        let cartResponse = await emptyUserCart(req, res, userId);
        if (cartResponse.status == STATUS_SUCCESS) {
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
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.something_going_wrong_please_try_again")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
    }


    /**
     * 
     * function to apply promo code
     * 
     * @param req As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.applyPromoCode = async (req, res) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        let promoCode = (req.body.promo_code) ? req.body.promo_code : '';
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let latitude = (req.body.latitude) ? req.body.latitude : '';
        let longitude = (req.body.longitude) ? req.body.longitude : '';


        let finalResponse = {};

        if (!userId || !promoCode || !latitude || !longitude) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {
 
            let areaOptions = {
                "latitude": latitude,
                "longitude": longitude
            }
             
            let areaIds = await getAreaIdsArrayFromLatLong(req, res, areaOptions);         
            if (areaIds.length) {
                let updateData = {
                    latitude: latitude,
                    longitude: longitude,
                    area_ids: areaIds
                };

                let condition = { user_id: userId }
                let option = { conditions: condition, updateData: { $set: updateData } }
                await CartModel.updateCartData(req, res, option);

            } else {
                let finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        message: res.__("front.system.location_outside_service_area")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            } 

            let cartDetail = await getCartDetail(req, res, userId);

            let promoCodeApplied = (cartDetail && cartDetail.result && cartDetail.result.promo_code_applied == ACTIVE) ? ACTIVE : DEACTIVE;

            if (promoCodeApplied) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        message: res.__("front.cart.promo_code_applied_already")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {
                /**function for check promo code validity */
                checkPromoCode(req, res, { "user_id": userId, "promo_code": promoCode, 'cart_details': cartDetail }).then((promoCodeResponse) => {

                    if (promoCodeResponse.status == STATUS_ERROR) {
                        /**send error response */
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                message: promoCodeResponse.message
                            }
                        };
                        return returnApiResult(req, res, finalResponse);

                    }
                    else {

                        finalResponse = {
                            'data': {
                                status: STATUS_SUCCESS,
                                message: res.__("front.cart.promo_code_applied")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }
                });
            }
        }
    }


    /**
     * 
     * function to apply promo code
     * 
     * @param req As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.removePromoCode = async (req, res) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let slug = (req.body.slug) ? req.body.slug : '';
        let userData = (req.user_data) ? req.user_data : {};

        let finalResponse = {};

        if (!slug) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
        else {
            let userId = (userData._id) ? userData._id : "";

            let cartResponse = await cartModel.getCartDetails({ conditions: { 'user_id': new ObjectId(userId) } });
            let cartDeatils = (cartResponse && cartResponse.result) ? cartResponse.result : "";

            if (!cartDeatils) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        message: res.__("api.global.there_is_no_items_in_cart")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
            else {

                let removePromoCodeOptions = { user_id: userId };
                let removed = removePromoCode(req, res, removePromoCodeOptions);

                if (removed) {
                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            message: res.__("front.cart.promo_code_removed")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            message: res.__("front.system.invalid_promo_code")
                        }
                    };
                }

            }
        }
    }


    /** 
     * function for get Promo Code  list
     *
     * @param req	As Request Data
     * @param res	As Response Data
     *
     * @return json
     */
    this.getPromoCodeList = async (req, res, next) => {
        let finalResponse = {};
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : "";
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        let latitude = (req.body.latitude) ? req.body.latitude : '';
        let longitude = (req.body.longitude) ? req.body.longitude : '';

        let areaOptions = {
            "latitude": latitude,
            "longitude": longitude
        }       

        let areaIds = await getAreaIdsArrayFromLatLong(req, res, areaOptions);

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

        /** points logs list */
        let cartConditions = [
            {
                $match: {
                    "user_id": new ObjectId(userId),                   
                }
            },
            {
                $lookup: {
                    "from": TABLE_CART_ITEMS,
                    "let": { "userId": userId },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$user_id", "$$userId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                "from": TABLE_PRODUCTS,
                                "let": { productId: "$product_id" },
                                "pipeline": [
                                    {
                                        '$match': {
                                            '$expr': {
                                                '$and': [
                                                    { '$eq': ['$_id', '$$productId'] },
                                                ]
                                            },
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            parent_category: 1,

                                        }
                                    }


                                ],
                                "as": "product_detail",
                            }
                        },
                        {
                            $lookup: {
                                "from": TABLE_PACKAGES,
                                "let": { packageId: "$package_id" },
                                "pipeline": [
                                    {
                                        '$match': {
                                            '$expr': {
                                                '$and': [
                                                    { '$eq': ['$_id', '$$packageId'] },
                                                ]
                                            },
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                        }
                                    }


                                ],
                                "as": "package_detail",
                            }
                        },

                        {
                            $lookup: {
                                "from": TABLE_SUBSCRIPTIONS,
                                "let": { subscriptionId: "$subscription_id" },
                                "pipeline": [
                                    {
                                        '$match': {
                                            '$expr': {
                                                '$and': [
                                                    { '$eq': ['$_id', '$$subscriptionId'] },
                                                ]
                                            },
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                        }
                                    }


                                ],
                                "as": "subscription_detail",
                            }
                        },

                    ],
                    "as": "items",
                }
            },
            {
                $project: {
                    user_id: 1,
                    items: 1,
                    parent_categories: {
                        $reduce: {
                            input: "$items",
                            initialValue: [],
                            in: {
                                $concatArrays: [
                                    "$$value",
                                    {
                                        $map: {
                                            input: "$$this.product_detail",
                                            as: "product",
                                            in: "$$product.parent_category"
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    package_ids: {
                        $reduce: {
                            input: "$items",
                            initialValue: [],
                            in: {
                                $concatArrays: [
                                    "$$value",
                                    {
                                        $map: {
                                            input: "$$this.package_detail",
                                            as: "package",
                                            in: "$$package._id"
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    subscription_ids: {
                        $reduce: {
                            input: "$items",
                            initialValue: [],
                            in: {
                                $concatArrays: [
                                    "$$value",
                                    {
                                        $map: {
                                            input: "$$this.subscription_detail",
                                            as: "subscription",
                                            in: "$$subscription._id"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ];

        let cartOptionObj = {
            conditions: cartConditions
        }


        CartModel.getCartAggregateList(req, res, cartOptionObj).then(cartItemResponse => {

            let parentCategories = cartItemResponse?.result?.[0]?.parent_categories || [];
            let convertedParentCategoriesIds = parentCategories.map(categorie => (
                new ObjectId(categorie)  // Convert string _id to ObjectId
            ));

            let packageIds = cartItemResponse?.result?.[0]?.package_ids || [];
            let convertedPackageIds = packageIds.map(package => (
                new ObjectId(package)  // Convert string _id to ObjectId
            ));

            let subscriptionIds = cartItemResponse?.result?.[0]?.subscription_ids || [];
            let convertedSubscriptionIds = subscriptionIds.map(subscription => (
                new ObjectId(subscription)  // Convert string _id to ObjectId
            ));


            let todayDay = new Date().getDay().toString();
            let currentHours = new Date().getHours().toString().padStart(2, '0');
            let commonCondition = {
                week_days: { $in: [todayDay] },
                status: ACTIVE,
                is_deleted: NOT_DELETED,
                code_valid_from: { $lt: convertToISO(new Date()) },
                code_valid_to: { $gt: convertToISO(new Date()) },
                start_hours: { $lt: currentHours },
                end_hours: { $gt: currentHours },
				area_id: { $in: areaIds },
                $or: [
                    { category_id: { $in: convertedParentCategoriesIds } },
                    { package_id: { $in: convertedPackageIds } },
                    { subscription_id: { $in: convertedSubscriptionIds } }
                ]
            }

            /** points logs list */
            let conditions = [{
                $facet: {
                    "promo_code_list": [
                        { $match: commonCondition ,},
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
            PromoCodeModel.getPromocodeAggregateList(req, res, optionObj).then(promoRes => {

                let responseStatus = (promoRes.status) ? promoRes.status : "";
                if (responseStatus == STATUS_SUCCESS) {
                    let responseResult = (promoRes.result && promoRes.result[0]) ? promoRes.result[0] : "";
                    let promoCodeList = (responseResult && responseResult.promo_code_list) ? responseResult.promo_code_list : [];
                    let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

                    /**send success response */
                    let finalResponse = {
                        data: {
                            status: STATUS_SUCCESS,
                            result: promoCodeList,
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
        });
    }

}

module.exports = new Cart();