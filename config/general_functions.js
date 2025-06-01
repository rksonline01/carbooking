const turf = require('@turf/turf');
const AreaModel = require("./../modules/admin/area_management/model/Area");
const OrderModel = require("./../modules/frontend/api/model/orderModel");
const UserModel = require("./../modules/frontend/api/model/userModel");
const contractsModel = require("./../modules/admin/franchise_contracts/model/contractsModel");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require("mongodb");
const async = require("async");


























/**
 * To get Available Service Provider
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return Service Providers
 */
getAvailableServiceProviders = (req, res, options) => {
	return new Promise(resolve => {

		let spResult = null;
		let areaIds = (options.area_ids) ? options.area_ids : [];
		let bookingStartDate = (options.booking_start_timestamp) ? options.booking_start_timestamp : null;
		let bookingEndDate = (options.booking_end_timestamp) ? options.booking_end_timestamp : null;
		let providerType = (options.provider_type) ? options.provider_type : null;
		let isServiceBooking = (options.is_service_booking) ? options.is_service_booking : null;
		let isStoreOrder = (options.is_store_order) ? options.is_store_order : null;

		let convertedAreaIds = areaIds.map(area => (
			new ObjectId(area.area_id)  // Convert string _id to ObjectId
		));


		if (isStoreOrder && !isServiceBooking) {

			let serviceConditions = [
				{
					$match: {
						"user_type": SERVICE_PROVIDER_USER_TYPE,
						"provider_type": providerType,
						"area_id": { $in: convertedAreaIds },
						"is_deleted": DEACTIVE,
						"status": ACTIVE
					},
				},
				{
					$project: {
						"_id": 1,
						"full_name": 1,
					}
				},
			];

			let serviceOptionObj = {
				'conditions': serviceConditions
			};

			UserModel.getAllUserList(req, res, serviceOptionObj).then(serviceProviderResponse => {

				let serviceProviderStatus = (serviceProviderResponse.status) ? serviceProviderResponse.status : "";
				if (serviceProviderStatus == STATUS_SUCCESS) {
					spResult = (serviceProviderResponse.result && serviceProviderResponse.result) ? serviceProviderResponse.result : "";
					return resolve(spResult);
				}
				else {
					return resolve(spResult);
				}
			})
		}
		else {
			let conditions = [
				{
					$match: {
						"area_ids.area_id": { $in: convertedAreaIds },
						'status': { $in: FOR_SERVICE_PROVIDERS_MY_BOOKING_STATUS },
						'booking_start_timestamp': { $lt: bookingEndDate },
						'booking_end_timestamp': { $gt: bookingStartDate },
					},
				},
				{
					$project: {
						"_id": 1,
						"status": 1,
						"service_provider_id": 1,
					}
				},
				{
					$group: {
						_id: "$service_provider_id", // Group by service_provider_id
					}
				}
			];

			let optionObj = {
				'conditions': conditions
			};

			OrderModel.getBookingAggregateList(req, res, optionObj).then(bookingResponse => {

				let responseStatus = (bookingResponse.status) ? bookingResponse.status : "";

				if (responseStatus == STATUS_SUCCESS) {
					let responseResult = (bookingResponse.result && bookingResponse.result) ? bookingResponse.result : "";
					let convertedServiceProviderIds = responseResult.map(serviceProvider => (
						new ObjectId(serviceProvider._id)  // Convert string _id to ObjectId
					));

					let serviceConditions = [
						{
							$match: {
								"_id": { $nin: convertedServiceProviderIds },
								"user_type": SERVICE_PROVIDER_USER_TYPE,
								"provider_type": providerType,
								"area_id": { $in: convertedAreaIds },
								"is_deleted": DEACTIVE,
								"status": ACTIVE
							},
						},
						{
							$project: {
								"_id": 1,
								"full_name": 1,
							}
						},
					];

					let serviceOptionObj = {
						'conditions': serviceConditions
					};

					UserModel.getAllUserList(req, res, serviceOptionObj).then(serviceProviderResponse => {

						let serviceProviderStatus = (serviceProviderResponse.status) ? serviceProviderResponse.status : "";
						if (serviceProviderStatus == STATUS_SUCCESS) {
							spResult = (serviceProviderResponse.result && serviceProviderResponse.result) ? serviceProviderResponse.result : "";
							return resolve(spResult);
						}
						else {
							return resolve(spResult);
						}
					})
				}
				else {
					return resolve(spResult);
				}
			})
		}
	});
}


