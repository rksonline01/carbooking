const { pipeline } = require("nodemailer/lib/xoauth2");
const OrderModel = require("./model/OrderModel");
const { ObjectId } = require("mongodb");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const userModel = require("../users/model/user");
const GiftTransactionModel = require("../../frontend/api/model/giftTransactionModel")
const asyncParallel = require("async/parallel");
const async = require("async");
const FranchiseContractsModel = require('../franchise_contracts/model/contractsModel');
const ProductModel = require('../products/model/ProductModel');
const AreaModel = require("../area_management/model/Area");


const Socket = require("../../frontend/socket/model/socket");

function Orders() {

	/**
	 * Function for get list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.getOrdersList = async (req, res, next) => {
		let searchUser = (req.query) ? req.query : "";
		let userId = (searchUser) ? searchUser.user_id : "";
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
					order_status: ORDER_PLACED,
					$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
				};



				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {
							if (formdata.name == "from_date" && formdata.value != "") {
								fromDate = formdata.value;
							} else if (formdata.name == "to_date" && formdata.value != "") {
								toDate = formdata.value;
							} else if (formdata.name == "booking_area_id") {
								dataTableConfig.conditions[formdata.name] = new ObjectId(formdata.value);
							} else if (formdata.name == "status" || formdata.name == "order_status" || formdata.name == "payment_status") {
								dataTableConfig.conditions[formdata.name] = Number(formdata.value);
							
							} else if(formdata.name == 'city_name') {
								dataTableConfig.conditions['address_detail.city_name'] = { "$regex": formdata.value, "$options": "i" };

							} else if (formdata.name == "registration_date") {

							} else {
								dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
							}
						}
					})
					if (fromDate != "" && toDate != "") {
						dataTableConfig.conditions["booking_date_time"] = {
							$gte: newDate(fromDate),
							$lte: newDate(toDate),
						}
					}
				}

				if (userId) {
					dataTableConfig.conditions['user_id'] = new ObjectId(userId);
				}


				let conditions = [
					{
						$facet: {
							"order_list": [
								{
									$match: commonConditions
								},
								{
									$lookup: {
										from: TABLE_USERS, // Replace with actual collection name
										localField: "user_id",
										foreignField: "_id",
										as: "user_details"
									}
								},
								{
									$lookup: {
										from: TABLE_USERS, // Replace with actual collection name
										localField: "service_provider_id",
										foreignField: "_id",
										as: "provider_details"
									}
								},
								{
									$addFields: {
										customer_name: { $arrayElemAt: ["$user_details.full_name", 0] },
										customer_phone: { $arrayElemAt: ["$user_details.mobile_number", 0] },
									}
								},
								{
									$addFields: {
										provider_name: { $arrayElemAt: ["$provider_details.full_name", 0] },
										provider_mobile_number: { $arrayElemAt: ["$provider_details.mobile_number", 0] },

									}
								},
								{
									$unset: "user_details" // Removes lookup results
								},
								{
									$unset: "provider_details" // Removes lookup results
								},
								{
									$match: dataTableConfig.conditions
								},
								{ $sort: { "created": SORT_DESC } },
								{ $skip: skip },
								{ $limit: limit },
							],
							"all_count": [
								{
									$match: commonConditions
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
								{
									$match: commonConditions
								},
								{
									$lookup: {
										from: TABLE_USERS, // Replace with actual collection name
										localField: "user_id",
										foreignField: "_id",
										as: "user_details"
									}
								},
								{
									$lookup: {
										from: TABLE_USERS, // Replace with actual collection name
										localField: "service_provider_id",
										foreignField: "_id",
										as: "provider_details"
									}
								},
								{
									$addFields: {
										customer_name: { $arrayElemAt: ["$user_details.full_name", 0] },
										customer_phone: { $arrayElemAt: ["$user_details.mobile_number", 0] },
									}
								},
								{
									$addFields: {
										provider_name: { $arrayElemAt: ["$provider_details.full_name", 0] },
										provider_mobile_number: { $arrayElemAt: ["$provider_details.mobile_number", 0] },

									}
								},
								{
									$unset: "user_details" // Removes lookup results
								},
								{
									$unset: "provider_details" // Removes lookup results
								},
								{
									$match: dataTableConfig.conditions
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
							]
						}
					}
				];

				let optionObj = {
					conditions: conditions
				}

				OrderModel.getOrderAggregateList(req, res, optionObj).then(orderResponse => {
					let responseStatus = (orderResponse.status) ? orderResponse.status : "";
					let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : "";
					let orderList = (responseResult && responseResult.order_list) ? responseResult.order_list : [];
					let orderAllCount = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
					let orderFilterCount = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;

					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: orderList,
						recordsTotal: orderAllCount,
						recordsFiltered: orderFilterCount,
					});
				});
			});
		} else {
			let response = {
				type: searchUser,
			};

			if (userId != "") {
				const options = {
					collection: TABLE_USERS,
					conditions: [
						{ $match: { _id: new ObjectId(userId) } },
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

				response['user_id'] = userId;
				response['user_details'] = userDetails;
			}

			let areaListResult = [];
			let optionObj = {
				conditions : {is_deleted: NOT_DELETED},
				fields:{ title : 1, _id: 1 }
			};
			const areaListResponse = await AreaModel.getAllAreaList(req, res, optionObj);
			let responseStatus = areaListResponse.status ? areaListResponse.status : "";
			if (responseStatus === STATUS_SUCCESS) {
				areaListResult = areaListResponse.result || [];
			}
			response['areaListResult'] = areaListResult;
			 

			req.breadcrumbs(BREADCRUMBS["admin/orders/list"]);
			res.render('list', response);

		};
	};//End getordersList()


	/*
	 * Function for view details
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewDetails = (req, res, next) => {
		let orderId = (req.params.id) ? (req.params.id) : "";
		 

		/** Get details **/
		let conditions = [
			{ $match: { '_id': new ObjectId(orderId) } },
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
					}],
					as: "order_item_details",
				}
			},
			{
				$lookup: {
					from: TABLE_AREAS,
					let: { areaIds: "$address_detail.area_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$_id", "$$areaIds"],
									//status:ACTIVE
								}
							}
						},
						{
							$project: {
								_id: 1,
								coordinates: 1,
								title: 1,
							}
						}
					],
					as: "area_details",
				}
			},

			{
				$lookup: {
					from: TABLE_USERS, // Replace with actual collection name
					localField: "user_id",
					foreignField: "_id",
					as: "user_details"
				}
			},
			{
				$addFields: {
					customer_name: { $arrayElemAt: ["$user_details.full_name", 0] },
					customer_phone: { $arrayElemAt: ["$user_details.mobile_number", 0] },
					customer_email: { $arrayElemAt: ["$user_details.email", 0] },
				}
			},
			{
				$lookup: {
					from: TABLE_USERS, // Replace with actual collection name
					localField: "service_provider_id",
					foreignField: "_id",
					as: "provider_details"
				}
			},
			{
				$addFields: {
					provider_name: { $arrayElemAt: ["$provider_details.full_name", 0] },
					provider_image: { $arrayElemAt: ["$provider_details.profile_image", 0] },
					provider_phone: { $arrayElemAt: ["$provider_details.mobile_number", 0] },
					provider_email: { $arrayElemAt: ["$provider_details.email", 0] },
					provider_rating_count: { $arrayElemAt: ["$provider_details.rating_count", 0] },
					provider_rating: { $arrayElemAt: ["$provider_details.rating", 0] },
					provider_id: { $arrayElemAt: ["$provider_details._id", 0] },
					provider_slug: { $arrayElemAt: ["$provider_details.slug", 0] },
				}
			},
			{
				$project: {
					'order_id': 1,
					'user_id': 1,
					'order_number': 1,
					'order_status': 1,
					'status': { $ifNull: ["$status", DEACTIVE] },
					'item_count': 1,
					'total_quantity': 1,
					'total_mrp_amount': 1,
					'total_selling_amount': 1,
					'total_product_discount': 1,
					'total_extra_discount': 1,
					'total_shipping_amount': 1,
					'booking_date': 1,
					'booking_time': 1,
					'booking_from': 1,
					"booking_start_timestamp": 1,
					"booking_end_timestamp": 1,
					"booking_travelling_timestamp": 1,
					'order_item_details': 1,
					'address_detail': 1,
					'order_status': 1,
					'payment_status': 1,
					'payment_by': 1,
					'service_provider_id': 1,
					'area_ids': 1,
					'created': 1,
					'is_service_booking': 1,
					'is_store_order': 1,
					'customer_name': 1,
					'customer_phone': 1,
					'customer_email': 1,
					'provider_type': 1,
					'booking_car_type': 1,
					'booking_duration': 1,
					'service_provider_id': { $ifNull: ["$service_provider_id", DEACTIVE] },
					'provider_name': 1,
					'provider_image': 1,
					'provider_phone': 1,
					'provider_email': 1,
					'provider_rating_count': 1,
					'provider_rating': 1,
					'provider_id': 1,
					'provider_slug': 1,
					'images': 1,
					'note': 1,
					'is_rescheduled': 1,
					'is_change_location' : 1,
					'booking_area_id': 1,
					'current_sp_location': 1,
					'area_list': '$area_details',
					'promo_code_detail': { $ifNull: ['$promo_code_detail', DEACTIVE] },
					'user_subscription_id': { $ifNull: ['$user_subscription_id', DEACTIVE] },
					'my_subscription_details': { $ifNull: ['$my_subscription_details', DEACTIVE] },
					'canceledBy':{ $arrayElemAt: ["$canceledBy", 0] },
				}
			},
		];

		let options = {
			'conditions': conditions
		};

		OrderModel.getOrderAggregateList(req, res, options).then(async orderResponse => {
 
			let responseStatus = (orderResponse.status) ? orderResponse.status : "";
			let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : {};
			let userId = (responseResult.user_id) ? responseResult.user_id : "";
			
			let canceledUserId = (responseResult?.canceledBy?.user_id) ? new ObjectId(responseResult?.canceledBy?.user_id) : "";

			let cancelUser =  await userModel.getUserDetails({
				conditions: { _id : canceledUserId },
				fields: { _id: 1, full_name: 1 },
			});
			  
			if(cancelUser.status == STATUS_SUCCESS && cancelUser.result && cancelUser.result){
			
				responseResult.canceled_by_full_name = (cancelUser.result.full_name) ? cancelUser.result.full_name : "";
			}
 

		 
			let serviceProviderId = (responseResult.service_provider_id) ? responseResult.service_provider_id : "";
			let areaIds = (responseResult.area_ids) ? responseResult.area_ids : [];
			let booking_start_timestamp = (responseResult.booking_start_timestamp) ? responseResult.booking_start_timestamp : null;
			let booking_end_timestamp = (responseResult.booking_end_timestamp) ? responseResult.booking_end_timestamp : null;
			let providerType = (responseResult.provider_type) ? responseResult.provider_type : SERVICE_PROVIDER_TYPE_BIKE_FLEET;
			let is_service_booking = (responseResult.is_service_booking) ? responseResult.is_service_booking : null;
			let is_store_order = (responseResult.is_store_order) ? responseResult.is_store_order : null;


			/** GET AVAILABLE SERVICE PROVIDERS ON SAME AREA AND ON SAME DATE-TIME  */
			let aSPOptions = {
				area_ids: areaIds,
				booking_start_timestamp: booking_start_timestamp,
				booking_end_timestamp: booking_end_timestamp,
				provider_type: providerType,
				is_service_booking: is_service_booking,
				is_store_order: is_store_order,
			};

			let availableServiceProviders = await getAvailableServiceProviders(req, res, aSPOptions);
 
			let availableSPIdsArray = [];
			if (availableServiceProviders.length > 0) {
				availableServiceProviders.map(availableSP => {
					availableSPIdsArray.push(availableSP._id);
				});
 			}

			/** MAKE DROP-DOWN FOR AVAILABLE SERVICE PROVIDERS */
			let options = {
				collections: [
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name", "email"],
						conditions: {
							user_type: SERVICE_PROVIDER_USER_TYPE,
							_id: { $in: availableSPIdsArray }
						},
						selected: [serviceProviderId],

					}
				]
			}; 
			
			getDropdownList(req, res, options).then(dropRes => {
				req.breadcrumbs(BREADCRUMBS["admin/orders/view"]);
				res.render('view', {
					result: responseResult,
					product_url: PRODUCT_URL,
					package_url: PACKAGE_URL,
					subscription_url: SUBSCRIPTION_URL,
					delivery_partner: (dropRes && dropRes.final_html_data && dropRes.final_html_data["0"]) || {},
					google_map_key: process.env.GOOGLE_MAP_API_KEY,
					google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
					google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
				});
			})

		});

	};//End viewDetails()


	/**
	* Function for change date - time booking
	*
	* @param req 	As 	Request Data
	* @param res 	As 	Response Data
	* @param next 	As 	Callback argument to the middleware function
	*
	* @return render/json
	*/
	this.changeDateTimeOfBooking = async (req, res, next) => {
		let orderId = (req.params.order_id) ? new ObjectId(req.params.order_id) : '';
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);
		var adminUserName = adminUser.full_name;
		var email = adminUser.email;

		if (isPost(req)) {
			let bookingDate = (req.body.booking_date_time) ? req.body.booking_date_time : '';
			let bookingTime = (req.body.booking_time) ? req.body.booking_time : '';


			let bookingDateTime = new Date(bookingDate + 'T' + bookingTime);
			let booking_timestamp = bookingDateTime.getTime();


			let optionObj = {
				conditions: {
					"_id": orderId,
					'status': BOOKING_STATUS_NEW,
					"order_status": ORDER_PLACED,
					$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
				},
				fields: { _id: 1, order_number: 1, booking_start_timestamp: 1, booking_end_timestamp: 1, booking_travelling_timestamp: 1, area_ids: 1, user_id: 1 }
			}

			/**get booking details */
			let bookingResponse = await OrderModel.orderFindOne(optionObj);
			let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

			if (!bookingDetails) {
				let finalResponse = {
					status: STATUS_ERROR,
					message: res.__("front.system.something_going_wrong_please_try_again"),
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId
				}
				return res.send(finalResponse)
			}

			let oldStartTimeStamp = bookingDetails.booking_start_timestamp || "";
			let userId = bookingDetails.user_id || "";
			let oldEndTimeStamp = bookingDetails.booking_end_timestamp || "";
			let travellingTimestamp = bookingDetails.booking_travelling_timestamp || "";
			let bookingDuration = (oldEndTimeStamp - oldStartTimeStamp);
			let orderNumber = bookingDetails.order_number || "";

			let new_start_timestamp = booking_timestamp - travellingTimestamp;
			let new_end_timestamp = new_start_timestamp + bookingDuration;

			let updateData = {
				'booking_date': bookingDate,
				'booking_time': bookingTime,
				'booking_date_time': bookingDateTime,
				'booking_start_timestamp': new_start_timestamp,
				'booking_end_timestamp': new_end_timestamp,
				'modified': getUtcDate(),
				'is_rescheduled': ACTIVE,
			};

			let options = {
				conditions: { '_id': orderId, 'status': BOOKING_STATUS_NEW },
				updateData: { $set: updateData }
			};

			/**update order booking */
			OrderModel.updateOneOrder(req, res, options).then(async (updateResponse) => {

				if (updateResponse.status == STATUS_SUCCESS) {

					if (updateResponse.status == STATUS_SUCCESS) {


						let notificationOptions = {
							notification_data: {
								notification_type: NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
								message_params: [adminUserName, orderNumber, bookingDate, bookingTime],
								user_id: userId,
								user_ids: [userId],
								parent_table_id: orderId,
								lang_code: DEFAULT_LANGUAGE_CODE,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: userId
							}
						};

						/**send booking notification to user */
						await insertNotifications(req, res, notificationOptions);




						let pushNotificationOptions = {
							notification_data: {
								notification_type: PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
								message_params: [adminUserName, orderNumber, bookingDate, bookingTime],
								user_id: userId,
								lang_code: DEFAULT_LANGUAGE_CODE,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: userId
							}
						};
						await pushNotification(req, res, pushNotificationOptions);


						/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
						let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
						let currentDateTime = new Date();
						let optionObj = {
							conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
						}
						FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
							let responseStatus = response.status ? response.status : "";
							let contractData = response.result ? response.result : "";
							if (responseStatus == STATUS_SUCCESS && contractData) {

								let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
								if (franchiseId) {
									let franchiseNotificationOptions = {
										notification_data: {
											notification_type: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
											message_params: [adminUserName, orderNumber, bookingDate, bookingTime],
											user_id: franchiseId,
											user_ids: [franchiseId],
											parent_table_id: orderId,
											lang_code: DEFAULT_LANGUAGE_CODE,
											user_role_id: FRONT_ADMIN_ROLE_ID,
											role_id: FRONT_ADMIN_ROLE_ID,
											created_by: userId
										}
									};

									await insertNotifications(req, res, franchiseNotificationOptions);

									let franchisePushNotificationOptionsUser = {
										notification_data: {
											notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
											message_params: [adminUserName, orderNumber, bookingDate, bookingTime],
											user_id: franchiseId,
											user_ids: [franchiseId],
											lang_code: DEFAULT_LANGUAGE_CODE,
											user_role_id: FRONT_ADMIN_ROLE_ID,
											role_id: FRONT_ADMIN_ROLE_ID,
											created_by: userId
										}
									};
									await pushNotification(req, res, franchisePushNotificationOptionsUser);
								}
							}
						})
						/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


						let emailOptions = {
							to: email,
							action: "user_change_booking_date_time",
							rep_array: [adminUserName, orderNumber, bookingDate, bookingTime],
						};
						sendMail(req, res, emailOptions);


						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("front.order.booking_date-time_changed"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.order.booking_date-time_changed"),
						});

					}
					else {
						let finalResponse = {
							status: STATUS_ERROR,
							message: res.__("front.system.something_going_wrong_please_try_again"),
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId
						}
						return res.send(finalResponse)
					}
				}
				else {
					let finalResponse = {
						status: STATUS_ERROR,
						message: res.__("front.system.something_going_wrong_please_try_again"),
						redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId
					}
					return res.send(finalResponse)
				}
			});
		} else {
			const [orderDetails] = await Promise.all([
				OrderModel.orderFindOne({ conditions: { _id: orderId }, fields: { _id: 1, booking_start_timestamp: 1, booking_travelling_timestamp: 1, user_id: 1, provider_type: 1, address_detail: 1, booking_date: 1, booking_time: 1 } }).then(res => res?.result || {})
			])



			let userId = (orderDetails.user_id) ? new ObjectId(orderDetails.user_id) : null;
			let addresDetail = (orderDetails.address_detail) ? orderDetails.address_detail : null;
			let bookingDate = (orderDetails.booking_date) ? orderDetails.booking_date : new Date().toISOString().split('T')[0];
			let latitude = (addresDetail.latitude) ? addresDetail.latitude : "";
			let longitude = (addresDetail.longitude) ? addresDetail.longitude : "";
			let providerType = (orderDetails.provider_type) ? orderDetails.provider_type : "";

			let updateObj = {
				_id: userId,
				user_type: CUSTOMER_USER_TYPE,
				booking_date: bookingDate,
				latitude: latitude,
				longitude: longitude,
				provider_type: providerType,
				lang_code: 'en'
			}

			let resultData = await getTimeSlotList(req, res, updateObj);
			let timeSlotList = [];
			if (resultData.status === STATUS_SUCCESS) {
				timeSlotList = resultData.result;

			}

			/** Render add/edit page  **/
			res.render('change_date_time', {
				layout: false,
				order_id: orderId,
				timeSlotList: timeSlotList,
				result: orderDetails
			});
		}
	}


	this.getTimeSlotList = async (req, res, next) => {

		let orderId = (req.body.order_id) ? new ObjectId(req.body.order_id) : '';
		let bookingDate = (req.body.booking_date) ? req.body.booking_date : '';

		const [orderDetails] = await Promise.all([
			OrderModel.orderFindOne({ conditions: { _id: orderId }, fields: { _id: 1, booking_start_timestamp: 1, booking_travelling_timestamp: 1, user_id: 1, provider_type: 1, address_detail: 1 } }).then(res => res?.result || {})
		])

		let userId = (orderDetails.user_id) ? new ObjectId(orderDetails.user_id) : null;
		let addresDetail = (orderDetails.address_detail) ? orderDetails.address_detail : null;
		let latitude = (addresDetail.latitude) ? addresDetail.latitude : "";
		let longitude = (addresDetail.longitude) ? addresDetail.longitude : "";
		let providerType = (orderDetails.provider_type) ? orderDetails.provider_type : "";

		let updateObj = {
			_id: userId,
			user_type: CUSTOMER_USER_TYPE,
			booking_date: bookingDate,
			latitude: latitude,
			longitude: longitude,
			provider_type: providerType,
			lang_code: 'en'
		}

		let resultData = await getTimeSlotList(req, res, updateObj);
		let timeSlotList = '';
		if (resultData.status === STATUS_SUCCESS) {
			timeSlotList = resultData.result;
		}

		res.send({
			status: STATUS_SUCCESS,
			result: timeSlotList
		});

	};


	/**
	 * Function to accept bookings
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.acceptBookings = (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		if (isPost(req)) {
			var adminUser = (req.session.user) ? req.session.user : {};
			var adminUserId = new ObjectId(adminUser._id);
			let serviceProviderId = (req.body.service_provider_id) ? new ObjectId(req.body.service_provider_id) : "";
			let conditionOptions = {
				conditions: { _id: serviceProviderId },
			}

			getUserDetailBySlug(req, res, conditionOptions).then(async (userDetailResponse) => {
				if (userDetailResponse.status == STATUS_SUCCESS) {
					let userDetails = (userDetailResponse.result) ? userDetailResponse.result : {};
					let areaId = (userDetails.area_id) ? userDetails.area_id : "";
					let userProviderType = (userDetails.provider_type) ? userDetails.provider_type : "";

					let optionObj = {
						conditions: { "_id": orderId, 'status': BOOKING_STATUS_NEW, "order_status": ORDER_PLACED },
						fields: { _id: 1, booking_start_timestamp: 1, booking_end_timestamp: 1, user_id: 1, order_number: 1, booking_time: 1, booking_date: 1, provider_type: 1, is_service_booking: 1, is_store_order: 1, area_ids: 1 }
					}

					/**get booking details */
					let bookingResponse = await OrderModel.orderFindOne(optionObj);
					let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

					if (!bookingDetails) {
						/** Send error response 
						req.flash(STATUS_ERROR, res.__("front.system.order_not_found"));
						res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);**/

						res.send({
							status: STATUS_ERROR,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.system.order_not_found"),
						});

					}

					let startTimeStamp = bookingDetails.booking_start_timestamp || "";
					let endTimeStamp = bookingDetails.booking_end_timestamp || "";
					let orderProviderType = bookingDetails.provider_type || "";

					let bookingTime = (bookingDetails && bookingDetails.booking_time) ? bookingDetails.booking_time : "";
					let bookingDate = (bookingDetails && bookingDetails.booking_date) ? bookingDetails.booking_date : "";
					let is_service_booking = (bookingDetails && bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : "";
					let is_store_order = (bookingDetails && bookingDetails.is_store_order) ? bookingDetails.is_store_order : "";

					let customerId = bookingDetails.user_id || "";
					let orderNumber = bookingDetails.order_number || "";
					let customerName = (userDetails && userDetails.full_name) ? userDetails.full_name : "";

					if (orderProviderType != userProviderType) {
						/** Send error response 
						req.flash(STATUS_ERROR, res.__("front.system.provider_type_not_same"));
						res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);**/

						res.send({
							status: STATUS_ERROR,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.system.provider_type_not_same"),
						});

					}
					let optionsData = {
						area_id: areaId,
						user_id: serviceProviderId,
						start_time_stamp: startTimeStamp,
						end_time_stamp: endTimeStamp,
						is_service_booking: is_service_booking,
						is_store_order: is_store_order,
					};

					/** check is booking available */
					let checkIsAvailable = await checkIsAvailableBooking(req, res, optionsData);

					if (checkIsAvailable.status) {

						let contractDetail = await getContractIdFromAreaANDProviderID({ area_id: areaId, service_provider_id: serviceProviderId });
						let contractId = (contractDetail.contract_id) ? contractDetail.contract_id : null;
						let franchiseId = (contractDetail.franchise_id) ? contractDetail.franchise_id : null;

						let currentDateTime = new Date().toISOString();

						let updateData = {
							'status': BOOKING_STATUS_ACCEPTED,
							'service_provider_id': new ObjectId(serviceProviderId),
							'booking_area_id': new ObjectId(areaId),
							'booking_contract_id': new ObjectId(contractId),
							'booking_franchise_id': new ObjectId(franchiseId),
							'booking_accept_time': currentDateTime,
							'service_provider_assigned_by': adminUserId,
							'modified': getUtcDate()
						};

						let options = {
							conditions: { '_id': orderId, 'status': BOOKING_STATUS_NEW },
							updateData: { $set: updateData }
						};
						/**update order booking */
						OrderModel.updateOneOrder(req, res, options).then(async updateResponse => {
							if (updateResponse.status == STATUS_SUCCESS) {


								if (bookingDetails.is_service_booking == ACTIVE) {
									let updateObj = {
										date: bookingDate,
										slot_time: bookingTime,
										booking_status: BOOKING_STATUS_ACCEPTED,
										service_provider_id: new ObjectId(serviceProviderId),
										booking_id: orderId,
										order_number: orderNumber,
										booking_start_timestamp: bookingDetails.booking_start_timestamp,
										booking_end_timestamp: bookingDetails.booking_end_timestamp
									}
									await updateServiceProviderTimeSlot(req, res, updateObj);
								}


								var fullName = (adminUser.full_name) ? adminUser.full_name : "";
								var email = (adminUser.email) ? adminUser.email : "";

								let notificationOptions = {
									notification_data: {
										notification_type: NOTIFICATION_TO_USER_ACCEPT_BOOKING,
										message_params: [customerName, orderNumber, fullName],
										user_id: customerId,
										user_ids: [customerId],
										parent_table_id: orderId,
										lang_code: DEFAULT_LANGUAGE_CODE,
										user_role_id: FRONT_ADMIN_ROLE_ID,
										role_id: FRONT_ADMIN_ROLE_ID,
										created_by: adminUserId
									}
								};

								/**send booking notification to user */
								await insertNotifications(req, res, notificationOptions);


								let pushNotificationOptions = {
									notification_data: {
										notification_type: PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
										message_params: [customerName, orderNumber, fullName],
										user_id: customerId,
										lang_code: DEFAULT_LANGUAGE_CODE,
										user_role_id: FRONT_ADMIN_ROLE_ID,
										role_id: FRONT_ADMIN_ROLE_ID,
										created_by: adminUserId
									}
								};
								await pushNotification(req, res, pushNotificationOptions);

								/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
								let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
								let currentDateTime = new Date();
								let optionObj = {
									conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
								}
								FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
									let responseStatus = response.status ? response.status : "";
									let contractData = response.result ? response.result : "";
									if (responseStatus == STATUS_SUCCESS && contractData) {

										let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
										if (franchiseId) {
											let franchiseNotificationOptions = {
												notification_data: {
													notification_type: FRANCHISE_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
													message_params: [customerName, orderNumber, fullName],
													user_id: franchiseId,
													user_ids: [franchiseId],
													parent_table_id: orderId,
													lang_code: DEFAULT_LANGUAGE_CODE,
													user_role_id: FRONT_ADMIN_ROLE_ID,
													role_id: FRONT_ADMIN_ROLE_ID,
													created_by: adminUserId
												}
											};

											await insertNotifications(req, res, franchiseNotificationOptions);

											let franchisePushNotificationOptionsUser = {
												notification_data: {
													notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
													message_params: [customerName, orderNumber, fullName],
													user_id: franchiseId,
													user_ids: [franchiseId],
													lang_code: DEFAULT_LANGUAGE_CODE,
													user_role_id: FRONT_ADMIN_ROLE_ID,
													role_id: FRONT_ADMIN_ROLE_ID,
													created_by: adminUserId
												}
											};
											await pushNotification(req, res, franchisePushNotificationOptionsUser);
										}
									}
								})
								/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */

								/*
									let emailOptions = {
										to: email,
										action: "user_accept_booking",
										rep_array: [customerName, orderNumber, fullName],
									};
									sendMail(req, res, emailOptions);
								*/

								/** Send success response **/
								req.flash(STATUS_SUCCESS, res.__("front.order.booking_accepted"));
								res.send({
									status: STATUS_SUCCESS,
									redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
									message: res.__("front.order.booking_accepted"),
								});

							} else {
								/** Send error response 
								req.flash(STATUS_ERROR, res.__("front.system.something_going_wrong_please_try_again"));
								res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);**/

								res.send({
									status: STATUS_ERROR,
									redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
									message: res.__("front.system.something_going_wrong_please_try_again"),
								});

							}
						});
					} else {
						/** Send error response 
						req.flash(STATUS_ERROR, res.__("front.system.service_provider_not_available_in_this_time"));
						**/
						res.send({
							status: STATUS_ERROR,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.system.service_provider_not_available_in_this_time"),
						});
					}
				}
			});
		}

	}//End acceptBookings()


	/**
	 * Function for update Booking Status Go To Location
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.updateBookingStatusGoToLocation = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);

		if (!orderId) {
			req.flash(STATUS_ERROR, res.__("api.global.parameter_missing"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let conditions = [{
			$match: { '_id': orderId, 'is_deleted': NOT_DELETED }
		}];

		let optionsForBookingDetails = {
			'conditions': conditions
		};
		let orderResponse = await OrderModel.getOrderAggregateList(req, res, optionsForBookingDetails);
		let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : {};

		if (!responseResult) {
			/** Send error response */
			req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);

		}

		let bookingStatus = (responseResult.status) ? (responseResult.status) : "";
		let customerId = (responseResult.user_id) ? (responseResult.user_id) : "";
		let orderNumber = (responseResult.order_number) ? (responseResult.order_number) : "";
		let isSoreBooking = (responseResult.is_store_order) ? responseResult.is_store_order : false;
		let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'full_name': 1 } });
		let customerResult = (userDetails.result) ? userDetails.result : "";
		let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";

		/*
		if(isSoreBooking == true){
			let orderItemOption = {
				conditions: {
					order_id: orderId,
					item_type: ITEM_TYPE_PRODUCT
				}
			};
			let orderItemResponse = await OrderModel.getOrderItemList(orderItemOption);

			if (orderItemResponse.status == STATUS_ERROR || (orderItemResponse.result && orderItemResponse.result.length == 0)) {

				req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);

			} else {
				
				let itemList = [];
				
				async.each(orderItemResponse.result, (records) => {
					let itemType 		=	(records.item_type) ? records.item_type : '';
					let startDelivery 	=	(records.start_delivery) && records.start_delivery == true ? true : false;
					let isDelivered 	=	(records.is_delivered) && records.is_delivered == true ? true : false;

					if (itemType == ITEM_TYPE_PRODUCT && startDelivery != true && isDelivered != true) {
						itemList.push(records._id);
					}
				});
				
				if (itemList.length == 0) {
					req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
					res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
				
				} else {

					let updateData = {
						'start_delivery': true,
						'start_delivery_time': getUtcDate()
					};
	
					let optionsForUpdateItems = {
						conditions: {'order_id': orderId },
						updateData: { $set: updateData }
					};
	
					await OrderModel.updateOrderItems(req, res, optionsForUpdateItems);
				}
			}
		} */

		if (bookingStatus == BOOKING_STATUS_ACCEPTED) {

			let currentDateTime = new Date().toISOString();

			let options = {
				conditions: { "_id": orderId, 'status': BOOKING_STATUS_ACCEPTED, "order_status": ORDER_PLACED },
				updateData: {
					$set: {
						'status': BOOKING_STATUS_GO_TO_LOCATION,
						'booking_go_to_location_time': currentDateTime,
						'modified': getUtcDate()
					}
				}
			};

			/**update order booking */
			let updateResponse = await OrderModel.updateOrderBooking(req, res, options);

			if (updateResponse.status == STATUS_SUCCESS) {

				let fullName = (adminUser.full_name) ? adminUser.full_name : "";
				let email = (adminUser.email) ? adminUser.email : "";

				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						user_ids: [customerId],
						parent_table_id: orderId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await insertNotifications(req, res, notificationOptions);

				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await pushNotification(req, res, pushNotificationOptions);


				/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
				let areaIds = responseResult.area_ids ? responseResult.area_ids.map(item => item.area_id) : [];
				let currentDateTime = new Date();
				let optionObj = {
					conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
				}
				FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
					let responseStatus = response.status ? response.status : "";
					let contractData = response.result ? response.result : "";
					if (responseStatus == STATUS_SUCCESS && contractData) {

						let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
						if (franchiseId) {
							let franchiseNotificationOptions = {
								notification_data: {
									notification_type: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};

							await insertNotifications(req, res, franchiseNotificationOptions);

							let franchisePushNotificationOptionsUser = {
								notification_data: {
									notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, franchisePushNotificationOptionsUser);
						}
					}
				})
				/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


				/*
					let emailOptions = {
						to: email,
						action: "user_go_to_location_booking",
						rep_array: [customerName, orderNumber, fullName],
					};
					sendMail(req, res, emailOptions);
				*/

				req.flash(STATUS_SUCCESS, res.__("front.global.booking_status_go_to_location_successfully"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
		}
	}


	/**
	 * Function for reached On Location booking
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.reachedOnLocationBooking = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);

		if (!orderId) {
			req.flash(STATUS_ERROR, res.__("api.global.parameter_missing"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let optionObj = {
			conditions: {
				"_id": orderId,
				'status': BOOKING_STATUS_GO_TO_LOCATION,
				$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
			},
			fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, area_ids: 1 }
		}

		/**get booking details */
		let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
		let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
		if (!bookingDetails) {
			req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let customerId = (bookingDetails.user_id) ? (bookingDetails.user_id) : "";
		let orderNumber = (bookingDetails.order_number) ? (bookingDetails.order_number) : "";
		let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'full_name': 1 } });
		let customerResult = (userDetails.result) ? userDetails.result : "";
		let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";


		let currentDateTime = new Date().toISOString();
		let options = {
			conditions: { "_id": orderId, 'status': BOOKING_STATUS_GO_TO_LOCATION, "order_status": ORDER_PLACED },
			updateData: {
				$set: {
					'status': BOOKING_STATUS_REACHED_LOCATION,
					'booking_reached_on_location_time': currentDateTime,
					'modified': getUtcDate()
				}
			}
		};
		/**update order booking */
		OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

			if (updateResponse.status == STATUS_SUCCESS) {

				let fullName = (adminUser.full_name) ? adminUser.full_name : "";
				let email = (adminUser.email) ? adminUser.email : "";

				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						user_ids: [customerId],
						parent_table_id: orderId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};

				await insertNotifications(req, res, notificationOptions);


				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await pushNotification(req, res, pushNotificationOptions);

				/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
				let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
				let currentDateTime = new Date();
				let optionObj = {
					conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
				}
				FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
					let responseStatus = response.status ? response.status : "";
					let contractData = response.result ? response.result : "";
					if (responseStatus == STATUS_SUCCESS && contractData) {

						let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
						if (franchiseId) {
							let franchiseNotificationOptions = {
								notification_data: {
									notification_type: FRANCHISE_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};


							await insertNotifications(req, res, franchiseNotificationOptions);

							let franchisePushNotificationOptionsUser = {
								notification_data: {
									notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, franchisePushNotificationOptionsUser);
						}
					}
				})
				/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


				/*
					let emailOptions = {
						to: email,
						action: "user_reached_on_location_booking",
						rep_array: [customerName, orderNumber, fullName],
					};
					sendMail(req, res, emailOptions);
				*/


				req.flash(STATUS_SUCCESS, res.__("front.global.reached_on_location_booking_successfully"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			} else {
				/**send success response */
				req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
		});
	}


	/**
	 * Function for start booking
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.startBooking = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);

		if (!orderId) {
			req.flash(STATUS_ERROR, res.__("api.global.parameter_missing"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let optionObj = {
			conditions: { "_id": orderId, 'status': { $in: FOR_START_BOOKING_STATUS }, "order_status": ORDER_PLACED },
			fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, area_ids: 1 }
		}

		/**get booking details */
		let bookingResponse = await OrderModel.orderFindOne(optionObj);
		let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

		if (!bookingDetails) {

			res.send({
				status: STATUS_ERROR,
				redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
				message: res.__("front.system.order_not_found"),
			});
		}


		let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
		let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
		let userDetails = await userModel.getUserDetails({ conditions: { '_id': customerId }, fields: { 'full_name': 1 } });
		let customerResult = (userDetails.result) ? userDetails.result : "";
		let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
		let currentDateTime = new Date().toISOString();

		let options = {
			conditions: { "_id": orderId, 'status': { $in: FOR_START_BOOKING_STATUS }, "order_status": ORDER_PLACED, $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }] },
			updateData: {
				$set: {
					'status': BOOKING_STATUS_SERVICE_STARTED,
					'booking_start_time': currentDateTime,
					'booking_started_by': adminUserId,
					'modified': getUtcDate()
				}
			}
		};

		/**update order booking */
		OrderModel.updateOneOrder(req, res, options).then(async (updateResponse) => {

			if (updateResponse.status == STATUS_SUCCESS) {

				var fullName = (adminUser.full_name) ? adminUser.full_name : 'Admin';
				var email = (adminUser.email) ? adminUser.email : '';

				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_START_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						user_ids: [customerId],
						parent_table_id: orderId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};

				/**send booking notification to user */
				await insertNotifications(req, res, notificationOptions);

				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_START_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await pushNotification(req, res, pushNotificationOptions);

				/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
				let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
				let currentDateTime = new Date();
				let optionObj = {
					conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
				}
				FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
					let responseStatus = response.status ? response.status : "";
					let contractData = response.result ? response.result : "";
					if (responseStatus == STATUS_SUCCESS && contractData) {

						let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
						if (franchiseId) {
							let franchiseNotificationOptions = {
								notification_data: {
									notification_type: FRANCHISE_NOTIFICATION_TO_USER_START_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await insertNotifications(req, res, franchiseNotificationOptions);

							let franchisePushNotificationOptionsUser = {
								notification_data: {
									notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_START_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, franchisePushNotificationOptionsUser);
						}
					}
				})
				/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


				/*
					let emailOptions = {
						to: email,
						action: "user_start_booking",
						rep_array: [customerName, orderNumber, fullName],
					};
					sendMail(req, res, emailOptions);
				*/

				req.flash(STATUS_SUCCESS, res.__('front.order.booking_service_started'));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
			else {
				req.flash(STATUS_ERROR, res.__('front.system.something_going_wrong_please_try_again'));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
		});
	}


	/**
	 * Function for update Booking Status Service Finished
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.FinishBookingService = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);
		if (!orderId) {
			req.flash(STATUS_ERROR, res.__("api.global.parameter_missing"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let optionObj = {
			conditions: {
				"_id": orderId,
				$or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
				$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
			},
			fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, is_store_order: 1, status: 1, total_selling_amount: 1, area_ids: 1 ,provider_type:1,service_provider_id:1, booking_contract_id: 1}
		}

		/**get booking details */
		let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
		let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
		let isServiceBooking = (bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : false;
		let isSoreBooking = (bookingDetails.is_store_order) ? bookingDetails.is_store_order : false;
		let providerType = (bookingDetails.provider_type) ? bookingDetails.provider_type : "";
		let serviceProviderId = (bookingDetails.service_provider_id) ? bookingDetails.service_provider_id : false;

		let bookingStatus = bookingDetails.status;

		if (isServiceBooking && (bookingStatus == BOOKING_STATUS_REACHED_LOCATION)) {
			req.flash(STATUS_ERROR, res.__("front.global.need_to_start_booking_service_first"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);

		}

		if (!bookingDetails) {
			req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
		let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
		let totalSellingAmount = (bookingDetails && bookingDetails.total_selling_amount) ? Number(bookingDetails.total_selling_amount) : "";
		let currentDateTime = new Date().toISOString();

		let options = {
			conditions: {
				"_id": orderId,
				$or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
				"order_status": ORDER_PLACED
			},
			updateData: {
				$set: {
					'status': BOOKING_STATUS_SERVICE_FINISHED,
					'booking_service_finished_time': currentDateTime,
					'modified': getUtcDate()
				}
			}
		};
		OrderModel.updateOrderBooking(req, res, options).then(async (updateResponse) => {

			/* CHECK IF THERE IS NO PRODUCT LEFT FOR DELIVERY AND REFUNDED MARK ORDER AS COMPLETED   */
			let orderItemDetails = await OrderModel.getOrderItemCount({
				conditions: {
					"order_id": orderId,
					'item_type': ITEM_TYPE_PRODUCT,
					'is_delivered': false,
				}
			});

			let orderItemResultCount = (orderItemDetails.result) ? orderItemDetails.result : 0;

			if ((isSoreBooking == false) || (isSoreBooking == true && orderItemResultCount == 0)) {
				let options = {
					conditions: { "_id": orderId, "order_status": ORDER_PLACED },
					updateData: {
						$set: {
							'status': BOOKING_STATUS_COMPLETED,
							'booking_complete_time': currentDateTime,
							'completed_by': new ObjectId(adminUserId),
							'modified': getUtcDate()
						}
					}
				};

				/**update order booking */
				OrderModel.updateOrderBooking(req, res, options).then(async (updateOrdResponse) => {

					if (updateOrdResponse.status == STATUS_SUCCESS) {

						if (totalSellingAmount) {
							let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1 } });

							let customerResult = (userDetails.result) ? userDetails.result : "";
							let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;
							let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;
							let valuePerPoint = res.locals.settings["Site.value_per_coin"];

							let pointsResp = calculatePoints(totalSellingAmount, valuePerPoint, totalBalanceForPoints);
							let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
							let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
							let useOrderNumber = "#" + orderNumber;

							let pointsOption = {
								"user_id": new ObjectId(customerId),
								"order_id": orderId,
								"order_number": orderNumber,
								"points": points,
								"type": POINT_TYPE_EARNED,
								"transaction_reason": EARNED_BY_ORDER,
								"amount_for_single_point": valuePerPoint,
								"total_user_points": totalUserPoints,
								"total_selling_amount": totalSellingAmount,
								"total_balance_for_points": totalBalanceForPoints,
								"remainder": remainder,
								"note": res.__("front.user.points_earned_regarding_order_number", useOrderNumber)
							}
							/**save points while complete order */
							await saveUserPoints(req, res, pointsOption);

							/** Save points stats for user*/
							await updatePointTransactionLogStats(req, res, {
								"user_id": adminUserId,
								"points": points,
							});



							/**  add provider amount */
							let currentDate = new Date().toISOString().split('T')[0];
							await providerEarning(req, res, {
								booking_id: orderId,
								provider_type: providerType,
								service_provider_id: serviceProviderId,
								date: currentDate,
							});
							/**  add provider amount */


							let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
							let fullName = (adminUser.full_name) ? adminUser.full_name : "";
							let email = (adminUser.email) ? adminUser.email : "";

							let notificationOptions = {
								notification_data: {
									notification_type: NOTIFICATION_TO_USER_FINISH_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: customerId,
									user_ids: [customerId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await insertNotifications(req, res, notificationOptions);


							let pushNotificationOptions = {
								notification_data: {
									notification_type: PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: customerId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, pushNotificationOptions);



							/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
							let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
							let currentDateTime = new Date();
							let optionObj = {
								conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
							}
							FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
								let responseStatus = response.status ? response.status : "";
								let contractData = response.result ? response.result : "";
								if (responseStatus == STATUS_SUCCESS && contractData) {

									 

									let franchiseId                     = (contractData.franchise_id) ? contractData.franchise_id : null;
									let purelyAmountCommissionStorePercentage     = (contractData.purely_amount_commission_store) ? contractData.purely_amount_commission_store : 0;
									let purelyAmountCommissionServicePercentage   = (contractData.purely_amount_commission) ? contractData.purely_amount_commission : 0;
									let contractId   = (contractData._id) ? contractData._id : 0;

									if (franchiseId) {

											/* PURELY COMMINSSION BASED CODE START */
											let handleObject = {
												orderId: orderId,
												franchiseId:franchiseId,
												contractId:contractId,
												purelyAmountCommissionStorePercentage:purelyAmountCommissionStorePercentage,
												purelyAmountCommissionServicePercentage:purelyAmountCommissionServicePercentage
											};
											await handlePurelyCommissionUpdate(req, res, handleObject);
											/* PURELY COMMINSSION BASED CODE END */

										let franchiseNotificationOptions = {
											notification_data: {
												notification_type: FRANCHISE_NOTIFICATION_TO_USER_FINISH_BOOKING,
												message_params: [customerName, orderNumber, fullName],
												user_id: franchiseId,
												user_ids: [franchiseId],
												parent_table_id: orderId,
												lang_code: DEFAULT_LANGUAGE_CODE,
												user_role_id: FRONT_ADMIN_ROLE_ID,
												role_id: FRONT_ADMIN_ROLE_ID,
												created_by: adminUserId
											}
										};

										await insertNotifications(req, res, franchiseNotificationOptions);

										let franchisePushNotificationOptionsUser = {
											notification_data: {
												notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING,
												message_params: [customerName, orderNumber, fullName],
												user_id: franchiseId,
												user_ids: [franchiseId],
												lang_code: DEFAULT_LANGUAGE_CODE,
												user_role_id: FRONT_ADMIN_ROLE_ID,
												role_id: FRONT_ADMIN_ROLE_ID,
												created_by: adminUserId
											}
										};
										await pushNotification(req, res, franchisePushNotificationOptionsUser);
									}
								}
							})
							/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */

							/*
							   let emailOptions = {
								   to: email,
								   action: "user_finish_booking",
								   rep_array: [customerName, orderNumber, fullName],
							   };
							   sendMail(req, res, emailOptions);
						   */


						}





						req.flash(STATUS_SUCCESS, res.__("admin.order.service_complete"));
						res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);


					} else {
						/**send error response */
						req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
						res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
					}
				});
			}

			if (updateResponse.status == STATUS_SUCCESS) {
				req.flash(STATUS_SUCCESS, res.__('front.order.booking_service_complete'));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
			else {
				/**send success response */
				req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
		});
	}


	/**
	 * Function to refund delivered product  
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.deliveredProduct = async (req, res, next) => {
		var productId = new ObjectId(req.params.product_id);
		var orderId = new ObjectId(req.params.order_id);
		var order_id = req.params.order_id;
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);
		delete adminUser.password;
		delete adminUser.is_email_verified;
		delete adminUser.is_mobile_verified;
		delete adminUser.is_admin_approved;

		let optionObj = {
			conditions: {
				"_id": orderId,
				$or: [{ 'status': BOOKING_STATUS_REACHED_LOCATION }, { 'status': BOOKING_STATUS_SERVICE_STARTED }, { 'status': BOOKING_STATUS_SERVICE_FINISHED }],
				$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
			},
			fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, is_service_booking: 1, is_store_order: 1, status: 1, total_selling_amount: 1, area_ids: 1, booking_contract_id: 1 }
		}

		/**get booking details */
		let bookingResponse = await OrderModel.getOrderBookingDetail(optionObj);
		if (bookingResponse.status == STATUS_ERROR || (bookingResponse.result && bookingResponse.result.length == 0)) {
			req.flash(STATUS_ERROR, res.__("front.global.no_record_found"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + order_id);
		}
		else {
			let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
			let isServiceBooking = (bookingDetails.is_service_booking) ? bookingDetails.is_service_booking : false;
			let isSoreBooking = (bookingDetails.is_store_order) ? bookingDetails.is_store_order : false;
			let bookingStatus = bookingDetails.status;
			let bookingContractId   = bookingDetails.booking_contract_id ? new ObjectId(bookingDetails.booking_contract_id) : '';

			// collect order details
			const options = {
				collection: TABLE_ORDERS,
				conditions: [
					{ $match: { _id: orderId } },
				]
			};

			// collect order details
			const items_options = {
				collection: TABLE_ORDER_ITEMS,
				conditions: [
					{ $match: { _id: productId } },
				]
			};

			const [orderDetails, orderItemDetails] = await Promise.all([
				DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {}),
				DbClass.getAggregateResult(null, null, items_options).then(res => res?.result?.[0] || {})
			]);

			// Order not delivered then return the request
			if (!orderDetails && !orderItemDetails?.is_delivered == true) {
				req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + order_id);
			}

			let customerId = (orderDetails.user_id) ? new ObjectId(orderDetails.user_id) : "";
			let orderNumber = (orderDetails && orderDetails.order_number) ? orderDetails.order_number : "";
			let totalSellingAmount = (orderDetails && orderDetails.total_selling_amount) ? Number(orderDetails.total_selling_amount) : "";

			let currentDateTime = new Date().toISOString();
			let updateData = {
				'is_delivered': true,
				'delivered_time': getUtcDate()
			};
			let optionsForUpdateItems = {
				conditions: { '_id': productId },
				updateData: { $set: updateData }
			};

			OrderModel.updateOrderItems(req, res, optionsForUpdateItems).then(async (updateResponse) => {

				let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1, 'full_name': 1 } });

				let customerResult = (userDetails.result) ? userDetails.result : "";

				let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : '';
				let fullName = (adminUser.full_name) ? adminUser.full_name : "";
				let productName = (orderItemDetails.product_title) ? orderItemDetails.product_title : "";
				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
						message_params: [customerName, orderNumber, productName],
						user_id: customerId,
						user_ids: [customerId],
						parent_table_id: orderId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};

				await insertNotifications(req, res, notificationOptions);


				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
						message_params: [customerName, orderNumber, productName],
						user_id: customerId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await pushNotification(req, res, pushNotificationOptions);

				/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
				let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
				let currentDateTime = new Date();
				let optionObj = {
					conditions: { 
						area_id: { $in: areaIds }, 
						status: CONTRACT_STATUS_ACTIVE, 
						end_date: { $gte: currentDateTime } 
					},
				}
				FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
					let responseStatus = response.status ? response.status : "";
					let contractData = response.result ? response.result : "";
					if (responseStatus == STATUS_SUCCESS && contractData) {

						let franchiseId	= (contractData.franchise_id) ? contractData.franchise_id : null;
						if (franchiseId) {
							let franchiseNotificationOptions = {
								notification_data: {
									notification_type: FRANCHISE_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
									message_params: [customerName, orderNumber, productName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};

							await insertNotifications(req, res, franchiseNotificationOptions);

							let franchisePushNotificationOptionsUser = {
								notification_data: {
									notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
									message_params: [customerName, orderNumber, productName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, franchisePushNotificationOptionsUser);
						}
					}
				})
				/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


				if ((isServiceBooking != ACTIVE) || ((isServiceBooking == ACTIVE) && (bookingStatus == BOOKING_STATUS_SERVICE_FINISHED))) {

					let orderItemDetails = await OrderModel.getOrderItemCount({
						conditions: {
							"order_id": orderId,
							'item_type': ITEM_TYPE_PRODUCT,
							'is_delivered': false,
						}
					});

					let orderItemResultCount = (orderItemDetails.result) ? orderItemDetails.result : 0;

					if (orderItemResultCount == 0) {
						let options = {
							conditions: { "_id": orderId, "order_status": ORDER_PLACED },
							updateData: {
								$set: {
									'status': BOOKING_STATUS_COMPLETED,
									'booking_complete_time': currentDateTime,
									'completed_by': new ObjectId(adminUserId),
									'modified': getUtcDate()
								}
							}
						};

						/**update order booking */
						OrderModel.updateOrderBooking(req, res, options).then(async (updateOrdResponse) => {

							if (updateOrdResponse.status == STATUS_SUCCESS) {

								if (totalSellingAmount) {

									let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;

									let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;
									let valuePerPoint = res.locals.settings["Site.value_per_coin"];

									let pointsResp = calculatePoints(totalSellingAmount, valuePerPoint, totalBalanceForPoints);
									let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
									let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
									let useOrderNumber = "#" + orderNumber;

									let pointsOption = {
										"user_id": new ObjectId(customerId),
										"order_id": orderId,
										"order_number": orderNumber,
										"points": points,
										"type": POINT_TYPE_EARNED,
										"transaction_reason": EARNED_BY_ORDER,
										"amount_for_single_point": valuePerPoint,
										"total_user_points": totalUserPoints,
										"total_selling_amount": totalSellingAmount,
										"total_balance_for_points": totalBalanceForPoints,
										"remainder": remainder,
										"note": res.__("front.user.points_earned_regarding_order_number", useOrderNumber)
									}
									/**save points while complete order */
									await saveUserPoints(req, res, pointsOption);

									/** Save points stats for user*/
									await updatePointTransactionLogStats(req, res, {
										"user_id": adminUserId,
										"points": points,
									});







									/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
									let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
									 let bookingContractId   = bookingDetails.booking_contract_id ? new ObjectId(bookingDetails.booking_contract_id) : '';
									let currentDateTime = new Date();
									let optionObj = {
										conditions: { 
											area_id: { $in: areaIds }, 
											_id: bookingContractId, 
											status: CONTRACT_STATUS_ACTIVE, 
											end_date: { $gte: currentDateTime } 
										},
									}
									FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
										let responseStatus = response.status ? response.status : "";
										let contractData = response.result ? response.result : "";
										if (responseStatus == STATUS_SUCCESS && contractData) {

											let franchiseId 								= (contractData.franchise_id) ? contractData.franchise_id : null;
											let purelyAmountCommissionStorePercentage     	= (contractData.purely_amount_commission_store) ? contractData.purely_amount_commission_store : 0;
											let purelyAmountCommissionServicePercentage   	= (contractData.purely_amount_commission) ? contractData.purely_amount_commission : 0;
											let contractId   								= (contractData._id) ? contractData._id : 0;
					
											
											if (franchiseId) {

												/* PURELY COMMINSSION BASED CODE START */
												let handleObject = {
													orderId: orderId,
													franchiseId:franchiseId,
													contractId:contractId,
													purelyAmountCommissionStorePercentage:purelyAmountCommissionStorePercentage,
													purelyAmountCommissionServicePercentage:purelyAmountCommissionServicePercentage
												};
												await handlePurelyCommissionUpdate(req, res, handleObject);
												/* PURELY COMMINSSION BASED CODE END */

											}
										}
									});


								}
								else {
									req.flash(STATUS_SUCCESS, res.__("admin.order.service_complete"));
									res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + order_id);
								}

							}
						});
					}
				}

				req.flash(STATUS_SUCCESS, res.__("admin.wallet.product_has_been_delivered_successfully"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + order_id);

			});
		}
	}


	/**
	 * Function to refund delivered product amount to wallet
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.refundProductAmount = async (req, res, next) => {
		var productId = new ObjectId(req.params.product_id);
		var orderId = new ObjectId(req.params.order_id);

		var adminUser = (req.session.user) ? req.session.user : {};
		delete adminUser.password;
		delete adminUser.is_email_verified;
		delete adminUser.is_mobile_verified;
		delete adminUser.is_admin_approved;

		if (isPost(req)) {
			let amount = req.body.amount ? req.body.amount : '';
			let note = req.body.note ? req.body.note : '';

			// collect order details
			const options = {
				collection: TABLE_ORDERS,
				conditions: [
					{ $match: { _id: orderId } },
				]
			};
			// collect order details
			const items_options = {
				collection: TABLE_ORDER_ITEMS,
				conditions: [
					{ $match: { _id: productId } },
				]
			};
			const [orderDetails, orderItemDetails] = await Promise.all([
				DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {}),
				DbClass.getAggregateResult(null, null, items_options).then(res => res?.result?.[0] || {})
			]);

			// Order not delivered then return the request
			if (!orderItemDetails?.is_delivered) {
				return res.send({
					status: STATUS_ERROR,
					message: res.__("admin.system.invalid_access"),
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
				})
			}
			// Refund is already issued then return the request
			else if (orderItemDetails?.refund_issued) {
				return res.send({
					status: STATUS_ERROR,
					message: res.__("admin.system.invalid_access"),
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
				})
			}

			let userId = orderDetails?.user_id ? new ObjectId(orderDetails.user_id) : '';

			let user_options = {
				collection: TABLE_USERS,
				conditions: { _id: userId },
			}

			const [userData] = await Promise.all([
				DbClass.getFindOne(user_options).then(res => res?.result || {})
			])

			let walletAmount = (userData?.wallet_amount) ? userData.wallet_amount : '';
			let totalUserWalletAmount = Number(walletAmount) + Number(amount)

			let transactionIdData 	= await getUniqueWalletTransactionId(req, res);
			let transaction_id 		= (transactionIdData.result) || '';
			asyncParallel({
				save_wallet_transaction: (callback) => {
					/**save wallet amount */
					GiftTransactionModel.saveWalletTransactionLogs(req, res, {
						insertData: {
							'user_id': userId,
							'order_id': orderId,
							'transaction_id' : transaction_id,
							'product_id': productId,
							'amount': Number(amount),
							'note': note,
							'type': AMOUNT_CREDIT,
							'transaction_type': ORDER_ITEM_REFUND,
							'total_balance_after_transaction': totalUserWalletAmount,
							'message': res.__("admin.wallet.refund_created_by_administrator"),
							'admin_user_details': adminUser,
							'amount_added_by': new ObjectId(adminUser._id),
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
				},
				update_order_item: (callback) => {
					let options = {
						'collection': TABLE_ORDER_ITEMS,
						'conditions': { _id: productId },
						'updateData': {
							$set: {
								'refund_amount': Number(amount),
								'refund_note': note,
								'refund_issued': ACTIVE,
								'admin_user_details': adminUser,
								'modified': getUtcDate()
							}
						},
					}

					DbClass.updateOneRecord(req, res, options).then(result => {
						callback(null, null)
					})
				}
			}, async (asyncErr, asyncRes) => {

				let fullName = (userData?.full_name) ? userData.full_name : '';
				let productTitle = (orderItemDetails?.product_title) ? orderItemDetails.product_title : '';
				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_FOR_ADMIN_REFUND_PRODUCT_AMOUNT,
						message_params: [fullName, Number(amount), productTitle],
						user_id: userId,
						user_ids: [userId],
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUser._id
					}
				};

				/**send booking notification to user */
				await insertNotifications(req, res, notificationOptions);


				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_REFUND_PRODUCT_AMOUNT,
						message_params: [fullName, Number(amount), productTitle],
						user_id: userId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUser._id
					}
				};
				await pushNotification(req, res, pushNotificationOptions);


				req.flash(STATUS_SUCCESS, res.__("admin.wallet.amount_has_been_rerunded_successfully"));

				res.send({
					status: STATUS_SUCCESS,
					message: res.__("admin.wallet.amount_has_been_rerunded_successfully"),
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
				})

			})
		}
		else {
			res.status(404).send({ status: STATUS_ERROR, message: res.__("admin.system.invalid_access") })
		}
	}


	/**
	 * Function to cancel bookings
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.cancelBookings = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);

		let cancelReason = (req.body.cancel_reason) ? req.body.cancel_reason : '';
		if (isPost(req)) {
			var adminUser = (req.session.user) ? req.session.user : {};
			var adminUserId = new ObjectId(adminUser._id);
			let optionObj = {
				conditions: {
					"_id": orderId,
					"order_status": ORDER_PLACED,
					'status': { $in: FOR_ADMIN_CANCEL_BOOKING_STATUS },
					$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }]
				}
			}
			/**get booking details */
			let bookingResponse = await OrderModel.orderFindOne(optionObj);
			let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

			if (!bookingDetails) {
				/** Send error response **/

				res.send({
					status: STATUS_ERROR,
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
					message: res.__("front.system.order_not_found"),
				});
			}

			let userId = (bookingDetails.user_id) ? bookingDetails.user_id : "";
			let orderItemOption = {
				conditions: {
					'order_id': orderId,
					"is_deliverd": true
				},
			};

			/**get order item lists */
			let orderItemResponse = await OrderModel.getOrderItemList(orderItemOption);
			let orderItemsResult = orderItemResponse.result || [];
			if (orderItemsResult.length > 0) {
				/** Send error response **/

				res.send({
					status: STATUS_ERROR,
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
					message: res.__("front.global.booking_cannot_cancel_some_products_deliverd"),
				});
			}
			else {

				let paymentStatus = (bookingDetails.payment_status) ? bookingDetails.payment_status : PAYMENT_UNPAID;
				let totalSellingAmount = (bookingDetails.total_selling_amount) ? bookingDetails.total_selling_amount : 0;
				let orderNumber = (bookingDetails.order_number) ? bookingDetails.order_number : 0;
				let bookingTime = (bookingDetails && bookingDetails.booking_time) ? bookingDetails.booking_time : "";
				let bookingDate = (bookingDetails && bookingDetails.booking_date) ? bookingDetails.booking_date : "";
				let serviceProviderId = (bookingDetails && bookingDetails.service_provider_id) ? bookingDetails.service_provider_id : null;


				let user_options = {
					collection: TABLE_USERS,
					conditions: { _id: userId },
				}

				const [userData] = await Promise.all([
					DbClass.getFindOne(user_options).then(res => res?.result || {})
				])

				 
                
				let walletAmount 		= (userData?.wallet_amount) ? userData.wallet_amount : '';
				let currentDateTime 	= new Date().toISOString();

				let updateData = {
					'cancel_reason': cancelReason,
					'status': BOOKING_STATUS_CANCELLED,
					'booking_cancel_time': currentDateTime,
					'modified': getUtcDate()
				};

				let options = {
					conditions: { '_id': orderId, 'status': { $in: FOR_ADMIN_CANCEL_BOOKING_STATUS } },
					updateData: {
						$set: updateData,
						$addToSet: {
							'canceledBy': {
								'user_id': adminUserId,
								'booking_cancel_time': currentDateTime,
								'cancel_reason': cancelReason
							}
						}
					}
				};

				/**update order booking */
				OrderModel.updateOrderBooking(req, res, options).then(async updateResponse => {

					if (updateResponse.status == STATUS_SUCCESS) {

						if ((bookingDetails.is_service_booking == ACTIVE) && (serviceProviderId)) {
							let updateObj = {
								date: bookingDate,
								slot_time: bookingTime,
								booking_status: BOOKING_STATUS_CANCELLED,
								service_provider_id: new ObjectId(serviceProviderId),
								booking_id: orderId,
								order_number: orderNumber,
								booking_start_timestamp: bookingDetails.booking_start_timestamp,
								booking_end_timestamp: bookingDetails.booking_end_timestamp
							}
							await updateServiceProviderTimeSlot(req, res, updateObj);

						}


						if ((paymentStatus == PAYMENT_PAID) && (totalSellingAmount > 0)) {

							let totalWalletAmount = Number(walletAmount) + Number(totalSellingAmount);

							let options = {
								'conditions': { _id: new ObjectId(userId) },
								'updateData': {
									$set: {
										'wallet_amount': Number(totalWalletAmount), 'modified': getUtcDate()
									}
								},
							}


							let transactionIdData 	= await getUniqueWalletTransactionId(req, res);
							let transaction_id 		= (transactionIdData.result) || '';
							/**query for update wallet amount */
							userModel.updateOneUser(req, res, options).then(async (updateRes) => {

								if (updateRes.status == STATUS_SUCCESS) {

									let useOrderNumber = "#" + orderNumber;

									await Promise.all([
										/**save wallet transaction and user point logs*/

										GiftTransactionModel.saveWalletTransactionLogs(req, res, {
											insertData: {
												'user_id': new ObjectId(userId),
												"order_id": orderId,
												"order_number": orderNumber,
												'transaction_id' : transaction_id,
												'amount': Number(totalSellingAmount),
												'type': AMOUNT_CREDIT,
												'transaction_type': REFUND_FOR_CANCEL_ORDER,
												'total_balance_after_transaction': Number(totalWalletAmount),
												'message': res.__("front.user.refund_for_cancel_order", useOrderNumber),
												'created': getUtcDate()
											}
										})
									]);
								} else {
									/** Send error response **/

									res.send({
										status: STATUS_ERROR,
										redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
										message: res.__("front.system.something_going_wrong_please_try_again"),
									});

								}
							});
						}



						//// update cancel booking update product
						let cancelOptionObj = {
							user_id: adminUserId,
							booking_id: orderId,
						}

						await addQuantityIntoProduct(req, res, cancelOptionObj);


						let fullName = (adminUser.full_name) ? adminUser.full_name : "";
						let notificationOptions = {
							notification_data: {
								notification_type: NOTIFICATION_TO_USER_CANCEL_BOOKING,
								message_params: ['', orderNumber, fullName],
								user_id: userId,
								user_ids: [userId],
								parent_table_id: orderId,
								lang_code: DEFAULT_LANGUAGE_CODE,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: adminUserId
							}
						};

						/**send booking notification to user */
						await insertNotifications(req, res, notificationOptions);


						let pushNotificationOptions = {
							notification_data: {
								notification_type: PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING,
								message_params: ['', orderNumber, fullName],
								user_id: userId,
								lang_code: DEFAULT_LANGUAGE_CODE,
								user_role_id: FRONT_ADMIN_ROLE_ID,
								role_id: FRONT_ADMIN_ROLE_ID,
								created_by: adminUserId
							}
						};
						await pushNotification(req, res, pushNotificationOptions);

						/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
						let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
						let currentDateTime = new Date();
						let optionObj = {
							conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
						}
						FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
							let responseStatus = response.status ? response.status : "";
							let contractData = response.result ? response.result : "";
							if (responseStatus == STATUS_SUCCESS && contractData) {

								let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
								if (franchiseId) {
									let franchiseNotificationOptions = {
										notification_data: {
											notification_type: FRANCHISE_NOTIFICATION_TO_USER_CANCEL_BOOKING,
											message_params: ['', orderNumber, fullName],
											user_id: franchiseId,
											user_ids: [franchiseId],
											parent_table_id: orderId,
											lang_code: DEFAULT_LANGUAGE_CODE,
											user_role_id: FRONT_ADMIN_ROLE_ID,
											role_id: FRONT_ADMIN_ROLE_ID,
											created_by: adminUserId
										}
									};

									await insertNotifications(req, res, franchiseNotificationOptions);

									let franchisePushNotificationOptionsUser = {
										notification_data: {
											notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING,
											message_params: ['', orderNumber, fullName],
											user_id: franchiseId,
											user_ids: [franchiseId],
											lang_code: DEFAULT_LANGUAGE_CODE,
											user_role_id: FRONT_ADMIN_ROLE_ID,
											role_id: FRONT_ADMIN_ROLE_ID,
											created_by: adminUserId
										}
									};
									await pushNotification(req, res, franchisePushNotificationOptionsUser);
								}
							}
						})
						/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */



						/*
							let emailOptions = {
								to: email,
								action: "user_cancel_booking",
								rep_array: [fullName, orderNumber],
							};
							sendMail(req, res, emailOptions);
						*/

						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.order.booking_cancel"),
						});




					}
				});
			}
		}
	}//End cancelBookings()


	/**
	 * Function to cancel bookings
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.noteBookings = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		let note = (req.body.note) ? req.body.note : '';
		if (isPost(req)) {
			let optionObj = {
				conditions: {
					"_id": orderId
				}
			}
			/**get booking details */
			let bookingResponse = await OrderModel.orderFindOne(optionObj);
			let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";
			if (!bookingDetails) {
				/** Send error response **/
				res.send({
					status: STATUS_ERROR,
					redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
					message: res.__("front.system.order_not_found"),
				});
			} else {
				let updateData = {
					'note': note,
					'modified': getUtcDate()
				};
				let options = {
					conditions: { '_id': orderId },
					updateData: {
						$set: updateData,
					}
				};

				/**update order booking */
				OrderModel.updateOrderBooking(req, res, options).then(async updateResponse => {
					if (updateResponse.status == STATUS_SUCCESS) {
						req.flash(STATUS_SUCCESS, res.__("front.order.note_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + "orders/view/" + orderId,
							message: res.__("front.order.note_has_been_added_successfully"),
						});
					}
				});
			}
		}
	}//End noteBookings()


	/**
	 * Function for complete booking
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.completeBooking = async (req, res, next) => {
		let orderId = new ObjectId(req.params.order_id);
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminUserId = new ObjectId(adminUser._id);

		if (!orderId) {
			req.flash(STATUS_ERROR, res.__("api.global.parameter_missing"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let optionObj = {
			conditions: { "_id": orderId, 'status': { $in: FOR_COMPLETE_BOOKING_STATUS }, "order_status": ORDER_PLACED, $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }] },
			fields: { _id: 1, user_id: 1, address_detail: 1, order_number: 1, total_selling_amount: 1, area_ids: 1 }
		}

		/**get booking details */
		let bookingResponse = await OrderModel.orderFindOne(optionObj);
		let bookingDetails = (bookingResponse.result) ? bookingResponse.result : "";

		if (!bookingDetails) {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("front.system.order_not_found"));
			res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
		}

		let orderNumber = (bookingDetails && bookingDetails.order_number) ? bookingDetails.order_number : "";
		let totalSellingAmount = (bookingDetails && bookingDetails.total_selling_amount) ? Number(bookingDetails.total_selling_amount) : "";
		let customerId = (bookingDetails.user_id) ? new ObjectId(bookingDetails.user_id) : "";
		let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'full_name': 1 } });
		let customerResult = (userDetails.result) ? userDetails.result : "";
		let customerName = (customerResult && customerResult.full_name) ? customerResult.full_name : "";
		let currentDateTime = new Date().toISOString();

		let options = {
			conditions: { "_id": orderId, 'status': { $in: FOR_COMPLETE_BOOKING_STATUS }, "order_status": ORDER_PLACED, $or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }] },
			updateData: {
				$set: {
					'status': BOOKING_STATUS_COMPLETED,
					'booking_complete_time': currentDateTime,
					'completed_by': adminUserId,
					'modified': getUtcDate()
				}
			}
		};

		/**update order booking */
		OrderModel.updateOneOrder(req, res, options).then(async (updateResponse) => {

			if (updateResponse.status == STATUS_SUCCESS) {

				if (totalSellingAmount) {
					let userDetails = await userModel.getUserDetails({ conditions: { '_id': new ObjectId(customerId) }, fields: { 'total_points': 1, 'total_balance_for_points': 1 } });
					let customerResult = (userDetails.result) ? userDetails.result : "";
					let totalUserPoints = (customerResult && customerResult.total_points) ? customerResult.total_points : 0;
					let totalBalanceForPoints = (customerResult && customerResult.total_balance_for_points) ? customerResult.total_balance_for_points : 0;
					let valuePerPoint = res.locals.settings["Site.value_per_coin"];

					let pointsResp = calculatePoints(totalSellingAmount, valuePerPoint, totalBalanceForPoints);
					let points = (pointsResp.totalPoints) ? pointsResp.totalPoints : 0;
					let remainder = (pointsResp.remainder) ? pointsResp.remainder : 0;
					let useOrderNumber = "#" + orderNumber;


					let pointsOption = {
						"user_id": new ObjectId(customerId),
						"order_id": orderId,
						"order_number": orderNumber,
						"points": points,
						"type": POINT_TYPE_EARNED,
						"transaction_reason": EARNED_BY_ORDER,
						"amount_for_single_point": valuePerPoint,
						"total_user_points": totalUserPoints,
						"total_selling_amount": totalSellingAmount,
						"total_balance_for_points": totalBalanceForPoints,
						"remainder": remainder,
						"note": res.__("front.user.points_earned_regarding_order_number", useOrderNumber)
					}

					/**save points while complete order */
					await saveUserPoints(req, res, pointsOption);

					/** Save points stats for user*/
					await updatePointTransactionLogStats(req, res, {
						"user_id": new ObjectId(customerId),
						"points": points,
					});
				}

				let fullName = (adminUser.full_name) ? adminUser.full_name : "";
				let notificationOptions = {
					notification_data: {
						notification_type: NOTIFICATION_TO_USER_COMPLETE_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						user_ids: [customerId],
						parent_table_id: orderId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};

				await insertNotifications(req, res, notificationOptions);


				let pushNotificationOptions = {
					notification_data: {
						notification_type: PUSH_NOTIFICATION_TO_USER_COMPLETE_BOOKING,
						message_params: [customerName, orderNumber, fullName],
						user_id: customerId,
						lang_code: DEFAULT_LANGUAGE_CODE,
						user_role_id: FRONT_ADMIN_ROLE_ID,
						role_id: FRONT_ADMIN_ROLE_ID,
						created_by: adminUserId
					}
				};
				await pushNotification(req, res, pushNotificationOptions);




				/* SEND NOTIFICATIONS TO FRANCHISE USER START HERE  */
				let areaIds = bookingDetails.area_ids ? bookingDetails.area_ids.map(item => item.area_id) : [];
				let currentDateTime = new Date();
				let optionObj = {
					conditions: { area_id: { $in: areaIds }, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
				}
				FranchiseContractsModel.getContractDetail(optionObj).then(async (response) => {
					let responseStatus = response.status ? response.status : "";
					let contractData = response.result ? response.result : "";
					if (responseStatus == STATUS_SUCCESS && contractData) {

						let franchiseId = (contractData.franchise_id) ? contractData.franchise_id : null;
						if (franchiseId) {
							let franchiseNotificationOptions = {
								notification_data: {
									notification_type: FRANCHISE_NOTIFICATION_TO_USER_COMPLETE_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									parent_table_id: orderId,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};

							await insertNotifications(req, res, franchiseNotificationOptions);

							let franchisePushNotificationOptionsUser = {
								notification_data: {
									notification_type: FRANCHISE_PUSH_NOTIFICATION_TO_USER_COMPLETE_BOOKING,
									message_params: [customerName, orderNumber, fullName],
									user_id: franchiseId,
									user_ids: [franchiseId],
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminUserId
								}
							};
							await pushNotification(req, res, franchisePushNotificationOptionsUser);
						}
					}
				})
				/* SEND NOTIFICATIONS TO FRANCHISE USER END HERE  */


				req.flash(STATUS_SUCCESS, res.__("front.order.booking_service_started"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
			else {
				req.flash(STATUS_ERROR, res.__("front.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL + "orders/view/" + orderId);
			}
		});
	}

};

module.exports = new Orders();