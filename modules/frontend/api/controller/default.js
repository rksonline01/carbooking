var crypto = require('crypto');
var async = require('async');
var moment = require('moment');
const asyncParallel = require("async/parallel");
const { ObjectId } = require('mongodb');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const CmsModel = require("../../../admin/cms/model/Cms");
const faqModel = require("../../../admin/faq/model/Faq");
const AreaModel = require("../../../admin/area_management/model/Area");
const BlockModel = require("../../../admin/block/model/Block");
const NotificationModel = require("../model/notificationModel");
const SliderModel = require("../../../admin/slider/model/sliderModel");
const popupAdsModel = require("../../../admin/popup_ads/model/popupAdsModel");

const Cart = require("../controller/cart");
const Order = require("../controller/order");

const axios = require('axios');
 
 

function Default() {

	/**
	 *  Function for get settings list
	 */
	this.getGlobalSettings = function (req, res, next, callback) {
		var settings = db.collection(TABLE_SETTINGS);
		let type = req.body.type ? req.body.type : "Social";
		let optionObj = {
			conditions: { "type": { $in: [type] } },
			collection: TABLE_SETTINGS,
			fields: { key_value: 1, value: 1 },
		}
		DbClass.getFindAllWithoutLimit(optionObj).then(settingRes => {

			let result = (settingRes.result) ? settingRes.result : "";
			let status = (settingRes.status) ? settingRes.status : "";
			if (status == STATUS_ERROR) {
				var finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: [],
						message: res.__("api.global.no_record_found")
					}
				};
				return returnApiResult(req, res, finalResponse);
			}

			if (result.length > 0) {
				var dataJson = {};
				for (var i = 0; i < result.length; i++) {
					dataJson[result[i]['key_value']] = result[i]['value']
				}
				var finalResponse = {
					'data': {
						status: STATUS_SUCCESS,
						result: dataJson,
						message: "",
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
		});

	};


	/**
	 * Function for getting CMS Page Detail
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getPageDetails = function (req, res, next) {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let pageSlug = req.body.page_slug ? req.body.page_slug : "";

		let finalResponse = {};

		if (pageSlug == "") {

			finalResponse = {
				'data': {
					status: STATUS_ERROR_INVALID_ACCESS,
					result: [],
					message: res.__("api.global.parameter_missing")
				}
			};
			return returnApiResult(req, res, finalResponse);

		} else {

			/** Get Cms details **/
			let conditionsObj = { slug: pageSlug };
			let optionObj = {
				conditions: conditionsObj,
				fields: {
					id: 1,
					name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".name", ''] }, then: "$pages_descriptions." + langCode + ".name", else: "$name" } },
					title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".title", ''] }, then: "$pages_descriptions." + langCode + ".title", else: "$title" } },
					sub_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".sub_title", ''] }, then: "$pages_descriptions." + langCode + ".sub_title", else: "$sub_title" } },
					body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$body" } },
					meta_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".meta_title", ''] }, then: "$pages_descriptions." + langCode + ".meta_title", else: "$meta_title" } },
					meta_description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".meta_description", ''] }, then: "$pages_descriptions." + langCode + ".meta_description", else: "$meta_description" } },
					meta_keyword: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".meta_keyword", ''] }, then: "$pages_descriptions." + langCode + ".meta_keyword", else: "$meta_keyword" } },
					modified: 1,
					banner_image: 1,
					content_image: 1,
					pages_descriptions: 1
				},
			}

			asyncParallel({
				cms_details: (callback) => {
					CmsModel.getCmsFindOne(optionObj).then(cmsRes => {
						callback(null, cmsRes);
					});

				},
			}, function (err, response) {

				if (err) return next(err);

				if (!response || !response.cms_details || response.cms_details.status != STATUS_SUCCESS || !response.cms_details.result) {
					finalResponse = {
						'data': {
							status: STATUS_ERROR,
							result: [],
							seo_content: {},
							image_url: CMS_FILE_URL,
							message: ""
						}
					}

					return returnApiResult(req, res, finalResponse)
				}

				let cmsContent = response.cms_details.result || {};

				let seoContent = {
					meta_title: cmsContent.meta_title,
					meta_description: cmsContent.meta_description,
					meta_keyword: cmsContent.meta_keyword

				}
				finalResponse = {
					'data': {
						status: STATUS_SUCCESS,
						result: cmsContent,
						seo_content: seoContent,
						image_url: CMS_FILE_URL,
						cms_content_image_url: CMS_CONTENT_URL,
						message: "",
					}
				};
				return returnApiResult(req, res, finalResponse);
			});

		}
	}


	/**
	 * Function for getting Block Detail
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getBlockDetails = async function (req, res, next) {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let blockSlug = req.body.block_slug ? req.body.block_slug : "";

		let finalResponse = {};

		if (blockSlug == "") {

			finalResponse = {
				'data': {
					status: STATUS_ERROR_INVALID_ACCESS,
					result: [],
					message: res.__("api.global.parameter_missing")
				}
			};
			return returnApiResult(req, res, finalResponse);

		}
		else {
			/** Get block details **/
			let conditionsObj = { block_slug: blockSlug };
			let optionObj = {
				conditions: conditionsObj,
				fields: { _id: 1, block_name: 1, page_name: 1, description: 1, modified: 1, blocks_descriptions: 1 },
			}
			BlockModel.getBlockFindOne(optionObj).then(blockRes => {
				let blockData = (blockRes.result) ? blockRes.result : "";
				if (blockData && Object.keys(blockData).length > 0) {
					blockData['block_name'] = (blockData.blocks_descriptions[langCode].block_name) ? blockData.blocks_descriptions[langCode].block_name : blockData.block_name;
					blockData['description'] = (blockData.blocks_descriptions[langCode].description) ? blockData.blocks_descriptions[langCode].description : blockData.description;

					delete blockData.blocks_descriptions;
					finalResponse = {
						'data': {
							status: STATUS_SUCCESS,
							result: blockData,
							message: "",
						}
					};
					return returnApiResult(req, res, finalResponse);
				} else {
					finalResponse = {
						'data': {
							status: STATUS_ERROR,
							result: {},
							message: ""
						}
					}

					return returnApiResult(req, res, finalResponse)
				}
			})
		}
	}


	/**
	 * Function for getting faq list
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getFAQList = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let faqCategory = (req.body.faq_category) ? new ObjectId(req.body.faq_category) : "";
		let page = (req.body.page) ? parseInt(req.body.page) : 1;
		let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
		let skip = (limit * page) - limit;
		limit = limit;
		let commonConditions = {
			is_active: ACTIVE
		}

		let sortConditions = {
			display_priority: 1
		}

		if (faqCategory != "") {
			commonConditions['faq_category_id'] = faqCategory
		}

		let conditions = [
			{
				$facet: {
					"faq_list": [
						{
							$lookup: {
								"from": TABLE_MASTERS,
								"localField": "faq_category_id",
								"foreignField": "_id",
								"as": "master_detail"
							}
						},
						{
							$project: {
								_id: 1,
								question: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".question", ''] }, then: "$pages_descriptions." + langCode + ".question", else: "$question" } },
								answer: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".answer", ''] }, then: "$pages_descriptions." + langCode + ".answer", else: "$answer" } },
								modified: 1,
								is_active: 1,
								display_priority: 1,
								faq_category_id: 1,
								faq_category_name: { "$arrayElemAt": ["$master_detail.name", 0] }
							}
						},
						{ $match: commonConditions },
						{ $sort: sortConditions },
						{ $skip: skip },
						{ $limit: limit },
					],
					"faq_all_count": [
						{
							$group: {
								_id: null,
								count: { $count: {} }
							}
						},
						{
							$project: {
								_id: 0, count: 1
							}
						}
					],
					"faq_filter_count": [
						{
							$group: {
								_id: null,
								count: { $count: {} }
							}
						},
						{
							$project: {
								_id: 0, count: 1
							}
						}
					]
				}
			}
		];

		let optionObj = {
			conditions: conditions
		}

		faqModel.getAggregateFaqList(req, res, optionObj).then(faqResponse => {

			let faqResult = faqResponse.result[0] ? faqResponse.result[0] : {}
			let records = faqResult.faq_list ? faqResult.faq_list : []

			let totalRecord = faqResult.faq_all_count[0] ? faqResult.faq_all_count[0].count : []

			/**send success response */
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: records,
					total_record: totalRecord,
					limit: limit,
					skip: skip,
					current_page: page,
					total_page: Math.ceil(totalRecord / limit),
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);

		})
	}//end getFAQList();


	/**
	 * Function will return data of About us cms page. 
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getAboutUsCMS = (req, res, next) => {

		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

		/** Get Cms details **/
		let conditionsObj = { slug: "about-us" };

		let aggregateCondition = [
			{
				$match: conditionsObj
			},
			{
				$lookup: {
					from: TABLE_BANNER,
					let: { page: "$page" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ["$page", "about-us"] }]
								}
							}
						}
					],
					as: "bannerDetails"
				}
			},
			{
				$project: {
					_id: 1,
					meta_title: 1,
					meta_description: 1,
					meta_keyword: 1,
					name: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".name", ''] }, then: "$pages_descriptions." + langCode + ".name", else: "$name" } },
					body: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".body", ''] }, then: "$pages_descriptions." + langCode + ".body", else: "$body" } },
					pages_descriptions: 1,
					status: 1,
					modified: 1,
					banner_title: { $arrayElemAt: ["$bannerDetails.banner_title", 0] },
					banner_description: { $arrayElemAt: ["$bannerDetails.description", 0] },
				}
			}
		]


		let optionObj = {
			conditions: aggregateCondition
		}

		let finalResponse = {};

		CmsModel.getAggregateCMSList(req, res, optionObj).then(cmsRes => {

			let result = (cmsRes.result[0]) ? cmsRes.result[0] : "";


			if (!result) {

				finalResponse = {
					'data': {
						status: STATUS_ERROR,
						result: [],
						message: res.__("Parameter Missing")
					}
				};
				return returnApiResult(req, res, finalResponse);
			}
			let seoContent = {
				meta_title: result.pages_descriptions[langCode].meta_title,
				meta_description: result.pages_descriptions[langCode].meta_description,
				meta_keyword: result.pages_descriptions[langCode].meta_keyword

			}
			finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: result,
					seo_content: seoContent,
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);

		});

	}//end getAboutUsCMS();


	/**
	 * Function for home page data
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getHomePageDetails = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let loginUserData = (req.user_data) ? req.user_data : "";
		let userId = (loginUserData._id) ? new ObjectId(loginUserData._id) : '';

		asyncParallel({
			cartypes_list: (callback) => {
				callback(null, CAR_TYPE_DROPDOWN);
			},
			notification_count: (callback) => {
				let options = { conditions: { user_id: userId, is_read: DEACTIVE } }
				NotificationModel.getNotificationsCount(options).then(async (notificationsCountRes) => {
					let notificationsCount = (notificationsCountRes.result) ? notificationsCountRes.result : 0;
					callback(null, notificationsCount);
				});
			},
		}, function (err, response) {
			if (err) return next(err);
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					cartypes_list: response.cartypes_list || [],
					notification_count: response.notification_count || 0,
					system_image_url: SYSTEM_IMAGE_URL,
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);
		});
	}// end getHomePageDetails();


	/**
	 * Function for getting  Slider List
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getSliderList = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let page = (req.body.page) ? parseInt(req.body.page) : 1;
		let limit = 10000; //(req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
		let skip = (limit * page) - limit;
		limit = limit;


		const currentDate = new Date();

		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
		const day = String(currentDate.getDate()).padStart(2, '0');
		const hours = String(currentDate.getHours()).padStart(2, '0');
		const minutes = String(currentDate.getMinutes()).padStart(2, '0');

		const current_time = `${year}-${month}-${day} ${hours}:${minutes}`;

		let commonConditions = {
			is_active: ACTIVE,
			start_time: { $lt: current_time },  // Current time is greater than start_time
			end_time: { $gt: current_time }     // Current time is less than end_time
		}

		let sortConditions = {
			order_number: 1
		}

		let conditions = [
			{
				$facet: {
					"slider_list": [
						{
							$project: {
								_id: 1,
								title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".title", ''] }, then: "$pages_descriptions." + langCode + ".title", else: "$title" } },
								sub_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".sub_title", ''] }, then: "$pages_descriptions." + langCode + ".sub_title", else: "$sub_title" } },
								label_text: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".label_text", ''] }, then: "$pages_descriptions." + langCode + ".label_text", else: "$label_text" } },
								modified: 1,
								is_active: 1,
								redirect_link: 1,
								order_number: 1,
								image: 1,
								start_time: 1,
								end_time: 1,
							}
						},
						{ $match: commonConditions },
						{ $sort: sortConditions },
						{ $skip: skip },
						{ $limit: limit },
					],
					"slider_all_count": [
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
							$project: {
								_id: 0, count: 1
							}
						}
					]
				}
			}
		];

		let optionObj = {
			conditions: conditions
		}



		SliderModel.getAggregateSliderList(req, res, optionObj).then(faqResponse => {

			let faqResult = faqResponse.result[0] ? faqResponse.result[0] : {}
			let records = faqResult.slider_list ? faqResult.slider_list : []

			let totalRecord = faqResult.slider_all_count[0] ? faqResult.slider_all_count[0].count : []

			/**send success response */
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: records,
					image_url: SLIDERS_URL,
					total_record: totalRecord,
					limit: limit,
					skip: skip,
					current_page: page,
					total_page: Math.ceil(totalRecord / limit),
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);

		})
	}//end getSliderList();


	/**
	 * Function for getting  Popup Ads List
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getPopupAdsList = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let page = (req.body.page) ? parseInt(req.body.page) : 1;
		let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
		let skip = (limit * page) - limit;
		limit = limit;


		const currentDate = new Date();

		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
		const day = String(currentDate.getDate()).padStart(2, '0');
		const hours = String(currentDate.getHours()).padStart(2, '0');
		const minutes = String(currentDate.getMinutes()).padStart(2, '0');

		const current_time = `${year}-${month}-${day} ${hours}:${minutes}`;

		let commonConditions = {
			is_active: ACTIVE,
			start_time: { $lt: current_time },  // Current time is greater than start_time
			end_time: { $gt: current_time }     // Current time is less than end_time
		}

		let sortConditions = {
			order_number: 1
		}

		let conditions = [
			{
				$facet: {
					"popup_ads_list": [
						{
							$project: {
								_id: 1,
								title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".title", ''] }, then: "$pages_descriptions." + langCode + ".title", else: "$title" } },
								content: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".content", ''] }, then: "$pages_descriptions." + langCode + ".content", else: "$content" } },
								modified: 1,
								is_active: 1,
								redirect_link: 1,
								order_number: 1,
								image: 1,
								start_time: 1,
								end_time: 1,
								call_to_action: 1
							}
						},
						{ $match: commonConditions },
						{ $sort: sortConditions },
						{ $skip: skip },
						{ $limit: limit },
					],
					"popup_ads_all_count": [
						{
							$group: {
								_id: null,
								count: { $count: {} }
							}
						},
						{
							$project: {
								_id: 0, count: 1
							}
						}
					],
					"popup_ads_filter_count": [
						{
							$group: {
								_id: null,
								count: { $count: {} }
							}
						},
						{
							$project: {
								_id: 0, count: 1
							}
						}
					]
				}
			}
		];

		let optionObj = {
			conditions: conditions
		}


		popupAdsModel.getAggregatePopupAdsList(req, res, optionObj).then(faqResponse => {

			let faqResult = faqResponse.result[0] ? faqResponse.result[0] : {}
			let records = faqResult.popup_ads_list ? faqResult.popup_ads_list : []

			let totalRecord = faqResult.popup_ads_all_count[0] ? faqResult.popup_ads_all_count[0].count : []

			/**send success response */
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: records,
					total_record: totalRecord,
					limit: limit,
					skip: skip,
					current_page: page,
					total_page: Math.ceil(totalRecord / limit),
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);

		})
	}//end getPopupAdsList();


	/**
	 * Function for getting  area List
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getAreaList = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let page = (req.body.page) ? parseInt(req.body.page) : 1;
		let limit = (req.body.limit) ? parseInt(req.body.limit) : FRONT_LISTING_LIMIT;
		let skip = (limit * page) - limit;
		limit = limit;
		let commonConditions = {
			conditions : {status: ACTIVE},
		}			 
		AreaModel.getAllAreaList(req, res, commonConditions).then(areaResponse => {

			let areaResult = areaResponse.result ? areaResponse.result : {}
			/**send success response */
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: areaResult,
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);

		})
	}//end getAreaList();

 
 
