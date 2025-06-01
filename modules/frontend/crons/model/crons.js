const UserModel = require("../../../admin/users/model/user");
const OrderModel = require("../../../admin/orders/model/OrderModel");
const PackageModel = require("../../../admin/package_management/model/Package");
const PromoCodeModel = require("../../../admin/promo_code/model/PromoCode");
const EmailNotificationModel = require("../../../admin/email_notification/model/EmailNotificationModel");
const CustomNotificationModel = require("../../../admin/custom_notification/model/CustomNotificationModel");
const ProductModel = require("../../../admin/products/model/ProductModel");
const RegistrationModel = require('../../api/model/registrationModel');
const async = require("async");
const asyncEachSeries = require("async/eachSeries");
const { ObjectId, Db } = require('mongodb');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const firebaseAdmin = require("firebase-admin");
const path = require("path");


// Load Firebase Service Account JSON
const serviceAccount = require(path.join(__dirname, "../../../../car-wash-24467-firebase-adminsdk-fbsvc-25130c504a.json"));


// Initialize Firebase Admin
if (!firebaseAdmin.apps.length) {
	firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert(serviceAccount),
	});
} else {
	firebaseAdmin.app();
}



const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
function Crons() {



	/**
	 * Function for use to admin Dashboard Stats
	 
	 * @return render/json
	 */
	this.adminDashboardStats = (req, res, next) => {

		const asyncParallel = require("async/parallel");
		asyncParallel({
			// 1.	Customer demographics gender base
			user_gender_data: (callback) => {
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
								gender: "$gender"
							},
							total_male_users: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ["$gender", 1] },
											]
										},
										1,
										0
									]
								}
							},
							total_female_users: {
								$sum: {
									$cond: [
										{
											$and: [
												{ $eq: ["$gender", 2] },
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

				let genderOptionObj = {
					conditions: conditionsObj,
					collection: TABLE_USERS
				}

				UserModel.userAggregateResult(req, res, genderOptionObj).then(genderRes => {

					let genderStatus = (genderRes.status) ? genderRes.status : "";
					if (genderStatus == STATUS_ERROR) {
						callback(null, genderStatus);
					}
					let genderResResult = (genderRes.result) ? genderRes.result : "";
					callback(null, genderResResult);
				})
			},

			//2. Peak booking times
			peak_booking_time_data: (callback) => {
				let conditionsObj = [
					{
						$match: {
							status: BOOKING_STATUS_COMPLETED
						}
					},
					{
						$project: {
							hour: { $hour: "$created" }  // Extract hour from timestamp
						}
					},
					{
						$group: {
							_id: "$hour",
							total_bookings: { $sum: 1 }
						}
					},
					{
						$sort: { total_bookings: -1 }
					}
				];


				let orderOptionObj = {
					conditions: conditionsObj,
				};
				OrderModel.getOrderAggregateList(req, res, orderOptionObj).then(objRes => {
					let objStatus = (objRes.status) ? objRes.status : "";
					if (objStatus == STATUS_ERROR) {
						callback(null, objStatus);
					}
					let objResult = (objRes.result) ? objRes.result : "";
					callback(null, objResult);

				});
			},

			//3. Most requested areas
			most_requested_areas_data: (callback) => {

				let conditionsObj = [
					{
						$match: {
							status: { $ne: BOOKING_STATUS_CANCELLED }
						}
					},
					{
						$group: {
							_id: "$address_detail.area_id",
							total_orders: { $sum: 1 }
						}
					},
					{
						$limit: 1
					},
					{
						$sort: { total_orders: -1 }
					},
					{
						$lookup: {
							from: TABLE_AREAS,
							localField: "_id",
							foreignField: "_id",
							as: "area_info"
						}
					},

					{
						$project: {
							area_id: "$_id",
							area_name: "$area_info.title",
							total_orders: 1,
							area_info: 1
						}
					}


				];

				let orderOptionObj = {
					conditions: conditionsObj,
				};

				OrderModel.getOrderAggregateList(req, res, orderOptionObj).then(orderRes => {
					let orderStatus = (orderRes.status) ? orderRes.status : "";
					if (orderStatus == STATUS_ERROR) {
						callback(null, orderStatus);
					}
					let orderResult = (orderRes.result) ? orderRes.result : "";
					callback(null, orderResult);

				});
			},

			//	4. Best-selling packages
			best_selling_package_data: (callback) => {
				let packageConditionsObj = [
					{
						$match: {
							"is_deleted": NOT_DELETED,
						}
					},
					{
						$lookup: {
							from: TABLE_ORDERS,
							let: { orderId: "$_id" },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ["$package_details._id", "$$orderId"] }]
										}
									}
								},

								{
									$project: {
										'_id': 1,
									}
								}
							],
							as: "booking"
						}
					}, {
						$project: {
							_id: 1,
							package_name: 1,
							bookingCount: { $size: "$booking" }
						}
					},
					{
						$sort: {
							bookingCount: -1
						}
					},
				]
				let packageOptionObj = {
					conditions: packageConditionsObj,
				}
				PackageModel.getAggregatePackageList(req, res, packageOptionObj).then(packageRes => {

					let packageStatus = (packageRes.status) ? packageRes.status : "";
					if (packageStatus == STATUS_ERROR) {
						callback(null, packageStatus);
					}
					let packageResult = (packageRes.result) ? packageRes.result : "";
					callback(null, packageResult);
				})
			},

			// 6. Conversion rate
			conversion_rate_data: (callback) => {
				let customerConditionsObj = [
					{
						$match: {
							"is_deleted": NOT_DELETED,
							"user_type": CUSTOMER_USER_TYPE
						}
					},
					{
						$lookup: {
							from: TABLE_ORDERS,
							let: { userId: "$_id" },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ["$user_id", "$$userId"] }]
										}
									}
								},

								{
									$project: {
										'_id': 1,
									}
								}
							],
							as: "booking"
						}
					},
					{
						$project: {
							_id: 1,
							full_name: 1,
							bookingCount: { $size: "$booking" }
						}
					},
					{
						$facet: {
							// First facet for bookingCount > 0
							greaterThanZero: [
								{
									$match: {
										bookingCount: { $gt: 0 }
									}
								},
								{
									$count: "bookingCountGreaterThanZero"  // Count users with bookingCount > 0
								}
							],
							// Second facet for bookingCount == 0
							equalToZero: [
								{
									$match: {
										bookingCount: { $eq: 0 }
									}
								},
								{
									$count: "bookingCountEqualToZero"  // Count users with bookingCount == 0
								}
							]
						}
					},
					{
						$project: {
							// Pull out the counts from the facets
							bookingCountGreaterThanZero: { $arrayElemAt: ["$greaterThanZero.bookingCountGreaterThanZero", 0] },
							bookingCountEqualToZero: { $arrayElemAt: ["$equalToZero.bookingCountEqualToZero", 0] },
						}
					},
					{
						$project: {

							bookingCountGreaterThanZero: { $ifNull: ["$bookingCountGreaterThanZero", 0] },
							bookingCountEqualToZero: { $ifNull: ["$bookingCountEqualToZero", 0] },
						}
					}

				]

				let customerOptionObj = {
					conditions: customerConditionsObj,
				}

				UserModel.userAggregateResult(req, res, customerOptionObj).then(customerRes => {
					let customerStatus = (customerRes.status) ? customerRes.status : "";
					if (customerStatus == STATUS_ERROR) {
						callback(null, customerStatus);
					}
					let customerResult = (customerRes.result) ? customerRes.result : "";
					callback(null, customerResult);
				})
			},

			//	8. order Cancellation rate
			order_cancellation_rate_data: (callback) => {
				let conditionsObj = [
					{
						$facet: {
							total_bookings: [
								{
									$match: {
										status: { $ne: BOOKING_STATUS_CANCELLED }
									}
								},
								{
									$count: "count"
								}
							],
							total_cancelled: [
								{
									$match: {
										status: BOOKING_STATUS_CANCELLED
									}
								},
								{
									$count: "count"
								}
							],
						}
					}
				];

				let orderOptionObj = {
					conditions: conditionsObj,
				};

				OrderModel.getOrderAggregateList(req, res, orderOptionObj).then(cancelRes => {

					let cancelStatus = (cancelRes.status) ? cancelRes.status : "";
					if (cancelStatus == STATUS_ERROR) {
						callback(null, cancelStatus);
					}
					let cancelResult = (cancelRes.result) ? cancelRes.result : "";
					callback(null, cancelResult);

					/*
					let result = cancelRes.result[0];        
					let totalBookings = result.total_bookings[0]?.count || 0;
					let totalCancelled = result.total_cancelled[0]?.count || 0;
					let cancellationRate = totalBookings > 0 ? (totalCancelled / (totalBookings + totalCancelled)) * 100 : 0;
				
					console.log("📊 Total Bookings:", totalBookings + totalCancelled);
					console.log("❌ Total Cancelled:", totalCancelled);
					console.log("📉 Cancellation Rate:", `${cancellationRate.toFixed(2)}%`);
					*/
				});
			},

			// 10. Discount code tracking
			discount_code_tracking_data: (callback) => {
				let discountCodeConditionsObj = [
					{
						$match: {
							"is_deleted": NOT_DELETED,
						}
					},

					{
						$lookup: {
							from: TABLE_ORDERS,
							let: { promoCodeId: "$_id" },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ["$promo_code_detail._id", "$$promoCodeId"] }]
										}
									}
								},

								{
									$project: {
										'_id': 1,
									}
								}
							],
							as: "booking"
						}
					}, {
						$project: {
							_id: 1,
							promo_code: 1,
							bookingCount: { $size: "$booking" }
						}
					},
					{
						$sort: {
							bookingCount: -1
						}
					},
				]

				let discountCodeOptionObj = {
					conditions: discountCodeConditionsObj,
				}
				PromoCodeModel.getPromocodeAggregateList(req, res, discountCodeOptionObj).then(discountCodeRes => {
					let discountCodeStatus = (discountCodeRes.status) ? discountCodeRes.status : "";
					if (discountCodeStatus == STATUS_ERROR) {
						callback(null, discountCodeStatus);
					}
					let discountCodeResult = (discountCodeRes.result) ? discountCodeRes.result : "";
					callback(null, discountCodeResult);
				})
			},

			// 11. Total revenue: daily/monthly.
			total_revenue_data: (callback) => {
				let bookingConditionsObj = [
					{
						$match: {
							"is_deleted": NOT_DELETED,
						}
					},
					{
						$project: {
							month: {
								$dateToString: {
									format: "%Y-%m",
									date: { $ifNull: [{ $toDate: "$booking_date" }, new Date(0)] }
								}
							},

							day: {
								$dateToString: {
									format: "%Y-%m-%d",
									date: { $ifNull: [{ $toDate: "$booking_date" }, new Date(0)] }
								}
							},
							total_selling_amount: 1
						}
					},
					{
						$facet: {
							monthlyBookings: [
								{
									$group: {
										_id: "$month",
										totalBookings: { $sum: 1 },
										totalSellingAmount: { $sum: "$total_selling_amount" }
									}
								},
								{
									$sort: { _id: -1 }
								}
							],
							dailyBookings: [
								{
									$group: {
										_id: "$day",
										totalBookings: { $sum: 1 },
										totalSellingAmount: { $sum: "$total_selling_amount" }
									}
								},
								{
									$sort: { _id: -1 }
								}
							]
						}
					}
				];

				let bookingOptionObj = {
					conditions: bookingConditionsObj,
				}
				OrderModel.getOrderAggregateList(req, res, bookingOptionObj).then(bookingRes => {
					let bookingStatus = (bookingRes.status) ? bookingRes.status : "";
					if (bookingStatus == STATUS_ERROR) {
						callback(null, bookingStatus);
					}
					let bookingResult = (bookingRes.result) ? bookingRes.result : "";
					callback(null, bookingResult);
				})
			},

			//	12.	Revenue by package
			revenue_by_package_data: (callback) => {
				let conditionsObj = [
					{
						$match: {
							status: BOOKING_STATUS_COMPLETED
						}
					},
					{
						$group: {
							_id: null,
							total_revenue: { $sum: { $toDouble: "$total_price_of_packages" } }
						}
					}
				];

				let orderOptionObj = {
					conditions: conditionsObj,
				};
				OrderModel.getOrderAggregateList(req, res, orderOptionObj).then(objRes => {
					console.log("🚀 ~ OrderModel.getOrderAggregateList ~ objRes:", objRes)
					let objStatus = (objRes.status) ? objRes.status : "";
					if (objStatus == STATUS_ERROR) {
						callback(null, cancelStatus);
					}
					let objResult = (objRes.result) ? objRes.result : "";
					callback(null, objResult);

				});
			},

			//14.Number of completed bookings: comparing days and weeks.
			tota_completed_data: (callback) => {
				let completeBookingConditionsObj = [
					{
						$match: {
							"is_deleted": NOT_DELETED,
							'status': BOOKING_STATUS_COMPLETED
						}
					},
					{
						$project: {
							month: {
								$dateToString: {
									format: "%Y-%m",
									date: { $ifNull: [{ $toDate: "$booking_complete_time" }, new Date(0)] }
								}
							},

							day: {
								$dateToString: {
									format: "%Y-%m-%d",
									date: { $ifNull: [{ $toDate: "$booking_complete_time" }, new Date(0)] }
								}
							}
						}
					},
					{
						$facet: {
							monthlyBookings: [
								{
									$group: {
										_id: "$month",
										totalBookings: { $sum: 1 },
									}
								},
								{
									$sort: { _id: -1 }
								}
							],
							dailyBookings: [
								{
									$group: {
										_id: "$day",
										totalBookings: { $sum: 1 },
									}
								},
								{
									$sort: { _id: -1 }
								}
							]
						}
					}
				];

				let completeBookingOptionObj = {
					conditions: completeBookingConditionsObj,
				}
				OrderModel.getOrderAggregateList(req, res, completeBookingOptionObj).then(completeBookingRes => {
					console.log("🚀 ~ OrderModel.getOrderAggregateList ~ objRes:", completeBookingRes)
					let completeBookingStatus = (completeBookingRes.status) ? completeBookingRes.status : "";
					if (completeBookingStatus == STATUS_ERROR) {
						callback(null, completeBookingStatus);
					}
					let completeBookingResult = (completeBookingRes.result) ? completeBookingRes.result : "";
					callback(null, completeBookingResult);
				})
			},

			//	25.	High-value customers
			high_value_customers_data: (callback) => {
				let conditionsObj = [
					{
						$match: {
							status: BOOKING_STATUS_COMPLETED
						}
					},
					{
						$group: {
							_id: "$user_id",
							total_spent: { $sum: { $toDouble: "$total_selling_amount" } },           // group by user
							total_bookings: { $sum: 1 }   // count number of bookings
						}
					},
					{
						$lookup: {
							from: TABLE_USERS,                // join with user info
							localField: "_id",
							foreignField: "_id",
							as: "user_info"
						}
					},
					{
						$unwind: {
							path: "$user_info",
							preserveNullAndEmptyArrays: true
						}
					},
					{
						$project: {
							_id: 0,
							user_id: "$_id",
							full_name: "$user_info.full_name",
							email: "$user_info.email",
							total_bookings: 1,
							total_spent: 1
						}
					},
					{
						$sort: { total_spent: -1 }
					},
					{
						$limit: 10
					}
				];
				let orderOptionObj = {
					conditions: conditionsObj,
				};
				OrderModel.getOrderAggregateList(req, res, orderOptionObj).then(objRes => {
					console.log("🚀 ~ OrderModel.getOrderAggregateList ~ objRes:", objRes)
					let objStatus = (objRes.status) ? objRes.status : "";
					if (objStatus == STATUS_ERROR) {
						callback(null, cancelStatus);
					}
					let objResult = (objRes.result) ? objRes.result : "";
					callback(null, objResult);
				});
			},

		}, (error, response) => {
			console.log("🚀 ~ Crons ~ response:", response)
		});
	}



	/**
		 * Function for use to Send email notification
		 
		 * @return render/json
		 */
	this.sendEmailNotification = (req, res, next) => {


		let date_time = new Date();
		let currentTimeStamp = date_time.getTime();

		let conditionsObj = [
			{
				$match: {
					is_deleted: NOT_DELETED,
					is_send: DEACTIVE,
					is_active: ACTIVE,
					start_time: { $lt: currentTimeStamp }
				}
			},

			{ $sort: { _id: SORT_DESC } }
		]

		let optionObj = {
			conditions: conditionsObj,
		}

		EmailNotificationModel.getEmailNotificationAggregateList(req, res, optionObj).then(async pnResponse => {
			let responseStatus = (pnResponse.status) ? pnResponse.status : "";

			if (responseStatus == STATUS_SUCCESS) {

				let responseResult = (pnResponse.result && pnResponse.result) ? pnResponse.result : [];

				if (responseResult.length > 0) {


					let subject = "";
					let message = "";
					let userIds = "";
					let emailId = "";

					async.each(responseResult, async (emailDetails) => {

						emailId = (emailDetails._id) ? emailDetails._id : "";
						userIds = (emailDetails.user_ids) ? emailDetails.user_ids : [];
						subject = (emailDetails.subject) ? emailDetails.subject : "";
						message = (emailDetails.message) ? emailDetails.message : "";


						let fullName = "";
						let email = "";

						async.each(userIds, async (userId) => {

							let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(userId) }, fields: { 'full_name': 1, 'email': 1 } });
							let userResult = (userDetails.result) ? userDetails.result : "";
							fullName = (userResult && userResult.full_name) ? userResult.full_name : "";
							email = (userResult && userResult.email) ? userResult.email : "";


							let attachments = "";

							let emailOptions = {
								to: email,
								full_name: fullName,
								subject: subject,
								message: message,
								attachments: attachments,
							};

							await sendMailFromCron(req, res, emailOptions);

						});

						let updateData = {
							'is_send': ACTIVE,
							'modified': getUtcDate(),
						};

						let options = {
							conditions: { '_id': emailId },
							updateData: { $set: updateData }
						};


						/**update email notification */
						await EmailNotificationModel.updateEmailNotification(req, res, options);

					})

					res.send({
						status: STATUS_SUCCESS,
						result: {},
					});
				} else {
					res.send({
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.global.no_record_found"),
					});
				}

			} else {
				res.send({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.something_going_wrong_please_try_again"),
				});
			}

		});


	}



	/**
		 * Function for use to send Push Notification
		 
		 * @return render/json
		 */
	this.sendPushNotification = (req, res, next) => {


		let date_time = new Date();
		let currentTimeStamp = date_time.getTime();

		let conditionsObj = [
			{
				$match: {
					is_deleted: NOT_DELETED,
					is_send: DEACTIVE,
					is_active: ACTIVE,
					notification_type: NOTIFICATION_TYPE_PUSH_NOTIFICATION,
					start_time: { $lt: currentTimeStamp }
				}
			},

			{ $sort: { _id: SORT_DESC } }
		]

		let optionObj = {
			conditions: conditionsObj,
		}

		CustomNotificationModel.getCustomNotificationAggregateList(req, res, optionObj).then(async pnResponse => {
			let responseStatus = (pnResponse.status) ? pnResponse.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				let responseResult = (pnResponse.result && pnResponse.result) ? pnResponse.result : [];

				console.log("responseResult", responseResult);


				if (responseResult.length > 0) {

					let pnTitle = "";
					let pnBody = "";
					let userIds = "";
					let notificationId = "";

					async.each(responseResult, async (notificationDetails) => {

						notificationId = (notificationDetails._id) ? notificationDetails._id : "";
						userIds = (notificationDetails.user_ids) ? notificationDetails.user_ids : [];
						pnTitle = (notificationDetails.title) ? notificationDetails.title : "";
						pnBody = (notificationDetails.message) ? notificationDetails.message : "";


						let fullName = "";
						let deviceType = "";
						let deviceToken = "";

						async.each(userIds, async (userId) => {

							let userDetails = await RegistrationModel.getUserDetail({ conditions: { '_id': new ObjectId(userId) }, fields: { 'full_name': 1, 'device_details': 1 } });
							let userResult = (userDetails.result) ? userDetails.result : "";


							fullName = (userResult && userResult.full_name) ? userResult.full_name : "";
							deviceType = userResult.device_details?.[0]?.device_type || "ios";
							deviceToken = userResult.device_details?.[0]?.device_token || "";
							//let deviceToken = "cxvgtAxoS0bussK-4fj0MX:APA91bFz7IzhEfV_xZhBOPIBa0cI55Zqho3AOez5m7xzDDCv2XDqeTwlQChCRXLp3V-BoI9cOHx63eSNkvYd_IQ_h7-9_su0_SFnpBAZ0lCMWKXKMRmO3mI";

							if (deviceToken) {
								let messagePayloadData = {};
								let extra_parameters = {};

								let messagePayload = {
									token: deviceToken,
									notification: {
										title: pnTitle,
										body: pnBody
									},
									data: messagePayloadData,
									android: {
										priority: "high",
										notification: {
											sound: "default",
										}
									},
									apns: {
										payload: {
											aps: {
												alert: {
													title: pnTitle,
													body: pnBody
												},
												sound: "default",
												badge: 1,
												content_available: true
											}
										}
									}
								};

								firebaseAdmin.messaging().send(messagePayload)
									.then(async response => {
										let savePushNotificationData = {
											user_id: userId,
											created_role_id: SUPER_ADMIN_ROLE_ID,
											created_by: new ObjectId(ADMIN_ID),
											title: pnTitle,
											message: pnBody,
											title_descriptions: pnTitle,
											message_descriptions: pnBody,
											extra_parameters: extra_parameters,
											notification_type: PUSH_NOTIFICATION_CUSTOM_NOTIFICATION,
											device_type: deviceType,
											device_token: deviceToken,
											request: messagePayload,
											response: JSON.stringify(response),
											sentStatus: true,
											created: getUtcDate(),
											modified: getUtcDate(),
										};

										await savePNRequest(req, res, savePushNotificationData);

									});

							}
						});

						let updateData = {
							'is_send': ACTIVE,
							'modified': getUtcDate(),
						};

						let options = {
							conditions: { '_id': notificationId, 'notification_type': NOTIFICATION_TYPE_PUSH_NOTIFICATION },
							updateData: { $set: updateData }
						};

						/**update notification */
						await CustomNotificationModel.updateCustomNotification(req, res, options);

					});

					res.send({
						status: STATUS_SUCCESS,
						result: {},
					});
				}
				else {
					res.send({
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.global.no_record_found"),
					});
				}

			} else {
				res.send({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.something_going_wrong_please_try_again"),
				});
			}

		});


	}


	/**
		 * Function for use to send web Notification
		 
		 * @return render/json
		 */
	this.sendWebNotification = (req, res, next) => {

		let date_time = new Date();
		let currentTimeStamp = date_time.getTime();

		let conditionsObj = [
			{
				$match: {
					is_deleted: NOT_DELETED,
					is_send: DEACTIVE,
					is_active: ACTIVE,
					notification_type: NOTIFICATION_TYPE_WEB_NOTIFICATION,
					start_time: { $lt: currentTimeStamp }
				}
			},

			{ $sort: { _id: SORT_DESC } }
		]

		let optionObj = {
			conditions: conditionsObj,
		}

		CustomNotificationModel.getCustomNotificationAggregateList(req, res, optionObj).then(async pnResponse => {
			let responseStatus = (pnResponse.status) ? pnResponse.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				let responseResult = (pnResponse.result && pnResponse.result) ? pnResponse.result : [];

				let title = "";
				let message = "";
				let userIds = "";
				let notificationId = "";

				if (responseResult.length > 0) {

					async.each(responseResult, async (notificationDetails) => {

						notificationId = (notificationDetails._id) ? notificationDetails._id : "";
						userIds = (notificationDetails.user_ids) ? notificationDetails.user_ids : [];
						title = (notificationDetails.title) ? notificationDetails.title : "";
						message = (notificationDetails.message) ? notificationDetails.message : "";

						let notiType = NOTIFICATION_TO_CUSTOM_NOTIFICATION;
						let extraParametersObj = {};

						let saveNotificationData = {
							user_id: "",
							user_role_id: "",
							created_role_id: SUPER_ADMIN_ROLE_ID,
							created_by: new ObjectId(ADMIN_ID),
							title: title,
							message: message,
							title_descriptions: title,
							message_descriptions: message,
							parent_table_id: "",
							extra_parameters: extraParametersObj,
							notification_type: notiType,
							icon_image: NOTIFICATION_TO_CUSTOM_IMAGE,
							is_seen: DEACTIVE,
							is_read: DEACTIVE,
							created: getUtcDate(),
							modified: getUtcDate(),
						};

						/** Save notification data **/
						saveNotifications(req, res, {
							notification_data: saveNotificationData,
							notification_type: notiType,
							user_ids: userIds ? userIds : [],
							user_role_id: FRONT_ADMIN_ROLE_ID,
							only_for_user_role: false,
						})

						let updateData = {
							'is_send': ACTIVE,
							'modified': getUtcDate(),
						};
						let options = {
							conditions: { '_id': notificationId, 'notification_type': NOTIFICATION_TYPE_WEB_NOTIFICATION },
							updateData: { $set: updateData }
						};
						/**update notification */
						await CustomNotificationModel.updateCustomNotification(req, res, options);

					});

					res.send({
						status: STATUS_SUCCESS,
						result: {},
					});
				} else {
					res.send({
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.global.no_record_found"),
					});
				}

			} else {
				res.send({
					status: STATUS_ERROR,
					result: {},
					message: res.__("front.system.something_going_wrong_please_try_again"),
				});
			}

		});


	}


	/**
			 * Function for use to send web Notification
			 
			 * @return render/json
			 */
	this.sendEmailAdminLowStockQuantity = (req, res, next) => {

		let lowestProductQuantityOfStock = Number(res.locals.settings["Site.lowest_product_quantity_of_stock"]);
		let adminEmail = res.locals.settings["Site.admin_email"];
		let siteTitle = res.locals.settings["Site.site_title"];

		let conditionsObj = {
			is_deleted: NOT_DELETED,
			quantity: { $lte: lowestProductQuantityOfStock }
		};

		let optionObj = {
			conditions: conditionsObj,
		};

		ProductModel.productFindAllList(optionObj).then(async productResponse => {
			let responseStatus = (productResponse.status) ? productResponse.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				let responseResult = (productResponse.result && productResponse.result) ? productResponse.result : [];

				let srno = 1;
				if (responseResult.length > 0) {

					let tableData = '<table border="1" cellpadding="1" cellspacing="1" style="width:500px"><tbody><tr>			<th>Sr No. </td><th>Product Name </td><th>Product SKU </td><th>Quantity</th></tr>';

					async.each(responseResult, async (product) => {
						let productName = (product.product_title) ? product.product_title : "";
						let quantity = (product.quantity) ? product.quantity : "";
						let product_sku = (product.product_sku) ? product.product_sku : "";

						tableData += '<tr><td>' + srno + '</td><td>' + productName + '</td><td>' + product_sku + '</td><td>' + quantity + '</td></tr>';

						srno++;
					})

					tableData += '</tr></tbody></table>';

					let emailOptions = {
						to: adminEmail,
						action: "send_email_to_admin_lowest_stock",
						rep_array: [siteTitle, tableData],
					};
					sendMail(req, res, emailOptions);


					res.send({
						status: STATUS_SUCCESS,
						result: {},
					});


				} else {
					res.send({
						status: STATUS_ERROR,
						result: {},
						message: res.__("front.system.something_going_wrong_please_try_again"),
					});
				}
			}

		});


	}

}
module.exports = new Crons();
