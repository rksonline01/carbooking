const CmsModel = require("./model/Cms");
const asyncParallel 		 = require('async/parallel');
const turf = require('@turf/turf');

const { ObjectId } = require('mongodb');
function Cms() {

	/**
	 * Function to get cms list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getCmsList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;
			const collection = db.collection(TABLE_PAGES);
			const async			= require('async');

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				let search_data = (req.body.search_data) ?  req.body.search_data : [];
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
							"cms_list" : [
								{
									$match : dataTableConfig.conditions
								},
								{
									$project : {
										_id:1, name :1, body:1, status:1, modified :1
									}
								},
								{
									$sort : dataTableConfig.sort_conditions
								},
								{$skip : skip},
								{$limit : limit},
							],
							"cms_all_count" : [
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
							"cms_filter_count" : [
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

                CmsModel.getAggregateCMSList(req,res,optionObj).then(cmsResponse=>{
					let responseStatus = (cmsResponse.status) ? cmsResponse.status : "";
                    let responseResult = (cmsResponse.result && cmsResponse.result[0]) ? cmsResponse.result[0] : "";
                    
                    let cms_list  = (responseResult && responseResult.cms_list ) ? responseResult.cms_list  : [];
                    let cms_all_count = (responseResult && responseResult.cms_all_count && responseResult.cms_all_count[0] && responseResult.cms_all_count[0]["count"]) ? responseResult.cms_all_count[0]["count"] : DEACTIVE;
                    let cms_filter_count = (responseResult && responseResult.cms_filter_count && responseResult.cms_filter_count[0] && responseResult.cms_filter_count[0]["count"]) ? responseResult.cms_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   cms_list ,
                        recordsTotal	:	cms_all_count,
                        recordsFiltered	:  	cms_filter_count,
                    });
				})
				
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/cms/list']);
			res.render('list');
		}
	};//End getCmsList()

	/**
	 * Function to get cms's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getCmsDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let cmsId = (req.params.id) ? req.params.id : "";
			/** Get Cms details **/
			let conditionsObj = { _id: new ObjectId(cmsId) };
			let optionObj = {
				conditions: conditionsObj,
				fields: { id: 1, name: 1, body: 1, modified: 1, pages_descriptions: 1, banner_image :1,content_image:1 },
			}
			CmsModel.getCmsFindOne(optionObj).then(cmsRes => {
				let result = (cmsRes.result) ? cmsRes.result : "";

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
	};// End getCmsDetails().

	/**
	 * Function to update cms's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editCmsOld = (req, res,next)=>{

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
			req.body		= clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody	= (req.body.body)	? req.body.body	: "";


			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}


			/** Update cms details **/
			let conditionsObj = { _id: new ObjectId(id) };
			let updateRecordObj = {
				$set: {
					body: pageBody,
					name: (req.body.name) ? req.body.name : "",
					meta_title: (req.body.meta_title) ? req.body.meta_title : "",
					meta_description: (req.body.meta_description) ? req.body.meta_description : "",
					meta_keyword: (req.body.meta_keyword) ? req.body.meta_keyword : "",
					default_language_id: DEFAULT_LANGUAGE_CODE,
					pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
					modified: getUtcDate()
				}
			}
			let optionObj = {
				conditions: conditionsObj,
				updateData: updateRecordObj,
			}
			CmsModel.updateOneCms(req, res, optionObj).then(updateResult => {
				let responseStatus = (updateResult.status) ? updateResult.status : "";
				if (responseStatus == STATUS_ERROR) {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				} else {
					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.cms.cms_details_has_been_updated_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'cms',
						message: res.__("admin.cms.cms_details_has_been_updated_successfully"),
					});
				}
			});

		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get cms details **/
				getCmsDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'cms');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/cms/edit']);
					res.render('edit',{
						result			: 	response.result,
						language_list	:	languageList
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editCms()

	/**
	 * Function for add cms
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addCmsOld = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			if(req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}
			const clone		= 	require('clone');
			let allData		= 	req.body;
			req.body		=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody	= 	(req.body.body)	?	req.body.body	:"";
			let pageName	= 	(req.body.name) ? 	req.body.name 	:"";

			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}
			/** Set options **/
			let options = {
				title 		:	pageName,
				table_name 	: 	"pages",
				slug_field 	: 	"slug"
			};

			/** Make Slug */
			getDatabaseSlug(options).then(response=>{
				/** Save Cms details */

				let optionObj = {
					insertData: {
						name: pageName,
						body: pageBody,
						slug: (response && response.title) ? response.title : "",
						meta_title: (req.body.meta_title) ? req.body.meta_title : "",
						meta_description: (req.body.meta_description) ? req.body.meta_description : "",
						meta_keyword: (req.body.meta_keyword) ? req.body.meta_keyword : "",
						default_language_id: DEFAULT_LANGUAGE_CODE,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						created: getUtcDate(),
						modified: getUtcDate()
					}
				}
				CmsModel.saveCms(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.cms.cms_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'cms',
							message: res.__("admin.cms.cms_has_been_added_successfully")
						});
					}
				})

			},error=>{
				/** Send error response */
				res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			});
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/cms/add']);
				/**Render add cms page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addCms()

	/**
	 * Function for add cms
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.addCms = (req, res,next)=>{
		if(isPost(req)){
			let bannerImage  = (req.files && req.files.banner_image) ? req.files.banner_image 	: ""; 
			let contentImage = (req.files && req.files.content_image) ? req.files.content_image : ""; 

			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			if(req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone		= 	require('clone');
			let allData		= 	req.body;
			req.body		=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody	= 	(req.body.body)	?	req.body.body	:"";
			let pageName	= 	(req.body.name) ? 	req.body.name 	:"";
			let title		= 	(req.body.title) ? 	req.body.title 	:"";
			let subTitle	= 	(req.body.sub_title) ? 	req.body.sub_title 	:"";

			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}


			asyncParallel({
                get_slug : (callback) => {					
                    getDatabaseSlug({
						title 		:	pageName,
						table_name 	: 	"pages",
						slug_field 	: 	"slug"
					}).then(slugRes=>{
						callback(null,slugRes.title || "");
					});
                },
                content_image :(callback) => {
					if(!contentImage) return callback(null,null);

                    moveUploadedFile(req, res,{
						'image' 	:	contentImage,
						'filePath' 	: 	CMS_FILE_PATH,
						oldPath : ""

					}).then(contentRes=>{
						callback(null,contentRes)
					});

                },
				banner_image :(callback) => {
					if(!bannerImage) return callback(null,null);
                    moveUploadedFile(req, res,{
						image 		:	bannerImage,
						filePath 	: 	CMS_FILE_PATH,
						oldPath 	: 	""
						
					}).then(bannerRes=>{
						callback(null,bannerRes)
					});
                },
                
            },(asyncErr, asyncRes) => {
				
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];

				if(asyncRes && asyncRes.content_image && asyncRes.content_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'content_image',path:'banner_image', msg : asyncRes.content_image.message});
				}

				if(asyncRes && asyncRes.banner_image && asyncRes.banner_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'banner_image',path:'banner_image',msg:asyncRes.banner_image.message});
				}

				if(errMessageArray.length){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: errMessageArray,
					});
				}

				let slug 		= (asyncRes && asyncRes.get_slug) ? asyncRes.get_slug : "";
				let contentImg 	= (asyncRes && asyncRes.content_image && asyncRes.content_image.fileName)  	? asyncRes.content_image.fileName 	: '';
				let bannerImg 	= (asyncRes && asyncRes.banner_image && asyncRes.banner_image.fileName)  	? asyncRes.banner_image.fileName 	: '';

				let optionObj = {
					insertData: {
						name				: pageName,
						body				: pageBody,
						title 				: title,
						sub_title			: subTitle,
						slug				: slug,
						meta_title			:	 (req.body.meta_title) ? req.body.meta_title : "",
						meta_description	: (req.body.meta_description) ? req.body.meta_description : "",
						meta_keyword		: (req.body.meta_keyword) ? req.body.meta_keyword : "",
						default_language_id	: DEFAULT_LANGUAGE_CODE,
						pages_descriptions	: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						content_image 		: contentImg,
						banner_image 		: bannerImg,
						
						created: getUtcDate(),
						modified: getUtcDate()
					}
				}


				CmsModel.saveCms(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.cms.cms_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'cms',
							message: res.__("admin.cms.cms_has_been_added_successfully")
						});
					}
				})
            });
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/cms/add']);
				/**Render add cms page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addCms()

	/**
	 * Function to update cms's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.editCms = (req, res,next)=>{

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
			req.body		= clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody	= (req.body.body)	? req.body.body	: "";
			let title		= 	(req.body.title) ? 	req.body.title 	:"";
			let subTitle	= 	(req.body.sub_title) ? 	req.body.sub_title 	:"";
			req.body.old_content_image = allData.old_content_image;
			req.body.old_banner_image = allData.old_banner_image;
			
			
			
			let bannerImage  = (req.files && req.files.banner_image) ? req.files.banner_image 	: ""; 
			let contentImage = (req.files && req.files.content_image) ? req.files.content_image : ""; 


			let oldContentImg = contentImage ? "" : req.body.old_content_image || "";
			let oldBannerImg  = bannerImage  ? "" : req.body.old_banner_image || "";


			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}

			asyncParallel({
                content_image :(callback) => {
                    moveUploadedFile(req, res,{
						'image' 	:	contentImage,
						'filePath' 	: 	CMS_FILE_PATH,
						oldPath 	: 	oldContentImg

					}).then(contentRes=>{
						callback(null,contentRes)
					});

                },
				banner_image :(callback) => {
                    moveUploadedFile(req, res,{
						image 		:	bannerImage,
						filePath 	: 	CMS_FILE_PATH,
						oldPath 	: 	oldBannerImg
						
					}).then(bannerRes=>{
						callback(null,bannerRes)
					});
                },
                
            },(asyncErr, asyncRes) => {
				
                if(asyncErr) return next(asyncErr);
				let errMessageArray =[];

				if(asyncRes && asyncRes.content_image && asyncRes.content_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'content_image', path:'content_image',msg : asyncRes.content_image.message});
				}

				if(asyncRes && asyncRes.banner_image && asyncRes.banner_image.status != STATUS_SUCCESS){
					errMessageArray.push({param:'banner_image',path:'banner_image',msg:asyncRes.banner_image.message});
				}

				if(errMessageArray.length){
					/** Send error response **/
					return res.send({
						status	: STATUS_ERROR,
						message	: errMessageArray,
					});
				}

				/** Update cms details **/
				let conditionsObj = { _id: new ObjectId(id) };
				let updateRecordObj = {
					$set: {
						body: pageBody,
						title,
						sub_title : subTitle,
						name: (req.body.name) ? req.body.name : "",
						meta_title: (req.body.meta_title) ? req.body.meta_title : "",
						meta_description: (req.body.meta_description) ? req.body.meta_description : "",
						meta_keyword: (req.body.meta_keyword) ? req.body.meta_keyword : "",
						default_language_id: DEFAULT_LANGUAGE_CODE,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						modified: getUtcDate()
					}
				}

				let contentImg 	= (asyncRes && asyncRes.content_image && asyncRes.content_image.fileName)  	? asyncRes.content_image.fileName 	: '';
				let bannerImg 	= (asyncRes && asyncRes.banner_image && asyncRes.banner_image.fileName)  	? asyncRes.banner_image.fileName 	: '';


				if(contentImg) updateRecordObj.$set.content_image 	= contentImg;
				if(bannerImg) updateRecordObj.$set.banner_image 	= bannerImg;

				let optionObj = {
					conditions: conditionsObj,
					updateData: updateRecordObj,
				}

				CmsModel.updateOneCms(req, res, optionObj).then(updateResult => {
					let responseStatus = (updateResult.status) ? updateResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.cms.cms_details_has_been_updated_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'cms',
							message: res.__("admin.cms.cms_details_has_been_updated_successfully"),
						});
					}
				});
			});
		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get cms details **/
				getCmsDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'cms');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/cms/edit']);
					res.render('edit',{
						result			: 	response.result,
						language_list	:	languageList,
						image_url		:   CMS_FILE_URL
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editCms()
 
	
}
module.exports = new Cms();
