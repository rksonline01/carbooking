const NewsLetterSubscriberModel = require("./model/NewsLetterSubscriberModel");
const clone			= require('clone');
const crypto 	    = 	require("crypto");
const { ObjectId } = require('mongodb');
function NewsLetterSubscriberController(){

    /**
	* Function for get list of newsletter subscribers
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
    this.getSubscriberList = (req, res)=>{
		if(isPost(req)){
			let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)	?	parseInt(req.body.start)  :DEFAULT_SKIP;
			let search_data 	= req.body.search_data;
			
			/** Configure DataTable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

                if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "status"){
                                dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                            }
                        }
                    })
                }

                let conditions = [{
                    $facet : {
                        "newsletter_subscriber_list" : [
                            {$match : dataTableConfig.conditions},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit : limit} 
                        ],
                        "newsletter_subscriber_all_count" : [
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "newsletter_subscriber_filter_count" : [
                            {$match: dataTableConfig.conditions},
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ]
                    }
                }];

                let options = {
                    conditions : conditions
                };

                NewsLetterSubscriberModel.getNewsletterSubscriberAggregateList(req,res,options).then(newsletterResponse=>{
					let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
                    let responseResult = (newsletterResponse.result && newsletterResponse.result[0]) ? newsletterResponse.result[0] : "";

                    let newsletter_subscriber_list = (responseResult && responseResult.newsletter_subscriber_list) ? responseResult.newsletter_subscriber_list : [];
                    let newsletter_subscriber_all_count = (responseResult && responseResult.newsletter_subscriber_all_count && responseResult.newsletter_subscriber_all_count[0] && responseResult.newsletter_subscriber_all_count[0]["count"]) ? responseResult.newsletter_subscriber_all_count[0]["count"] : DEACTIVE;
                    let newsletter_subscriber_filter_count = (responseResult && responseResult.newsletter_subscriber_filter_count && responseResult.newsletter_subscriber_filter_count[0] && responseResult.newsletter_subscriber_filter_count[0]["count"]) ? responseResult.newsletter_subscriber_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   newsletter_subscriber_list,
                        recordsTotal	:	newsletter_subscriber_all_count,
                        recordsFiltered	:  	newsletter_subscriber_filter_count,
                    });
				});
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/newsletter_subscribers/list"]);
			res.render("list");
		}
	};//End getSubscriberList()

    	/**
	 * Function to add newsletter's subscriber
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addSubscriber = (req,res,next)=>{
        if(isPost(req)){
            req.body 	=	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let email	=	(req.body.email)	?	req.body.email	:"";

            
            let currentTime	= 	currentTimeStamp();
            let encId		=	crypto.createHash("md5").update(currentTime+email).digest("hex");

            let insertData = {
                email 			: 	email,
                status 			:  	ACTIVE,
                user_id 		: 	0,
                enc_id			:	encId,
                modified 		: 	getUtcDate(),
                created 		: 	getUtcDate()
            };

            let saveOption = {
                insertData : insertData
            }

            NewsLetterSubscriberModel.saveNewletterSubscriber(req,res,saveOption).then(newsletterResponse=>{
                let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
                if (responseStatus == STATUS_ERROR) {
                    /** Send error response **/
                    res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }else{
                    /** Send success response */
                    req.flash('success', res.__("admin.newsletter.newsletter_subscriber_has_been_added_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + 'newsletter_subscribers',
                        message: res.__("admin.newsletter.newsletter_subscriber_has_been_added_successfully")
                    });
                }
            })

        }else{
            /** Render add page **/
			req.breadcrumbs(BREADCRUMBS["admin/newsletter_subscribers/add"]);
			res.render("add");	
        }
    }

    /**
	 * Function for update newsletter subscriber's detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editSubscriber = (req,res,next)=>{
        let subscriberId = (req.params.id) ? req.params.id : "";
        if(subscriberId){
            if(isPost(req)){
                req.body 	= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                let email	= 	(req.body.email)	? 	req.body.email	:"";

                let updateCondition = {
                    _id : new ObjectId(subscriberId)
                }

                let updateData = {
					email 		: 	email,
					// modified	: 	getUtcDate()
				}

                let updateOption = {
                    conditions : updateCondition,
                    updateData : {$set:updateData}
                }

                NewsLetterSubscriberModel.updateNewletterSubscriber(req,res,updateOption).then(updateResponse=>{
                    if(updateResponse.status == STATUS_SUCCESS){
                        req.flash(STATUS_SUCCESS,res.__("admin.newsletter.subscriber_has_been_updated_successfully"));
                        res.send({
                            status			:	STATUS_SUCCESS,
                            redirect_url	: 	WEBSITE_ADMIN_URL+"newsletter_subscribers",
                            message			:	res.__("admin.newsletter.subscriber_has_been_updated_successfully"),
                        });
                    }else{
                        res.send({
                            status: STATUS_ERROR,
                            message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                        });
                    }
                })

            }else{
                let detailCondition = {
                    _id : new ObjectId(subscriberId)
                };

                let optionObj = {
                    conditions : detailCondition
                }

                NewsLetterSubscriberModel.getNewletterSubscriberDetail(optionObj).then(newsletterResponse=>{
                    if(newsletterResponse.status != STATUS_SUCCESS){
                        /** Send error response **/
                        req.flash("error",categryDetailResponse.message);
                        res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
                        return;
                    }else{
                        /** Render edit page **/
                        req.breadcrumbs(BREADCRUMBS["admin/newsletter_subscribers/edit"]);
                        res.render("edit",{
                            result : (newsletterResponse.result) ? newsletterResponse.result :{}
                        });
                    }
                })
            }

        }else{
             /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
			return;
        }
    }

    /**
	 * Function for delete subscriber
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	 */
	this.deleteSubscriber = (req,res)=>{
		let subscriberId	= (req.params.id) ? req.params.id :"";
        if(subscriberId){

            let condition = {
                _id : new ObjectId(subscriberId)
            }

            let deleteOptions = {
                conditions : condition
            }

            NewsLetterSubscriberModel.deleteNewletterSubscriber(req,res,deleteOptions).then(newsletterResponse=>{
                if(newsletterResponse.status == STATUS_SUCCESS){
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS,res.__("admin.newsletter.subscriber_deleted_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");	
                }else{
                      /** Send success response **/
                      req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                      res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
                }
            })

        }else{
              /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
			return;
        }
	};//End deleteSubscriber()

    /**
	 * Function for update newsletter subscriber's status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	 */
	this.updateSubscriberStatus = (req,res,next)=>{
		let subscriberId	= 	(req.params.id) 	?	req.params.id 		:"";
		let status	 		=	(req.params.status)	? 	req.params.status	:"";
		status	 			=	(status==ACTIVE) 	? 	DEACTIVE 			:ACTIVE;

        if(subscriberId){

            let condition = {
                _id : new ObjectId(subscriberId)
            };

            let updateData = {
                status		:	status,
                modified 	:	getUtcDate()
            }

            let updateOption = {
                conditions : condition,
                updateData : {$set: updateData}
            };

            NewsLetterSubscriberModel.updateNewletterSubscriber(req,res,updateOption).then(updateResponse=>{
                if(updateResponse.status == STATUS_SUCCESS){
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS,res.__("admin.subscriber.subscriber_status_has_been_updated_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
                }else{
                     /** Send success response **/
                     req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                     res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
                }
            })

        }else{
            /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"newsletter_subscribers");
			return;
        }
	};//End updateSubscriberStatus()

};

module.exports = new NewsLetterSubscriberController()