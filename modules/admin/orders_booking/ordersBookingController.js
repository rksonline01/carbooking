const OrdersBookingModel = require("./model/OrdersBookingModel");
const { ObjectId } = require("mongodb");

function OrdersBooking() {

	/**
	 * Function for get order booking list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.getOrdersBookingList = (req, res, next) => {
        let langCode = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;

		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			let bookingNumber = (req.body.booking_number) ? req.body.booking_number : "";

			/** Configure DataTable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {
				/** Set conditions **/
				let commonConditions = {
					is_deleted: NOT_DELETED,
				};
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

				if (bookingNumber) dataTableConfig.conditions['booking_number'] = bookingNumber;

				let conditions = [
					{
						$facet: {
							"booking_list": [
								{
									$match: dataTableConfig.conditions
								},
								{
									$project: {
										"_id": 1,
										"booking_number": 1,
										"booking_date": 1,
										"booking_time": 1,
										"booking_start_timestamp": 1,
										"booking_end_timestamp": 1,
										"travelling_timestamp": 1,
										"booking_car_type": 1,
										"booking_duration": 1,
										"booking_price": 1,
										"order_details": 1,
										"package_details": {
											"_id": 1,
											"package_image": 1,
											"package_name": 1,
											"car_type": 1,
											"duration": 1,
											"price": 1,
											"short_description": 1,
											'package_name': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".package_name", ''] }, then: "$package_details.pages_descriptions." + langCode + ".package_name", else: "$package_details.package_name" } },
											'body': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".body", ''] }, then: "$package_details.pages_descriptions." + langCode + ".body", else: "$package_details.body" } },
											'short_description': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$package_details.pages_descriptions." + langCode + ".short_description", else: "$package_details.short_description" } },
											"description": 1,
											"slug": 1,
			
										},
										"subscription_details": {
											'id': 1,
											'subscription_image': 1,
											'subscription_name': 1,
											'car_type': 1,
											'duration': 1,
											'price': 1,
											'slug': 1,
											'total_service': 1,
											'validity_period': 1,
											'short_description': 1,
											'description': 1,
											'subscription_name': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$subscription_details.subscription_name" } },
											'body': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".body", else: "$body" } },
											'short_description': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".short_description", else: "$subscription_details.short_description" } },
											'is_active': 1,
										},
										'user_package_id': 1,
										'user_subscription_id': 1,
										"modified": 1,
										"created": 1
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

				OrdersBookingModel.getBookingAggregateList(req, res, optionObj).then(orderResponse => {
					let responseStatus = (orderResponse.status) ? orderResponse.status : "";
					let responseResult = (orderResponse.result && orderResponse.result[0]) ? orderResponse.result[0] : "";
					let bookingList = (responseResult && responseResult.booking_list) ? responseResult.booking_list : [];
					let orderAllCount = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
					let orderFilterCount = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;

					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: bookingList,
						recordsTotal: orderAllCount,
						recordsFiltered: orderFilterCount,
					});
				});
			});
		} else {

			req.breadcrumbs(BREADCRUMBS["admin/orders_booking/list"]);
			res.render('list');

		};
	};//End getordersBookingList()


	/*
	 * Function for view details
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewBookingDetails = (req, res, next) => {
        let langCode = (req.session.lang) ? req.session.lang : DEFAULT_LANGUAGE_CODE;
		let bookingId = (req.params.id) ? (req.params.id) : "";

		let optionObj = {
			conditions: { '_id': new ObjectId(bookingId), 'is_deleted': NOT_DELETED },
			fields: {
				"_id": 1,
				"booking_number": 1,
				"booking_date": 1,
				"booking_time": 1,
				"booking_start_timestamp": 1,
				"booking_end_timestamp": 1,
				"travelling_timestamp": 1,
				"booking_car_type": 1,
				"booking_duration": 1,
				"booking_price": 1,
				"order_details": 1,
				"package_details": {
					"_id": 1,
					"package_image": 1,
					"package_name": 1,
					"car_type": 1,
					"duration": 1,
					"price": 1,
					"short_description": 1,
					'package_name': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".package_name", ''] }, then: "$package_details.pages_descriptions." + langCode + ".package_name", else: "$package_details.package_name" } },
					'body': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".body", ''] }, then: "$package_details.pages_descriptions." + langCode + ".body", else: "$package_details.body" } },
					'short_description': { $cond: { if: { $ne: ["$package_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$package_details.pages_descriptions." + langCode + ".short_description", else: "$package_details.short_description" } },
					"description": 1,
					"slug": 1,

				},
				"subscription_details": {
					'_id': 1,
					'subscription_image': 1,
					'subscription_name': 1,
					'car_type': 1,
					'duration': 1,
					'price': 1,
					'slug': 1,
					'total_service': 1,
					'validity_period': 1,
					'short_description': 1,
					'description': 1,
					'subscription_name': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$subscription_details.subscription_name" } },
					'body': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".body", else: "$subscription_details.body" } },
					'short_description': { $cond: { if: { $ne: ["$subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$subscription_details.pages_descriptions." + langCode + ".short_description", else: "$subscription_details.short_description" } },
					'is_active': 1,
				},
				"my_subscription_details":{
					'_id': 1,
					'order_number':1,
					'subscription_image': 1,
					'subscription_name': 1,
					'car_type': 1,
					'duration': 1,
					'price': 1,
					'slug': 1,
					'total_service': 1,
					'validity_period': 1,
					'short_description': 1,
					'description': 1,
					'subscription_name': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".subscription_name", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".subscription_name", else: "$my_subscription_details.subscription_name" } },
					'body': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".body", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".body", else: "$my_subscription_details.body" } },
					'short_description': { $cond: { if: { $ne: ["$my_subscription_details.pages_descriptions." + langCode + ".short_description", ''] }, then: "$my_subscription_details.pages_descriptions." + langCode + ".short_description", else: "$my_subscription_details.short_description" } },
				},
				'address_detail':1,
				'user_package_id': 1,
				'user_subscription_id': 1,
				"modified": 1,
				"created": 1
			}
		}


		OrdersBookingModel.getOrderBookingDetail(optionObj).then(bookingRes => {
			let bookingDetails = (bookingRes.result) ? bookingRes.result : "";
			req.breadcrumbs(BREADCRUMBS["admin/orders_booking/view"]);
			res.render('view', {
				result: bookingDetails,
				product_url: PRODUCT_URL,
				package_url: PACKAGE_URL,
				subscription_url: SUBSCRIPTION_URL,

			});

		});

	};//End viewDetails()




};
module.exports = new OrdersBooking();