/**
 * To get Available Bookings for service providers
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
getAvailableBookings = (req, res, options) => {
	return new Promise(resolve => {

		let date_time = new Date();
		let currentTimeStamp = date_time.getTime();

		let userId = (options.user_id) ? options.user_id : null;
		let areaId = (options.area_id) ? options.area_id : null;

		let availableBookingList = [];

		if (userId && areaId) {

			optionObj = {
				conditions: {
					'status': { $in: [BOOKING_STATUS_NEW] },
					$or: [{ 'booking_start_timestamp': { $gt: currentTimeStamp } }, { 'booking_start_timestamp': null }],
					'order_status': ORDER_PLACED,
					$or: [{ is_store_order: ACTIVE }, { is_service_booking: ACTIVE }],
					"area_ids.area_id": new ObjectId(areaId)
				},
			}

			OrderModel.getAllOrderList(optionObj).then(async ordersBookingListResponse => {

				let responseStatus = (ordersBookingListResponse.status) ? ordersBookingListResponse.status : "";

				if (responseStatus == STATUS_SUCCESS) {
					let ordersBookingListResult = (ordersBookingListResponse.result) ? ordersBookingListResponse.result : [];

					for (const records of ordersBookingListResult) {
						const startTimeStamp = records.booking_start_timestamp || '';
						const endTimeStamp = records.booking_end_timestamp || '';


						if (startTimeStamp && endTimeStamp) {
							let sp_conditions = {
								status: { $nin: [BOOKING_STATUS_COMPLETED, BOOKING_STATUS_CANCELLED, BOOKING_STATUS_NEW] },
								service_provider_id: new ObjectId(userId),
								'$or': [
									{ 'booking_start_timestamp': { $gte: startTimeStamp, $lte: endTimeStamp } },
									{ 'booking_end_timestamp': { $gte: startTimeStamp, $lte: endTimeStamp } },
								]
							};

							let sp_optionObj = {
								conditions: sp_conditions
							}

							let bookedOrdersBookingResponse = await OrderModel.getOrderDetail(sp_optionObj);
							let bookedOrdersBookingStatus = (bookedOrdersBookingResponse.status) ? bookedOrdersBookingResponse.status : "";
							let bookedOrdersBookingResult = (bookedOrdersBookingResponse.result) ? bookedOrdersBookingResponse.result : "";

							if (bookedOrdersBookingResult && (typeof bookedOrdersBookingResult._id !== "undefined")) {
								/* service provider is not free for this booking */
							}
							else {
								/* service provider is free for this booking */
								availableBookingList.push(records._id);
							}
						}
						else {
							availableBookingList.push(records._id);
						}
					}

					return resolve(availableBookingList);
				}
			});
		}
		else {
			return resolve(0);
		}
	});
}


/**
 * To check current Booking is available for service providers or not
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
checkIsAvailableBooking = (req, res, options) => {
	return new Promise(resolve => {

		let userId = (options.user_id) ? options.user_id : null;
		let areaId = (options.area_id) ? options.area_id : null;
		let startTimeStamp = (options.start_time_stamp) ? options.start_time_stamp : null;
		let endTimeStamp = (options.end_time_stamp) ? options.end_time_stamp : null;
		let isServiceBooking = (options.is_service_booking) ? options.is_service_booking : null;
		let isStoreOrder = (options.is_store_order) ? options.is_store_order : null;

		if (isStoreOrder && !isServiceBooking) {
			resolve({ status: true });
		}
		else {
			let sp_conditions = {
				status: { $nin: [BOOKING_STATUS_COMPLETED, BOOKING_STATUS_CANCELLED, BOOKING_STATUS_NEW] },
				order_status: ORDER_PLACED,
				service_provider_id: new ObjectId(userId),
				'$or': [
					{ 'booking_start_timestamp': { $gte: startTimeStamp, $lte: endTimeStamp } },
					{ 'booking_end_timestamp': { $gte: startTimeStamp, $lte: endTimeStamp } },
				]
			};


			let sp_optionObj = {
				conditions: sp_conditions
			}


			OrderModel.getOrderDetail(sp_optionObj).then(bookedOrdersBookingResponse => {


				let bookedOrdersBookingStatus = (bookedOrdersBookingResponse.status) ? bookedOrdersBookingResponse.status : "";
				let bookedOrdersBookingResult = (bookedOrdersBookingResponse.result) ? bookedOrdersBookingResponse.result : "";

				if (bookedOrdersBookingResult && (typeof bookedOrdersBookingResult._id !== "undefined")) {
					resolve({ status: false });
				}
				else {
					/* service provider is free for this booking */
					resolve({ status: true });
				}
			})
		}
	});
}


