const { ObjectId } = require('mongodb');
const async = require("async");
const EmailLogs = require("./model/emailLog");

function emailLog(){


    /**
	 * Function to email logs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.emailLogList = (req, res)=>{
		if(isPost(req)){
			let fromDate 		= 	(req.body.fromDate)	? 	req.body.fromDate 			:"";
			let toDate 			= 	(req.body.toDate) 	? 	req.body.toDate				:"";
			let limit			= 	(req.body.length)	? 	parseInt(req.body.length)	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)	?	parseInt(req.body.start)	:DEFAULT_SKIP;
			
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				if(fromDate != "" && toDate != ""){
					dataTableConfig.conditions['created']={
						$gte 	: newDate(fromDate),
						$lte 	: newDate(toDate),
					}
				}
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions);
				  
				let conditions = [
					{
						$facet : {
							"email_log_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$project : {
										_id:1,from:1,to:1,subject:1,created:1
									}
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{	$skip : skip },
								{	$limit : limit }
							],
							"email_log_all_count" : [
								{
									$group : {
										_id : null,
										count : {$count : {}}
									}
								},
								{
									$project : {_id:0,countL:1}
								}
							],
							"email_log_filter_count" : [
								{$match : dataTableConfig.conditions},
								{
									$group : {
										_id : null,
										count : {$count : {}}
									}
								},
								{
									$project : {_id :0, count:1}
								}
							]
						}
					}
				];

				let optionObj = {
					conditions : conditions
				}

				EmailLogs.getEmailLogAggregateList(req,res,optionObj).then(logResponse=>{
					let responseStatus = (logResponse.status) ? logResponse.status : "";
                    let responseResult = (logResponse.result && logResponse.result[0]) ? logResponse.result[0] : "";
                    
                    let email_log_list  = (responseResult && responseResult.email_log_list ) ? responseResult.email_log_list  : [];
                    let email_log_all_count = (responseResult && responseResult.email_log_all_count && responseResult.email_log_all_count[0] && responseResult.email_log_all_count[0]["count"]) ? responseResult.email_log_all_count[0]["count"] : DEACTIVE;
                    let email_log_filter_count = (responseResult && responseResult.email_log_filter_count && responseResult.email_log_filter_count[0] && responseResult.email_log_filter_count[0]["count"]) ? responseResult.email_log_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   email_log_list ,
                        recordsTotal	:	email_log_all_count,
                        recordsFiltered	:  	email_log_filter_count,
                    });
				})
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/email_logs/list']);
			res.render('list');
		}
	};//End list()

     /**
	 * Function to email logs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    this.emailLogView = (req,res)=>{
        let emailLogId = (req.params.id) ? req.params.id : "";
	    if(!emailLogId || emailLogId ==''){
            /** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"email_logs");
        }else{
            try{
                /** Get email logs details **/
                let detailConditions = {
                    _id : new ObjectId(emailLogId)
                };

                let detailFields = {_id:1,from:1,to:1,subject:1,created:1,html:1}

                let optionObj = {
                    conditions : detailConditions,
                    fields : detailFields
                }

                EmailLogs.getEmailLogDetail(req,res,optionObj).then(detailResponse=>{
                    let detailStatus = (detailResponse.status) ? detailResponse.status : "";
                    let logDetail = (detailResponse.result) ? detailResponse.result : {};

                    if(detailStatus == STATUS_SUCCESS){
                        req.breadcrumbs(BREADCRUMBS['admin/email_logs/view']);
						/** Render view page*/
						res.render('view',{
							result	: logDetail,
						});
                    }else{
                        /** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"email_logs");
                    }
                })

            }catch(e){
                /** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"email_logs");
            }
        }
    }

}

module.exports = new emailLog();