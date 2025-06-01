const PackageModel = require("./model/Package");
const asyncParallel 		 = require('async/parallel');
const asyncEach = require("async/each");

const { ObjectId } = require('mongodb');
const { errorMonitor } = require("events");
function Package() {

	PACKAGE = this;

	/**
	 * Function to get package list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getPackageList = (req, res,next)=>{
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
							"package_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{$skip : skip},
								{$limit : limit},
							],
							"package_all_count" : [
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
							"package_filter_count" : [
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

                PackageModel.getAggregatePackageList(req,res,optionObj).then(packageRes=>{
					let responseStatus = (packageRes.status) ? packageRes.status : "";
                    let responseResult = (packageRes.result && packageRes.result[0]) ? packageRes.result[0] : "";
                    let packageList  		= (responseResult && responseResult.package_list) ? responseResult.package_list  : [];
                    let packageAllCount 	= (responseResult && responseResult.package_all_count && responseResult.package_all_count[0] && responseResult.package_all_count[0]["count"]) ? responseResult.package_all_count[0]["count"] : DEACTIVE;
                    let packageFilterCount 	= (responseResult && responseResult.package_filter_count && responseResult.package_filter_count[0] && responseResult.package_filter_count[0]["count"]) ? responseResult.package_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   packageList,
                        recordsTotal	:	packageAllCount,
                        recordsFiltered	:  	packageFilterCount,
                    });
				})
				
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/packages/list']);
						
			res.render('list',{image_url		:	PACKAGE_URL});
		}
	};//End getPackageList()

	
	/**
	 * Function to get package's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getPackageDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let packageId = (req.params.id) ? req.params.id : "";
			/** Get package details **/
			let conditionsObj = { _id: new ObjectId(packageId) };
			let optionObj = {
				conditions: conditionsObj, is_deleted: NOT_DELETED
			}
			PackageModel.getPackageFindOne(optionObj).then(packageRes => {
				let result = (packageRes.result) ? packageRes.result : "";

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
	};// End getPackageDetails().

	
	/**
	 * Function for add package
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addPackage = (req, res,next)=>{

		var adminUser = (req.session.user) ? req.session.user : {};
		var adminId 	= (adminUser._id) ? adminUser._id : "";
		if(isPost(req)){
			let packageImage 		= (req.files && req.files.package_image) ? req.files.package_image : ""; 
			let packageVideo 		= (req.files && req.files.package_video) ? req.files.package_video : ""; 

			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			if(req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone				= 	require('clone');
			let allData				= 	req.body;
			let packageCarType		= 	(req.body.car_type)		?	req.body.car_type		: "";
			let packageDuration		= 	(req.body.duration)		?	req.body.duration		: "";
			let packagePrice		= 	(req.body.price)		?	Number(req.body.price)	: "";
			
			let offerPrice			= 	(req.body.offer_price)		?	Number(req.body.offer_price)	: 0;
			let offerType			= 	(req.body.offer_type)		?	req.body.offer_type				: "";
			let providerType		= 	(req.body.provider_type)		?	req.body.provider_type				: "";
			let travelTime			= 	(req.body.travel_time)		?	Number(req.body.travel_time)	: "";
			let vatIncluded			= 	(req.body.vat_included)		?	Number(req.body.vat_included)	: "";
			let mrpPrice			=	packagePrice;
			
			if(offerPrice > 0 ){
				if(offerType == PERCENT_OF_AMOUNT){
					mrpPrice	=	(Number(packagePrice) * 100 ) / (100 - Number(offerPrice));
				}
				else {
					mrpPrice	=	Number(offerPrice) + Number(packagePrice);
				}
			}
			 
			req.body				=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let packageName			= 	(req.body.package_name)	?	req.body.package_name	: "";
			let description			= 	(req.body.body)			?	req.body.body			: "";
			
			if(description!= "") req.body.body =  description.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();

			let shortDescription	= 	(req.body.short_description)	?	req.body.short_description			: "";

			asyncParallel({
                get_slug : (callback) => {					
                    getDatabaseSlug({
						title 		:	packageName,
						table_name 	: 	TABLE_PACKAGES,
						slug_field 	: 	"slug"
					}).then(slugRes=>{
						callback(null,slugRes.title || "");
					});
                },
				package_image :(callback) => {
					if(!packageImage) return callback(null,null);
                    moveUploadedFile(req, res,{
						image 		:	packageImage,
						filePath 	: 	PACKAGE_FILE_PATH,
						oldPath 	: 	""
						
					}).then(bannerRes=>{
						callback(null,bannerRes)
					});
                },
				package_video :(callback) => {
					if(!packageVideo) return callback(null,null);

					let options = {
                        image: packageVideo,
                        filePath: PACKAGE_FILE_PATH,
                        allowedExtensions: ALLOWED_VIDEO_EXTENSIONS,
                        allowedImageError: ALLOWED_VIDEO_ERROR_MESSAGE,
                        allowedMimeTypes: ALLOWED_VIDEO_MIME_EXTENSIONS,
                        allowedMimeError: ALLOWED_VIDEO_MIME_ERROR_MESSAGE,
                    };

                    moveUploadedFile(req, res,options).then(videoRes=>{
						callback(null,videoRes)
					});
                },
            },(asyncErr, asyncRes) => {
				
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];

				if(asyncRes && asyncRes.package_image && asyncRes.package_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'package_image',path:'package_image',msg:asyncRes.package_image.message});
				}


				let slug 		= (asyncRes && asyncRes.get_slug) ? asyncRes.get_slug : "";
				let packageImg 	= (asyncRes && asyncRes.package_image && asyncRes.package_image.fileName)  	? asyncRes.package_image.fileName 	: '';
				let packageVideo 	= (asyncRes && asyncRes.package_video && asyncRes.package_video.fileName)  	? asyncRes.package_video.fileName 	: '';

				let optionObj = {
					insertData: {
						create_by 			: 	new ObjectId(adminId),
						package_image 		: 	packageImg,
						package_video 		: 	packageVideo,
						package_name  		: 	packageName,
						car_type  			: 	packageCarType,
						duration  			: 	packageDuration,
						price  				: 	packagePrice,
						mrp_price  			: 	mrpPrice,
						offer_price			: 	offerPrice,
						offer_type  		: 	offerType,
						provider_type  		: 	providerType,
						travel_time  		: 	travelTime,
						vat_included  		: 	vatIncluded,
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

				PackageModel.savePackage(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.package.package_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'package-management',
							message: res.__("admin.package.package_has_been_added_successfully")
						});
					}
				})
            });
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/packages/add']);
				/**Render add Package page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addPackage()

	
	/**
	 * Function to update Package's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.editPackage = (req, res,next)=>{

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
			

			const clone		= require('clone');
			let allData		= req.body;
			
			let packageCarType		= 	(req.body.car_type)		?	req.body.car_type		: "";
			let packageDuration		= 	(req.body.duration)		?	req.body.duration		: "";
			let packagePrice		= 	(req.body.price)		?	req.body.price			: "";
			
			let offerPrice			= 	(req.body.offer_price)		?	Number(req.body.offer_price)	: 0;
			let offerType			= 	(req.body.offer_type)		?	req.body.offer_type				: "";
			let providerType		= 	(req.body.provider_type)	?	req.body.provider_type				: "";
			let travelTime			= 	(req.body.travel_time)		?	Number(req.body.travel_time)	: "";
			let vatIncluded			= 	(req.body.vat_included)		?	Number(req.body.vat_included)	: "";
			let mrpPrice			=	packagePrice;
			
			if(offerPrice > 0 ){
				if(offerType == PERCENT_OF_AMOUNT){
					mrpPrice	=	(Number(packagePrice) * 100 ) / (100 - Number(offerPrice));
				}
				else {
					mrpPrice	=	Number(offerPrice) + Number(packagePrice);
				}
			}
			
			req.body		= clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);

			let packageName			= 	(req.body.package_name)			?	req.body.package_name				: "";
			let description			= 	(req.body.body)					?	req.body.body						: "";
			
			if(description!= "") req.body.body =  description.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();

			let shortDescription	= 	(req.body.short_description)	?	req.body.short_description			: "";
			 
			req.body.old_package_image = allData.old_package_image;
			req.body.old_package_video = allData.old_package_video;

			let packageImage 	= 	(req.files && req.files.package_image) ? req.files.package_image : ""; 
			let oldPackageImg 	= 	packageImage ? "" : req.body.old_package_image || "";

			let packageVideo 		= (req.files && req.files.package_video) ? req.files.package_video : "";
			let oldPackageVideo 	= 	packageVideo ? "" : req.body.old_package_video || "";
 
			  
			asyncParallel({
                package_image :(callback) => {
                    moveUploadedFile(req, res,{
						'image' 	:	packageImage,
						'filePath' 	: 	PACKAGE_FILE_PATH,
						oldPath 	: 	oldPackageImg

					}).then(contentRes=>{
						callback(null,contentRes)
					});

                },
				package_video :(callback) => {
					if(!packageVideo) return callback(null,null);

					let options = {
                        image: packageVideo,
						oldPath : 	oldPackageVideo,
                        filePath: PACKAGE_FILE_PATH,
                        allowedExtensions: ALLOWED_VIDEO_EXTENSIONS,
                        allowedImageError: ALLOWED_VIDEO_ERROR_MESSAGE,
                        allowedMimeTypes: ALLOWED_VIDEO_MIME_EXTENSIONS,
                        allowedMimeError: ALLOWED_VIDEO_MIME_ERROR_MESSAGE,
                    };

                    moveUploadedFile(req, res,options).then(videoRes=>{
						callback(null,videoRes)
					});
                },
            },(asyncErr, asyncRes) => {
				
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];
 
				/** Update Package details **/
				let conditionsObj = { _id: new ObjectId(id) };
				let updateRecordObj = {
					$set: {
						package_name  		: 	packageName,
						car_type  			: 	packageCarType,
						duration  			: 	packageDuration,
						price  				: 	packagePrice,
						mrp_price  			: 	mrpPrice,
						offer_price			: 	offerPrice,
						offer_type  		: 	offerType,
						provider_type  		: 	providerType,
						travel_time  		: 	travelTime,
						vat_included  		: 	vatIncluded,
						short_description	:	shortDescription,
						pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions : {},
						default_language_id	:   DEFAULT_LANGUAGE_CODE,
						description,
						modified			:   getUtcDate(),
					}
				}

				let packageImage 	= (asyncRes && asyncRes.package_image && asyncRes.package_image.fileName)  	? asyncRes.package_image.fileName 	: ''; 
				let packageVideoName 	= (asyncRes && asyncRes.package_video && asyncRes.package_video.fileName)  ? asyncRes.package_video.fileName 	: ''; 

				/** Upadate images */
				if(packageImage) updateRecordObj.$set.package_image	= packageImage;
				if(packageVideoName) updateRecordObj.$set.package_video	= packageVideoName;

				/** Package Options  */
				let optionObj = {
					conditions: conditionsObj,
					updateData: updateRecordObj,
				}

				/** Upadate Package details */
				PackageModel.updateOnePackage(req, res, optionObj).then(updateResult => {
					let responseStatus = (updateResult.status) ? updateResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.package.package_details_has_been_updated_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'package-management',
							message: res.__("admin.package.package_details_has_been_updated_successfully"),
						});
					}
				});
			});
		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get Package details **/
				getPackageDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'package-management');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/package/edit']);
					
					let details = (response.result) ? response.result :{};
					let packageImage = (details.package_image) ? details.package_image : "";
					let packageVideo = (details.package_video) ? details.package_video : "";

					res.render('edit',{
						result			: 	details,
						language_list	:	languageList,
						image_url		:   PACKAGE_URL,
						package_image   : 	packageImage,
						package_video   : packageVideo
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editPackage()
 

	/**
     * Function for update Package content status
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.updatePackageStatus = (req, res, next) =>{
        let packageId 		= (req.params.id) ? req.params.id : "";
        let packageStatus 	= (req.params.status) ? req.params.status : "";

        if (!packageId || !packageStatus) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"package-management");
            return;
        }else{

            /** Set update data **/
            let updateData = {
                $set: {
					is_active : (packageStatus == ACTIVE) ? DEACTIVE : ACTIVE,
                    modified: getUtcDate()
                }
            };

            let condition = {
                _id : new ObjectId(packageId), is_deleted: NOT_DELETED
            }

            let optionObj = {
                conditions : condition,
                updateData : updateData
            }

            PackageModel.updateOnePackage(req,res,optionObj).then(updateResponse=>{
				if(updateResponse.status == STATUS_SUCCESS){
                    let message = res.__("admin.package.package_status_has_been_updated_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL+"package-management");
                }else{
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL+"package-management");
                }
            });
        }
    }


	/**
     * Function for delete Package 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
	this.deletePackage = (req, res, next) =>{
        let packageId 		= (req.params.id) ? req.params.id : "";
		var adminUser = (req.session.user) ? req.session.user : {};
		var adminId = (adminUser._id) ? adminUser._id : "";
        if (!packageId) {
            /** Send error response **/
            req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"package-management");
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
                _id : new ObjectId(packageId)
            }

            let optionObj = {
                conditions : condition,
                updateData : updateData
            }

            PackageModel.updateOnePackage(req,res,optionObj).then(updateResponse=>{
				if(updateResponse.status == STATUS_SUCCESS){
                    let message = res.__("admin.package.package_deleted_successfully");
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL+"package-management");
                }else{
                    let message = res.__("admin.system.something_going_wrong_please_try_again");
                    req.flash(STATUS_ERROR, message);
                    res.redirect(WEBSITE_ADMIN_URL+"package-management");
                }
            });
        }
    }
	
	
	/**
	 * Function for view package's detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render
	 */
	this.viewPackageDetails = (req,res,next)=>{

		/** Get package details **/
		getPackageDetails(req, res, next).then(async (response)=>{
			if(response.status != STATUS_SUCCESS){
				/** Send error response **/
				req.flash(STATUS_ERROR,response.message);
				res.redirect(WEBSITE_ADMIN_URL+"package-management");
				return;
			}

			let created_by_name = await getUserName(response.result.create_by);
			if(response.result.create_by){
				response.result.created_by_name = created_by_name;
			}
			let vatOnPackage = Number(res.locals.settings["Vat.package_vat_amount"]);

			response.result.total_price = Number(response.result.price);
			if(response.result.vat_included != ACTIVE){
				let packagePrice = Number(response.result.price);
				let vatAmount = Number(vatOnPackage/100) * Number(packagePrice);
				let packagePriceWithVat = Number(packagePrice) + Number(vatAmount);
				response.result.total_price = packagePriceWithVat;
			}
			
			response.result.vat = vatOnPackage 
		
			/** Render view page  **/
			req.breadcrumbs(BREADCRUMBS['admin/packages/view']);
			res.render('view',{
				result	:	(response.result) ? response.result	:{},
			});
		}).catch(next);
	};//End viewPackageDetails()
	
}
module.exports = new Package();