/**
 * To get Areas list for booking
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
getAreaIdsFromLatLong = async (req, res, options) => {
	return new Promise(async resolve => {
		optionObj = {conditions : {is_deleted: NOT_DELETED}};
		let latitude = options.latitude ? parseFloat(options.latitude) : 0;
		let longitude = options.longitude ? parseFloat(options.longitude) : 0;

		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();

		const pointToCheck = turf.point([latitude, longitude]);

		const areaListResponse = await AreaModel.getAllAreaList(req, res, optionObj);

		let responseStatus = areaListResponse.status ? areaListResponse.status : "";
		if (responseStatus === STATUS_SUCCESS) {
			let areaListResult = areaListResponse.result || [];
			let itemList = [];

			for (const records of areaListResult) {
				const coordinates = records.coordinates || '';

				let coordinatesArea = JSON.stringify(coordinates)
					.replace('""', "")
					.replace(/&#34;/g, '"');
				const jsonCoordinatesAreaArray = JSON.parse(coordinatesArea);

				const pathCoordinatesArea = jsonCoordinatesAreaArray.map(item => ({
					lat: parseFloat(item.lat),
					lng: parseFloat(item.lng)
				}));

				const polygonCoordinates = pathCoordinatesArea.map(point => [point.lat, point.lng]);
				polygonCoordinates.push([parseFloat(coordinates[0].lat), parseFloat(coordinates[0].lng)]);

				const polygon = turf.polygon([polygonCoordinates]);
				const isWithin = turf.booleanPointInPolygon(pointToCheck, polygon);

				if (isWithin) {
					let contractId = null;
					let optionCont = {
						collection: TABLE_FRANCHISE_CONTRACTS,
						conditions: { area_id: records._id, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
					};

					const response = await DbClass.getFindOne(optionCont);
					let contractData = response.result ? response.result : "";

					if (response.status === STATUS_SUCCESS && contractData) {
						contractId = contractData._id || "";
					}

					itemList.push({ area_id: records._id, contract_id: contractId, status: DEACTIVE });
				}
			}

			return resolve(itemList);
		} else {
			return resolve([]);
		}
	});
};


getAreaIdsFromLatLong___ = (req, res, options) => {
	return new Promise(async resolve => {
		optionObj = {conditions : {is_deleted: NOT_DELETED}};
		let latitude = (options.latitude) ? parseFloat(options.latitude) : 0;
		let longitude = (options.longitude) ? parseFloat(options.longitude) : 0;

		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();


		const pointToCheck = turf.point([latitude, longitude]);

		await AreaModel.getAllAreaList(req, res, optionObj).then(async areaListResponse => {
			let responseStatus = (areaListResponse.status) ? areaListResponse.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				let areaListResult = (areaListResponse.result) ? areaListResponse.result : [];
				let itemList = [];

				await areaListResult.forEach(function (records) {
					const coordinates = records.coordinates || '';

					var coordinatesArea = JSON.stringify(coordinates);
					coordinatesArea = coordinatesArea.replace('""', "");
					coordinatesArea = coordinatesArea.replace(/&#34;/g, '"');
					jsonCoordinatesAreaArray = JSON.parse(coordinatesArea);

					pathCoordinatesArea = jsonCoordinatesAreaArray.map(item => ({
						lat: parseFloat(item.lat),  // Convert lat to number
						lng: parseFloat(item.lng)   // Convert lng to number
					}));


					const polygonCoordinates = pathCoordinatesArea.map(point => [point.lat, point.lng]);
					polygonCoordinates.push([parseFloat(coordinates[0].lat), parseFloat(coordinates[0].lng)]); // Close the polygon loop

					const polygon = turf.polygon([polygonCoordinates]);

					const isWithin = turf.booleanPointInPolygon(pointToCheck, polygon);
					if (isWithin) {
						var contractId = null;
						var optionCont = {};

						optionCont = {
							collection: TABLE_FRANCHISE_CONTRACTS,
							conditions: { area_id: records._id, status: CONTRACT_STATUS_ACTIVE, end_date: { $gte: currentDateTime } },
						}

						DbClass.getFindOne(optionCont).then((response) => {
							responseStatus = response.status ? response.status : "";
							contractData = response.result ? response.result : "";

							if (responseStatus == STATUS_SUCCESS && contractData) {
								contractId = contractData._id ? contractData._id : "";
							}

							itemList.push({ area_id: records._id, contract_id: contractId, status: DEACTIVE });
						});
					}
				})

				return resolve(itemList);
			}
		});
	});
}


/**
 * To get Areas list for booking
 *
 * @param req	As Request Data
 * @param res	As Response Data
 *
 * @return boolean
 */