getData = async (endpoint, data) => {
	const API_URL = WEBSITE_URL + 'api';	
	try {
		const response = await axios.post(`${API_URL}/${endpoint}`, data, {
			headers: { "Content-Type": "application/json" }
		});

		return response.data; // ✅ Return response
	} 
	catch (error) {
		throw error; // ✅ Ensure error is propagated
	}
};

this.createBooking = async (req, res) => {
	try {
		req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
		const {slug, products, package_id, user_address, booking_date, booking_time, subscription_id, quantity} = req.body;
		 
		if(products){
			for (const product of products) {
				const cartData = {
					req: Buffer.from(JSON.stringify({
						data: {
							slug: slug,
							product_id: product.product_id,
							quantity: product.quantity,
						}
					})).toString("base64"),  // Convert to Base64
					api_type: "web",
					lang_code: "en",
					device_type: "desktop",
					debug_json_view: 1
				};
		
				const response = await getData("add-to-cart", cartData);
				if(response?.response?.status == 'error'){
					return res.status(400).json(response);
				}
			}
		}
		
		if(package_id){
			const packageData = {
				req: Buffer.from(JSON.stringify({
					data: {
						slug: slug,
						package_id: package_id,
                        quantity: quantity,
					}
				})).toString("base64"),  // Convert to Base64
				api_type: "web",
				lang_code: "en",
				device_type: "desktop",
				debug_json_view: 1
			};
	
			const packageResponse = await getData("add-package-to-cart", packageData);
			if(packageResponse?.response?.status == 'error'){
				return res.status(400).json(packageResponse);
			}
		}

		if(subscription_id){
			const subscriptionData = {
				req: Buffer.from(JSON.stringify({
					data: {
						slug: slug,
						subscription_id: subscription_id,
                        quantity: quantity,
					}
				})).toString("base64"),  // Convert to Base64
				api_type: "web",
				lang_code: "en",
				device_type: "desktop",
				debug_json_view: 1
			};
	
			const subscriptionResponse = await getData("add-subscription-to-cart", subscriptionData);

			if(subscriptionResponse?.response?.status == 'error'){
				return res.status(400).json(subscriptionResponse);
			}
		}

		const saveData = {
			req: Buffer.from(JSON.stringify({
				data: {
					slug: slug,
					user_address: user_address,
					my_subscription_id: subscription_id,
					booking_date: booking_date,
					booking_time: booking_time
				}
			})).toString("base64"),  // Convert to Base64
			api_type: "web",
			lang_code: "en",
			device_type: "desktop",
			debug_json_view: 1
		};

		const saveOrderResponse = await getData("save-order", saveData);
		if(saveOrderResponse?.response?.status == 'success'){
			const order_number = saveOrderResponse?.response?.result?.order_number
			const checkoutData = {
				req: Buffer.from(JSON.stringify({
					data: {
						slug: slug,
						order_number: order_number,
						pay_from_wallet: 1,
					}
				})).toString("base64"),  // Convert to Base64
				api_type: "web",
				lang_code: "en",
				device_type: "desktop",
				debug_json_view: 1
			};
	
			const checkoutResponse = await getData("checkout-order", checkoutData);
			if(checkoutResponse?.response?.status == 'success'){
				return res.status(200).json({
					checkoutResponse: checkoutResponse, 
					order_number: order_number
				});
			}
		}
	} catch (error) {
		return res.status(500).json({ error: "Error processing booking", details: error.message });
	}
};



	/**
	 * Function for getting  area List
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As Callback argument to the middleware function
	 * @return json
	 */
	this.getAreaListByLatLong = async (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let latitude = (req.body.latitude) ? req.body.latitude : null;
        let longitude = (req.body.longitude) ? req.body.longitude : null;
		let finalResponse = {};
		
		let latLongOptions = { latitude: latitude, longitude: longitude };
		let areaIds = await getAreaIdsArrayFromLatLong(req, res, latLongOptions);

		if(areaIds.length){
			finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: areaIds,
					message: "",
				}
			};
		}
		else{
		 	finalResponse = {
				'data': {
					status: STATUS_ERROR,
					result: "",
					message: res.__("front.system.location_outside_service_area"),
				}
			};
		}
		return returnApiResult(req, res, finalResponse);
	}//end getAreaList();

 
}
module.exports = new Default();