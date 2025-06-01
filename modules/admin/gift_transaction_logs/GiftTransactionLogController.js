const GiftTransactionModel = require(WEBSITE_MODULES_PATH + 'api/model/giftTransactionModel');
const { ObjectId } = require('mongodb');
function GiftTransactionLogs() {


	let exportGiftTransactionCommonConditions 	= {};

	/**
	 * Function to get gift logs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res, next) => {

		let senderId	=  (req.query.sender_id)		  ? new ObjectId(req.query.sender_id)	:"";
		let receiverId	=  (req.query.receiver_id)		  ? new ObjectId(req.query.receiver_id)	:"";


		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			let search_data = req.body.search_data;
			let fromDate = "";
            let toDate = "";
			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {

				exportGiftTransactionCommonConditions = dataTableConfig.conditions;

				if (search_data.length) {
					search_data.map(formdata => {
						
						if (formdata.name != "search_open" && formdata.value != "") {
							if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            }else if (formdata.name == "sender_id" && formdata.value != "") {
								dataTableConfig.conditions['sender_id'] = new ObjectId(formdata.value);
							}else if (formdata.name == "receiver_id" && formdata.value != "") {
								dataTableConfig.conditions['receiver_id'] = new ObjectId(formdata.value);
							} else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
							} else if (formdata.name == "registration_date") {

							} else if(formdata.name == "status"){
								if(formdata.value != "") dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
							}else{
								dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
							}
						}
					})

					if (fromDate != "" && toDate != "") {
                        dataTableConfig.conditions["created"] = {
                            $gte: newDate(fromDate),
                            $lte: newDate(toDate),
                        }
                    }
				}

				let conditions = [
					{
						$facet: {
							"gift_logs_list": [
								{
									$lookup: {
										from: TABLE_USERS,
										let: { sender_id: "$sender_id" },
										pipeline: [
											{
												$match: {
													$expr: {
														$or: [
															{ $eq: ["$_id", "$$sender_id"] }
														]
													}
												}
											},
											{
												$project: {
													_id: 0,
													full_name: 1,
													mobile_number: 1,
												}
											}
										],
										as: "sender_details"
									}
								},
								{
									$lookup: {
										from: TABLE_USERS,
										let: { receiver_id: "$receiver_id" },
										pipeline: [
											{
												$match: {
													$expr: {
														$or: [
															{ $eq: ["$_id", "$$receiver_id"] }
														]
													}
												}
											},
											{
												$project: {
													_id: 0,
													full_name: 1,
													mobile_number: 1,
												}
											}
										],
										as: "receiver_details"
									}
								},
								{
									$project: {
										'id': 1,
										'amount': 1,
										'message': 1,
										'sender_id': 1,
										'receiver_id': 1,
										"sender_name": { $arrayElemAt: ["$sender_details.full_name", 0] },
										"sender_mobile_number": { $arrayElemAt: ["$sender_details.mobile_number", 0] },
										"receiver_name": { $arrayElemAt: ["$receiver_details.full_name", 0] },
										"receiver_mobile_number": { $arrayElemAt: ["$receiver_details.mobile_number", 0] },
										'total_receiver_amount': 1,
										'total_sender_amount': 1,
										'payment_method': 1,
										'gift_transaction_id': 1,
										'status': 1,
										'created': 1,
									}
								},
								{
									$match: dataTableConfig.conditions
								},
								{
									$sort: dataTableConfig.sort_conditions
								},
								{ $skip: skip },
								{ $limit: limit },
							],
							"gift_all_count": [
								{ $match: {} },
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
							"gift_filter_count": [
								{
									$lookup: {
										from: TABLE_USERS,
										let: { sender_id: "$sender_id" },
										pipeline: [
											{
												$match: {
													$expr: {
														$or: [
															{ $eq: ["$_id", "$$sender_id"] }
														]
													}
												}
											},
											{
												$project: {
													_id: 0,
													full_name: 1,
													mobile_number: 1,
												}
											}
										],
										as: "sender_details"
									}
								},
								{
									$lookup: {
										from: TABLE_USERS,
										let: { receiver_id: "$receiver_id" },
										pipeline: [
											{
												$match: {
													$expr: {
														$or: [
															{ $eq: ["$_id", "$$receiver_id"] }
														]
													}
												}
											},
											{
												$project: {
													_id: 0,
													full_name: 1,
													mobile_number: 1,
												}
											}
										],
										as: "receiver_details"
									}
								},
								{
									$project: {
										'id': 1,
										'amount': 1,
										'message': 1,
										"sender_name": { $arrayElemAt: ["$sender_details.full_name", 0] },
										"sender_mobile_number": { $arrayElemAt: ["$sender_details.mobile_number", 0] },
										"receiver_name": { $arrayElemAt: ["$receiver_details.full_name", 0] },
										"receiver_mobile_number": { $arrayElemAt: ["$receiver_details.mobile_number", 0] },
										'total_receiver_amount': 1,
										'total_sender_amount': 1,
										'payment_method': 1,
										'gift_transaction_id': 1,
										'status': 1,
										'created': 1,
									}
								},
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

				GiftTransactionModel.getGiftAggregateList(req, res, optionObj).then( async giftRes => {
					let responseStatus = (giftRes.status) ? giftRes.status : "";
					if (responseStatus == STATUS_SUCCESS) {
						let responseResult = (giftRes.result && giftRes.result[0]) ? giftRes.result[0] : "";
						let giftList = (responseResult && responseResult.gift_logs_list) ? responseResult.gift_logs_list : [];
						let giftAllCount = (responseResult && responseResult.gift_all_count && responseResult.gift_all_count[0] && responseResult.gift_all_count[0]["count"]) ? responseResult.gift_all_count[0]["count"] : DEACTIVE;
						let giftFilterCount = (responseResult && responseResult.gift_filter_count && responseResult.gift_filter_count[0] && responseResult.gift_filter_count[0]["count"]) ? responseResult.gift_filter_count[0]["count"] : DEACTIVE;
 
					
						/* GET RESULT GROUP BY PAYMENT METHOD */
						let conditionGropuBypayment = [
							{
								$facet: {
									payment_method_report: [
										{
											$lookup: {
												from: TABLE_USERS,
												let: { sender_id: "$sender_id" },
												pipeline: [
													{
														$match: {
															$expr: { $eq: ["$_id", "$$sender_id"] }
														}
													},
													{
														$project: {
															_id: 0,
															full_name: 1,
															mobile_number: 1
														}
													}
												],
												as: "sender_details"
											}
										},
										{
											$addFields: {
												sender_name: { $arrayElemAt: ["$sender_details.full_name", 0] },
												sender_mobile_number: { $arrayElemAt: ["$sender_details.mobile_number", 0] },
											}
										},
										{
											$unset: "sender_details"
										},
										{
											$lookup: {
												from: TABLE_USERS,
												let: { receiver_id: "$receiver_id" },
												pipeline: [
													{
														$match: {
															$expr: { $eq: ["$_id", "$$receiver_id"] }
														}
													},
													{
														$project: {
															_id: 0,
															full_name: 1,
															mobile_number: 1
														}
													}
												],
												as: "receiver_details"
											}
										},
										{
											$addFields: {
												receiver_name: { $arrayElemAt: ["$receiver_details.full_name", 0] },
												receiver_mobile_number: { $arrayElemAt: ["$receiver_details.mobile_number", 0] },
											}
										},
										{
											$unset: "receiver_details"
										},
										{
											$match: {
												...dataTableConfig.conditions
											}
										},
										{
											$group: {
												_id: null,
												walletCount: {
													$sum: {
														$cond: [{ $eq: ["$payment_method", PAYMENT_BY_WALLET] }, 1, 0]
													}
												},
												appleCount: {
													$sum: {
														$cond: [{ $eq: ["$payment_method", PAYMENT_BY_APPLE_PAY] }, 1, 0]
													}
												},
												pgCount: {
													$sum: {
														$cond: [{ $eq: ["$payment_method", PAYMENT_BY_PAYMENT_GATEWAY] }, 1, 0]
													}
												},
												codCount: {
													$sum: {
														$cond: [{ $eq: ["$payment_method", PAYMENT_BY_COD] }, 1, 0]
													}
												}
											}
										},
										{
											$project: {
												_id: 0,
												walletCount: 1,
												appleCount: 1,
												pgCount: 1,
												codCount: 1
											}
										}
									],
						
									top_sender_report: [
										{
											$match: {
												...dataTableConfig.conditions
											}
										},
										{
											$group: {
												_id: "$sender_id",
												count: { $sum: 1 }
											}
										},
										{ $sort: { count: -1 } },
										{
											$lookup: {
												from: TABLE_USERS,
												localField: "_id",
												foreignField: "_id",
												as: "sender"
											}
										},
										{
											$unwind: {
												path: "$sender",
												preserveNullAndEmptyArrays: true
											}
										},
										{
											$project: {
												_id: 1,
												count: 1,
												sender_name: "$sender.full_name",
												sender_mobile_number: "$sender.mobile_number"
											}
										}
									],
						
									top_receipent_report: [
										{
											$match: {
												...dataTableConfig.conditions
											}
										},
										{
											$group: {
												_id: "$receiver_id",
												count: { $sum: 1 }
											}
										},
										{ $sort: { count: -1 } },
										{
											$lookup: {
												from: TABLE_USERS,
												localField: "_id",
												foreignField: "_id",
												as: "receipent"
											}
										},
										{
											$unwind: {
												path: "$receipent",
												preserveNullAndEmptyArrays: true
											}
										},
										{
											$project: {
												_id: 1,
												count: 1,
												receipent_name: "$receipent.full_name",
												receipent_mobile_number: "$receipent.mobile_number"
											}
										}
									]
								}
							}
						];
						
						 
						let optionObjGropuBypayment = {
							conditions: conditionGropuBypayment
						};
						
						let giftGropuBypaymentRes = await GiftTransactionModel.getGiftAggregateList(req, res, optionObjGropuBypayment);
						
						let responseGropuBypaymentResult = giftGropuBypaymentRes?.result?.[0] || {};
						let gropuByPaymentMethodResult = responseGropuBypaymentResult?.payment_method_report[0] || [];
						
					
 						
						let topSenderResult 			= (responseGropuBypaymentResult.top_sender_report && responseGropuBypaymentResult.top_sender_report[0]) ? responseGropuBypaymentResult.top_sender_report[0] : [];
						
						let topReceipentResult 			= (responseGropuBypaymentResult.top_receipent_report && responseGropuBypaymentResult.top_receipent_report[0]) ? responseGropuBypaymentResult.top_receipent_report[0] : [];
						
						/* GET RESULT GROUP BY PAYMENT METHOD  */
						res.send({
							status: responseStatus,
							draw: dataTableConfig.result_draw,
							data: giftList,
							gropuByPaymentMethod: gropuByPaymentMethodResult,
							topSenderResult: topSenderResult,
							topReceipentResult: topReceipentResult,
							recordsTotal: giftAllCount,
							recordsFiltered: giftFilterCount,
						});
					}
				});


			});
		} else {
			/** render listing page **/

			let dropOptions = {
				collections: [
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name"],
						conditions: { is_deleted: NOT_DELETED, user_role_id: FRONT_ADMIN_ROLE_ID, user_type : CUSTOMER_USER_TYPE  },
						...(senderId && {selected : [senderId]})
					},
					{
						collection: TABLE_USERS,
						columns: ["_id", "full_name"],
						conditions: { is_deleted: NOT_DELETED, user_role_id: FRONT_ADMIN_ROLE_ID, user_type : CUSTOMER_USER_TYPE  },
						...(receiverId && {selected : [receiverId]})
					},
				]
			};
	
			getDropdownList(req, res, dropOptions).then(responseData => {

			req.breadcrumbs(BREADCRUMBS['admin/gift_transaction_logs/list']);
			res.render('list', {				
				sender_list : (responseData.final_html_data && responseData.final_html_data['0']) ? responseData.final_html_data['0'] : '',
				receiver_list : (responseData.final_html_data && responseData.final_html_data['1']) ? responseData.final_html_data['1'] : ''
			  });

			});
		}
	};//End getContactList()