getAreaIdsArrayFromLatLong = (req, res, options) => {
	return new Promise(resolve => {
		optionObj = {conditions : {is_deleted: NOT_DELETED}};
		let latitude = (options.latitude) ? parseFloat(options.latitude) : 0;
		let longitude = (options.longitude) ? parseFloat(options.longitude) : 0;

		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();


		const pointToCheck = turf.point([latitude, longitude]);

		AreaModel.getAllAreaList(req, res, optionObj).then(areaListResponse => {
			let responseStatus = (areaListResponse.status) ? areaListResponse.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				let areaListResult = (areaListResponse.result) ? areaListResponse.result : [];

				let itemList = [];

				areaListResult.forEach(function (records) {
					const coordinates = records.coordinates || '';

					var coordinatesArea = JSON.stringify(coordinates);
					coordinatesArea = coordinatesArea.replace('""', "");
					coordinatesArea = coordinatesArea.replace(/&#34;/g, '"');
					jsonCoordinatesAreaArray = JSON.parse(coordinatesArea);

					pathCoordinatesArea = jsonCoordinatesAreaArray.map(item => ({
						lat: parseFloat(item.lat),  // Convert lat to number
						lng: parseFloat(item.lng)   // Convert lng to number
					}));


					const polygonCoordinates = pathCoordinatesArea.map(point => [point.lat, point.lng]);
					polygonCoordinates.push([parseFloat(coordinates[0].lat), parseFloat(coordinates[0].lng)]); // Close the polygon loop

					const polygon = turf.polygon([polygonCoordinates]);

					const isWithin = turf.booleanPointInPolygon(pointToCheck, polygon);
					if (isWithin) {
						itemList.push(records._id);
					}
				})

				return resolve(itemList);
			}
		});
	});
}


/**
 * Funcion to get active contract id from area ID and service provider id
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
getContractIdFromAreaANDProviderID = (options) => {
	return new Promise((resolve) => {
		let serviceProviderId = options.service_provider_id ? new ObjectId(options.service_provider_id) : "";
		let areaId = options.area_id ? new ObjectId(options.area_id) : "";

		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();

		let optionObj = {
			collection: TABLE_FRANCHISE_CONTRACTS,
			conditions: {
				area_id: areaId,
				status: CONTRACT_STATUS_ACTIVE,
				end_date: { $gte: currentDateTime }
			},
			service_provider_in_area: serviceProviderId
		}

		DbClass.getFindOne(optionObj).then((response) => {
			let responseStatus = response.status ? response.status : "";
			let contractData = response.result ? response.result : "";

			if (responseStatus == STATUS_SUCCESS && contractData) {
				let contractId = contractData._id ? contractData._id : "";
				let franchiseId = contractData.franchise_id ? contractData.franchise_id : "";

				let returnResponse = { contract_id: contractId, franchise_id: franchiseId }

				return resolve(returnResponse);
			}
			else {
				return resolve(0);
			}
		})
	});
}//end getContractIdFromAreaANDProviderID();


/**
 * Funcion to get All Active AreaIds From Franchise
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
getAllActiveAreaIdsFromFranchise = (options) => {
	return new Promise((resolve) => {
		let franchiseId = options.franchise_id ? new ObjectId(options.franchise_id) : "";
		let currentDateTime = new Date();
		let currentTimeStamp = currentDateTime.getTime();

		let optionObj = {
			collection: TABLE_FRANCHISE_CONTRACTS,
			conditions: {
				franchise_id: franchiseId,
				status: CONTRACT_STATUS_ACTIVE,
				end_date: { $gte: currentDateTime }
			},
		}

		DbClass.getFindAllWithoutLimit(optionObj).then((response) => {

			let responseStatus = response.status ? response.status : "";
			let contractData = response.result ? response.result : "";

			if (responseStatus == STATUS_SUCCESS && contractData) {

				let itemList = [];

				contractData.forEach(function (contract) {
					itemList.push(contract.area_id);
				})

				return resolve(itemList);
			}
			else {
				return resolve(0);
			}
		})
	});
}//end getContractIdFromAreaANDProviderID();


/**
 * Funcion to submit Review Rating
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
submitReviewRating = (req, res, options) => {
	return new Promise((resolve, reject) => {
		let rating = options.rating ? options.rating : "";
		let review = options.review ? options.review : "";
		let reviewFor = options.review_for ? options.review_for : USER_REVIEW;
		let userId = options.user_id ? new ObjectId(options.user_id) : "";
		let loginUserId = options.login_user_id ? options.login_user_id : "";
		let bookingId = options.booking_id ? new ObjectId(options.booking_id) : "";
		let bookingDetails = options.booking_details ? options.booking_details : "";

		/** Condition for booking date and time */


		let ratingOptionObj = {
			collection: TABLE_RATING,
			conditions: {
				"posted_by": loginUserId,
				"review_for": reviewFor,
				"booking_id": bookingId,
			},
		};

		DbClass.getFindOne(ratingOptionObj).then((orderResponse) => {
			let responseStatus = (orderResponse.status) ? orderResponse.status : "";
			let ratingResponseResult = (orderResponse.result) ? orderResponse.result : "";

			if (responseStatus == STATUS_ERROR) {
				let response = {
					status: STATUS_ERROR,
					result: {},
					error: true,
					message: "in error case"
				};
				return resolve(response);

			} else {


				if (ratingResponseResult) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: true,
						message: res.__("front.system.you_rating_has_already_been_submited.")
					};
					return resolve(response);
				} else {

					let option = {
						collection: TABLE_RATING,
						insertData: {
							'booking_id': bookingId,
							'user_id': userId,
							'posted_by': loginUserId,
							'rating': rating,
							'review': review,
							'booking_details': bookingDetails,
							'review_for': reviewFor,
							'status': DEACTIVE,
							'is_deleted': DEACTIVE,
							'created': getUtcDate(),
							'modified': getUtcDate()
						}
					};

					DbClass.saveInsertOne(req, res, option).then(saveResponse => {
						let responseStatus = (saveResponse.status) ? saveResponse.status : "";
						let responseResult = (saveResponse.result) ? saveResponse.result : "";
						if (responseStatus == STATUS_ERROR) {
							let response = {
								status: STATUS_ERROR,
								result: {},
								error: true,
								message: "in error case"
							};
							return resolve(response);

						} else {
							let response = {
								status: STATUS_SUCCESS,
								result: responseResult,
								error: false,
								message: ""
							};
							return resolve(response);
						}
					});
				}
			}
		})

	});
};


