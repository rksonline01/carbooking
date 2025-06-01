const BlockModel = require("./model/Block");
const { ObjectId } = require('mongodb');
function BlockController() {

	/**
	 * Function for get block list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.getBlockList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start) 	? parseInt(req.body.start)	: DEFAULT_SKIP;
			let language        =   (req.session.lang)  ?   req.session.lang            : DEFAULT_LANGUAGE_CODE;

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
							"block_list" : [

								{
									$project	:	{
										_id: 1,
										block_name: { $cond : {if: { $ne : ["$blocks_descriptions."+language+".block_name",'']},then:"$blocks_descriptions."+language+".block_name",else:"$block_name"}},
										description: { $cond : {if: { $ne : ["$blocks_descriptions."+language+".description",'']},then:"$blocks_descriptions."+language+".description",else:"$description"}},
										page_name: 1,
										modified: 1
									}
								},
								{$match : dataTableConfig.conditions},
								{$sort : dataTableConfig.sort_conditions},
								{$skip  : skip},
								{$limit : limit},

							],
							"block_all_count" : [
								{$group:{
									_id: null,
									count: { $sum: 1 }
								}},
								{
									$project:{count:1,_id:0}
								}
							],
							"block_filter_count" : [
								{$match: dataTableConfig.conditions},
								{$group:{
									_id: null,
									count: { $sum: 1 }
								}},
								{
									$project:{count:1,_id:0}
								}
							]
						}
					}
				];

				let optionObj = {
					conditions : conditions
				}

				BlockModel.getBlockAggregateList(req,res,optionObj).then(blockResponse=>{
					let responseStatus = (blockResponse.status) ? blockResponse.status : "";
                    let responseResult = (blockResponse.result && blockResponse.result[0]) ? blockResponse.result[0] : "";

                    let block_list = (responseResult && responseResult.block_list) ? responseResult.block_list : [];
                    let block_all_count = (responseResult && responseResult.block_all_count && responseResult.block_all_count[0] && responseResult.block_all_count[0]["count"]) ? responseResult.block_all_count[0]["count"] : DEACTIVE;
                    let block_filter_count = (responseResult && responseResult.block_filter_count && responseResult.block_filter_count[0] && responseResult.block_filter_count[0]["count"]) ? responseResult.block_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   block_list,
                        recordsTotal	:	block_all_count,
                        recordsFiltered	:  	block_filter_count,
                    });
				})
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/block/list"]);
			res.render('list');
		}
	};//End getBlockList()


	/**
	 * Function to get block's detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	* @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	getBlockDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let blockId = (req.params.id) ? req.params.id : "";
			if(!blockId || blockId ==""){
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.invalid_access")
				};
				return resolve(response);
			}
			try{
				/** Get block details **/
				let conditionsObj = { _id: new ObjectId(blockId) };
				let optionObj = {
					conditions: conditionsObj,
					fields: { _id: 1, block_name: 1, page_name: 1, description: 1, modified: 1, blocks_descriptions: 1 },
				}

				BlockModel.getBlockFindOne(optionObj).then(blockRes => {

					let blockStatus = (blockRes.status) ? blockRes.status : "";
					let result = (blockRes.result) ? blockRes.result : "";

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

				})

			}catch(e){
				/** Send error response */
				let response = {
					status	: STATUS_ERROR,
					message	: res.__("admin.system.something_going_wrong_please_try_again")
				};
				resolve(response);
			}
		});
	};//End getBlockDetails()


	/**
	 * Function for update block's detail
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editBlock = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data **/
			req.body	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let id 		= (req.params.id)	? req.params.id :"";
			if(id == "" || typeof req.body.blocks_descriptions === typeof undefined || typeof req.body.blocks_descriptions[DEFAULT_LANGUAGE_CODE] === typeof undefined || !req.body.blocks_descriptions[DEFAULT_LANGUAGE_CODE] || req.body.blocks_descriptions[DEFAULT_LANGUAGE_CODE] == ""){
				/** Send error response **/
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone			= require('clone');
			let allData			= req.body;
			req.body		= clone(allData.blocks_descriptions[DEFAULT_LANGUAGE_CODE]);
			req.body.page_name	= (allData.page_name) 		? allData.page_name 	: "";
			let pageDescription = (req.body.description)	? req.body.description	: "";

			if(pageDescription!= ""){
				req.body.description =  pageDescription.replace(new RegExp(/&nbsp;|<br \/\>/g)," ").trim();
			}
			try{
				let pageName	= (req.body.page_name) 		? req.body.page_name 	: "";
				let blockName	= (req.body.block_name) 	? req.body.block_name 	: "";

				/** Update block record **/
				let conditionsObj = { _id: new ObjectId(id) };
				let updateRecordObj = {
					$set: {
						page_name: pageName,
						block_name: blockName,
						description: pageDescription,
						default_language_id: DEFAULT_LANGUAGE_CODE,
						blocks_descriptions: (allData.blocks_descriptions) ? allData.blocks_descriptions : {},
						modified: getUtcDate()
					}
				}
				let optionObj = {
					conditions: conditionsObj,
					updateData: updateRecordObj,
				}
				BlockModel.updateOneBlock(req, res, optionObj).then(updateResult => {
					let responseStatus = (updateResult.status) ? updateResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response **/
						req.flash("success", res.__("admin.block.block_details_has_been_updated_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + "block",
							message: res.__("admin.block.block_details_has_been_updated_successfully"),
						});
					}
				})

			}catch(e){
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}
		}else{
			/** Get language list **/
			getLanguages().then((languageList)=>{
				/** Get blocks details **/
				getBlockDetails(req, res,next).then((response)=>{
					if(response.status != STATUS_SUCCESS){
						/** Send Error response **/
						req.flash("error",response.message);
						res.redirect(WEBSITE_ADMIN_URL+"block");
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS["admin/block/edit"]);
					res.render('edit',{
						result			: response.result,
						language_list	: languageList
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editBlock()


	/**
	 * Function for add block
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addBlock = (req, res, next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body =  sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			if(req.body.blocks_descriptions == undefined || req.body.blocks_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.blocks_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			const clone			= require('clone');
			let allData			= req.body;
			req.body			= clone(allData.blocks_descriptions[DEFAULT_LANGUAGE_CODE]);
			req.body.page_name	= (allData.page_name) 	? allData.page_name 	: "";
			let pageDescription = (req.body.description)? req.body.description	: "";
			/** Check validation */


			if(pageDescription!= ""){
				req.body.description =  pageDescription.replace(new RegExp(/&nbsp;|<br \/\>/g),' ').trim();
			}
			/** parse Validation array  */

			try{
				let pageName	= (req.body.page_name)		? req.body.page_name 	: '';
				let blockName	= (req.body.block_name) 	? req.body.block_name 	: '';
				let description	= (req.body.description)	? req.body.description 	: '';

				/**Get database slugs */
				const async = require('async');
				async.parallel([
					(callback)=>{
						/** Set options **/
						let options = {
							title 		: blockName,
							table_name 	: TABLE_BLOCK,
							slug_field 	: "block_name"
						};
						/** Make slugs */
						getDatabaseSlug(options).then(blockResponse=>{
							callback(null,blockResponse);
						},error=>{
							callback(STATUS_ERROR,{});
						}).catch(next);
					},
					(callback)=>{
						/** Set page options **/
						let pageOptions = {
							title 		: pageName,
							table_name 	: TABLE_BLOCK,
							slug_field 	: "page_name"
						};
						/** Make slugs */
						getDatabaseSlug(pageOptions).then(pageResponse=>{
							callback(null,pageResponse);
						},error=>{
							callback(STATUS_ERROR,{});
						}).catch(next);
					}
				],(err,response)=>{
					if(err) return next(err);

					let blockResponse	= (response && response[0]) ? response[0] : {};
					let pageResponse	= (response && response[1]) ? response[1] : {};
					/** insert block record */
					let optionObj = {
						insertData	:	{
							page_name			: pageName,
							block_name			: blockName,
							block_slug			: (blockResponse && blockResponse.title)? blockResponse.title	:"",
							page_slug			: (pageResponse && pageResponse.title)	? pageResponse.title	:"",
							description			: description,
							default_language_id	: DEFAULT_LANGUAGE_CODE,
							blocks_descriptions	: (allData.blocks_descriptions) ? allData.blocks_descriptions :{},
							modified 			: getUtcDate(),
							created 			: getUtcDate()
						}
					}
					BlockModel.saveBlock(req, res, optionObj).then(saveResult => {
						let responseStatus = (saveResult.status) ? saveResult.status : "";
						if (responseStatus == STATUS_ERROR) {
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
							});
						}else{
							/** Send success response */
							req.flash('success', res.__("admin.block.block_has_been_added_successfully"));
							res.send({
								status: STATUS_SUCCESS,
								redirect_url: WEBSITE_ADMIN_URL + 'block',
								message: res.__("admin.block.block_has_been_added_successfully")
							});
						}
					})
				});
			}catch(e){
				/** Send error response **/
				res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}
		}else{
			/** Get language list */
			getLanguages().then((languageList)=>{
				req.breadcrumbs(BREADCRUMBS['admin/block/add']);
				res.render('add',{
					language_list	: languageList
				});
			});
		}
	};//End addBlock()
}

module.exports = new BlockController();
