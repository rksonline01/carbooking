const async	= require("async");

function PostReviews() {

	/**
	 * Function for get post review list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getAdReviews = (req, res, next)=>{
		if(isPost(req)){
			let limit			= 	(req.body.length) 			? 	parseInt(req.body.length) 			:	ADMIN_LISTING_LIMIT;
			let skip			=	(req.body.start) 			?	parseInt(req.body.start)			:	DEFAULT_SKIP;
			let statusSearch	= 	(req.body.status_search)	? 	parseInt(req.body.status_search)	:	'';
			
			const collection	= 	db.collection(TABLE_REVIEWS);

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				/** Set conditions **/
				let commonConditions = {
					is_deleted	: NOT_DELETED,
					type 		: PRODUCT_REVIEW,
				};
				
				/** Conditions for search using status*/
				if (statusSearch != "") {
					switch(statusSearch){
						case SEARCHING_ACTIVE:						
							dataTableConfig.conditions["status"] 		= 	ACTIVE;
						break;

						case SEARCHING_DEACTIVE:
							dataTableConfig.conditions["status"] 		= 	DEACTIVE;
						break;
					}
				}
				
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);
				async.parallel([
					(callback)=>{
						/** Get list of blog's **/
						collection.aggregate([
							{ "$match":dataTableConfig.conditions},
							{ "$sort": dataTableConfig.sort_conditions},
							{ "$skip": skip },
							{ "$limit": limit },
							{$lookup:{
								from			: TABLE_PRODUCTS,
								localField		: 'review_for',
								foreignField	: '_id',
								as				: 'productDetails'
							}},
							{"$project": {
								review_for	: 1, full_name : 1, email : 1, review : 1,type : 1,rating : 1, status : 1, is_approved : 1, modified : 1, created : 1,"productDetails": { "$arrayElemAt": [ "$productDetails.product_title", 0 ] }, "main_image_name": { "$arrayElemAt": [ "$productDetails.main_image_name", 0 ]},
								
							}}
						]).collation(COLLATION_VALUE).toArray((err, result)=>{
							let options = {
								"file_url" 			: 	ADS_IMAGE_URL['image_url_150_X_100'],
								"file_path" 		: 	ADS_FILE_150_X_100_FILE_PATH,
								"result" 			: 	result,
								"database_field" 	: 	"main_image_name"
							};
		
							/** Append image with full path **/
							appendFileExistData(options).then(response=>{
								result = (response && response.result)	?	response.result	:[];
								callback(err, result);
							});
						});
					},
					(callback)=>{
						/** Get total number of records in blogs collection **/
						collection.find(dataTableConfig.conditions).count((err,countResult)=>{
							callback(err, countResult);
						});
					},
					(callback)=>{
						/** Get filtered records counting in blogs **/
						collection.find(dataTableConfig.conditions).count((err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				],
				(err, response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response[0]) ? response[0] :[],
						recordsFiltered	: (response[2]) ? response[2] :0,
						recordsTotal	: (response[1]) ? response[1] :0
					});
				});
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/posts/reviews/list"]);
			res.render('reviews/list');
		}
	};//End getAdReviews()

	/**
	 * Function to get review detail
	 *
	 * @param req		As Request Data
	 * @param res		As Response Data
	 *
	 * @return json
	 */
	getProductReviewDetails = (req,res)=>{	
		return new Promise(resolve=>{
			let reviewId = (req.params.id) ? req.params.id : "";
			if(!reviewId || reviewId ==""){
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.invalid_access")
				};
				return resolve(response);
			}
			try{
				/** Get block details **/
				const reviews = db.collection(TABLE_REVIEWS);
				reviews.aggregate([
					{
						$match :{
							_id : ObjectId(reviewId)
						}
					},
					{
						$lookup : {
							from : TABLE_PRODUCTS,
							localField : 'review_for',
							foreignField : '_id',
							as : 'productDetails'
						}
					},
					{
						$project : {
							_id:1, user_id:1, review_for:1, order_item_id:1, full_name:1, email:1, type:1, review:1, rating:1,
							product_name : {$arrayElemAt:["$productDetails.product_title",0]}
						}
					}
				]).toArray((err, result)=>{
						if(result[0]){
							/** Send success response **/
							let response = {
								status	: STATUS_SUCCESS,
								result	: (result[0])	?	result[0]	:{}
							};
							return resolve(response);
						}else{
							/** Send error response */
							let response = {
								status	: STATUS_ERROR,
								message	: res.__("admin.system.invalid_access")
							};
							resolve(response);
						}
					}
				);
			}catch(e){
				/** Send error response */
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.something_going_wrong_please_try_again")
				};
				resolve(response);
			}
		});
	};//End getReviewDetails()
	
	/**
	 * Function for update review detail
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.editReview = (req, res, next)=>{
		if(isPost(req)){
			/** Sanitize Data **/
			req.body	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let id 		= (req.params.id)	? req.params.id 			: "";

			let review	= (req.body.review)	? req.body.review 			: '';
			/** insert block record */
			let updateData	=	{
				review		: review,
				modified 	: getUtcDate(),
			}

			const reviews = db.collection(TABLE_REVIEWS);
			reviews.updateOne({
				_id : ObjectId(id)
			},
			{$set: updateData},(err)=>{
				if(err) return next(err);
				
				/** Send success response **/
				req.flash("success",res.__("admin.posts.review_has_been_updated_successfully"));
				res.send({
					status			: 	STATUS_SUCCESS,
					redirect_url	:	WEBSITE_ADMIN_URL+"posts/reviews",
					message			: 	res.__("admin.posts.review_has_been_updated_successfully"),
				});
			});
		}else{
			/** Get review details **/
			getProductReviewDetails(req, res).then((responseReview)=>{
				if(responseReview.status == STATUS_SUCCESS){
					req.breadcrumbs(BREADCRUMBS['admin/posts/reviews/edit']);
					res.render('reviews/edit',{
						record	: (responseReview && responseReview.result)		?	responseReview && responseReview.result	: {},
					});
				
				}else{
					/** Send error response **/
					req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
					res.redirect(WEBSITE_ADMIN_URL+"posts/reviews");
				}
			});
		}
	};//End editReview()
	/**
	 * Function for update review status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.updateReviewStatus = (req,res, next)=>{
		let recordId		 = 	(req.params.id) 			?	req.params.id 			:"";
		let recordStatus	=	(req.params.status) 		? req.params.status : '';
		let statusType		=	(req.params.status_type) 	? req.params.status_type : '';
		
		if(recordId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))){
			let updateData = {
				modified : getUtcDate()
			};

			if(statusType == ACTIVE_INACTIVE_STATUS){
				updateData['status']	=	(recordStatus == ACTIVE) ? DEACTIVE :ACTIVE;
			}

			/**update status*/
			const collection = db.collection(TABLE_REVIEWS);
			collection.findOneAndUpdate({ _id : ObjectId(recordId) },{ $set : updateData },{ returnNewDocument: true },(err,result)=>{
				if(err) return next(err);
				var updatedValue = (result.value) ? result.value : {};

				/* If record is updated then update product rating */
				if( updatedValue && updatedValue.review_for ){
					let ratingoptions = {
						post_id : ObjectId(updatedValue.review_for),
					};
	
					/** Update Product Rating **/
					updateProductAverageRating(req,res,ratingoptions);
				}

				let review_for = (updatedValue.review_for) ? updatedValue.review_for : '';
				let fullName = (updatedValue.full_name)	? updatedValue.full_name : '';
				let userId = (updatedValue.user_id)	? updatedValue.user_id : '';
				
				const productCollection = db.collection(TABLE_PRODUCTS);

				productCollection.findOne({_id : ObjectId(review_for)},(productErr, productResult)=>{

					let productName 	= (productResult.product_title) ? (productResult.product_title) : '';
					let productNameAr 	= (productResult.pages_descriptions && productResult.pages_descriptions[ARABIC_LANGUAGE_CODE] && productResult.pages_descriptions[ARABIC_LANGUAGE_CODE].product_title) ? productResult.pages_descriptions[ARABIC_LANGUAGE_CODE].product_title : productResult.product_title;
					let status 			= (recordStatus == ACTIVE) ? 'deactivated' :  'activated';
					let statusAr 		= (recordStatus == ACTIVE) ? 'معطل'  :  'مفعل';
					
					
					let notificationMessageParams = {} ;			
					notificationMessageParams[DEFAULT_LANGUAGE_CODE] = [fullName,PRODUCT_REVIEW,productName,status]; 
					notificationMessageParams[ARABIC_LANGUAGE_CODE]  = [fullName,PRODUCT_REVIEW_AR,productNameAr,statusAr];

					let notificationOptions 		= {
						notification_data : {
							notification_type	: NOTIFICATION_REVIEW_STATUS_UPDATED,
							message_params		: notificationMessageParams,
							parent_table_id		: userId,
							user_id				: userId,
							user_ids			: [userId],
							user_role_id		: FRONT_SITE_USER_ROLE_ID,
							role_id				: FRONT_SITE_USER_ROLE_ID,
							created_by			: ADMIN_ID,
							notification_for	: BUYER,
							send_pn				: ACTIVE,
							pn_type				: PN_TYPE_CONFIG.review_status_updated,
							notification_action	: PN_TYPE_CONFIG.review_status_updated,							
							extra_parameters	: {
								user_id	: ObjectId(userId),
								type : PRODUCT_REVIEW
							}
						}
					};

					insertNotifications(req,res,notificationOptions).then(notificationResponse=>{ });

					/** Send success response **/
					req.flash(STATUS_SUCCESS,res.__("admin.posts.review_status_successfully_updated"));
					res.redirect(WEBSITE_ADMIN_URL+"posts/reviews");
				});
			});
			
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"posts/reviews");
		}
	}; //end updateReviewStatus
	
	/**
	 * Function for Approve Review
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	*/
	this.approveReview = (req, res, next) => {
		let reviewId      = (req.params.id)     ? req.params.id     : "";

		/** Set update review data **/
		let updateData = {
			modified	: getUtcDate(),
			is_approved : ACTIVE,
		};

		/** Approve review */
		const collection = db.collection(TABLE_REVIEWS);
		collection.findOneAndUpdate({ _id : ObjectId(reviewId) },{ $set : updateData },{ returnNewDocument: true },(err,result)=>{
			if (err) return next(err);
			var updatedValue = (result.value) ? result.value : {};

			/* If record is updated then update product rating */
			if( updatedValue && updatedValue.review_for ){
				let ratingoptions = {
					post_id : ObjectId(updatedValue.review_for),
				};

				/** Update Product Rating **/
				updateProductAverageRating(req,res,ratingoptions);
			}

			let review_for = (updatedValue.review_for) ? updatedValue.review_for : '';
			let fullName = (updatedValue.full_name)	? updatedValue.full_name : '';
			let userId = (updatedValue.user_id)	? updatedValue.user_id : '';

			const productCollection = db.collection(TABLE_PRODUCTS);

			productCollection.findOne({_id : ObjectId(review_for)},(productErr, productResult)=>{

				let productName = (productResult.product_title) ? (productResult.product_title) : '';
				let productNameAr 	= (productResult.pages_descriptions && productResult.pages_descriptions[ARABIC_LANGUAGE_CODE] && productResult.pages_descriptions[ARABIC_LANGUAGE_CODE].product_title) ? productResult.pages_descriptions[ARABIC_LANGUAGE_CODE].product_title : productResult.product_title;
				

				let notificationMessageParams = {} ;			
				notificationMessageParams[DEFAULT_LANGUAGE_CODE] = [fullName,PRODUCT_REVIEW,productName]; 
				notificationMessageParams[ARABIC_LANGUAGE_CODE]  = [fullName,PRODUCT_REVIEW_AR,productNameAr];

				let notificationOptions 		= {
					notification_data : {
						notification_type	: NOTIFICATION_REVIEW_APPROVED,
						message_params		: notificationMessageParams,
						parent_table_id		: userId,
						user_id				: userId,
						user_ids			: [userId],
						user_role_id		: FRONT_SITE_USER_ROLE_ID,
						role_id				: FRONT_SITE_USER_ROLE_ID,
						created_by			: ADMIN_ID,
						notification_for	: BUYER,
						send_pn				: ACTIVE,
						pn_type				: PN_TYPE_CONFIG.review_approved,
						notification_action	: PN_TYPE_CONFIG.review_approved,							
						extra_parameters	: {
							user_id	: ObjectId(userId),
							type : PRODUCT_REVIEW
						}
					}
				};

				insertNotifications(req,res,notificationOptions).then(notificationResponse=>{ });

				/** Send success response **/
				req.flash(STATUS_SUCCESS,res.__("admin.posts.review_is_approved_successfully"));
				res.redirect(WEBSITE_ADMIN_URL+"posts/reviews");
			});
		});
	};//End approveReview()

	/**
	 * Function for delete review
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	*/
	this.deleteReview = (req, res, next) => {
		let reviewId	= (req.params.id)     	? req.params.id     	: "";
		let userId		= (req.session.user) 	? req.session.user._id	: "";

		/**For Update Review details */
		const collection = db.collection(TABLE_REVIEWS);
		collection.findOneAndUpdate({ _id : ObjectId(reviewId) },{ $set : { is_deleted: DELETED, deleted_by : ObjectId(userId) } },{ returnNewDocument: true },(err,result)=>{
			if (err) return next(err);
			var updatedValue = (result.value) ? result.value : {};

			/* If record is updated then update product rating */
			if( updatedValue && updatedValue.review_for ){
				let ratingoptions = {
					post_id : ObjectId(updatedValue.review_for),
				};

				/** Update Product Rating **/
				updateProductAverageRating(req,res,ratingoptions);
			}

			let review_for = (updatedValue.review_for) ? updatedValue.review_for : '';
			let fullName = (updatedValue.full_name)	? updatedValue.full_name : '';
			let userId = (updatedValue.user_id)	? updatedValue.user_id : '';

			const productCollection = db.collection(TABLE_PRODUCTS);

			productCollection.findOne({_id : ObjectId(review_for)},(productErr, productResult)=>{

				let productName = (productResult.product_title) ? (productResult.product_title) : '';

				let notificationMessageParams = {} ;			
					notificationMessageParams[DEFAULT_LANGUAGE_CODE] = [fullName,productName]; 
					notificationMessageParams[ARABIC_LANGUAGE_CODE]  = [fullName,productName];

				let notificationOptions 		= {
					notification_data : {
						notification_type	: NOTIFICATION_REVIEW_DELETED,
						message_params		: notificationMessageParams,
						parent_table_id		: userId,
						user_id				: userId,
						user_ids			: [userId],
						user_role_id		: FRONT_SITE_USER_ROLE_ID,
						role_id				: FRONT_SITE_USER_ROLE_ID,
						created_by			: ADMIN_ID,
						notification_for	: BUYER,
						send_pn				: ACTIVE,
						pn_type				: PN_TYPE_CONFIG.review_deleted,
						notification_action	: PN_TYPE_CONFIG.review_deleted,							
						extra_parameters	: {
							user_id	: ObjectId(userId),
						}
					}
				};

				insertNotifications(req,res,notificationOptions).then(notificationResponse=>{ });
				/** Send success response **/
				req.flash(STATUS_SUCCESS,res.__("admin.posts.review_deleted_successfully"));
				res.redirect(WEBSITE_ADMIN_URL+"posts/reviews");
			});
		});
	};//End deleteReview()
}

module.exports = new PostReviews();