/**
 * Funcion to purely Amount Commission
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
purelyAmountCommission = (req, res, options) => {
	return new Promise((resolve, reject) => {
		try {
			let commissionPercentage = parseFloat(options.purely_amount_commission) || 0;
			let amount = parseFloat(options.amount) || 0;

			let purelyAmountCommission = (amount * commissionPercentage) / 100;
			let remainingAmount = amount - purelyAmountCommission;

			resolve({
				purelyAmountCommission: parseFloat(purelyAmountCommission.toFixed(2)),
				remainingAmount: parseFloat(remainingAmount.toFixed(2))
			});
		} catch (error) {
			console.error("Error in purelyAmountCommission:", error);
			reject(error);
		}
	});
};


/**
 * Funcion to provider Earning
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
providerEarning = (req, res, options) => {
	return new Promise(async (resolve, reject) => {

		try {
			let dateForBooking = options.date ? options.date : "";
			let bookingId = options.booking_id ? options.booking_id : "";
			let serviceProviderId = options.service_provider_id ? new ObjectId(options.service_provider_id) : "";
			let serviceProviderType = options.provider_type ? options.provider_type : "";

			let totalCompleteWashes = DEACTIVE;
			let sumPriceOfPackages = DEACTIVE;
			
			let currentDate = new Date(dateForBooking); 
			let nextDate = new Date(currentDate);
			nextDate.setDate(currentDate.getDate() + 1);
			nextDate = nextDate.toISOString().split('T')[0]
			
			console.log("nextDate", nextDate);
			
			let conditions = {
				service_provider_id: serviceProviderId,
				provider_type: serviceProviderType,
				status: BOOKING_STATUS_COMPLETED,
				is_service_booking: ACTIVE,
				booking_service_finished_time: {$gte: dateForBooking, $lt: nextDate }
			};
			
			
			console.log("conditions", conditions);

			if (serviceProviderType == SERVICE_PROVIDER_TYPE_BIKE_FLEET) {

				let aggConditions = [
					{ $match: conditions },
				];

				let bookingOptions = {
					conditions: aggConditions,
					collection: TABLE_ORDERS
				}

				let response = await DbClass.getAggregateResult(req, res, bookingOptions);
				let responseStatus = response.status ? response.status : "";
				
			 
				if (responseStatus == STATUS_SUCCESS) {
					
					let bookingData = response.result ? response.result : "";
					totalCompleteWashes = (bookingData.length) ? bookingData.length : DEACTIVE;

					let freeNumberWahses = Number(res.locals.settings["bike_fleet_earning.target_no_wash_for_earning"]);
					let perWashAmount = Number(res.locals.settings["bike_fleet_earning.per_wash_amount"]);

					console.log("totalCompleteWashes", totalCompleteWashes);
					console.log("freeNumberWahses", freeNumberWahses);

					if (totalCompleteWashes > freeNumberWahses) {

						let optionObj = {
							collection: TABLE_ORDERS,
							conditions: {
								_id: bookingId,
								service_provider_id: serviceProviderId,
								provider_type: serviceProviderType,
								status: BOOKING_STATUS_COMPLETED,
								is_service_booking: ACTIVE,
							}
						};

						DbClass.getFindOne(optionObj).then(async (bookingResponse) => {
							let rbookingResponseStatus = bookingResponse.status ? bookingResponse.status : "";
							let bookingResponseResult = bookingResponse.result ? bookingResponse.result : "";

							if (rbookingResponseStatus == STATUS_SUCCESS && bookingResponseResult) {

								let orderNumber = bookingResponseResult.order_number;
								let priceOfPackage = bookingResponseResult.total_price_of_packages;

								let insetDataOption = {
									"user_id": serviceProviderId,
									"provider_type": serviceProviderType,
									"date": dateForBooking,
									"earning_amount": perWashAmount,
									"order": {
										"_id": bookingId,
										"order_number": orderNumber,
										"price_of_package": priceOfPackage,
										"earning_amount": perWashAmount,
										"free_no_wahses": freeNumberWahses,
										"per_wash_amount": perWashAmount
									}
								}

								let insertOptionObj = {
									insertData: insetDataOption,
									collection: TABLE_PROVIDER_EARNING,
								};
								/**insert provider earning */
								let insertOptionRersponse = await DbClass.saveInsertOne(req, res, insertOptionObj);

								let insertOptionRersponseStatus = insertOptionRersponse.status ? insertOptionRersponse.status : "";

								if (insertOptionRersponseStatus == STATUS_SUCCESS) {
									return resolve(true);
								} 
								else {
									return resolve(false);
								}
							}
							else {
								return resolve(false);
							}
						});
					}
					else {
						return resolve(false);
					}
				}
				else {
					return resolve(false);
				}
			}
			else if (serviceProviderType == SERVICE_PROVIDER_TYPE_VAN_FLEET) {

				let aggConditions = [
					{ $match: conditions },
					{
						$project: {
							total_price_of_packages: { $toDouble: "$total_price_of_packages" },
							order_number: 1,
							_id: 1,
						}
					},
					{
						$group: {
							_id: null,
							sumPriceOfPackages: { $sum: "$total_price_of_packages" },
							ordersDetails: {
								$push: {
									_id: "$_id",
									order_number: "$order_number",
									total_price_of_packages: "$total_price_of_packages"
								}
							}
						}
					}
				];
				let bookingOptions = {
					conditions: aggConditions,
					collection: TABLE_ORDERS
				}

				let response = await DbClass.getAggregateResult(req, res, bookingOptions);
				let responseStatus = response.status ? response.status : "";

				let orderDetails = [];

				if (responseStatus == STATUS_SUCCESS) {
					let bookingDataResult = response.result ? response.result : "";
					sumPriceOfPackages = (bookingDataResult[0]) ? bookingDataResult[0].sumPriceOfPackages : DEACTIVE;
					orderDetails = (bookingDataResult[0]) ? bookingDataResult[0].ordersDetails : [];
				
					console.log("sumPriceOfPackages", sumPriceOfPackages);
					console.log("orderDetails", orderDetails);
				
				}

				let freeWashAmount = Number(res.locals.settings["van_fleet_earning.target_amount_for_earning"]);
				let perWashAmountPercentage = Number(res.locals.settings["van_fleet_earning.per_wash_amount_percentage"]);

				console.log("freeWashAmount", freeWashAmount);
				console.log("perWashAmountPercentage", perWashAmountPercentage);
 
				if (sumPriceOfPackages > freeWashAmount) {

					let optionEarning = {
						collection: TABLE_PROVIDER_EARNING,
						conditions: { user_id: serviceProviderId, provider_type: serviceProviderType, date: { $eq: dateForBooking } },
					};

					const earningResponse = await DbClass.getFindOne(optionEarning);
					let earningResponseResult = earningResponse.result ? earningResponse.result : "";

					if (earningResponse.status === STATUS_SUCCESS && earningResponseResult) {

						let optionObj = {
							collection: TABLE_ORDERS,
							conditions: {
								_id: bookingId,
								service_provider_id: serviceProviderId,
								provider_type: serviceProviderType,
								status: BOOKING_STATUS_COMPLETED,
								is_service_booking: ACTIVE
							}
						};

						DbClass.getFindOne(optionObj).then(async (bookingResponse) => {
							let rbookingResponseStatus = bookingResponse.status ? bookingResponse.status : "";
							let bookingResponseResult = bookingResponse.result ? bookingResponse.result : "";

							if (rbookingResponseStatus == STATUS_SUCCESS && bookingResponseResult) {

								let orderNumber 	= bookingResponseResult.order_number;
								let priceOfPackage 	= bookingResponseResult.total_price_of_packages;
								let earningAmount 	= formatToTwo((perWashAmountPercentage / 100) * priceOfPackage);

								let insetDataOption = {
									"user_id": serviceProviderId,
									"provider_type": serviceProviderType,
									"date": dateForBooking,
									"earning_amount": earningAmount,
									"order": {
										"_id": bookingId,
										"order_number": orderNumber,
										"price_of_package": priceOfPackage,
										"earning_amount": earningAmount,
										"free_wash_amount": freeWashAmount,
										"per_wash_amount_percentage": perWashAmountPercentage
									}
								}

								let insertOptionObj = {
									insertData: insetDataOption,
									collection: TABLE_PROVIDER_EARNING,
								};

								/**insert provider earning */
								let insertOptionRersponse = await DbClass.saveInsertOne(req, res, insertOptionObj);

								let insertOptionRersponseStatus = insertOptionRersponse.status ? insertOptionRersponse.status : "";

								if (insertOptionRersponseStatus == STATUS_SUCCESS) {
									return resolve(true);
								} else {
									return resolve(false);
								}
							}
							return resolve(false);
						});

					} 
					else {
						 
						async.each(orderDetails, async (records) => {

							let orderId = (records._id) ? records._id : '';
							let orderNumber = (records.order_number) ? records.order_number : "";
							let priceOfPackage = (records.total_price_of_packages) ? records.total_price_of_packages : DEACTIVE;
							let earningAmount = (perWashAmountPercentage / 100) * priceOfPackage;

							let insetDataOption = {
								"user_id": serviceProviderId,
								"provider_type": serviceProviderType,
								"date": dateForBooking,
								"earning_amount": earningAmount,
								"order": {
									"_id": orderId,
									"order_number": orderNumber,
									"price_of_package": priceOfPackage,
									"earning_amount": earningAmount,
									"free_wash_amount": freeWashAmount,
									"per_wash_amount_percentage": perWashAmountPercentage
								}
							}

							let insertOptionObj = {
								insertData: insetDataOption,
								collection: TABLE_PROVIDER_EARNING,
							};

							/**insert provider earning */
							let insertOptionRersponse = await DbClass.saveInsertOne(req, res, insertOptionObj);
							let insertOptionRersponseStatus = insertOptionRersponse.status ? insertOptionRersponse.status : "";

							asyncCallback(null);
						
						}, asyncErr => {
							resolve(true);
						});
					}
				} 
				else {
					return resolve(false);
				}
			}
			else {
				return resolve(false);
			}
		} 
		catch (error) {
			console.error("Error in provider Amount Calculation:", error);
			reject(error);
		}
	});
};


