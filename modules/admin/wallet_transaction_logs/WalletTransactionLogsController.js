const crypto = require("node:crypto");
const async = require("async");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
 
const WalletTransationLogs = require("../wallet_transaction_logs/model/WalletTransationLogs");
const { ObjectId } = require('mongodb');


function WalletTransactionLogsController() {

    GlobalUserController = this;

    let exportWalletCommonConditions 	= {};
  
    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getUserWalletList = async(req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";       
        let userId	=  (req.query.user_id)		  ? new ObjectId(req.query.user_id)	:"";

        /*
        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }
        */ 

    
        if (isPost(req)) {
            
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let fromDate = "";
            let toDate = "";
            let search_data = req.body.search_data;

            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                let commonConditions = {};
                /** Set conditions **/
                if(userId){
                    commonConditions.user_id = userId;
                }
                
				
				exportWalletCommonConditions = dataTableConfig.conditions;
				
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
							} else if (formdata.name == "transaction_type") {
                                dataTableConfig.conditions[formdata.name]  = Number(formdata.value);
                            }  else {
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
 
                let conditions = [{
                    $facet: {
                        "wallet_list": [
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: 'user_id',
                                    foreignField: '_id',
                                    as: "userdetails",
                                }
                            },
                            {
                                $addFields: {
                                    user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
                                    mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] },
                                }
                            },
                            {
                                $unset: "userdetails" // Removes lookup results
                            },
                            { $match: dataTableConfig.conditions },
                            { $sort: {'created': -1} },
                            { $skip: skip },
                            { $limit: limit },
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
                                    from: TABLE_USERS,
                                    localField: 'user_id',
                                    foreignField: '_id',
                                    as: "userdetails",
                                }
                            },
                            {
                                $addFields: {
                                    user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
                                    mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] },
                                }
                            },
                            {
                                $unset: "userdetails" // Removes lookup results
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
                        ]
                    }
                }];

                let optionObj = {
                    conditions: conditions
                }

                WalletTransationLogs.getWalletTransationAggregateList(req, res, optionObj).then(async userResponse => {
                    let responseStatus = (userResponse.status) ? userResponse.status : "";
                    let responseResult = (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";

                    let wallet_list = (responseResult && responseResult.wallet_list) ? responseResult.wallet_list : [];
                    let all_count = (responseResult && responseResult.all_count && responseResult.all_count[0] && responseResult.all_count[0]["count"]) ? responseResult.all_count[0]["count"] : DEACTIVE;
                    let filter_count = (responseResult && responseResult.filter_count && responseResult.filter_count[0] && responseResult.filter_count[0]["count"]) ? responseResult.filter_count[0]["count"] : DEACTIVE;
                   
                      

                    /* GET RESULT GROUP BY PAYMENT METHOD */
                    let conditionGropuBypayment = [
                        {
                            $lookup: {
                                from: TABLE_USERS,
                                localField: 'user_id',
                                foreignField: '_id',
                                as: "userdetails",
                            }
                        },
                        {
                            $addFields: {
                                user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
                                mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] },
                            }
                        },
                        {
                            $unset: "userdetails"
                        },
                        {
                            $match: {
                                ...dataTableConfig.conditions,
                            }
                        },
                        
                        {
                            $group: {
                                _id: null,
                                totalDebitAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", AMOUNT_DEBIT] }, "$amount", 0]
                                    }
                                },
                                totalCreditAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", AMOUNT_CREDIT] }, "$amount", 0]
                                    }
                                },
                                debitCount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", AMOUNT_DEBIT] }, 1, 0]
                                    }
                                },
                                creditCount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", AMOUNT_CREDIT] }, 1, 0]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalDebitAmount: 1,
                                totalCreditAmount: 1,
                                debitCount: 1,
                                creditCount: 1
                            }
                        }
                    ];
                    
						 
						let optionObjGropuBypayment = {
							conditions: conditionGropuBypayment
						}
 						let walletGropuBypaymentRes 			= await WalletTransationLogs.getWalletTransationAggregateList(req, res, optionObjGropuBypayment);

						let responseGropuBypaymentStatus 	= (walletGropuBypaymentRes.status) ? walletGropuBypaymentRes.status : "";
						let responseGropuBypaymentResult 	= (walletGropuBypaymentRes.result && walletGropuBypaymentRes.result[0]) ? walletGropuBypaymentRes.result[0] : "";
 						
                        let totalDebit = (responseGropuBypaymentResult?.totalDebitAmount ) ? responseGropuBypaymentResult.totalDebitAmount:   0;
                        let totalCredit = (responseGropuBypaymentResult?.totalCreditAmount) ? responseGropuBypaymentResult.totalCreditAmount : 0;
                    
                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: wallet_list,
                        recordsTotal: all_count,
                        recordsFiltered: filter_count,
                        totalDebit: displayPrice(totalDebit),
                        totalCredit: displayPrice(totalCredit),
                    });
                })
            });
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
    

            req.breadcrumbs(BREADCRUMBS["admin/view_wallet_list"]);
            res.render("view_wallet_history",{               
                customer_list : (responseData.final_html_data && responseData.final_html_data['0']) ? responseData.final_html_data['0'] : ''
            });


            })
        }
    };//End getUserWalletList()


	/**
     * Function for export User Wallet History
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.exportUserWalletHistory = async(req, res) => {
        let userType = (req.params.user_type) ? req.params.user_type : "";
        let userId	= (req.params.id)		? 	new ObjectId(req.params.id)	:"";
        
        /*
        if (!userType && !userId) {
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "dashboard");
            return;
        }
        */

		let conditionsexp	=	exportWalletCommonConditions;
        if(userId){
            conditionsexp.user_id	=	userId;
        }
		
		 
		let conditions = [{
			$facet: {
				"wallet_list": [
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
							user_id: 1, 
							amount: 1, 
							type: 1,
							message: 1, 
							total_balance_after_transaction: 1, 
							created:1, 
							note :1,
                            transaction_id:1, 
                            order_number:1,
							user_name: { $arrayElemAt: ["$userdetails.full_name", 0] },
							user_email: { $arrayElemAt: ["$userdetails.email", 0] },
							mobile_number: { $arrayElemAt: ["$userdetails.mobile_number", 0] }
						}
					},
					{ $sort: {'created': 1} },
				],
				"all_count": [
					{ $match: conditionsexp },
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
					{ $match: conditionsexp },
					{
						$group: {
							_id: null,
							count: { $sum: 1 }
						}
					},
					{
						$project: { count: 1, _id: 0 }
					}
				]
			}
		}];

		let optionObj = {
			conditions: conditions
		}

		WalletTransationLogs.getWalletTransationAggregateList(req, res, optionObj).then(userResponse => {
			
			let responseStatus 	= (userResponse.status) ? userResponse.status : "";
			let responseResult 	= (userResponse.result && userResponse.result[0]) ? userResponse.result[0] : "";
			let result		 	= (responseResult && responseResult.wallet_list) ? responseResult.wallet_list : [];
			
			/**Set variable for export */
			let temp = [];
			/** Define excel heading label **/
			let commonColls	= [
				res.__("admin.system.user_name"),
				res.__("admin.user.email"),
				res.__("admin.user.mobile_number"),
				res.__("admin.wallet.transaction_id"),
				res.__("admin.wallet.order_number"),
				res.__("admin.user.amount"),
				res.__("admin.wallet.type"),
				res.__("admin.wallet.message"),
				res.__("admin.wallet.total_balance_after_transaction"),
				res.__("admin.wallet.reason"),
				res.__("admin.system.created"),
			];
			if(result && result.length > 0){
				result.map(records=>{
					let buffer = [
						(records.user_name)		? records.user_name 	:	"N/A",
						(records.user_email)	? records.user_email 	:	"N/A",
						(records.mobile_number)	? records.mobile_number 	:	"N/A",
						(records.transaction_id)	? records.transaction_id 	:	"N/A",
						(records.order_number)	? records.order_number 	:	"N/A",
						(records.amount)		? records.amount 	:	"N/A",
						(records.type)			? toTitleCase(records.type) 		:	"N/A",
						(records.message)		? records.message	:	"N/A",
						(records.total_balance_after_transaction) ? records.total_balance_after_transaction : 	"N/A",
						(records.note) ? records.note : 	"N/A",
						(records.created)		? newDate(records.created,DATE_TIME_FORMAT_EXPORT) :"",
					];
					temp.push(buffer);
				});
			}

			/**  Function to export data in excel format **/
			exportToExcel(req,res,{
				file_prefix 	: "User_Wallet_Report",
				heading_columns	: commonColls,
				export_data		: temp
			});
		})
    };//End exportUserWalletHistory()

	
}
module.exports = new WalletTransactionLogsController();
