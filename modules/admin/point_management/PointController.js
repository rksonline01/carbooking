const PointModel = require("./model/points");
const asyncParallel 		 = require('async/parallel');
const asyncEach = require("async/each");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const { errorMonitor } = require("events");

const OrderModel = require('../../frontend/api/model/orderModel');
const UserModel = require('../users/model/user');

function Points() {

	POINTS = this;

	let exportPointCommonConditions 	= {};

	/**
	 * Function for get points list of users
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getUserPointsList = async (req, res) => {
		let userId	=  (req.query.user_id)		  ? new ObjectId(req.query.user_id)	:"";

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
				};

				exportPointCommonConditions = dataTableConfig.conditions;

				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {
							if (formdata.name == "from_date" && formdata.value != "") {
								fromDate = formdata.value;
							} else if (formdata.name == "to_date" && formdata.value != "") {
								toDate = formdata.value;
							}else if (formdata.name == "customer" && formdata.value != "") {
								dataTableConfig.conditions['user_id'] = new ObjectId(formdata.value);
							}else if (formdata.name == "transaction_reason" && formdata.value != "") {
								dataTableConfig.conditions['transaction_reason'] = parseInt(formdata.value);
							}   
							else {
								dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
							}
						}
					});

					if (fromDate != "" && toDate != "") {
						dataTableConfig.conditions["created"] = {
							$gte: newDate(fromDate),
							$lte: newDate(toDate),
						}
					}
				}

				if(userId){
					dataTableConfig.conditions['user_id'] = userId;
				}
				
				
				let totalEarnedPointCond = dataTableConfig.conditions;
				//totalEarnedPointCond.type	=	POINT_TYPE_EARNED;
					
				let totalRedeemedPointCond = dataTableConfig.conditions;
				//totalRedeemedPointCond.type	=	POINT_TYPE_REDEEM;	

				let conditions = [{
					$facet: {
						"point_list": [
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
								}
							},
							{
							$project: {
								_id			: 1,
								points		: 1,
								user_id		: 1,
								order_id	: 1,
								is_redeem	: 1,
								note : 1,
								message :1,
								type : 1,
								transaction_reason : 1,
								total_user_points		: 1,
								total_selling_amount	: 1,
								total_balance_for_points: 1,
								total_amount_for_points	: 1,
								total_redeem_points		: 1,
								total_redeem_amount		: 1,
								created			: 1,
								modified		: 1,
								order_number	: 1,
								customer_name 	: 1, 
								customer_phone 	: 1,
							}
							},
							{ $match: dataTableConfig.conditions },
							{ $sort: dataTableConfig.sort_conditions },
							{ $skip: skip },
							{ $limit: limit }
						],
						"all_count": [
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
						"filter_count": [
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
								}
							},
							{
								$lookup: {
									from: TABLE_ORDERS,
									localField: "order_id", // Using franchise_id from TABLE_FRANCHISE_CONTRACTS
									foreignField: "_id", // Matching with _id in TABLE_USERS
									as: "order_detail"
								}
								},
							{
							$project: {
								_id: 1,
								points: 1,
								user_id: 1,
								order_id: 1,
								is_redeem: 1,
								note : 1,
								message :1,
								type : 1,
								transaction_reason : 1,
								total_selling_amount: 1,
								total_balance_for_points: 1,
								total_amount_for_points: 1,
								total_redeem_points: 1,
								total_redeem_amount: 1,
								created: 1,
								modified: 1,
								order_number: { $arrayElemAt: ["$order_detail.order_number", 0] }
							}
							},
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
						],
						
						"total_earned_points": [
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
								}
							},
							{ $match: {
									...dataTableConfig.conditions,
									type: POINT_TYPE_EARNED
								} 
							},
							{
								$group: {
									_id: null,
									total_points: { $sum: "$points" }
								}
							},
							{
								$project: { _id: 0, total_points: 1 }
							}
						],
						
						"total_redeemed_points": [
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
								}
							},
							{ $match: {
									...dataTableConfig.conditions,
									type: POINT_TYPE_REDEEM
								} 
							},
							{
								$group: {
									_id: null,
									total_points: { $sum: "$total_redeem_points" }
								}
							},
							{
								$project: { _id: 0, total_points: 1 }
							}
						],
						
						"total_redeemed_amount": [
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
								}
							},
							{ $match: {
									...dataTableConfig.conditions,
									type: POINT_TYPE_REDEEM
								} 
							},
							{
								$group: {
									_id: null,
									total_redeem_amount: { $sum: "$total_redeem_amount" }
								}
							},
							{
								$project: { _id: 0, total_redeem_amount: 1 }
							}
						],
						
						}
					}
				];


				let optionObj = {
					conditions: conditions
				}

				PointModel.getPointsAggregateList(req, res, optionObj).then(userResponse => {
					let responseStatus = (userResponse.status) ? userResponse.status : "";
					let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
					
					let point_list = (responseResult && responseResult.point_list) ? responseResult.point_list : [];
					
					let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;

					let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
					
					
					let totalEarnedPoints = (responseResult && responseResult.total_earned_points && responseResult.total_earned_points[0] && responseResult.total_earned_points[0]["total_points"]) ? responseResult.total_earned_points[0]["total_points"] : DEACTIVE;
					
					let totalRedeemedPoints = (responseResult && responseResult.total_redeemed_points && responseResult.total_redeemed_points[0] && responseResult.total_redeemed_points[0]["total_points"]) ? responseResult.total_redeemed_points[0]["total_points"] : DEACTIVE;
					
					let totalRedeemedAmount = (responseResult && responseResult.total_redeemed_amount && responseResult.total_redeemed_amount[0] && responseResult.total_redeemed_amount[0]["total_redeem_amount"]) ? responseResult.total_redeemed_amount[0]["total_redeem_amount"] : DEACTIVE;
					 
					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: point_list,
						recordsTotal: all_count,
						recordsFiltered: filter_count,
						totalEarnedPoints: totalEarnedPoints,
						totalRedeemedPoints: totalRedeemedPoints,
						totalRedeemedAmount: displayPrice(totalRedeemedAmount)
					});
				})
			});
		}
		else {
			const options = {
				collection: TABLE_USERS,
				conditions: [
					{ $match: { _id: userId } },
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
				DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {}),
			]);


			let dropOptions = {
				collections: [
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name"],
						conditions: { is_deleted: NOT_DELETED, user_role_id: FRONT_ADMIN_ROLE_ID, user_type : CUSTOMER_USER_TYPE  },
						...(userId && {selected : [userId]})
					},
				]
			};
	
			getDropdownList(req, res, dropOptions).then(responseData => {
				req.breadcrumbs(BREADCRUMBS["admin/points/list"]);
				res.render("list", {
					user_id: userId,
					user_details : userDetails,
					customer_list : (responseData.final_html_data && responseData.final_html_data['0']) ? responseData.final_html_data['0'] : ''
				});
			})
		}
	};//End getUserPointsList()

	/**
     * Function for adding points for user
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addPoint = (req, res) => {
        let userId	= (req.query.user_id)		? 	new ObjectId(req.query.user_id)	:"";
        let adminId = (req?.session?.user?._id) ? new ObjectId(req.session.user._id) : "";

        if (isPost(req)) {
            let customer = req.body.customer ? new ObjectId(req.body.customer) : '';
            let point 	 = req.body.point ? parseInt(req.body.point) : '';
            let note 	 = req.body.note ? req.body.note.trim() : '';
            // let transaction_reason = req.body.transaction_reason ? Number(req.body.transaction_reason) : '';

            let options = {
                collection : TABLE_USERS,
                conditions : { _id : customer},
            }


            DbClass.getFindOne(options).then((response)=>{
                let userData = (response?.result) || {}
                let userPoints =  (userData?.total_points) ? userData.total_points : '';

                let totalUserPoints = Number(userPoints) + Number(point)
  
				const asyncParallel = require("async/parallel");
                asyncParallel({
                    save_point_log:(callback)=>{
						let option = {
							insertData: {
								"user_id": customer,
								"order_id": null,
								"order_number": null,
								"points": point,
								"note" : note,
								"type" : POINT_TYPE_EARNED,
								"transaction_reason" : POINT_ADDED_BY_ADMINISTRATOR,
								"total_user_points":Number(totalUserPoints),
								"total_selling_amount": DEACTIVE,
								"previous_balance_for_points": null,
								"total_amount_for_points": null,
								"now_remaining_amount_for_point": null,
								"amount_for_single_point": null,
								"is_redeem": DEACTIVE,
								"total_redeem_points": DEACTIVE,
								"total_redeem_amount": DEACTIVE,
								'message': res.__("admin.points.created_by_administrator"),
                                'amount_added_by' : adminId,
								"created": getUtcDate()
							}
						};
						
						 OrderModel.savePointsLogs(req, res, option).then(() => {
							callback(null, null)
						 })
                    },
                    update_user : (callback)=>{
                        let options = {
                            'collection' : TABLE_USERS,
                            'conditions': { _id: customer },
                            'updateData': {
                                $set: { 'total_points': Number(totalUserPoints), 'modified': getUtcDate() }
                            },
                        }

                        DbClass.updateOneRecord(req, res, options).then(result=>{
                            callback(null, null)
                        })
                    },
					update_user_points_stats : (callback)=>{
						/** Save points stats for user*/
						updatePointTransactionLogStats(req, res, {
							"user_id": customer,
							"points": point,
						}).then(response=>{
							callback(null, null);
						});
					},
                }, async (asyncErr, asyncRes)=>{

					UserModel.getUserDetails({
						conditions: { _id: customer },
						fields: { _id: 1, full_name: 1 },
					}).then(async userRes => {
						if (userRes || userRes.status != STATUS_SUCCESS || !userRes.result){

							let fullName = (userRes.result.full_name) ? userRes.result.full_name : "";
							let notificationOptions = {
								notification_data: {
									notification_type: NOTIFICATION_TO_USER_FOR_ADMIN_ADD_POINT,
									message_params: [fullName, point],
									user_id: customer,
									user_ids: [customer],
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminId
								}
							};
							
							/**send booking notification to user */
							await insertNotifications(req, res, notificationOptions);
		
							let pushNotificationOptions = {
								notification_data: {
									notification_type: PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_ADD_POINT,
									message_params: [fullName, point],
									user_id: customer,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminId
								}
							};
							await pushNotification(req, res, pushNotificationOptions);



							res.send({
								status : STATUS_SUCCESS,
								message : res.__("admin.points.points_has_been_added")
							})
						}
					});
                })
                
            })
        } else {

			let dropOptions = {
				collections: [
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name"],
						conditions: { is_deleted: NOT_DELETED, user_role_id: FRONT_ADMIN_ROLE_ID, user_type : CUSTOMER_USER_TYPE  },
						...(userId && {selected : [userId]})
					},
				]
			};
	
			getDropdownList(req, res, dropOptions).then(responseData => {

				/** Render add/edit page  **/
				res.render('add_point', {
					layout			:	false,
                    user_id         : userId,
					customer_list : (responseData.final_html_data && responseData.final_html_data['0']) ? responseData.final_html_data['0'] : ''
				});
			});
        }
    }// end addAmountUserWallet()

	/**
     * Function for adding points for user
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.deductPoint = (req, res) => {
		let userId	= (req.query.user_id)		? 	new ObjectId(req.query.user_id)	:"";
		let adminId = (req?.session?.user?._id) ? new ObjectId(req.session.user._id) : "";

		if (isPost(req)) {
			let customer = req.body.customer ? new ObjectId(req.body.customer) : '';
			let point = req.body.point ? parseInt(req.body.point) : '';
			let note = req.body.note ? req.body.note.trim() : '';

			let options = {
				collection : TABLE_USERS,
				conditions : { _id : customer},
			}


			DbClass.getFindOne(options).then((response)=>{
				let userData = (response?.result) || {}
				let userPoints =  (userData?.total_points) ? userData.total_points : '';
				
				let totalUserPoints = Number(userPoints) - Number(point)
				 
				const asyncParallel = require("async/parallel");
				asyncParallel({
					save_point_log:(callback)=>{
						let option = {
							insertData: {
								"user_id": customer,
								"order_id": null,
								"order_number": null,
								"points": point,
								"note" : note,
								"type" : POINT_TYPE_DEDUCT,
								"transaction_reason" : POINT_ADDED_BY_ADMINISTRATOR,
								"total_user_points":Number(totalUserPoints),
								"total_selling_amount": DEACTIVE,
								"previous_balance_for_points": null,
								"total_amount_for_points": null,
								"now_remaining_amount_for_point": null,
								"amount_for_single_point": null,
								"is_redeem": DEACTIVE,
								"total_redeem_points": DEACTIVE,
								"total_redeem_amount": DEACTIVE,
								'message': res.__("admin.points.created_by_administrator"),
								'amount_added_by' : adminId,
								"created": getUtcDate()
							}
						};
						
							OrderModel.savePointsLogs(req, res, option).then(() => {
							callback(null, null)
							})
					},
					update_user : (callback)=>{
						let options = {
							'collection' : TABLE_USERS,
							'conditions': { _id: customer },
							'updateData': {
								$set: { 'total_points': Number(totalUserPoints), 'modified': getUtcDate() }
							},
						}

						DbClass.updateOneRecord(req, res, options).then(result=>{
							callback(null, null)
						})
					}
				}, (asyncErr, asyncRes)=>{

					UserModel.getUserDetails({
						conditions: { _id: customer },
						fields: { _id: 1, full_name: 1 },
					}).then(async userRes => {
						if (userRes || userRes.status != STATUS_SUCCESS || !userRes.result){

							let fullName = (userRes.result.full_name) ? userRes.result.full_name : "";
							let notificationOptions = {
								notification_data: {
									notification_type: NOTIFICATION_TO_USER_FOR_ADMIN_DEDUCT_POINT,
									message_params: [fullName, point],
									user_id: customer,
									user_ids: [customer],
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminId
								}
							};
							
							/**send booking notification to user */
							await insertNotifications(req, res, notificationOptions);
		

							let pushNotificationOptions = {
								notification_data: {
									notification_type: PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_DEDUCT_POINT,
									message_params: [fullName, point],
									user_id: customer,
									lang_code: DEFAULT_LANGUAGE_CODE,
									user_role_id: FRONT_ADMIN_ROLE_ID,
									role_id: FRONT_ADMIN_ROLE_ID,
									created_by: adminId
								}
							};
							await pushNotification(req, res, pushNotificationOptions);



							res.send({
								status : STATUS_SUCCESS,
								message : res.__("admin.points.points_has_been_deducted")
							})
						}
					});
					
				})
				
			})
		} else {

			let dropOptions = {
				collections: [
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name"],
						conditions: { is_deleted: NOT_DELETED, user_role_id: FRONT_ADMIN_ROLE_ID, user_type : CUSTOMER_USER_TYPE  },
						...(userId && {selected : [userId]})
					},
				]
			};
	
			getDropdownList(req, res, dropOptions).then(responseData => {

				/** Render add/edit page  **/
				res.render('deduct_point', {
					layout			:	false,
					user_id         : userId,
					customer_list : (responseData.final_html_data && responseData.final_html_data['0']) ? responseData.final_html_data['0'] : ''
				});
			});
		}
	}// end deductPoint();

    /**
     * Function for export User Points List
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.exportUserPointsList = async(req, res) => {
        let userId	= (req.params.id)		? 	new ObjectId(req.params.id)	:"";

		let conditionsexp		=	exportPointCommonConditions;

		if(userId){
			conditionsexp['user_id'] = userId;
		}

		let conditions = [{
			$facet: {
				"point_list": [
                    { $match: conditionsexp},      
					{
						$lookup: {
							from: TABLE_USERS,
							localField: 'user_id',
							foreignField: '_id',
							as: "userdetails",
						}
					},	  
					{
						$project: {
							_id: 1,
							points: 1,
							user_id: 1,
							order_id: 1,
							is_redeem: 1,
							total_user_points: 1,
							total_selling_amount: 1,
							total_balance_for_points: 1,
							total_amount_for_points: 1,
							total_redeem_points: 1,
							total_redeem_amount: 1,
							created: 1,
							modified: 1,
							order_number: 1,
							user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
							user_email: { $arrayElemAt: ["$userdetails.email", 0] },
							mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] }
						}
					},   
					{ $sort: {'created': -1} },
				],
			}
		}];

		let optionObj = {
			conditions: conditions
		}


		PointModel.getPointsAggregateList(req, res, optionObj).then(userResponse => {

			let responseStatus 	= (userResponse.status) ? userResponse.status : "";
			let responseResult 	= (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
			let result		 	= (responseResult && responseResult.point_list) ? responseResult.point_list : [];

			/**Set variable for export */
			let temp = [];
			/** Define excel heading label **/
			let commonColls	= [
				res.__("admin.system.user_name"),
				res.__("admin.user.email"),
				res.__("admin.user.mobile_number"),
				res.__("admin.admin.user_point.order_number"),
				res.__("admin.user_point.type"),
				res.__("admin.user_point.point"),
				res.__("admin.user_point.amount"),
				res.__("admin.user_point.balance"),
				res.__("admin.system.created"),
			];
			if(result && result.length > 0){
				result.map(records=>{

					let showing_point	=	records.points;
					if (records.is_redeem == 1) {
						showing_point	=	records.total_redeem_points;
					}

					let buffer = [
						(records.user_name)		? records.user_name 	:	"N/A",
						(records.user_email)	? records.user_email 	:	"N/A",
						(records.mobile_number)	? records.mobile_number 	:	"N/A",
						(records.order_number)		? records.order_number 	:	"N/A",
						(records.is_redeem)			? 'Redeem' 		:	"Credit",
						(records.total_selling_amount)		? records.total_selling_amount	:	"N/A",
						showing_point,
						(records.total_user_points) ? records.total_user_points : 	"N/A",
						(records.created)		? newDate(records.created,DATE_TIME_FORMAT_EXPORT) :"",
					];
					temp.push(buffer);
				});
			}

			/**  Function to export data in excel format **/
			exportToExcel(req,res,{
				file_prefix 	: "User_Point_Report",
				heading_columns	: commonColls,
				export_data		: temp
			});
		})
    };//End exportUserPointsList()


}
module.exports = new Points();



