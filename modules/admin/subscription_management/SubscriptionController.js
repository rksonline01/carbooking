const SubscriptionModel = require("./model/Subscription");
const asyncParallel 		 = require('async/parallel');
const asyncEach = require("async/each");

const { ObjectId } = require('mongodb');
const { errorMonitor } = require("events");
function Subscription() {

	SUBSCRIPTION = this;

	/**
	 * Function to get Subscription list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getSubscriptionList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				
				let commoncondition = {
                    is_deleted: NOT_DELETED
                }
				
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commoncondition);
				
				
				let search_data = (req.body.search_data) ?  req.body.search_data : [];
				if(search_data.length){	
					search_data.map(formdata=>{
						if(formdata.value != ''){
							if(formdata.name == "is_active" ){
								if(formdata.value != "") dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
							}else{
								dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
							}
						}
						
					})
				}

				let conditions = [
					{
						$facet : {
							"subscription_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{$skip : skip},
								{$limit : limit},
							],
							"subscription_all_count" : [
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
							"subscription_filter_count" : [
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

                SubscriptionModel.getAggregateSubscriptionList(req,res,optionObj).then(subscriptionRes=>{
					let responseStatus 			= (subscriptionRes.status) ? subscriptionRes.status : "";
                    
					let responseResult 			= (subscriptionRes.result && subscriptionRes.result[0]) ? subscriptionRes.result[0] : "";
                    
					let subscriptionList  		= (responseResult && responseResult.subscription_list) ? responseResult.subscription_list  : [];
                    
					let subscriptionAllCount 	= (responseResult && responseResult.subscription_all_count && responseResult.subscription_all_count[0] && responseResult.subscription_all_count[0]["count"]) ? responseResult.subscription_all_count[0]["count"] : DEACTIVE;
                    
					let subscriptionFilterCount	= (responseResult && responseResult.subscription_filter_count && responseResult.subscription_filter_count[0] && responseResult.subscription_filter_count[0]["count"]) ? responseResult.subscription_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   subscriptionList,
                        recordsTotal	:	subscriptionAllCount,
                        recordsFiltered	:  	subscriptionFilterCount,
                    });
				})
				
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/subscription/list']);
						
			res.render('list',{image_url	:	SUBSCRIPTION_URL});
		}
	};//End getSubscriptionList()

	
	/**
	 * Function to get subscription's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getSubscriptionDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let subscriptionId = (req.params.id) ? req.params.id : "";
			/** Get subscription details **/
			let conditionsObj = { _id: new ObjectId(subscriptionId), is_deleted: NOT_DELETED};
			let optionObj = {
				conditions: conditionsObj
			}
			SubscriptionModel.getSubscriptionFindOne(optionObj).then(subscriptionRes => {
				let result = (subscriptionRes.result) ? subscriptionRes.result : "";

				if (!result) {
					/** Send error response */
					let response = {
						status: STATUS_ERROR,
						message: res.__("admin.system.invalid_access")
					};
					return resolve(response);
				}

				/** Send success response */
				let response = {
					status: STATUS_SUCCESS,
					result: result
				};
				resolve(response);
			});

		});
	};// End getSubscriptionDetails().

	
	/**
	 * Function for add subscription
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addSubscription = (req, res,next)=>{
		var adminUser 	=	(req.session.user) ? req.session.user : {};
		var adminId 	=	(adminUser._id) ? adminUser._id : "";
		if(isPost(req)){
			let subscriptionImage 		= (req.files && req.files.subscription_image) ? req.files.subscription_image : ""; 			

			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			if(req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone						= 	require('clone');
			let allData						= 	req.body;
			let subscriptionCarType			= 	(req.body.car_type)				?	req.body.car_type			: "";			
			let subscriptionPrice			= 	(req.body.price)				?	req.body.price				: "";
			let subscriptionTotalService	= 	(req.body.total_service)		?	req.body.total_service		: "";
			let subscriptionValidityPeriod	= 	(req.body.validity_period)		?	req.body.validity_period	: "";
			
			let offerPrice			= 	(req.body.offer_price)		?	Number(req.body.offer_price)	: 0;
			let offerType			= 	(req.body.offer_type)		?	req.body.offer_type				: "";	
			let vatIncluded			= 	(req.body.vat_included)		?	Number(req.body.vat_included)	: "";
			let mrpPrice			=	subscriptionPrice;
			
			if(offerPrice > 0 ){
				if(offerType == PERCENT_OF_AMOUNT){
					mrpPrice	=	(Number(subscriptionPrice) * 100 ) / (100 - Number(offerPrice));
				}
				else {
					mrpPrice	=	Number(offerPrice) + Number(subscriptionPrice);
				}
			}
			
			req.body						=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let subscriptionName			= 	(req.body.subscription_name)	?	req.body.subscription_name	: "";
			let description					= 	(req.body.body)					?	req.body.body				: "";
			
			if(description!= "") req.body.body =  description.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();

			let shortDescription		= 	(req.body.short_description)	?	req.body.short_description			: "";

			asyncParallel({
                get_slug : (callback) => {					
                    getDatabaseSlug({
						title 		:	subscriptionName,
						table_name 	: 	TABLE_SUBSCRIPTIONS,
						slug_field 	: 	"slug"
					}).then(slugRes=>{
						callback(null,slugRes.title || "");
					});
                },
				subscription_image :(callback) => {
					if(!subscriptionImage) return callback(null,null);
                    moveUploadedFile(req, res,{
						image 		:	subscriptionImage,
						filePath 	: 	SUBSCRIPTION_FILE_PATH,
						oldPath 	: 	""
						
					}).then(bannerRes=>{
						callback(null,bannerRes)
					});
                },
			
            },(asyncErr, asyncRes) => {
				
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];

				if(asyncRes && asyncRes.subscription_image && asyncRes.subscription_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'subscription_image',path:'subscription_image',msg:asyncRes.subscription_image.message});
				}


				let slug 		= (asyncRes && asyncRes.get_slug) ? asyncRes.get_slug : "";
				let subscriptionImg 	= (asyncRes && asyncRes.subscription_image && asyncRes.subscription_image.fileName)  	? asyncRes.subscription_image.fileName 	: '';				

				let optionObj = {
					insertData: {
						create_by 			: 	new ObjectId(adminId),
						subscription_image	: 	subscriptionImg,					
						subscription_name	: 	subscriptionName,
						car_type  			: 	subscriptionCarType,					
						price  				: 	subscriptionPrice,
						mrp_price  			: 	mrpPrice,
						offer_price			: 	offerPrice,
						offer_type  		: 	offerType,	
						vat_included  		: 	vatIncluded,
						total_service		: 	subscriptionTotalService,
						validity_period		: 	subscriptionValidityPeriod,
						short_description	:	shortDescription,
						pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions : {},
						default_language_id	:   DEFAULT_LANGUAGE_CODE,
						description,
						is_deleted			:	NOT_DELETED,
        			    is_active 			:	ACTIVE,
						slug,
						created				:   getUtcDate(),
						modified			:   getUtcDate(),
					}
				}

				SubscriptionModel.saveSubscription(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.subscription.subscription_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'subscription-management',
							message: res.__("admin.subscription.subscription_has_been_added_successfully")
						});
					}
				})
            });
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/subscription/add']);
				/**Render add subscription page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addSubscription()

	
	/**
	 * Function to update Subscription's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.editSubscription = (req, res,next)=>{

		if(isPost(req)){
			/** Sanitize Data **/
			req.body	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let id		= (req.params.id) ? req.params.id :"";

			if(id == "" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '')){
				/** Send error response **/
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}
			

			const clone						=	require('clone');
			let allData						=	req.body;
			let subscriptionCarType			= 	(req.body.car_type)			?	req.body.car_type			: "";			
			let subscriptionPrice			= 	(req.body.price)			?	req.body.price				: "";
			let subscriptionTotalService	= 	(req.body.total_service)	?	req.body.total_service		: "";
			let subscriptionValidityPeriod	= 	(req.body.validity_period)	?	req.body.validity_period	: "";
			
			let offerPrice			= 	(req.body.offer_price)		?	Number(req.body.offer_price)	: 0;
			let offerType			= 	(req.body.offer_type)		?	req.body.offer_type				: "";
			let vatIncluded			= 	(req.body.vat_included)		?	Number(req.body.vat_included)	: "";
			let mrpPrice			=	subscriptionPrice;
			
			if(offerPrice > 0 ){
				if(offerType == PERCENT_OF_AMOUNT){
					mrpPrice	=	(Number(subscriptionPrice) * 100 ) / (100 - Number(offerPrice));
				}
				else {
					mrpPrice	=	Number(offerPrice) + Number(subscriptionPrice);
				}
			}
			
			req.body						=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let subscriptionName			=	(req.body.subscription_name)	?	req.body.subscription_name	: "";
			let description					= 	(req.body.body)					?	req.body.body				: "";
			
			if(description!= "") req.body.body =  description.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();

			let shortDescription	= 	(req.body.short_description)	?	req.body.short_description			: "";

			req.body.old_subscription_image = allData.old_subscription_image;
			  
			let subscriptionImage 	= 	(req.files && req.files.subscription_image) ? req.files.subscription_image : ""; 
			let oldSubscriptionImg 	= 	subscriptionImage ? "" : req.body.old_subscription_image || "";
			

			asyncParallel({
                subscription_image :(callback) => {
                    moveUploadedFile(req, res,{
						'image' 	:	subscriptionImage,
						'filePath' 	: 	SUBSCRIPTION_FILE_PATH,
						oldPath 	: 	oldSubscriptionImg

					}).then(contentRes=>{
						callback(null,contentRes)
					});

                },				
            },(asyncErr, asyncRes) => {
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];
 
				/** Update subscription details **/
				let conditionsObj = { _id: new ObjectId(id) };
				let updateRecordObj = {
					$set: {
						subscription_name	: 	subscriptionName,
						car_type  			: 	subscriptionCarType,						
						price  				: 	subscriptionPrice,
						mrp_price  			: 	mrpPrice,
						offer_price			: 	offerPrice,
						offer_type  		: 	offerType,
						vat_included  		: 	vatIncluded,
						total_service		: 	subscriptionTotalService,
						validity_period		: 	subscriptionValidityPeriod,
						short_description	:	shortDescription,
						pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions : {},
						default_language_id	:   DEFAULT_LANGUAGE_CODE,
						description,
						modified			:   getUtcDate(),
					}
				}

				let subscriptionImage 	= (asyncRes && asyncRes.subscription_image && asyncRes.subscription_image.fileName)  ? asyncRes.subscription_image.fileName 	: ''; 				

				/** Upadate images */
				if(subscriptionImage) updateRecordObj.$set.subscription_image	= subscriptionImage;
				

				/** subscription Options  */
				let optionObj = {
					conditions: conditionsObj,
					updateData: updateRecordObj,
				}

				/** Upadate subscription details */
				SubscriptionModel.updateOneSubscription(req, res, optionObj).then(updateResult => {
					let responseStatus = (updateResult.status) ? updateResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.subscription.subscription_details_has_been_updated_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'subscription-management',
							message: res.__("admin.subscription.subscription_details_has_been_updated_successfully"),
						});
					}
				});
			});
		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get subscription details **/
				getSubscriptionDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'subscription-management');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/subscription/edit']);
					
					let details = (response.result) ? response.result :{};
					let subscriptionImage = (details.subscription_image) ? details.subscription_image : "";				

					res.render('edit',{
						result					:	details,
						language_list			:	languageList,
						image_url				:   SUBSCRIPTION_URL,
						subscription_image    	: 	subscriptionImage,						

					});
				}).catch(next);
			}).catch(next);
		}
	};//End editSubscription()
 

	/**
     * Function for update Subscription content status
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.updateSubscriptionStatus = (req, res, next) =>{
        let subscriptionId 		= (req.params.id) ? req.params.id : "";
        let subscriptionStatus 	= (req.params.status) ? req.params.status : "";

        if (!subscriptionId || !subscriptionStatus) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
            return;
        }else{

            /** Set update data **/
            let updateData = {
                $set: {
					is_active : (subscriptionStatus == ACTIVE) ? DEACTIVE : ACTIVE,
                    modified: getUtcDate()
                }
            };

            let condition = {
                _id : new ObjectId(subscriptionId), is_deleted: NOT_DELETED
            }

            let optionObj = {
                conditions : condition,
                updateData : updateData
            }

            SubscriptionModel.updateOneSubscription(req,res,optionObj).then(updateResponse=>{
				if(updateResponse.status == STATUS_SUCCESS){
                    let message = res.__("admin.subscription.subscription_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
                }else{
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
                }
            });
        }
    }
	

	/**
     * Function for delete Subscription 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.deleteSubscription = (req, res, next) =>{
        let subscriptionId 		= (req.params.id) ? req.params.id : "";
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminId = (adminUser._id) ? adminUser._id : "";
        if (!subscriptionId) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
            return;
        }
		else{

            /** Set update data **/
            let updateData = {
                $set: {
					is_deleted 	: DELETED,
					deleted_by 	: new ObjectId(adminId),
                    modified	: getUtcDate(),
                    deleted_at	: getUtcDate()
                }
            };

            let condition = {
                _id : new ObjectId(subscriptionId)
            }

            let optionObj = {
                conditions : condition,
                updateData : updateData
            }

            SubscriptionModel.updateOneSubscription(req,res,optionObj).then(updateResponse=>{
				if(updateResponse.status == STATUS_SUCCESS){
                    let message = res.__("admin.subscription.subscription_deleted_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
                }else{
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
                }
            });
        }
    }


	/**
	 * Function for view Subscription's detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewSubscriptionDetails = (req,res,next)=>{

		/** Get Subscription details **/
		getSubscriptionDetails(req, res, next).then(async (response)=>{
			if(response.status != STATUS_SUCCESS){
				/** Send error response **/
				req.flash(STATUS_ERROR,response.message);
				res.redirect(WEBSITE_ADMIN_URL+"subscription-management");
				return;
			}
			
			let created_by_name = await getUserName(response.result.create_by);
			if(response.result.create_by){
				response.result.created_by_name = created_by_name;
			}
			let vatOnPackage = Number(res.locals.settings["Vat.subscription_vat_amount"]);
			response.result.total_price = Number(response.result.price);
			if(response.result.vat_included != ACTIVE){
				let packagePrice = Number(response.result.price);
				let vatAmount = Number(vatOnPackage/100) * Number(packagePrice);
				let packagePriceWithVat = Number(packagePrice) + Number(vatAmount);
				response.result.total_price = packagePriceWithVat;
			}
			
			response.result.vat = vatOnPackage 

			/** Render view page  **/
			req.breadcrumbs(BREADCRUMBS['admin/subscription/view']);
			res.render('view',{
				result	:	(response.result) ? response.result	:{},
			});
		}).catch(next);
	};//End viewSubscriptionDetails()
	
}
module.exports = new Subscription();



