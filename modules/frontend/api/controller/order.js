const UserAddressModel = require("../model/userAddressModel");
const OrderModel = require('../model/orderModel');
const ProductModel = require('../../../admin/products/model/ProductModel');
const FranchiseContractsModel = require('../../../admin/franchise_contracts/model/contractsModel');
const PackageModel = require('../../../admin/package_management/model/Package');
const SubscriptionModel = require('../../../admin/subscription_management/model/Subscription');
const UserModel = require("../model/userModel");
const CartModel = require("../model/cartModel");
const RegistrationModel = require("../model/registrationModel");
const GiftTransactionModel = require("../model/giftTransactionModel");
const asyncParallel = require("async/parallel");
const asyncEach = require("async/each");

const { ObjectId } = require("mongodb");
const async = require("async");
function OrderController() {

    /**
     * Function to save order
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.saveOrder = async (req, res) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let slug = (req.body.slug) ? req.body.slug : "";
        let languageCode = (req.body.lang_code) ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let firstBooking = (loginUserData.first_booking) ? loginUserData.first_booking : DEACTIVE;
        let mySubscriptionId = (req.body.my_subscription_id) ? new ObjectId(req.body.my_subscription_id) : null;
        let addressId = (req.body.address_id) ? req.body.address_id : null;
        let bookingDate = (req.body.booking_date) ? req.body.booking_date : null;
        let bookingTime = (req.body.booking_time) ? req.body.booking_time : null;
        let bookingDateTime = null;
        let booking_timestamp = null;
        let booking_start_timestamp = null;
        let booking_end_timestamp = null;
        let travelling_timestamp = null;
        let package_dration = null;
        let package_data = null;
        let subscription_data = null;
        let mySubscriptionDetails = null;
        let is_service_booking = null;
        let is_store_order = null;
        let booking_from = null;
        let addressDetail = null;
        let addressObject = req.body.user_address || {};
        let totalReceivableAmount = 0;
        let finalResponse = {};

        let fullName = (addressObject && addressObject.full_name) ? addressObject.full_name : "";
        let zipCode = (addressObject && addressObject.zip_code) ? addressObject.zip_code : "";
        let addressLine1 = (addressObject && addressObject.address_line_1) ? addressObject.address_line_1 : "";
        let addressLine2 = (addressObject && addressObject.address_line_2) ? addressObject.address_line_2 : "";
        let countryName = (addressObject && addressObject.country_name) ? (addressObject.country_name) : "";
        let stateName = (addressObject && addressObject.state_name) ? (addressObject.state_name) : "";
        let cityName = (addressObject && addressObject.city_name) ? (addressObject.city_name) : "";
        var longitude = (addressObject && addressObject.longitude) ? addressObject.longitude : "";
        var latitude = (addressObject && addressObject.latitude) ? addressObject.latitude : "";
		let areaDetails = null;

        if (!slug) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
		
		
		/**get cart details */
        let cartDetailRes = await getCartDetail(req, res, userId);
		cartDetail = (cartDetailRes.result) ? cartDetailRes.result : [];
		
		if (( (cartDetailRes.status == STATUS_ERROR) || (cartDetail.length <= 0) ) && !mySubscriptionId) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.cart_is_empty"),
                }
            };
            return returnApiResult(req, res, finalResponse);

        }
		
		
		/* check if there is only subscription in cart */
		let checkItemoptions = {
			conditions: {
				user_id: new ObjectId(userId),
				item_type: ITEM_TYPE_SUBSCRIPTION,
			}
		};

		let cartItemsResponse 	=	await CartModel.getCartItemDetails(checkItemoptions);
		let cartItemsResult		=	cartItemsResponse.result || {};
		
		if((cartItemsResult._id) && (cartDetail.length > 1)){
			finalResponse = {
				'data': {
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.you_can_not_purchase_subscription_with_another_package_or_product")
				}
			};
			return returnApiResult(req, res, finalResponse);
		}
		else if((cartItemsResult._id) && (cartDetail.length == 1)){
			
			/* YOU ARE GOING TO BUY SUBSCRIPTION ONLY */
			subscription_data = (cartDetail.subscription_data) ? cartDetail.subscription_data : null;
			if(!subscription_data){
				
			}
		}
		 
			
		package_data 				= 	(cartDetail.package_data) ? cartDetail.package_data : null;
		totalNumerOfProducts 		= 	(cartDetail.total_numer_of_products) ? cartDetail.total_numer_of_products : 0;
		totalNumerOfPackages 		= 	(cartDetail.total_numer_of_packages) ? cartDetail.total_numer_of_packages : 0;
		totalNumerOfSubscriptions 	= (cartDetail.total_numer_of_subscriptions) ? cartDetail.total_numer_of_subscriptions : 0;
		
		let promoCode = (cartDetail.promo_code) ? cartDetail.promo_code : "";

		if (totalNumerOfProducts > 0) {
			is_store_order = ACTIVE;
		}

		if (promoCode) {
			/**function for check promo code validity */
			await checkPromoCode(req, res, { "user_id": userId, "promo_code": promoCode, 'cart_details': cartDetail });

		}

		if (!mySubscriptionId && (totalNumerOfProducts == 0) && (totalNumerOfPackages == 0) && (totalNumerOfSubscriptions == 0)) {
			finalResponse = {
				'data': {
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.cart_is_empty"),
				}
			};
			return returnApiResult(req, res, finalResponse);
		}
		
		if (totalNumerOfProducts || totalNumerOfPackages) {
			if (!addressId && !addressObject) {
				finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.system.select_address_error"),
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
		}

		if (totalNumerOfPackages || mySubscriptionId) {
			if (!bookingDate || !bookingTime) {
				finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.system.date_time_error"),
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
			else {
				
				bookingDateTime = new Date(bookingDate + 'T' + bookingTime);
				booking_timestamp = bookingDateTime.getTime();

				let date_time = new Date();
				let currentTimeStamp = date_time.getTime(); 
			}
		}
		
		 
		/* HERE YOU ARE GOING TO BUY SOME PRODUCT OR PACKAGE FOR WHICH ADDRESS IS NEEDED */
		if (totalNumerOfProducts || totalNumerOfPackages  || mySubscriptionId) {
			if (addressId || (longitude && latitude)) {
				if (addressId) {
					let addressOption = {
						conditions: { _id: new ObjectId(addressId), is_deleted: NOT_DELETED },
						fields: { is_deleted: 0, phone_number: 0, dial_code: 0, country_code: 0, country_dial_code: 0, country: 0, state: 0, is_default: 0, device_type: 0, api_type: 0, modified: 0, created: 0 }
					}

					/**get billing address */
					let addressDetailResp = await UserAddressModel.getUserAddressDetail(addressOption);

					if (addressDetailResp.status == STATUS_ERROR) {
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
						addressDetail = addressDetailResp.result;
					
						let areaOptions = {
							"latitude": (addressDetail.latitude) ? addressDetail.latitude : "",
							"longitude": (addressDetail.longitude) ? addressDetail.longitude : ""
						}
						/**area details */
						areaDetails = await getAreaIdsFromLatLong(req, res, areaOptions);
						if (typeof areaDetails !== 'undefined' && areaDetails.length > 0) {
							
						}
						else {
							let finalResponse = {
								'data': {
									status: STATUS_ERROR,
									message: res.__("front.system.location_outside_service_area")
								}
							};
							return returnApiResult(req, res, finalResponse);
						}
					}
				}
				else if (addressObject) {
					let areaOptions = {
						"latitude": latitude,
						"longitude": longitude
					}
					/**area details */
					areaDetails = await getAreaIdsFromLatLong(req, res, areaOptions);

					if (typeof areaDetails !== 'undefined' && areaDetails.length > 0) {
						addressDetail = {
							user_id: userId,
							full_name: fullName,
							country_name: countryName,
							state_name: stateName,
							city_name: cityName,
							zip_code: zipCode,
							address_line_1: addressLine1,
							address_line_2: addressLine2,
							area_id: areaDetails,
							latitude: latitude,
							longitude: longitude,
						};
					}
					else {
						let finalResponse = {
							'data': {
								status: STATUS_ERROR,
								message: res.__("front.system.location_outside_service_area")
							}
						};
						return returnApiResult(req, res, finalResponse);
					}
				}
			}
			else {
				finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: {},
						message: res.__("api.global.parameter_missing_address_details")
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
		}
			 
		
		
		
		if (package_data && !mySubscriptionId) {
			package_dration 	= 	(package_data && package_data.duration) ? package_data.duration : null;
			carType 			= 	(package_data && package_data.car_type) ? package_data.car_type : "";
			providerType 		= 	(package_data && package_data.provider_type) ? package_data.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;
			duration 			= 	(package_data && package_data.duration) ? package_data.duration : "";
			
			if (providerType == "van_fleet") {
				travelling_timestamp = Number(res.locals.settings["travel_time.van_fleet"]);
			}
			else if (providerType == "bike_fleet") {
				travelling_timestamp = Number(res.locals.settings["travel_time.bike_fleet"]);
			}

			booking_start_timestamp = booking_timestamp - travelling_timestamp;


			if (package_dration) {
				package_dration_timestamp = DURATION_TIMESTAMP[package_dration];
			}

			if (booking_timestamp) {
				booking_end_timestamp = booking_timestamp + package_dration_timestamp;
				is_service_booking = ACTIVE;
			}

			booking_from = BOOKING_FROM_PACKAGE;

			if (booking_start_timestamp <= currentTimeStamp) {
				finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.orders.select_feature_date_time.")
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
		}
		else if (mySubscriptionId) {
            /**get subscription details */
            let subscriptionDetails 	= await UserModel.getMySubscriptionFindOne({ conditions: { _id: mySubscriptionId, user_id: new ObjectId(userId) } });
            mySubscriptionDetails 		= (subscriptionDetails.result) ? subscriptionDetails.result : "";
            let subscriptionExpiryDate 	= (mySubscriptionDetails.end_date) ? new Date(mySubscriptionDetails.end_date) : "";
            let totalAvailableService 	= (mySubscriptionDetails.total_service) ? mySubscriptionDetails.total_service : 0;
            let currentDate = new Date();
				 
            if (!mySubscriptionDetails) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.orders.you_have_no_any_subscription.")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            /**check expiry date */
            if (subscriptionExpiryDate < currentDate) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.orders.your_subscription_has_been_expired")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            /**get total bookings */
            let bookingDetails = await OrderModel.getOrderBookingCount({
                conditions: {
                    'user_subscription_id': new ObjectId(mySubscriptionId),
                    'user_id': new ObjectId(userId),
                    'is_service_booking': ACTIVE,
                    'order_status': ORDER_PLACED,
                    'status': { $ne: BOOKING_STATUS_CANCELLED }
                }
            });

            let bookingResult = (bookingDetails.result) ? bookingDetails.result : 0;

            /**check available booking */
            if (totalAvailableService <= bookingResult) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.orders.your_total_booking_has_been_complete")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }


			carType 			= (mySubscriptionDetails && mySubscriptionDetails.car_type) ? mySubscriptionDetails.car_type : "";
			providerType 		= (mySubscriptionDetails && mySubscriptionDetails.provider_type) ? mySubscriptionDetails.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;
			duration 			= (mySubscriptionDetails && mySubscriptionDetails.duration) ? mySubscriptionDetails.duration : "";
			subscriptionPrice 	= (mySubscriptionDetails && mySubscriptionDetails.price) ? mySubscriptionDetails.price : 0;

            if (providerType == "van_fleet") {
                travelling_timestamp = Number(res.locals.settings["travel_time.van_fleet"]);
            }
            else if (providerType == "bike_fleet") {
                travelling_timestamp = Number(res.locals.settings["travel_time.bike_fleet"]);
            }

            booking_start_timestamp = booking_timestamp - travelling_timestamp;

            if (booking_start_timestamp <= currentTimeStamp) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.orders.select_feature_date_time.")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }

            if (duration) {
                my_subscription_dration_timestamp = DURATION_TIMESTAMP[duration];
            }

            booking_end_timestamp = booking_timestamp + my_subscription_dration_timestamp;

            is_service_booking = ACTIVE;
            booking_from = BOOKING_FROM_SUBSCRIPTION;
		}
		
		
		
		let cartProductList = (cartDetail && cartDetail.product_list) ? cartDetail.product_list : [];

		/**If there is no products into cart then create a booking directly with subscription*/
		if (((cartDetail.length == 0) || (cartProductList.length == 0)) && mySubscriptionId) {
			/** Generate booking Number */
			let orderNumberRes = await OrderModel.generateOrderNumber(req, res);

			if (orderNumberRes.status == STATUS_ERROR) {
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
				orderNumber = (orderNumberRes.result) ? orderNumberRes.result : "";
			}

			let orderData = {
				user_id: new ObjectId(userId),
				order_number: orderNumber,
				order_status: ORDER_PLACED,
				payment_status: PAYMENT_PREPAID,
				booking_date: bookingDate,
				booking_time: bookingTime,
				booking_date_time: bookingDateTime,
				booking_start_timestamp: booking_start_timestamp,
				booking_end_timestamp: booking_end_timestamp,
				booking_travelling_timestamp: travelling_timestamp,
				is_service_booking: is_service_booking,
				is_store_order: is_store_order,
				booking_from: booking_from,
				user_subscription_id: mySubscriptionId,
				my_subscription_details: mySubscriptionDetails,
				subscription_details: mySubscriptionDetails,
				address_detail: addressDetail,
				is_deleted: NOT_DELETED,
				area_ids: areaDetails,
				status: BOOKING_STATUS_NEW,
				booking_car_type: carType,
				provider_type: providerType,
				booking_duration: duration,
				total_received_amount: totalReceivableAmount,
				first_booking: firstBooking,
			};

			let options = {
				insertData: orderData
			}

			/**save Booking data */
			OrderModel.saveOrder(req, res, options).then(async (bookingRes) => {

				if (bookingRes.status == STATUS_SUCCESS) {

					if (is_service_booking || is_store_order) {


						//update user first booking 
						if (firstBooking == ACTIVE) {
							let iserupdateOptions = {
								'conditions': { _id: new ObjectId(userId) },
								'updateData': {
									$set: { 'first_booking': DEACTIVE, 'modified': getUtcDate() }
								},
							}
							await RegistrationModel.updateUser(req, res, iserupdateOptions);
						}


						let bookingRslt = (bookingRes.result) ? bookingRes.result : "";
						let bookingId = (bookingRslt.insertedId) ? bookingRslt.insertedId.toString() : "";

						let extraParametersObj = {
							user_id: new ObjectId(userId),
							order_number: orderNumber,
							booking_car_type: carType,
							provider_type: providerType,
							booking_duration: duration,
							user_subscription_id: mySubscriptionId,
							booking_id: bookingId,
							booking_status: BOOKING_STATUS_NEW,
						}

						let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
						let email = (loginUserData.email) ? loginUserData.email : "";
						let notificationOptions = {
							notification_data: {
								notification_type: NOTIFICATION_TO_USER_CONFIRM_BOOKING,
								message_params: [fullName, orderNumber],
								user_id: userId,
								user_ids: [userId],
								extra_parameters: extraParametersObj,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: userId
							}
						};

						/**send notification to user */
						await insertNotifications(req, res, notificationOptions);

						/**send checkout push notification to user */
						let pushNotificationOptionsUser = {
							notification_data: {
								notification_type: PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
								message_params: [fullName, orderNumber],
								user_id: userId,
								booking_id: bookingId,
								booking_status: BOOKING_STATUS_NEW,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: userId
							}
						};
						await pushNotification(req, res, pushNotificationOptionsUser);


						/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
						let areaIds = areaDetails ? areaDetails.map(item => item.area_id) : [];
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
											notification_type: FRANCHISE_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
											message_params: [fullName, orderNumber, totalSellingAmount],
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
											notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
											message_params: [fullName, orderNumber, totalSellingAmount],
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
						/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */



						let emailOptions = {
							to: email,
							action: "user_confirm_booking",
							rep_array: [fullName, orderNumber],
						};

						sendMail(req, res, emailOptions);
 
						let aSPOptions = {
							area_ids: areaDetails,
							booking_start_timestamp: booking_start_timestamp,
							booking_end_timestamp: booking_end_timestamp,
							provider_type: providerType,
							is_service_booking: is_service_booking,
							is_store_order: is_store_order,
						};

						let availableServiceProviders = await getAvailableServiceProviders(req, res, aSPOptions);

						if (Array.isArray(availableServiceProviders) && availableServiceProviders.length > 0) {
							let ids = availableServiceProviders.map(provider => provider._id.toString());

							if (availableServiceProviders.length == 1) {
								const { acceptBooking } = require('./orderBooking');
								req.body.is_automatic_assign = ACTIVE;
								req.body.booking_id = bookingId;
								req.body.user_id = ids[0];
								await acceptBooking(req, res);
							}
							else {

								let extraParametersObj = {
									order_id: bookingId,
									order_number: orderNumber,
									user_id: new ObjectId(userId),
									booking_id: bookingId.toString(),
									booking_status: BOOKING_STATUS_NEW,
								}

								let notificationOptions = {
									notification_data: {
										notification_type: NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING,
										message_params: [fullName, orderNumber],
										user_id: userId,
										user_ids: ids,
										extra_parameters: extraParametersObj,
										user_role_id: FRONT_ADMIN_ROLE_ID,
										role_id: FRONT_ADMIN_ROLE_ID,
										created_by: userId
									}
								};
								await insertNotifications(req, res, notificationOptions);


								/**send checkout push notification to user */
								let pushNotificationOptionsUser = {
									notification_data: {
										notification_type: PUSH_NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING,
										message_params: [fullName, orderNumber],
										user_ids: ids,
										booking_id: bookingId,
										booking_status: BOOKING_STATUS_NEW,
										user_role_id: FRONT_ADMIN_ROLE_ID,
										role_id: FRONT_ADMIN_ROLE_ID,
										created_by: userId
									}
								};

								await pushNotification(req, res, pushNotificationOptionsUser);
							}

						}
					}

					finalResponse = {
						'data': {
							status: STATUS_SUCCESS,
							result: {},
							message: res.__("front.order.booking_successfully")
						}
					};
					return returnApiResult(req, res, finalResponse);
				}
				else {
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
		else {

			/** Generate Order Number */
			let orderNumberRes = await OrderModel.generateOrderNumber(req, res);

			if (orderNumberRes.status == STATUS_ERROR) {
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
				orderNumber = orderNumberRes.result
			}
			
			let totalAmountWithoutAnyDiscount = cartDetail.total_without_discount_price;
			let totalDiscountOnMrp = cartDetail.total_discount_on_mrp;
			let totalSellingAmount = cartDetail.total_item_price;
			let totalVatExcludedPrice = cartDetail.total_vat_excluded_price;
			let totalVatIncludedPrice = cartDetail.total_vat_included_price;
			let totalPromoCodeDiscount = cartDetail.total_item_discount;
			let totalItemQuantity = cartDetail.total_item_quantity;
			let itemCount = cartDetail.item_count;

			let is_b2b_code = (cartDetail.is_b2b_code) ? cartDetail.is_b2b_code : null;
			let b2b_code = (cartDetail.b2b_code) ? cartDetail.b2b_code : null;

			/** Set data to be insert */
			let orderData = {
				user_id: new ObjectId(userId),
				order_number: orderNumber,
				order_status: ORDER_IN_PANDING,
				item_count: itemCount,
				total_quantity: totalItemQuantity,
				total_mrp_amount: formatToTwo(totalAmountWithoutAnyDiscount),
				total_discount_on_mrp: formatToTwo(totalDiscountOnMrp),
				total_selling_amount: formatToTwo(totalSellingAmount),
				total_vat_excluded_price: formatToTwo(totalVatExcludedPrice),
				total_vat_included_price: formatToTwo(totalVatIncludedPrice),
				total_selling_amount: formatToTwo(totalSellingAmount),
				total_extra_discount: formatToTwo(totalPromoCodeDiscount),
				total_shipping_amount: DEACTIVE,
				total_numer_of_products: formatToTwo(cartDetail.total_numer_of_products),
				total_quantity_of_products: formatToTwo(cartDetail.total_quantity_of_products),
				total_price_of_products: formatToTwo(cartDetail.total_price_of_products),
				total_numer_of_packages: formatToTwo(cartDetail.total_numer_of_packages),
				total_quantity_of_packages: formatToTwo(cartDetail.total_quantity_of_packages),
				total_price_of_packages: formatToTwo(cartDetail.total_price_of_packages),
				total_numer_of_subscriptions: formatToTwo(cartDetail.total_numer_of_subscriptions),
				total_quantity_of_subscriptions: formatToTwo(cartDetail.total_quantity_of_subscriptions),
				total_price_of_subscriptions: formatToTwo(cartDetail.total_price_of_subscriptions),
				booking_date: bookingDate,
				booking_time: bookingTime,
				booking_date_time: bookingDateTime,
				payment_status: PAYMENT_UNPAID,
				booking_start_timestamp: booking_start_timestamp,
				booking_end_timestamp: booking_end_timestamp,
				booking_travelling_timestamp: travelling_timestamp,
				booking_car_type: typeof carType !== "undefined" ? carType : "",
				provider_type: typeof providerType !== "undefined" ? providerType : SERVICE_PROVIDER_TYPE_BIKE_FLEET,
				is_service_booking: is_service_booking,
				is_store_order: is_store_order,
				booking_from: booking_from,
				user_subscription_id: mySubscriptionId,
				my_subscription_details: mySubscriptionDetails,
				package_details: package_data,
				subscription_details: subscription_data,
				address_detail: addressDetail,
				area_ids: areaDetails,
				promo_code_detail: cartDetail.promo_code_detail,
				is_b2b_code: is_b2b_code,
				b2b_code: b2b_code,
				is_deleted: NOT_DELETED,
				first_booking: firstBooking,
				total_received_amount: totalReceivableAmount
			};


			let option = {
				insertData: orderData
			};

			OrderModel.saveOrder(req, res, option).then(async saveResponse => {
				if (saveResponse.status == STATUS_ERROR) {
					finalResponse = {
						'data': {
							status: STATUS_ERROR,
							result: {},
							message: res.__("front.system.something_going_wrong_please_try_again"),
						}
					};
					return returnApiResult(req, res, finalResponse);
				} else {
					let orderId = (saveResponse.result.insertedId) ? saveResponse.result.insertedId : "";

					//update user first booking 
					if (firstBooking == ACTIVE) {
						let iserupdateOptions = {
							'conditions': { _id: new ObjectId(userId) },
							'updateData': {
								$set: { 'first_booking': DEACTIVE, 'modified': getUtcDate() }
							},
						}
						await RegistrationModel.updateUser(req, res, iserupdateOptions);
					}

					/**function is used to save order items */
					saveOrderItems(req, res, cartDetail, orderId, orderNumber).then(orderItemResponse => {
						if (orderItemResponse.status == STATUS_ERROR) {
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
							finalResponse = {
								"data": {
									status: STATUS_SUCCESS,
									result: { order_number: orderNumber },
									message: null,
								}
							};
							return returnApiResult(req, res, finalResponse);
						}
					})
				}
			})
		}
    }


    /**
     * Function to get save order items
     *
     * @param req		As Request Data
     * @param res		As Response Data
     * @param condition	As Order condition
     *
     * @return json
     */
    saveOrderItems = (req, res, cartDetail, orderId, orderNumber) => {
        return new Promise(resolve => {
            let loginUserData = (req.user_data) ? req.user_data : "";
            let userId = (loginUserData._id) ? loginUserData._id : "";
            let productList = (cartDetail && cartDetail.product_list) ? cartDetail.product_list : [];
            let orderItems = {};
            let finalResponse = {};

            if (productList.length > DEACTIVE) {
                let orderItemResponse = processProductList(productList, orderId, orderNumber, userId, req, res);

                if (orderItemResponse.status == STATUS_ERROR) {
                    finalResponse = {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again"),
                    };
                    return resolve(finalResponse);
                }
                else {
                    finalResponse = {
                        status: STATUS_SUCCESS,
                        result: {},
                        message: ''
                    };
                    return resolve(finalResponse);
                }
            }
            else {
                /** Send success response */
                let response = {
                    status: STATUS_SUCCESS,
                    result: {},
                    message: ''
                };
                return resolve(response);
            }
        });
    }; // End saveOrderItems()


    /**
     * Function to ceheckout order
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.checkoutOrder = async (req, res) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";

        let slug = (req.body.slug) ? req.body.slug : '';
        let orderNumber = (req.body.order_number) ? req.body.order_number : '';

        let paymentGatwayTransactionId = (req.body.payment_gatway_transaction_id) ? req.body.payment_gatway_transaction_id : "";
        let paymentGatewayResponse = (req.body.payment_gatway_response) ? req.body.payment_gatway_response : "";
        let paymentGatewayAmount = (req.body.payment_gatway_amount) ? parseInt(req.body.payment_gatway_amount) : "";
        let paymentGatewayStatus = (req.body.payment_gatway_status) ? req.body.payment_gatway_status : "";

        let userWalletbalance = (loginUserData.wallet_amount) ? parseFloat(loginUserData.wallet_amount) : 0;
        let userWalletStatus = (loginUserData.wallet_status) ? loginUserData.wallet_status : DEACTIVE;
        let payFromWallet = (req.body.pay_from_wallet) ? parseInt(req.body.pay_from_wallet) : 0;
        let payFromPG = (req.body.pay_from_pg) ? parseInt(req.body.pay_from_pg) : 0;
        let payCOD = (req.body.pay_cod) ? parseInt(req.body.pay_cod) : 0;
        let paymentBy = null;
        let totalReceivableAmount = 0;
        if (payFromPG) {
            paymentBy = PAYMENT_BY_PAYMENT_GATEWAY;
        } else if (payFromWallet) {
            paymentBy = PAYMENT_BY_WALLET;
        } else {
            paymentBy = PAYMENT_BY_COD;
        }


        let finalResponse = {};

        if (!orderNumber || !slug) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
		
		
		if (!payFromWallet && !payFromPG && !payCOD) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.payment_type_missing")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }
		

        if (payFromPG) {
            if (!paymentGatwayTransactionId || !paymentGatewayAmount) {
                finalResponse = {
                    'data': {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("api.global.parameter_missing")
                    }
                };
                return returnApiResult(req, res, finalResponse);
            }
        }


        if (payFromWallet && (userWalletStatus != ACTIVE)) {
            finalResponse = {
                'data': {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("api.global.wallet_deative_message")
                }
            };
            return returnApiResult(req, res, finalResponse);
        }


        /**condition for check payemnt gatway response and status */
        if (payCOD || payFromWallet || (payFromPG && paymentGatewayResponse && paymentGatewayStatus == STATUS_SUCCESS)) {

            let orderCondition = {
                order_number: orderNumber,
                user_id: new ObjectId(userId),
                order_status: ORDER_IN_PANDING
            }

            let option = {
                conditions: orderCondition
            }
            /**get order details */
            OrderModel.getOrderDetail(option).then(async (detailResponse) => {
                if (detailResponse.error || !detailResponse.result) {
                    finalResponse = {
                        'data': {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again")
                        }
                    };
                    return returnApiResult(req, res, finalResponse);
                }
                else {
                    let ordersDetails = (detailResponse.result) ? detailResponse.result : "";
                    let orderId = (ordersDetails._id) ? new ObjectId(ordersDetails._id) : "";
                    let orderSellingAmount = (ordersDetails.total_selling_amount) ? parseInt(ordersDetails.total_selling_amount) : 0;
                    if (paymentBy == PAYMENT_BY_PAYMENT_GATEWAY || paymentBy == PAYMENT_BY_WALLET) {
                        totalReceivableAmount = orderSellingAmount;
                    }


                    let addressDetail = (ordersDetails && ordersDetails.address_detail) ? ordersDetails.address_detail : "";
                    let bookingDate = ordersDetails.booking_date || null;
                    let bookingTime = ordersDetails.booking_time || null;
                    let bookingStartTimestamp = ordersDetails.booking_start_timestamp || null;
                    let bookingEndTimestamp = ordersDetails.booking_end_timestamp || null;
                    let travellingTimestamp = ordersDetails.travelling_timestamp || null;
                    let mySubscriptionId = ordersDetails.user_subscription_id || null;
                    let mySubscriptionDetails = ordersDetails.my_subscription_details || null;
                    let totalNumerOfSubscriptions = ordersDetails.total_numer_of_subscriptions || 0;
                    let mypackageId = null;
                    let bookingPrice = null;
                    let bookingDuration = (mySubscriptionDetails && mySubscriptionDetails.duration) ? mySubscriptionDetails.duration : null;
                    let bookingCarType = (mySubscriptionDetails && mySubscriptionDetails.car_type) ? mySubscriptionDetails.car_type : null;
                    let bookingProviderType = (mySubscriptionDetails && mySubscriptionDetails.provider_type) ? mySubscriptionDetails.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;

                    let orderFinalDetails = ordersDetails;
                    delete orderFinalDetails.package_data;
                    delete orderFinalDetails.subscription_data;
                    /**condition for check payment amount and order selling amount */

                    if (payFromWallet) {
                        if (userWalletbalance < orderSellingAmount) {
                            finalResponse = {
                                'data': {
                                    status: STATUS_ERROR,
                                    result: {},
                                    message: res.__("front.system.user_wallet_balance_is_low")
                                }
                            };
                            return returnApiResult(req, res, finalResponse);
                        }
                    }

                    if (totalNumerOfSubscriptions && payCOD) {
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.system.COD_not_allowed_for_purchase_subscription")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }


                    let transactionResponse = {};
                    let transactionId = null;

                    if (payCOD || (payFromPG && (paymentGatewayAmount == orderSellingAmount)) || (payFromWallet && (userWalletbalance >= orderSellingAmount))) {

                        if (payFromPG) {
                            let paymentOptions = {
                                'order_id': orderId,
                                'order_number': orderNumber,
                                'order_details': orderFinalDetails,
                                'user_id': userId,
                                'transaction_id': paymentGatwayTransactionId,
                                'amount': paymentGatewayAmount,
                                'status': paymentGatewayStatus,
                                'response': JSON.stringify(paymentGatewayResponse),
                                'modified': getUtcDate()
                            }

                            let options = {
                                insertData: paymentOptions
                            }

                            transactionResponse = await UserModel.saveMyPaymentTransaction(req, res, options);
                            transactionId = (transactionResponse.result.insertedId) ? new ObjectId(transactionResponse.result.insertedId) : "";
                        }

                        async.parallel({
                            updatePaymentStatus: (callback) => {
                                let updateData = {
                                    'payment_transaction_id': transactionId,
                                    'payment_by': paymentBy
                                };

                                if (payFromPG || payFromWallet) {
                                    updateData['payment_status'] = PAYMENT_PAID;
                                }

                                let options = {
                                    conditions: { order_number: orderNumber },
                                    updateData: { $set: updateData }
                                };
                                OrderModel.updateOrder(req, res, options).then(updateOrderResponse => {
                                    callback(updateOrderResponse.error || null, updateOrderResponse.result)
                                });
                            },
                            updateOrderItemsPaymentStatus: (callback) => {
                                let updateData = {
                                    'payment_by': paymentBy
                                };

                                if (payFromPG || payFromWallet) {
                                    updateData['payment_status'] = PAYMENT_PAID;
                                } else {
                                    updateData['payment_status'] = PAYMENT_UNPAID;
                                }

                                let options = {
                                    conditions: { 'order_number': orderNumber },
                                    updateData: { $set: updateData }
                                };
                                /**update order items payment status */
                                OrderModel.updateOrderItems(req, res, options).then(updateOrderItemResponse => {
                                    callback(updateOrderItemResponse.error || null, updateOrderItemResponse.result)
                                });
                            },
                            deleteCartEntry: (callback) => {
                                emptyUserCart(req, res, userId).then(cartResponse => {
                                    callback(null, cartResponse.result)
                                });
                            },
                            updateProductQuantity: (callback) => {
                                let condition = {
                                    order_number: orderNumber
                                };
                                let orderItemOption = {
                                    conditions: condition,
                                    fields: { product_id: 1, item_type: 1, product_cart_quantity: 1 }
                                };
                                OrderModel.getOrderItemList(orderItemOption).then(orderItemResponse => {
                                    if (orderItemResponse.status == STATUS_ERROR || (orderItemResponse.result && orderItemResponse.result.length == 0)) {
                                        callback(orderItemResponse.error || null, orderItemResponse.result || null)
                                    } else {

                                        async.each(orderItemResponse.result, (records, childCallback) => {

                                            let itemType = (records.item_type) ? records.item_type : '';

                                            /**condition for product */
                                            if (itemType === ITEM_TYPE_PRODUCT) {
                                                let productId = (records.product_id) ? new ObjectId(records.product_id) : '';
                                                let productQuantity = (records.product_cart_quantity) ? parseInt(records.product_cart_quantity) : DEACTIVE;


                                                //   product order log insert
                                                let condition = {
                                                    _id: productId
                                                }
                                                let option = {
                                                    conditions: condition,
                                                }

                                                ProductModel.productFindOne(option).then(productDetailResponse => {
                                                    if (productDetailResponse.status == STATUS_SUCCESS) {

                                                        let product_quantity = (productDetailResponse.result.quantity) ? Number(productDetailResponse.result.quantity) : 0;
                                                        let new_product_quantity = product_quantity - productQuantity;

                                                        let optionObj = {
                                                            insertData: {
                                                                create_by: new ObjectId(userId),
                                                                product_id: productId,
                                                                order_id: orderId,
                                                                post_quantity: product_quantity,
                                                                new_quantity: new_product_quantity,
                                                                quantity: productQuantity,
                                                                action: REMOVE,
                                                                note: res.__("admin.system.order_booking"),
                                                                created: getUtcDate(),
                                                                modified: getUtcDate(),
                                                            }
                                                        }
                                                        ProductModel.saveOneStockLog(req, res, optionObj).then(saveResponse => { })
                                                    }
                                                })

                                                /* product order log insert */
                                                let productOption = {
                                                    conditions: { _id: productId },
                                                    updateData: {
                                                        $inc: { quantity: -productQuantity },
                                                        $set: { modified: getUtcDate() }
                                                    }
                                                };

                                                /**update product quantity*/
                                                ProductModel.updateOneProduct(req, res, productOption).then((productResposne) => {
                                                    childCallback(productResposne.error || null, productResposne.result || null)
                                                });


                                            } else if (itemType === ITEM_TYPE_PACKAGE) { /**condition for package */

                                                let packageId = (records.product_id) ? new ObjectId(records.product_id) : '';

                                                let packageOpt = {
                                                    conditions: { _id: packageId }
                                                };
                                                /**get package details */
                                                PackageModel.getPackageFindOne(packageOpt).then(async (packageRes) => {
                                                    let packageDetails = (packageRes.result) ? packageRes.result : {};

                                                    delete packageDetails._id;

                                                    /**set booking price, cartype, duration */
                                                    bookingPrice = (packageDetails && packageDetails.price) ? packageDetails.price : "";
                                                    bookingCarType = (packageDetails && packageDetails.car_type) ? packageDetails.car_type : "";
                                                    bookingProviderType = (packageDetails && packageDetails.provider_type) ? packageDetails.provider_type : "";
                                                    bookingDuration = (packageDetails && packageDetails.duration) ? packageDetails.duration : "";

                                                    let packageOptions = {
                                                        'payment_transaction_id': transactionId,
                                                        'order_id': orderId,
                                                        'order_number': orderNumber,
                                                        'user_id': userId,
                                                        'package_id': packageId,
                                                        'booking_date': bookingDate,
                                                        'booking_time': bookingTime,
                                                        'booking_start_timestamp': bookingStartTimestamp,
                                                        'booking_end_timestamp': bookingEndTimestamp,
                                                        'travelling_timestamp': travellingTimestamp,
                                                        ...packageDetails,
                                                        'is_deleted': NOT_DELETED,
                                                        'created': getUtcDate(),
                                                        'modified': getUtcDate(),

                                                    };

                                                    let package = {
                                                        insertData: packageOptions
                                                    }
                                                    /**save user package */
                                                    UserModel.saveMyPackage(req, res, package).then((packageResposne) => {
                                                        mypackageId = (packageResposne.result.insertedId) ? new ObjectId(packageResposne.result.insertedId) : "";
                                                        childCallback(packageResposne.error || null, packageResposne.result || null)
                                                    });
                                                });
                                            }
                                            else if (itemType === ITEM_TYPE_SUBSCRIPTION) { /**condition for subscription */
                                                let subscriptionId = (records.product_id) ? new ObjectId(records.product_id) : '';

                                                let subscriptionOpt = {
                                                    conditions: { _id: subscriptionId }
                                                };
                                                /**get subscription */
                                                SubscriptionModel.getSubscriptionFindOne(subscriptionOpt).then((subscriptionResponse) => {

                                                    let subscriptionResult = (subscriptionResponse.result) ? subscriptionResponse.result : {};
                                                    let duration = (subscriptionResult && subscriptionResult.duration) ? subscriptionResult.duration : "";
                                                    let validity_period = (subscriptionResult && subscriptionResult.validity_period) ? parseInt(subscriptionResult.validity_period) : 0;

                                                    delete subscriptionResult._id;

                                                    let startDate = new Date();

                                                    let endDate = new Date();
                                                    endDate.setDate(startDate.getDate() + validity_period);
                                                    endDate.toDateString();

                                                    let startDateTimestamp = startDate.getTime() || null;
                                                    let endDateTimestamp = new Date(endDate).getTime() || null;

                                                    let subscriptionOptions = {
                                                        'payment_transaction_id': transactionId,
                                                        'order_id': orderId,
                                                        'order_number': orderNumber,
                                                        'user_id': userId,
                                                        'subscription_id': subscriptionId,
                                                        'start_date': startDate.toISOString(),
                                                        'end_date': endDate.toISOString(),
                                                        'start_date_timestamp': startDateTimestamp,
                                                        'end_date_timestamp': endDateTimestamp,
                                                        ...subscriptionResult,
                                                        'is_deleted': NOT_DELETED,
                                                        'modified': getUtcDate(),
                                                        'created': getUtcDate(),
                                                    };

                                                    let subscription = {
                                                        insertData: subscriptionOptions
                                                    }
                                                    /**save user subscription */
                                                    UserModel.saveMySubscription(req, res, subscription).then(async (subscriptionResposne) => {

                                                        mySubscriptionId = (subscriptionResposne.result.insertedId) ? new ObjectId(subscriptionResposne.result.insertedId) : "";


                                                        // add point for subscription 
                                                        let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(userId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1, 'full_name': 1 } });

                                                        let customerResult = (userDetails.result) ? userDetails.result : "";
                                                        let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;
                                                        let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;

                                                        let valuePerPoint = res.locals.settings["Site.value_per_coin"];


                                                        let totalSellingAmount = (subscriptionResult && subscriptionResult.price) ? Number(subscriptionResult.price) : 0;

                                                        let pointsResp = calculatePoints(orderSellingAmount, valuePerPoint, totalBalanceForPoints);
                                                        let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
                                                        let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
                                                        let useOrderNumber = "#" + orderNumber;

                                                        let pointsOption = {
                                                            "user_id": new ObjectId(userId),
                                                            "order_id": orderId,
                                                            "order_number": useOrderNumber,
                                                            "points": points,
                                                            "type": POINT_TYPE_EARNED,
                                                            "transaction_reason": EARNED_BY_ORDER,
                                                            "amount_for_single_point": valuePerPoint,
                                                            "total_user_points": totalUserPoints,
                                                            "total_selling_amount": orderSellingAmount,
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


                                                        childCallback(subscriptionResposne.error || null, subscriptionResposne.result || null)
                                                    });
                                                });
                                            }
                                            else {
                                                childCallback(null, null);
                                            }
                                        }, (childErr) => {
                                            callback(childErr || null, null);
                                        });
                                    }
                                })
                            },
                            getAddressDetails: (callback) => {
                                let options = {
                                    "latitude": (addressDetail.latitude) ? addressDetail.latitude : "",
                                    "longitude": (addressDetail.longitude) ? addressDetail.longitude : ""
                                }
                                getAreaIdsFromLatLong(req, res, options).then((addRes) => {
                                    callback(null, addRes)
                                });
                            },

                        }, async (asyncErr, asyncResponse) => {

                            if (!asyncErr && asyncResponse) {

                                let areaDetails = (asyncResponse && asyncResponse.getAddressDetails) ? asyncResponse.getAddressDetails : {};

                                let is_service_booking = ordersDetails.is_service_booking;
                                let is_store_order = ordersDetails.is_store_order;
                                let fullName = (loginUserData.full_name) ? loginUserData.full_name : "";
                                let email = (loginUserData.email) ? loginUserData.email : "";

                                let updateData = {
                                    order_status: ORDER_PLACED,
                                    area_ids: areaDetails,
                                    user_package_id: mypackageId,
                                    user_subscription_id: mySubscriptionId,
                                    payment_details: {
                                        'payment_transaction_id': transactionId,
                                        'transaction_id': paymentGatwayTransactionId,
                                        'amount': paymentGatewayAmount,
                                        'status': paymentGatewayStatus,
                                    },
                                    status: BOOKING_STATUS_NEW,
                                    booking_car_type: bookingCarType,
                                    provider_type: bookingProviderType,
                                    booking_duration: bookingDuration,
                                    booking_price: bookingPrice,
                                    total_received_amount: totalReceivableAmount
                                };

                                let options = {
                                    conditions: { _id: orderId },
                                    updateData: { $set: updateData }
                                };

                                OrderModel.updateOrder(req, res, options).then(async (updateOrderResponse) => {

                                    let bookingRslt = (updateOrderResponse.result) ? updateOrderResponse.result : null;

                                    if (updateOrderResponse.status == STATUS_SUCCESS) {

                                        if (is_service_booking || is_store_order) {
                                            let extraParametersObj = {
                                                order_id: orderId,
                                                order_number: orderNumber,
                                                user_id: new ObjectId(userId),
                                                user_package_id: mypackageId,
                                                user_subscription_id: mySubscriptionId,
                                                booking_id: orderId.toString(),
                                                booking_status: BOOKING_STATUS_NEW,
                                            }

                                            let notificationOptions = {
                                                notification_data: {
                                                    notification_type: NOTIFICATION_TO_USER_CONFIRM_BOOKING,
                                                    message_params: [fullName, orderNumber],
                                                    user_id: userId,
                                                    user_ids: [userId],
                                                    lang_code: langCode,
                                                    extra_parameters: extraParametersObj,
                                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                                    role_id: FRONT_ADMIN_ROLE_ID,
                                                    created_by: userId
                                                }
                                            };

                                            /**send booking notification to user */
                                            await insertNotifications(req, res, notificationOptions);


                                            /**send checkout push notification to user */
                                            let pushNotificationOptionsUser = {
                                                notification_data: {
                                                    notification_type: PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
                                                    message_params: [fullName, orderNumber],
                                                    user_id: userId,
                                                    user_ids: [userId],
                                                    booking_id: orderId.toString(),
                                                    booking_status: BOOKING_STATUS_NEW,
                                                    user_role_id: FRONT_ADMIN_ROLE_ID,
                                                    role_id: FRONT_ADMIN_ROLE_ID,
                                                    created_by: userId
                                                }
                                            };
                                            await pushNotification(req, res, pushNotificationOptionsUser);


                                            let areaIds = ordersDetails.area_ids ? ordersDetails.area_ids.map(item => item.area_id) : [];
                                            let currentDateTime = new Date();
                                            let optionObj = {
                                                conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
                                            }
                                            FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
                                                let responseStatus = response.status ? response.status : "";
                                                let contractData = response.result ? response.result : "";
                                                if (responseStatus == STATUS_SUCCESS && contractData) {

                                                    let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
                                                    let totalSellingAmount = (ordersDetails.total_selling_amount) ? ordersDetails.total_selling_amount : 0;

                                                    if (franchiseId) {
                                                        let franchiseNotificationOptions = {
                                                            notification_data: {
                                                                notification_type: FRANCHISE_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
                                                                message_params: [fullName, orderNumber, totalSellingAmount],
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
                                                                notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
                                                                message_params: [fullName, orderNumber, totalSellingAmount],
                                                                user_id: franchiseId,
                                                                user_ids: [franchiseId],
                                                                booking_id: orderId.toString(),
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


                                            let emailOptions = {
                                                to: email,
                                                action: "user_confirm_booking",
                                                rep_array: [fullName, orderNumber],
                                            };
                                            sendMail(req, res, emailOptions);

                                            let aSPOptions = {
                                                area_ids: areaDetails,
                                                booking_start_timestamp: bookingStartTimestamp,
                                                booking_end_timestamp: bookingEndTimestamp,
                                                provider_type: bookingProviderType,
                                                is_service_booking: is_service_booking,
                                                is_store_order: is_store_order,
                                            };

                                            let availableServiceProviders = await getAvailableServiceProviders(req, res, aSPOptions);

                                            if (Array.isArray(availableServiceProviders) && availableServiceProviders.length > 0) {
                                                let ids = availableServiceProviders.map(provider => provider._id.toString());

                                                if (availableServiceProviders.length == 1) {
                                                    const { acceptBooking } = require('./orderBooking');
                                                    req.body.is_automatic_assign = ACTIVE;
                                                    req.body.booking_id = orderId;
                                                    req.body.user_id = ids[0];
                                                    await acceptBooking(req, res);
                                                }
                                                else {
                                                    let extraParametersObj = {
                                                        order_id: orderId,
                                                        order_number: orderNumber,
                                                        user_id: new ObjectId(userId),
                                                        booking_id: orderId.toString(),
                                                        booking_status: BOOKING_STATUS_NEW,
                                                    }

                                                    let notificationOptions = {
                                                        notification_data: {
                                                            notification_type: NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING,
                                                            message_params: [fullName, orderNumber],
                                                            user_id: userId,
                                                            user_ids: ids,
                                                            extra_parameters: extraParametersObj,
                                                            user_role_id: FRONT_ADMIN_ROLE_ID,
                                                            role_id: FRONT_ADMIN_ROLE_ID,
                                                            created_by: userId
                                                        }
                                                    };
                                                    await insertNotifications(req, res, notificationOptions);

                                                    /**send checkout push notification to user */
                                                    let pushNotificationOptionsUser = {
                                                        notification_data: {
                                                            notification_type: PUSH_NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING,
                                                            message_params: [fullName, orderNumber],
                                                            user_ids: ids,
                                                            booking_id: orderId.toString(),
                                                            booking_status: BOOKING_STATUS_NEW,
                                                            user_role_id: FRONT_ADMIN_ROLE_ID,
                                                            role_id: FRONT_ADMIN_ROLE_ID,
                                                            created_by: userId
                                                        }
                                                    };
                                                    await pushNotification(req, res, pushNotificationOptionsUser);
                                                }
                                            }
                                        }

                                        if (payFromWallet) {
                                            let totalUserWalletAmount = Number(userWalletbalance) - Number(orderSellingAmount);
                                            let options = {
                                                'conditions': { _id: userId },
                                                'updateData': {
                                                    $set: { 'wallet_amount': Number(totalUserWalletAmount), 'modified': getUtcDate() }
                                                },
                                            }

                                            let transactionIdData = await getUniqueWalletTransactionId(req, res);
                                            let transaction_id = (transactionIdData.result) || '';

                                            /**query for update sender wallet ammount */
                                            RegistrationModel.updateUser(req, res, options).then(async (updateWalletRes) => {
                                                try {
                                                    let userOrderNumber = "#" + orderNumber;
                                                    /**save wallet amount */
                                                    GiftTransactionModel.saveWalletTransactionLogs(req, res, {
                                                        insertData: {
                                                            'user_id': userId,
                                                            'amount': Number(orderSellingAmount),
                                                            'order_id': orderId,
                                                            'order_number': orderNumber,
                                                            'transaction_id': transaction_id,
                                                            'type': AMOUNT_DEBIT,
                                                            'transaction_type': PAY_FOR_ORDER_BOOKING,
                                                            'total_balance_after_transaction': totalUserWalletAmount,
                                                            'message': res.__("front.user.paid_for", userOrderNumber),
                                                            'created': getUtcDate()
                                                        }
                                                    });

                                                    if (updateWalletRes.status == STATUS_SUCCESS) {


                                                        let extraParametersObj = {
                                                            order_id: orderId,
                                                            order_number: orderNumber,
                                                            user_id: new ObjectId(userId),
                                                        }

                                                        let notificationCheckoutOptions = {
                                                            notification_data: {
                                                                notification_type: NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET,
                                                                message_params: [fullName, orderNumber, orderSellingAmount],
                                                                user_id: userId,
                                                                user_ids: [userId],
                                                                lang_code: langCode,
                                                                extra_parameters: extraParametersObj,
                                                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                                                role_id: FRONT_ADMIN_ROLE_ID,
                                                                created_by: userId
                                                            }
                                                        };

                                                        /**send checkout notification to user */
                                                        await insertNotifications(req, res, notificationCheckoutOptions);



                                                        let pushNotificationOptions = {
                                                            notification_data: {
                                                                notification_type: PUSH_NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET,
                                                                message_params: [fullName, orderNumber, orderSellingAmount],
                                                                user_id: userId,
                                                                lang_code: langCode,
                                                                user_role_id: FRONT_ADMIN_ROLE_ID,
                                                                role_id: FRONT_ADMIN_ROLE_ID,
                                                                created_by: userId
                                                            }
                                                        };

                                                        /**send checkout push notification to user */
                                                        await pushNotification(req, res, pushNotificationOptions);



                                                        let emailOptions = {
                                                            to: email,
                                                            action: "user_checkout_order_from_wallet",
                                                            rep_array: [fullName, orderNumber, orderSellingAmount],
                                                        };
                                                        sendMail(req, res, emailOptions);


                                                        finalResponse = {
                                                            'data': {
                                                                status: STATUS_SUCCESS,
                                                                result: {},
                                                                message: res.__("front.order.thanks_for_your_order")
                                                            }
                                                        };
                                                        return returnApiResult(req, res, finalResponse);
                                                    } else {
                                                        finalResponse = {
                                                            'data': {
                                                                status: STATUS_ERROR,
                                                                result: {},
                                                                message: res.__("front.system.something_going_wrong_please_try_again")
                                                            }
                                                        };
                                                        return returnApiResult(req, res, finalResponse);
                                                    }

                                                } catch (err) {
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
                                        } else {

                                            finalResponse = {
                                                'data': {
                                                    status: STATUS_SUCCESS,
                                                    result: {},
                                                    message: res.__("front.order.thanks_for_your_order")
                                                }
                                            };
                                            return returnApiResult(req, res, finalResponse);
                                        }
                                    } else {
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
                        });
                    }
                    else {
                        finalResponse = {
                            'data': {
                                status: STATUS_ERROR,
                                result: {},
                                message: res.__("front.order.amount_does_not_match_to_selling_amount")
                            }
                        };
                        return returnApiResult(req, res, finalResponse);
                    }

                }
            });
        }
    }


    /**
     * Function for get order list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.getOrderList = (req, res, next) => {
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let page = (req.body.page) ? parseInt(req.body.page) : 1;
        let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
        let skip = (limit * page) - limit;

        if (!userId) {
            finalResponse = {
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
            user_id: new ObjectId(userId),
        };

        /** order list condition */
        let conditions = [{
            $facet: {
                "order_list": [
                    { $match: commonConditions },
                    {
                        $project: {
                            'package_data': 0,
                            'subscription_data': 0,
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

        OrderModel.getOrderAggregateList(req, res, optionObj).then(orderResponse => {
            let responseStatus = (orderResponse.status) ? orderResponse.status : "";
            if (responseStatus == STATUS_SUCCESS) {
                let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : "";
                let orderList = (responseResult && responseResult.order_list) ? responseResult.order_list : [];
                let totalRecord = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                /**send success response */
                let finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: orderList,
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
    }


    /**
    * Function for get order Detail 
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.getOrderDetail = (req, res, next) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
        let orderNumber = (req.body.order_number) ? req.body.order_number : "";
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";

        let finalResponse = {};

        if (userId == "" || orderNumber == "") {
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

            /** Get details **/
            let conditions = [
                { $match: { 'order_number': orderNumber, 'user_id': new ObjectId(userId), 'is_deleted': NOT_DELETED } },
                {
                    $lookup: {
                        from: TABLE_ORDER_ITEMS,
                        let: { orderNumber: "$order_number" },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$order_number", "$$orderNumber"] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                "_id": 1,
                                "order_id": 1,
                                "order_number": 1,
                                "item_type": 1,
                                "product_title": 1,
                                "product_image": 1,
                                "car_type": "3",
                                "duration": "1",
                                'car_type': 1,
                                'duration': 1,
                                'price': 1,
                                'slug': 1,
                                'short_description': 1,
                                'description': 1,
                                'package_name': { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".package_name", ''] }, then: "$pages_descriptions." + langCode + ".package_name", else: "$package_name" } },
                                'body': { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$body" } },
                                'short_description': { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".short_description", ''] }, then: "$pages_descriptions." + langCode + ".short_description", else: "$short_description" } },
                                "product_price": 1,
                                "product_mrp_price": 1,
                                "product_offer_price": 1,
                                "product_offer_type": 1,
                                "vat_included": 1,
                                "product_cart_quantity": 1,
                                "total_mrp": 1,
                                "total_selling_amount": 1,
                                "total_product_discount": 1,
                                "item_status": 1,
                            }
                        }],
                        as: "order_item_details",
                    }
                },
                {
                    $project: {
                        'order_id': 1,
                        'order_number': 1,
                        'order_status': 1,
                        'item_count': 1,
                        'total_quantity': 1,
                        'total_mrp_amount': 1,
                        'total_selling_amount': 1,
                        'total_product_discount': 1,
                        'total_extra_discount': 1,
                        'total_shipping_amount': 1,
                        'booking_date': 1,
                        'booking_time': 1,
                        'order_item_details': 1,
                        'address_detail': 1,
                        'created': 1,
                    }
                },
            ];

            let options = {
                'conditions': conditions
            };

            OrderModel.getOrderAggregateList(req, res, options).then(orderResponse => {
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
                /** Send success response */
                finalResponse = {
                    data: {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        product_url: PRODUCT_URL,
                        package_url: PACKAGE_URL,
                        subscription_url: SUBSCRIPTION_URL,
                        message: ""
                    }
                };
                return returnApiResult(req, res, finalResponse);
            });
        }

    }// End getOrderDetail()


    const processProductList = async (productList, orderId, orderNumber, userId, req, res) => {
        try {
            const itemList = [];
            let i = 1;

            for (const records of productList) {
                const itemType = records.item_type || '';
                const orderItems = {};

                if (itemType === ITEM_TYPE_PRODUCT) {
                    const formattedRecords = records.product_detail?.[0] || {};
                    const productId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

                    const options = {
                        conditions: { _id: productId },
                        fields: { "_id": 1, "product_title": 1, "main_image_name": 1, "parent_category_name": 1, "slug": 1, "product_sku": 1, "price": 1, "mrp_price": 1, "offer_price": 1, "offer_type": 1, "vat_included": 1, "pages_descriptions": 1 },
                    };

                    const productResponse = await ProductModel.productFindOne(options);
                    if (productResponse.status === STATUS_ERROR) {
                        return {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        };
                    }

                    const productResult = productResponse.result;

                    Object.assign(orderItems, {
                        order_id: new ObjectId(orderId),
                        order_number: orderNumber,
                        order_item_number: `${orderNumber}_${i++}`,
                        user_id: new ObjectId(userId),
                        item_type: itemType,
                        product_id: formattedRecords._id ? new ObjectId(formattedRecords._id) : '',
                        product_title: formattedRecords.product_title || '',
                        product_slug: formattedRecords.slug || '',
                        product_image: productResult.main_image_name || '',
                        product_sku: productResult.product_sku || '',
                        pages_descriptions: productResult.pages_descriptions || '',
                        product_category_name: productResult.parent_category_name || '',
                        seller_id: formattedRecords.user_id ? new ObjectId(formattedRecords.user_id) : '',
                        sold_by: formattedRecords.user_details || {},
                        product_price: formattedRecords.price ? formatToTwo(formattedRecords.price) : DEACTIVE,
                        product_mrp_price: formattedRecords.mrp_price ? formatToTwo(formattedRecords.mrp_price) : DEACTIVE,
                        product_offer_price: formattedRecords.offer_price ? formatToTwo(formattedRecords.offer_price) : DEACTIVE,
                        product_offer_type: formattedRecords.offer_type ? formattedRecords.offer_type : DEACTIVE,
                        vat_included: formattedRecords.vat_included ? Number(formattedRecords.vat_included) : DEACTIVE,
                        vat_in_precentage: records.vat_in_precentage ? Number(records.vat_in_precentage) : DEACTIVE,
                        total_vat_excluded_amount: records.total_vat_excluded_amount ? Number(records.total_vat_excluded_amount) : DEACTIVE,
                        total_vat_included_amount: records.total_vat_included_amount ? Number(records.total_vat_included_amount) : DEACTIVE,
                        product_cart_quantity: records.cart_quantity ? Number(records.cart_quantity) : DEACTIVE,
                        total_mrp: records.total_mrp ? formatToTwo(records.total_mrp) : DEACTIVE,
                        total_discount_on_mrp: records.total_discount_on_mrp ? formatToTwo(records.total_discount_on_mrp) : DEACTIVE,
                        total_selling_amount: records.total_selling_amount ? formatToTwo(records.total_selling_amount) : DEACTIVE,
                        total_product_discount: records.total_product_discount ? formatToTwo(records.total_product_discount) : DEACTIVE,
                        item_status: ITEM_PLACED,
                        start_delivery: false,
                        is_delivered: false
                    });

                    itemList.push(orderItems);
                }

                if (itemType === ITEM_TYPE_PACKAGE) {
                    const formattedRecords = records.package_detail?.[0] || {};
                    const packageId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

                    const options = {
                        conditions: { _id: packageId },
                        fields: { "_id": 1, "package_name": 1, "package_image": 1, "slug": 1, "car_type": 1, "duration": 1, "travel_time": 1, "price": 1, "mrp_price": 1, "offer_price": 1, "offer_type": 1, "vat_included": 1, "pages_descriptions": 1 },
                    };

                    const productResponse = await PackageModel.getPackageFindOne(options);
                    if (productResponse.status === STATUS_ERROR) {
                        return {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        };
                    }

                    const productResult = productResponse.result;

                    Object.assign(orderItems, {
                        order_id: new ObjectId(orderId),
                        order_number: orderNumber,
                        order_item_number: `${orderNumber}_${i++}`,
                        user_id: new ObjectId(userId),
                        item_type: itemType,
                        product_id: formattedRecords._id ? new ObjectId(formattedRecords._id) : '',
                        product_title: productResult.package_name || '',
                        product_slug: productResult.slug || '',
                        product_image: productResult.package_image || '',
                        car_type: productResult.car_type || '',
                        duration: productResult.duration || '',
                        travel_time: productResult.travel_time || '',
                        pages_descriptions: productResult.pages_descriptions || '',
                        product_price: productResult.price ? formatToTwo(productResult.price) : DEACTIVE,
                        product_mrp_price: productResult.mrp_price ? formatToTwo(productResult.mrp_price) : DEACTIVE,
                        product_offer_price: productResult.offer_price ? formatToTwo(productResult.offer_price) : DEACTIVE,
                        product_offer_type: productResult.offer_type ? productResult.offer_type : DEACTIVE,
                        vat_included: productResult.vat_included ? Number(productResult.vat_included) : DEACTIVE,
                        vat_in_precentage: records.vat_in_precentage ? Number(records.vat_in_precentage) : DEACTIVE,
                        total_vat_excluded_amount: records.total_vat_excluded_amount ? Number(records.total_vat_excluded_amount) : DEACTIVE,
                        total_vat_included_amount: records.total_vat_included_amount ? Number(records.total_vat_included_amount) : DEACTIVE,
                        product_cart_quantity: records.cart_quantity ? Number(records.cart_quantity) : DEACTIVE,
                        total_mrp: records.total_mrp ? formatToTwo(records.total_mrp) : DEACTIVE,
                        total_discount_on_mrp: records.total_discount_on_mrp ? formatToTwo(records.total_discount_on_mrp) : DEACTIVE,
                        total_selling_amount: records.total_selling_amount ? formatToTwo(records.total_selling_amount) : DEACTIVE,
                        total_product_discount: records.total_product_discount ? formatToTwo(records.total_product_discount) : DEACTIVE,
                        item_status: ITEM_PLACED,
                    });

                    itemList.push(orderItems);
                }


                if (itemType === ITEM_TYPE_SUBSCRIPTION) {
                    const formattedRecords = records.subscription_detail?.[0] || {};
                    const subscriptionId = formattedRecords._id ? new ObjectId(formattedRecords._id) : '';

                    const options = {
                        conditions: { _id: subscriptionId },
                        fields: { "_id": 1, "subscription_name": 1, "subscription_image": 1, "slug": 1, "car_type": 1, "duration": 1, "travel_time": 1, "price": 1, "mrp_price": 1, "offer_price": 1, "offer_type": 1, "vat_included": 1, "pages_descriptions": 1, "total_service": 1, "validity_period": 1, "pages_descriptions": 1 },
                    };

                    const subscriptionResponse = await SubscriptionModel.getSubscriptionFindOne(options);
                    if (subscriptionResponse.status === STATUS_ERROR) {
                        return {
                            status: STATUS_ERROR,
                            result: {},
                            message: res.__("front.system.something_going_wrong_please_try_again"),
                        };
                    }

                    const subscriptionResult = subscriptionResponse.result;

                    Object.assign(orderItems, {
                        order_id: new ObjectId(orderId),
                        order_number: orderNumber,
                        order_item_number: `${orderNumber}_${i++}`,
                        user_id: new ObjectId(userId),
                        item_type: itemType,
                        product_id: formattedRecords._id ? new ObjectId(formattedRecords._id) : '',
                        product_title: subscriptionResult.subscription_name || '',
                        product_slug: subscriptionResult.slug || '',
                        product_image: subscriptionResult.subscription_image || '',
                        car_type: subscriptionResult.car_type || '',
                        duration: subscriptionResult.duration || '',
                        travel_time: subscriptionResult.travel_time || '',
                        total_service: subscriptionResult.total_service || '',
                        validity_period: subscriptionResult.validity_period || '',
                        pages_descriptions: subscriptionResult.pages_descriptions || '',
                        product_price: subscriptionResult.price ? formatToTwo(subscriptionResult.price) : DEACTIVE,
                        product_mrp_price: subscriptionResult.mrp_price ? formatToTwo(subscriptionResult.mrp_price) : DEACTIVE,
                        product_offer_price: subscriptionResult.offer_price ? formatToTwo(subscriptionResult.offer_price) : DEACTIVE,
                        product_offer_type: subscriptionResult.offer_type ? subscriptionResult.offer_type : DEACTIVE,
                        vat_included: subscriptionResult.vat_included ? Number(subscriptionResult.vat_included) : DEACTIVE,
                        vat_in_precentage: records.vat_in_precentage ? Number(records.vat_in_precentage) : DEACTIVE,
                        total_vat_excluded_amount: records.total_vat_excluded_amount ? Number(records.total_vat_excluded_amount) : DEACTIVE,
                        total_vat_included_amount: records.total_vat_included_amount ? Number(records.total_vat_included_amount) : DEACTIVE,
                        product_cart_quantity: records.cart_quantity ? Number(records.cart_quantity) : DEACTIVE,
                        total_mrp: records.total_mrp ? formatToTwo(records.total_mrp) : DEACTIVE,
                        total_discount_on_mrp: records.total_discount_on_mrp ? formatToTwo(records.total_discount_on_mrp) : DEACTIVE,
                        total_selling_amount: records.total_selling_amount ? formatToTwo(records.total_selling_amount) : DEACTIVE,
                        total_product_discount: records.total_product_discount ? formatToTwo(records.total_product_discount) : DEACTIVE,
                        item_status: ITEM_PLACED,
                    });

                    itemList.push(orderItems);
                }
            }

            const options = {
                insertData: itemList,
            };

            const orderItemResponse = await OrderModel.saveInsertOrderItems(req, res, options);

            if (orderItemResponse.status === STATUS_ERROR) {
                return {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.something_going_wrong_please_try_again"),
                };
            } else {
                return {
                    status: STATUS_SUCCESS,
                    result: {},
                    message: '',
                };
            }
        } catch (error) {
            console.error("Error processing product list:", error);
            return {
                status: STATUS_ERROR,
                result: {},
                message: res.__("front.system.something_going_wrong_please_try_again"),
            };
        }
    };


    /**
     * Function for upload image on booking
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.uploadImagesForBooking = async (req, res, next) => {
        let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let bookingId = (req.body.booking_id) ? new ObjectId(req.body.booking_id) : "";
        let image = (req.files && req.files.product_images) ? req.files.product_images : "";
        image = Array.isArray(image) ? image : image ? [image] : [];
        let files = req.files || '';

        if (Object.keys(files).length) {
            files = Object.keys(files).map(key => ({ image: files[key] }));
        }

        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let finalResponse = {};
        if (!userId || !bookingId || !image) {

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
                'service_provider_id': new ObjectId(userId),
                $or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
                $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
            },
            fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, is_store_order: 1, status: 1, total_selling_amount: 1 }
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
                conditions: { "_id": bookingId, 'service_provider_id': new ObjectId(userId), "order_status": ORDER_PLACED },
                updateData: {
                    $set: {
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
            OrderModel.updateOrderBooking(req, res, options).then(async (updateOrdResponse) => {

                if (updateOrdResponse.status == STATUS_SUCCESS) {

                    finalResponse = {
                        'data': {
                            status: STATUS_SUCCESS,
                            result: {},
                            message: res.__("front.order.image_uploaded")
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
        });
    }


    /**
    * Function for update Order Delivery Status
    *
    * @param req 	As 	Request Data
    * @param res 	As 	Response Data
    * @param next 	As 	Callback argument to the middleware function
    *
    * @return render/json
    */
    this.updateOrderDeliveryStatus = (req, res, next) => {

        let loginUserData = (req.user_data) ? req.user_data : "";
        let userId = (loginUserData._id) ? loginUserData._id : "";
        let userType = (loginUserData.user_type) ? loginUserData.user_type : "";
        let orderId = (req.body.order_id) ? new ObjectId(req.body.order_id) : "";
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

        // /** Get details **/
        let conditions = [
            {
                $match: { '_id': orderId, 'service_provider_id': new ObjectId(userId), 'is_deleted': NOT_DELETED }
            },
        ];

        let options = {
            'conditions': conditions
        };

        OrderModel.getOrderAggregateList(req, res, options).then(orderResponse => {

            let responseStatus = (orderResponse.status) ? orderResponse.status : "";
            let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : {};

            let status = (responseResult.status) ? (responseResult.status) : "";

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

            if (status == BOOKING_STATUS_GO_TO_LOCATION) {
                let condition = {
                    order_id: orderId
                };

                let orderItemOption = {
                    conditions: condition,
                };

                OrderModel.getOrderItemList(orderItemOption).then(orderItemResponse => {
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

                            if (itemType == ITEM_TYPE_PRODUCT && startDelivery == true && isDelivered != true) {
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
                            'is_delivered_time': getUtcDate()
                        };

                        let options = {
                            conditions: { '_id': { $in: convertedOrderItemIds } },
                            updateData: { $set: updateData }
                        };

                        OrderModel.updateOrderItems(req, res, options).then(updateOrderItemResponse => {
                            if (updateOrderItemResponse.state == STATUS_ERROR) {
                                finalResponse = {
                                    data: {
                                        status: STATUS_ERROR,
                                        result: {},
                                        message: res.__("front.system.something_going_wrong_please_try_again"),
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            }
                            else {
                                finalResponse = {
                                    data: {
                                        status: STATUS_SUCCESS,
                                        result: responseResult,
                                        message: res.__("front.global.order_delivered_successful")
                                    }
                                };
                                return returnApiResult(req, res, finalResponse);
                            }
                        });
                    }
                })
            }
            else {
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
        });
    }


    /**
 * Function for create booking
 * @param req As Request Data
 * @param res As Response Data
 * @param next	As Callback argument to the middleware function
 * @return json
 */
    this.createBooking = async (req, res) => {
        req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

        try {
            let bookingDate = req.body.booking_date || null;
            let bookingTime = req.body.booking_time || null;
            let addressId = req.body.address_id || "";
            let product_id = req.body.product_id || "";
            let packageId = req.body.package_id || "";
            let slug = req.body.slug || "";
            let products = req.body.products || "";
            let bookingDateTime = null;
            let booking_timestamp = null;
            let is_service_booking = null;
            let is_store_order = null;
            let booking_start_timestamp = null;
            let booking_end_timestamp = null;
            let travelling_timestamp = null;
            let addressDetail = null;
            let areaDetails = null;
            let carType = null;
            let providerType = null;
            let package_dration = null;
            let duration = null;


            const loginUserData = req.user_data || {};
            const userId = loginUserData._id ? new ObjectId(loginUserData._id) : null;

            if (products) {
                is_store_order = ACTIVE;
            }
            if (packageId) {
                is_service_booking = ACTIVE;
            }

            if (!slug || !userId) {
                return returnApiResult(req, res, {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("api.global.parameter_missing"),
                    },
                });
            }



            if (bookingDate && bookingTime) {
                bookingDateTime = new Date(bookingDate + 'T' + bookingTime);
                booking_timestamp = bookingDateTime.getTime();
            }

            let orderNumberRes = await OrderModel.generateOrderNumber(req, res);
            let orderNumber = orderNumberRes.result;

            if (addressId) {
                let addressOption = {
                    conditions: { _id: new ObjectId(addressId), is_deleted: NOT_DELETED },
                    fields: { is_deleted: 0, phone_number: 0, dial_code: 0, country_code: 0, country_dial_code: 0, country: 0, state: 0, is_default: 0, device_type: 0, api_type: 0, modified: 0, created: 0 }
                }

                /**get billing address */
                let addressDetailResp = await UserAddressModel.getUserAddressDetail(addressOption);


                if (addressDetailResp.status == STATUS_ERROR) {
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

                    addressDetail = addressDetailResp.result;

                    let areaOptions = {
                        "latitude": (addressDetail.latitude) ? addressDetail.latitude : "",
                        "longitude": (addressDetail.longitude) ? addressDetail.longitude : ""
                    }
                    /**area details */
                    areaDetails = await getAreaIdsFromLatLong(req, res, areaOptions);

                }
            }

            if (packageId) {
                const options = {
                    conditions: { _id: new ObjectId(packageId) },
                    fields: {
                        _id: 1,
                        package_name: 1,
                        package_image: 1,
                        slug: 1,
                        price: 1,
                        mrp_price: 1,
                        offer_price: 1,
                        offer_type: 1,
                        vat_included: 1,
                        pages_descriptions: 1,
                        duration: 1,
                        car_type: 1,
                        provider_type: 1,
                        travel_time: 1,
                    },
                };

                let packageResponse = await PackageModel.getPackageFindOne(options);
                let package_data = packageResponse.result

                package_dration = (package_data && package_data.duration) ? package_data.duration : null;
                carType = (package_data && package_data.car_type) ? package_data.car_type : "";
                providerType = (package_data && package_data.provider_type) ? package_data.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;

                if (providerType == "van_fleet") {
                    travelling_timestamp = Number(res.locals.settings["travel_time.van_fleet"]);
                }
                else if (providerType == "bike_fleet") {
                    travelling_timestamp = Number(res.locals.settings["travel_time.bike_fleet"]);
                }


                package_dration_timestamp = null;
                booking_start_timestamp = booking_timestamp - travelling_timestamp;
                if (package_dration) {
                    package_dration_timestamp = DURATION_TIMESTAMP[package_dration];
                }
                if (booking_timestamp) {
                    booking_end_timestamp = booking_timestamp + package_dration_timestamp;
                }
                booking_from = BOOKING_FROM_PACKAGE;
            }

            let orderData = {
                user_id: new ObjectId(userId),
                order_number: orderNumber,
                order_status: ORDER_PLACED,
                payment_status: PAYMENT_PAID,
                total_shipping_amount: DEACTIVE,
                booking_date: bookingDate,
                booking_time: bookingTime,
                booking_date_time: bookingDateTime,
                payment_status: PAYMENT_UNPAID,
                is_service_booking: is_service_booking,
                is_store_order: is_store_order,
                is_deleted: NOT_DELETED,
                booking_start_timestamp: booking_start_timestamp,
                booking_end_timestamp: booking_end_timestamp,
                booking_travelling_timestamp: travelling_timestamp,
                address_detail: addressDetail || "",
                status: BOOKING_STATUS_NEW,
                area_ids: areaDetails || "",
                booking_car_type: carType || "",
                provider_type: providerType || SERVICE_PROVIDER_TYPE_BIKE_FLEET,
                booking_duration: duration || "",
            };

            let options = { insertData: orderData };
            let bookingRes = await OrderModel.saveOrder(req, res, options);
            if (bookingRes.status === STATUS_SUCCESS) {
                let orderId = bookingRes.result.insertedId || "";
                let itemList = [];
                let productsToAdd = [];

                if (Array.isArray(products)) {
                    productsToAdd = products;
                } else if (Array.isArray(product_id)) {
                    productsToAdd = product_id.map((pid) => ({
                        product_id: pid,
                        quantity: quantity || 1,
                    }));
                } else if (product_id) {
                    productsToAdd = [{ product_id, quantity: 1 }];
                }

                let i = 1;
                for (const product of productsToAdd) {
                    const options = {
                        conditions: { _id: new ObjectId(product.product_id) },
                        fields: {
                            _id: 1,
                            product_title: 1,
                            main_image_name: 1,
                            parent_category_name: 1,
                            slug: 1,
                            product_sku: 1,
                            price: 1,
                            mrp_price: 1,
                            offer_price: 1,
                            offer_type: 1,
                            vat_included: 1,
                            pages_descriptions: 1,
                        },
                    };

                    let productResponse = await ProductModel.productFindOne(options);

                    if (productResponse.result) {
                        let newOrderItem = {
                            order_id: new ObjectId(orderId),
                            order_number: orderNumber,
                            order_item_number: `${orderNumber}_${i++}`,
                            user_id: new ObjectId(userId),
                            item_type: ITEM_TYPE_PRODUCT,
                            product_id: new ObjectId(productResponse.result._id),
                            product_title: productResponse.result.product_title || "",
                            product_slug: productResponse.result.slug || "",
                            product_image: productResponse.result.main_image_name || "",
                            product_sku: productResponse.result.product_sku || "",
                            product_category_name: productResponse.result.parent_category_name || "",
                            product_price: formatToTwo(productResponse.result.price) || DEACTIVE,
                            product_mrp_price: formatToTwo(productResponse.result.mrp_price) || DEACTIVE,
                            product_offer_price: formatToTwo(productResponse.result.offer_price) || DEACTIVE,
                            product_offer_type: productResponse.result.offer_type || DEACTIVE,
                            vat_included: Number(productResponse.result.vat_included) || DEACTIVE,
                            item_status: ITEM_PLACED,
                            start_delivery: false,
                            is_delivered: false,
                            total_selling_amount: 100,
                            total_product_discount: DEACTIVE,
                        };

                        itemList.push(newOrderItem);
                    }
                }

                if (packageId) {
                    const options = {
                        conditions: { _id: new ObjectId(packageId) },
                        fields: {
                            _id: 1,
                            package_name: 1,
                            package_image: 1,
                            slug: 1,
                            price: 1,
                            mrp_price: 1,
                            offer_price: 1,
                            offer_type: 1,
                            vat_included: 1,
                            pages_descriptions: 1,
                        },
                    };

                    let packageResponse = await PackageModel.getPackageFindOne(options);

                    if (packageResponse.result) {
                        let newPackageItem = {
                            order_id: new ObjectId(orderId),
                            order_number: orderNumber,
                            order_item_number: `${orderNumber}_${i++}`,
                            user_id: new ObjectId(userId),
                            item_type: ITEM_TYPE_PACKAGE,
                            product_id: new ObjectId(packageId),
                            product_title: packageResponse.result.package_name || "",
                            product_slug: packageResponse.result.slug || "",
                            product_image: packageResponse.result.package_image || "",
                            product_price: formatToTwo(packageResponse.result.price) || DEACTIVE,
                            product_mrp_price: formatToTwo(packageResponse.result.mrp_price) || DEACTIVE,
                            product_offer_price: formatToTwo(packageResponse.result.offer_price) || DEACTIVE,
                            product_offer_type: packageResponse.result.offer_type || DEACTIVE,
                            vat_included: Number(packageResponse.result.vat_included) || DEACTIVE,
                            total_selling_amount: 100,
                            total_product_discount: DEACTIVE,
                            item_status: ITEM_PLACED,
                        };

                        itemList.push(newPackageItem);
                    }
                }

                if (itemList.length > 0) {
                    let optionsItems = { insertData: itemList };
                    await OrderModel.saveInsertOrderItems(req, res, optionsItems);
                }

                return returnApiResult(req, res, {
                    data: {
                        status: STATUS_SUCCESS,
                        result: { order_number: orderNumber },
                        message: null,
                    },
                });
            }
        } catch (error) {
            console.error("Error in createBooking:", error);
            return returnApiResult(req, res, {
                data: {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.something_going_wrong_please_try_again"),
                },
            });
        }
    };









    /**
     * Function for add Wallet Amount
     * @param req As Request Data
     * @param res As Response Data
     * @param next	As Callback argument to the middleware function
     * @return json
     */
    this.addWalletAmount = async (req, res) => {
        try {
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

            let loginUserData = req.user_data || {};
            let userId = loginUserData._id || "";
            let userType = loginUserData.user_type || "";
            let userWalletAmount = Number(loginUserData.wallet_amount || 0);
            let addWalletAmount = Number(req.body.wallet_amount || 0);
            let paymentGatewayResponse = req.body.payment_gatway_response || {};
            if (!userId || !addWalletAmount) {
                return returnApiResult(req, res, {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("api.global.parameter_missing")
                    }
                });
            }

            let totalWalletAmount = userWalletAmount + addWalletAmount;

            let transactionIdData = await getUniqueWalletTransactionId(req, res);
            let transaction_id = transactionIdData?.result || '';

            // Update user wallet amount
            let updateOptions = {
                conditions: { _id: new ObjectId(userId) },
                updateData: {
                    $set: {
                        wallet_amount: totalWalletAmount,
                        modified: getUtcDate()
                    }
                }
            };

            let updateRes = await RegistrationModel.updateUser(req, res, updateOptions);

            if (!updateRes || updateRes.modifiedCount === 0) {
                return returnApiResult(req, res, {
                    data: {
                        status: STATUS_ERROR,
                        result: {},
                        message: res.__("front.system.something_going_wrong_please_try_again")
                    }
                });
            }

            // Log wallet transaction
            await GiftTransactionModel.saveWalletTransactionLogs(req, res, {
                insertData: {
                    user_id: new ObjectId(userId),
                    transaction_id,
                    amount: addWalletAmount,
                    type: AMOUNT_CREDIT,
                    transaction_type: ADDED_BY_USER,
                    total_balance_after_transaction: totalWalletAmount,
                    message: res.__("admin.system.added_by_user"),
                    created: getUtcDate(),
                    payment_response: paymentGatewayResponse
                }
            });

            // Success Response
            return returnApiResult(req, res, {
                data: {
                    status: STATUS_SUCCESS,
                    result: {
                        wallet_amount: totalWalletAmount
                    },
                    message: res.__("admin.system.wallet_updated_successfully")
                }
            });

        } catch (error) {
            console.error("Error in addWalletAmount:", error);
            return returnApiResult(req, res, {
                data: {
                    status: STATUS_ERROR,
                    result: {},
                    message: res.__("front.system.something_going_wrong_please_try_again")
                }
            });
        }
    };


}
module.exports = new OrderController();