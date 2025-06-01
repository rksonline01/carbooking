const ContactModel = require("./model/ContactModel");
const { ObjectId } = require('mongodb');
function Contact() {

	/**
	 * Function to get contact list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getContactList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;
			let search_data 	= req.body.search_data;
			let fromDate 		= "";
			let toDate			= "";
		
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

				if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "from_date" && formdata.value != ""){
                                fromDate = formdata.value;
                            }else if(formdata.name == "to_date" && formdata.value != ""){
                                toDate = formdata.value;
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
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
						$facet : {
							"contact_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$project : {
										_id: 1,
                                        full_name: 1,
                                        name: 1,
                                        email: 1,
                                        subject: 1,
                                        message: 1,
                                        phone: 1,
                                        enquiry_type: 1,
                                        created: 1
									}
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{
									$skip : skip
								},
								{
									$limit : limit
								},
								
							],
							"contact_all_count" : [
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
							"contact_filter_count" : [
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

                ContactModel.getAggregateContactList(req,res,optionObj).then(contactResponse=>{
					let responseStatus = (contactResponse.status) ? contactResponse.status : "";
                    let responseResult = (contactResponse.result && contactResponse.result[0]) ? contactResponse.result[0] : "";
                    
                    let contact_list  = (responseResult && responseResult.contact_list ) ? responseResult.contact_list  : [];
                    let contact_all_count = (responseResult && responseResult.contact_all_count && responseResult.contact_all_count[0] && responseResult.contact_all_count[0]["count"]) ? responseResult.contact_all_count[0]["count"] : DEACTIVE;
                    let contact_filter_count = (responseResult && responseResult.contact_filter_count && responseResult.contact_filter_count[0] && responseResult.contact_filter_count[0]["count"]) ? responseResult.contact_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   contact_list ,
                        recordsTotal	:	contact_all_count,
                        recordsFiltered	:  	contact_filter_count,
                    });
				})
				
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/contact/list']);
			res.render('list');
		}
	};//End getContactList()


    /**
	 * Function for view contact details
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.view = (req, res, next) => {
		let contactId = (req.params.id) ? req.params.id : "";

		if (!contactId) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "contact");
            return;
        }else{

			if(isPost(req)){
				/** Sanitize Data **/
				req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);  
				var reply_message 	= 	(req.body.reply_message)    ?  req.body.reply_message : "";

				let condition = {
					_id : new ObjectId(contactId),		                   
				}
				let updateData = {
					$set : {
						is_reply : ACTIVE,		             
						modified : getUtcDate(),
						reply_message:	reply_message
					}
				}

				let option = {
					conditions : condition,
					updateData : updateData
				}

				ContactModel.updateContactReplyMessage(req,res,option).then(contactResponse=>{
					let status = contactResponse.status;
					let result = contactResponse.result;
					if(status == STATUS_ERROR){
						finalResponse =	{					
								status	: STATUS_ERROR,
								result	: {},
								message	: res.__("front.system.something_going_wrong_please_try_again")					
						};
						return finalResponse ;
					}
					 
					let  full_name  = (result && result.full_name) ? result.full_name :'';
					let  email      = (result && result.email)     ? result.email :'';
						
					/** Email option**/	
					let emailOptions = {
						to 			:	email,
						action 		:	"contact_reply",
						rep_array 	:	[full_name,reply_message]
					};
			
					/** Send Mail*/
					sendMail(req,res,emailOptions);  
					
				   	req.flash(STATUS_SUCCESS,res.__("admin.contact.reply_has_been_sent_successfully"));
					res.send({
						status		: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL+"contact/view/"+contactId,
						message		: res.__("admin.contact.reply_has_been_sent_successfully"),
					});
				})


			}else{
				let detailConditions = {
					_id : new ObjectId(contactId)
				};
	
				let options = {
					conditions : detailConditions
				}
	
				ContactModel.getContactFindOne(options).then(contactResponse=>{
					
					if(contactResponse == STATUS_ERROR){
						/** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + "contact");
					}else{
	
						let contactData = (contactResponse.result) ? contactResponse.result :{};
					  
						req.breadcrumbs(BREADCRUMBS["admin/contact/view"]);
						res.render("view", {
							result			: (contactData)			?	contactData	    :	{},
						});
						   
					}
				})
	
			}
           
        }

	};//End view()
	
	
}
module.exports = new Contact();