this.exportGiftData = async(req, res) => {
		 
		let conditionsexp	=	exportGiftTransactionCommonConditions;
		let limit 			= 	ADMIN_LISTING_LIMIT;
		let skip 			= 	DEFAULT_SKIP;

		let conditions = [
			{
				$facet: {
					"gift_logs_list": [
						{
							$lookup: {
								from: TABLE_USERS,
								let: { sender_id: "$sender_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$or: [
													{ $eq: ["$_id", "$$sender_id"] }
												]
											}
										}
									},
									{
										$project: {
											_id: 0,
											full_name: 1,
											mobile_number: 1,
										}
									}
								],
								as: "sender_details"
							}
						},
						{
							$lookup: {
								from: TABLE_USERS,
								let: { receiver_id: "$receiver_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$or: [
													{ $eq: ["$_id", "$$receiver_id"] }
												]
											}
										}
									},
									{
										$project: {
											_id: 0,
											full_name: 1,
											mobile_number: 1,
										}
									}
								],
								as: "receiver_details"
							}
						},
						{
							$project: {
								'id': 1,
								'amount': 1,
								'message': 1,
								"sender_name": { $arrayElemAt: ["$sender_details.full_name", 0] },
								"sender_mobile_number": { $arrayElemAt: ["$sender_details.mobile_number", 0] },
								"receiver_name": { $arrayElemAt: ["$receiver_details.full_name", 0] },
								"receiver_mobile_number": { $arrayElemAt: ["$receiver_details.mobile_number", 0] },
								'total_receiver_amount': 1,
								'total_sender_amount': 1,
								'payment_method': 1,
								'gift_transaction_id': 1,
								'status': 1,
								'created': 1,
							}
						},
						{
							$match: conditionsexp
						},
						
						{ $skip: skip },
						{ $limit: limit },
					],
					"gift_all_count": [
						{ $match: {} },
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
					"gift_filter_count": [
						{
							$lookup: {
								from: TABLE_USERS,
								let: { sender_id: "$sender_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$or: [
													{ $eq: ["$_id", "$$sender_id"] }
												]
											}
										}
									},
									{
										$project: {
											_id: 0,
											full_name: 1,
											mobile_number: 1,
										}
									}
								],
								as: "sender_details"
							}
						},
						{
							$lookup: {
								from: TABLE_USERS,
								let: { receiver_id: "$receiver_id" },
								pipeline: [
									{
										$match: {
											$expr: {
												$or: [
													{ $eq: ["$_id", "$$receiver_id"] }
												]
											}
										}
									},
									{
										$project: {
											_id: 0,
											full_name: 1,
											mobile_number: 1,
										}
									}
								],
								as: "receiver_details"
							}
						},
						{
							$project: {
								'id': 1,
								'amount': 1,
								'message': 1,
								"sender_name": { $arrayElemAt: ["$sender_details.full_name", 0] },
								"sender_mobile_number": { $arrayElemAt: ["$sender_details.mobile_number", 0] },
								"receiver_name": { $arrayElemAt: ["$receiver_details.full_name", 0] },
								"receiver_mobile_number": { $arrayElemAt: ["$receiver_details.mobile_number", 0] },
								'total_receiver_amount': 1,
								'total_sender_amount': 1,
								'payment_method': 1,
								'gift_transaction_id': 1,
								'status': 1,
								'created': 1,
							}
						},
						{ $match: conditionsexp },
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

		GiftTransactionModel.getGiftAggregateList(req, res, optionObj).then(giftRes => {
 
			let responseStatus 	= (giftRes.status) ? giftRes.status : "";
			let responseResult = (giftRes.result && giftRes.result[0]) ? giftRes.result[0] : "";
 			let giftList = (responseResult && responseResult.gift_logs_list) ? responseResult.gift_logs_list : [];
 			let giftAllCount = (responseResult && responseResult.gift_all_count && responseResult.gift_all_count[0] && responseResult.gift_all_count[0]["count"]) ? responseResult.gift_all_count[0]["count"] : DEACTIVE;
			let giftFilterCount = (responseResult && responseResult.gift_filter_count && responseResult.gift_filter_count[0] && responseResult.gift_filter_count[0]["count"]) ? responseResult.gift_filter_count[0]["count"] : DEACTIVE;


			/**Set variable for export */
			let temp = [];
			/** Define excel heading label **/
			let commonColls	= [
				res.__("admin.user.sender_name"),
				res.__("admin.user.receiver_name"),
				res.__("admin.user.payment_method"),
				res.__("admin.user.gift_transaction_id"),
				res.__("admin.sms_logs.message"),
				res.__("admin.user.amount"),
				res.__("admin.user.total_amount"),
				res.__("admin.user.total_sender_amount"),
				res.__("admin.system.created"),
			];
			if(giftList && giftList.length > 0){
				giftList.map(records=>{
					let buffer = [
						(records.sender_name)			? records.sender_name 			:	"N/A",
						(records.receiver_name)			? records.receiver_name 		:	"N/A",
						(records.payment_method)		? records.payment_method 		:	"N/A",
						(records.gift_transaction_id)	? records.gift_transaction_id 	:	"N/A",
						(records.message)				? records.message 				:	"N/A",
						(records.amount)				? records.amount				:	"N/A",
						(records.total_receiver_amount) ? records.total_receiver_amount : 	"N/A",
						(records.total_sender_amount) 	? records.total_sender_amount 	: 	"N/A",
						(records.created)				? newDate(records.created,DATE_TIME_FORMAT_EXPORT) :"",
					];
					temp.push(buffer);
				});
			}

			/**  Function to export data in excel format **/
			exportToExcel(req,res,{
				file_prefix 	: "User_Gift_Report",
				heading_columns	: commonColls,
				export_data		: temp
			});
		})
	};//End exportGiftData()

}
module.exports = new GiftTransactionLogs();