/**
 * Funcion to handle Purely Commission Update
 * 
 * @param req 		As Request Data
 * @param res 		As Response Data
 * @param options 	As Data object
 * 
 * @return json
 */
handlePurelyCommissionUpdate = (req, res, options) => {
	return new Promise(async (resolve, reject) => {
		try {

			let orderId 								= new ObjectId(options.orderId) || "";
			let franchiseId 							= new ObjectId(options.franchiseId) || "";
			let contractId 								= new ObjectId(options.contractId) || "";
			let purelyAmountCommissionStorePercentage 	= options.purelyAmountCommissionStorePercentage || "";
			let purelyAmountCommissionServicePercentage = options.purelyAmountCommissionServicePercentage || "";
			let totalPurelyAmountCommissionAmount 		= 0;
			let totalRemainingAmount 					= 0;
			let packagePurelyAmountCommissionAmount 	= 0;
			let packageRemainingAmount 					= 0;
			let productPurelyAmountCommissionAmount 	= 0;
			let productRemainingAmount 					= 0;

			let bookingOptionObj = {
				conditions: {
					_id: orderId,
					status: BOOKING_STATUS_COMPLETED,
				},
				fields: {
					_id: 1, user_id: 1, order_number: 1,
					is_service_booking: 1, is_store_order: 1,
					total_price_of_packages: 1, total_price_of_products: 1,
					service_provider_id: 1
				}
			};

			let orderBookingResponse = await OrderModel.getOrderBookingDetail(bookingOptionObj);
			if (orderBookingResponse.status !== STATUS_SUCCESS) return resolve();

			let booking = orderBookingResponse.result || {};
			let isServiceOrder = booking.is_service_booking || false;
			let isStoreOrder = booking.is_store_order || false;
			let packageTotal = booking.total_price_of_packages || 0;
			let productTotal = booking.total_price_of_products || 0;

			if (isServiceOrder) {
				let packageCommissionObj = await purelyAmountCommission(req, res, {
					amount: packageTotal,
					purely_amount_commission: purelyAmountCommissionServicePercentage
				});
				packagePurelyAmountCommissionAmount = packageCommissionObj.purelyAmountCommission;
				packageRemainingAmount = packageCommissionObj.remainingAmount;
			}

			if (isStoreOrder) {
				let productCommissionObj = await purelyAmountCommission(req, res, {
					amount: productTotal,
					purely_amount_commission: purelyAmountCommissionStorePercentage
				});
				productPurelyAmountCommissionAmount = productCommissionObj.purelyAmountCommission;
				productRemainingAmount 				= productCommissionObj.remainingAmount;
			}

			totalPurelyAmountCommissionAmount 	= packagePurelyAmountCommissionAmount + productPurelyAmountCommissionAmount;
			totalRemainingAmount 				= packageRemainingAmount + productRemainingAmount;

			await OrderModel.updateOrderBooking(req, res, {
				conditions: { _id: orderId },
				updateData: {
					$set: {
						total_purely_amount_commission	: totalPurelyAmountCommissionAmount,
						total_remaining_amount			: totalRemainingAmount,
						package_purely_amount_commission: packagePurelyAmountCommissionAmount,
						package_remaining_amount		: packageRemainingAmount,
						product_purely_amount_commission: productPurelyAmountCommissionAmount,
						product_remaining_amount		: productRemainingAmount,
						modified						: getUtcDate()
					}
				}
			});

			// Washing Commission
			const now = new Date();
			const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
			const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

			let washingCommissionResponse = await OrderModel.getWashingCommissionDetail({
				conditions: {
					created: { $gte: startOfToday, $lte: endOfToday },
					franchise_id: new ObjectId(franchiseId)
				}
			});

			let addToSetObject = {
				order_id						: orderId,
				purely_store_Percentage			: purelyAmountCommissionStorePercentage,
				purely_service_Percentage		: purelyAmountCommissionServicePercentage,
				total_purely_amount_commission	: totalPurelyAmountCommissionAmount,
				total_remaining_amount			: totalRemainingAmount,
				package_purely_amount_commission: packagePurelyAmountCommissionAmount,
				package_remaining_amount		: packageRemainingAmount,
				product_purely_amount_commission: productPurelyAmountCommissionAmount,
				product_remaining_amount		: productRemainingAmount,
			};

			if (washingCommissionResponse.status === STATUS_SUCCESS && washingCommissionResponse.result) {
				let wash = washingCommissionResponse.result || {};
				let washId = wash._id ? new ObjectId(wash._id) : null;

				await OrderModel.updateWashingCommission(req, res, {
					conditions: {
						franchise_id: new ObjectId(franchiseId),
						...(washId ? { _id: washId } : {})
					},
					updateData: {
						$set: {
							modified: getUtcDate(),
							total_purely_amount_commission: (wash.total_purely_amount_commission || 0) + totalPurelyAmountCommissionAmount,
							total_remaining_amount: (wash.total_remaining_amount || 0) + totalRemainingAmount,
							total_package_purely_amount: (wash.total_package_purely_amount || 0) + packagePurelyAmountCommissionAmount,
							total_package_remaining_amount: (wash.total_package_remaining_amount || 0) + packageRemainingAmount,
							total_product_purely_amount: (wash.total_product_purely_amount || 0) + productPurelyAmountCommissionAmount,
							total_product_remaining_amount: (wash.total_product_remaining_amount || 0) + productRemainingAmount,
						},
						$push: {
							order_ids: addToSetObject
						}
					}
				});
			} else {
				await OrderModel.saveWashingCommission(req, res, {
					insertData: {
						franchise_id					: franchiseId,
						contract_id						: contractId,
						total_purely_amount_commission	: totalPurelyAmountCommissionAmount,
						total_remaining_amount			: totalRemainingAmount,
						total_package_purely_amount		: packagePurelyAmountCommissionAmount,
						total_package_remaining_amount	: packageRemainingAmount,
						total_product_purely_amount		: productPurelyAmountCommissionAmount,
						total_product_remaining_amount	: productRemainingAmount,
						order_ids						: [addToSetObject],
						created							: getUtcDate(),
						modified						: getUtcDate()
					}
				});
			}

			resolve(); // Done
		} catch (error) {
			console.error("❌ Error in handlePurelyCommissionUpdate:", error);
			reject(error);
		}
	});
};




getUserName = (userId) => {
	return new Promise((resolve) => {
		let optionObj = {
			collection: TABLE_USERS,
			conditions: { _id: new ObjectId(userId) },
			projection: { full_name: 1 }
		}

		DbClass.getFindOne(optionObj).then((response) => {
			let responseStatus = response.status ? response.status : "";
			let userData = response.result ? response.result : "";

			if (responseStatus === STATUS_SUCCESS && userData && userData.full_name) {
				resolve(userData.full_name);
			} else {
				resolve();
			}
		})
	});
};