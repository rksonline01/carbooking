const SmsModel = require("./model/SmsLog");
const { ObjectId } = require('mongodb');
function SmsLog() {

	/**
	 * Function to get sms logs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.list = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;
			let search_data 	= req.body.search_data;
		
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

				if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
							dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                        }
                    })
                }
				
				let conditions = [
					{
						$facet : {
							"sms_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$project : {
										_id:1,mobile_number:1,message:1,status:1,created:1 ,
									}
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{$skip : skip},
								{$limit : limit},
							],
							"sms_all_count" : [
								{
									$group :{
										_id : null,
										count : {$count : {}}
									}
								},
								{
									$project : {_id :0,count:1}
								}
							],
							"sms_filter_count" : [
								{ $match : dataTableConfig.conditions},
								{
									$group : {
										_id : null,
										count : {$count :{}}
									}
								},
								{
									$project : {_id:0,count:1}
								}
							]
						}
					}
				];

				let optionObj = {
                    conditions : conditions
                }

                SmsModel.getAggregateSmsLogsList(req,res,optionObj).then(smsLogResponse=>{
					let responseStatus = (smsLogResponse.status) ? smsLogResponse.status : "";
                    let responseResult = (smsLogResponse.result && smsLogResponse.result[0]) ? smsLogResponse.result[0] : "";
                    
                    let sms_list  = (responseResult && responseResult.sms_list ) ? responseResult.sms_list  : [];
                    let sms_all_count = (responseResult && responseResult.sms_all_count && responseResult.sms_all_count[0] && responseResult.sms_all_count[0]["count"]) ? responseResult.sms_all_count[0]["count"] : DEACTIVE;
                    let sms_filter_count = (responseResult && responseResult.sms_filter_count && responseResult.sms_filter_count[0] && responseResult.sms_filter_count[0]["count"]) ? responseResult.sms_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   sms_list ,
                        recordsTotal	:	sms_all_count,
                        recordsFiltered	:  	sms_filter_count,
                    });
				})
				
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/sms_logs/list']);
			res.render('list');
		}
	};//End getContactList()


    /**
	 * Function for view sms logs details
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.viewDetials = (req, res, next) => {
		let smsLogId = (req.params.id) ? req.params.id : "";

		if (!smsLogId) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"sms_logs");
            return;
        }else{


            let conditions = [
                { $match: { _id : new ObjectId(smsLogId)}},
                {
                    $lookup: {
                        from: TABLE_USERS,
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'userdetails'
                    }
                },
                {
                    $project: {
                        _id:1,mobile_number:1,message:1,status:1,created:1 ,user_name: { "$arrayElemAt": ["$userdetails.full_name", 0] },

                    }
                }
            ];

            let optionObj = {
                conditions : conditions
            }

            SmsModel.getAggregateSmsLogsList(req,res,optionObj).then(smsLogResponse=>{
                
                if(smsLogResponse == STATUS_ERROR){
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL+"sms_logs");
                }else{

                    let smsLogData = (smsLogResponse.result) ? smsLogResponse.result[0] :{};
                    consoleLog(smsLogData)
                    req.breadcrumbs(BREADCRUMBS['admin/sms_logs/view']);
                    res.render("view", {
                        result			: (smsLogData)			?	smsLogData	    :	{},
                    });
                       
                }
            })

        }

	};//End view()


    
	
	
}
module.exports = new SmsLog();
