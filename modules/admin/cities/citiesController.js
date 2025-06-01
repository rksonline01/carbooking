const { ObjectId } = require('mongodb');
const async = require("async");
const CityModel = require("./model/cities");
const clone				= 	require('clone');

function citiesController(){

     /**
     * Function to get cities list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     this.getCityList = (req,res,next)=>{
        if(isPost(req)){
            let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) 	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? 	parseInt(req.body.start) 	:DEFAULT_SKIP;
			let search_data 	=   req.body.search_data;

            configDatatable(req,res,null).then(dataTableConfig=>{

				if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){
                            if(formdata.name == "status"){
                                dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
                            }else if(formdata.name == "state_id" || formdata.name=="country_id"){
                                dataTableConfig.conditions[formdata.name] 	= new ObjectId(formdata.value);
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                            }
                            
                        }
                
                    })
                }

				let conditions = [{
					$facet : {
						"city_list" : [
							{$match : dataTableConfig.conditions},
							{$sort : dataTableConfig.sort_conditions},
							{$skip  : skip},
							{$limit : limit},
							{
								$lookup:{
									"from"			:	"countries",
									"localField"	:	"country_id",
									"foreignField"	:	"_id",
									"as"			:	"country_detail"
								}
							},
							{
								$lookup:{
									"from"			:	TABLE_STATES,
									"localField"	:	"state_id",
									"foreignField"	:	"_id",
									"as"			:	"states_detail"
								}
							},
							{
								$project	:	{
									_id				:	1,
									city_name		:	1,
									country_id		:	1,
									state_id		:	1,
									status			:	1,
									created_at		:	1,
									updated_at		:	1,
									country_name	: 	{ "$arrayElemAt" : ["$country_detail.country_name",0] },
									state_name		: 	{ "$arrayElemAt" : ["$states_detail.state_name",0] }
								}
							},
						],
						"city_all_count" : [
							{
								$group : {
									_id : null,
									count : {$count : {}}
								}
							},
							{
								$project: {
									_id : 0, count: 1
								}
							}
						],
						"city_filter_count" : [
							{
								$group : {
									_id : null,
									count : {$count : {}}
								}
							},
							{
								$project: {
									_id : 0, count: 1
								}
							}
						]
					}
				}];

				let optionObj = {
					conditions : conditions
				}

				CityModel.getCitiesAggregateList(req,res,optionObj).then(cityResponse=>{
					let responseStatus = (cityResponse.status) ? cityResponse.status : "";
					let responseResult = (cityResponse.result && cityResponse.result[0]) ? cityResponse.result[0] : "";
					
					let city_list = (responseResult && responseResult.city_list) ? responseResult.city_list : [];
					let city_all_count = (responseResult && responseResult.city_all_count && responseResult.city_all_count[0] && responseResult.city_all_count[0]["count"]) ? responseResult.city_all_count[0]["count"] : DEACTIVE;
					let city_filter_count = (responseResult && responseResult.city_filter_count && responseResult.city_filter_count[0] && responseResult.city_filter_count[0]["count"]) ? responseResult.city_filter_count[0]["count"] : DEACTIVE;
					res.send({
						status			: 	responseStatus,
						draw			:	dataTableConfig.result_draw,
						data			:   city_list,
						recordsTotal	:	city_all_count,
						recordsFiltered	:  	city_filter_count,
					});
				});
            })
        }else{

            /***** Set dropdown options ******/
			let dropdownOptions = {
				collections : [
					{
						collection 	: 	TABLE_COUNTRY,
						columns 	: 	["_id","country_name"],
						conditions 	: 	{
							status		:	 ACTIVE,
						},
					}
				]
			};
			getDropdownList(req, res,dropdownOptions).then(dropdownResponse=>{
            /** render listing page **/
				req.breadcrumbs(BREADCRUMBS["admin/cities/list"]);
				res.render("list", {
					country_list	: (dropdownResponse && dropdownResponse.final_html_data && dropdownResponse.final_html_data["0"])	?	dropdownResponse.final_html_data["0"]:""
				});
			});
        }
    }

	/**
     * Function to add cities 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addCity = (req,res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			 /** Sanitize Data */
			 req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			 if(typeof req.body.pages_descriptions == typeof undefined && (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == typeof undefined && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == "")){
				 return res.send({
					 status	: STATUS_ERROR,
					 message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				 });
			 }
			 
			 var allData				= 	JSON.parse(JSON.stringify(req.body));
			 req.body				=	clone(allData);
 
			 req.body.city_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["city_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["city_name"] :"";
			 let multilinualData = allData.pages_descriptions;

			var country_id 	=	(req.body.country_id)	?	req.body.country_id	:	"";
			var state_id	=	(req.body.state_id) 	? 	req.body.state_id	:	"";
			var city_name	=	(req.body.city_name) 	? 	req.body.city_name	:	"";
			
			let insertData = {
				country_id			: 	new ObjectId(country_id),
				state_id			: 	new ObjectId(state_id),
				city_name 			: 	city_name,
				pages_descriptions	: 	multilinualData,
				status				: 	ACTIVE,
				is_deleted			: 	DEACTIVE,
				created_at 			: 	getUtcDate(),
				updated_at 			: 	getUtcDate(),
			};

			let optionObj = {
				insertData : insertData
			}

			CityModel.addCities(req,res,optionObj).then(cityResponse=>{
				if(cityResponse.status == STATUS_SUCCESS){
					req.flash(STATUS_SUCCESS,res.__("admin.city.city_details_has_been_save_successfully"));
					res.send({
						status		: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL+"cities",
						message		: res.__("admin.city.city_details_has_been_save_successfully"),
					});
				}else{
					/** Send error response **/
					req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
					res.redirect(WEBSITE_ADMIN_URL+"cities");
					return;
				}
			})
		}else{
			let options = {
				collections:[
					{
						collection:	"countries",
						columns	:	["_id","country_name"],
						conditions:{
								status :	ACTIVE
							}
					}
				]
			}
			getDropdownList(req,res,options).then(response=> {
				getLanguages().then(languageList=>{
					req.breadcrumbs(BREADCRUMBS["admin/cities/add"]);
					res.render("add",{
						country_list	:	(response && response.final_html_data && response.final_html_data["0"])	?	response.final_html_data["0"]:"",
						language_list	: languageList
					});
				});
			});
		}
    }

	/**
     * Function to add cities 
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.editCity = (req,res,next)=>{
		var cityId = (req.params.id) ? req.params.id : "";
		
		if(cityId){
			if(isPost(req)){
				/** Sanitize Data */
				 req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
				 if(typeof req.body.pages_descriptions == typeof undefined && (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == typeof undefined && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == "")){
					 return res.send({
						 status	: STATUS_ERROR,
						 message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
					 });
				 }
				 
				 var allData				= 	JSON.parse(JSON.stringify(req.body));
				 req.body				=	clone(allData);
	 
				 req.body.city_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["city_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["city_name"] :"";
				 let multilinualData = allData.pages_descriptions;
	
				var country_id 	=	(req.body.country_id)	?	req.body.country_id	:	"";
				var state_id	=	(req.body.state_id) 	? 	req.body.state_id	:	"";
				var city_name	=	(req.body.city_name) 	? 	req.body.city_name	:	"";
				
				let updateData = {
					country_id			: 	new ObjectId(country_id),
					state_id			: 	new ObjectId(state_id),
					city_name 			: 	city_name,
					pages_descriptions	: 	multilinualData,
					updated_at 			: 	getUtcDate(),
				};

				let conditions = {
					_id : new ObjectId(cityId)
				}
	
				let optionObj = {
					updateData : {$set: updateData},
					conditions : conditions
				}
	
				CityModel.updateCities(req,res,optionObj).then(cityResponse=>{
					if(cityResponse.status == STATUS_SUCCESS){
						req.flash(STATUS_SUCCESS,res.__("admin.city.city_details_has_been_save_successfully"));
						res.send({
							status		: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL+"cities",
							message		: res.__("admin.city.city_details_has_been_save_successfully"),
						});
					}else{
						/** Send error response **/
						req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"cities");
						return;
					}
				})
			}else{
				let condition = {
					_id : new ObjectId(cityId)
				}
				let optionObj = {
					conditions : condition,
					field : {}
				}
				CityModel.getCitiesDetails(optionObj).then(detailsResponse=>{
					if(detailsResponse.status == STATUS_SUCCESS){
						let countryId = detailsResponse.result["country_id"];
						let options = {
							collections:[
								{
									collection:	"countries",
									columns	:	["_id","country_name"],
									selected : [countryId],
									conditions:{
											status :	ACTIVE
										}
								}
							]
						}
						getDropdownList(req,res,options).then(response=> {
							
							getLanguages().then(languageList=>{
								req.breadcrumbs(BREADCRUMBS["admin/cities/edit"]);
								res.render("edit",{
									country_list	:	(response && response.final_html_data && response.final_html_data["0"])	?	response.final_html_data["0"]:"",
									result : detailsResponse.result,
									language_list	: languageList
								});
							});
						});
					}else{
						/** Send error response **/
						req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"cities");
						return;
					}
				})
			}
		}else{
			/** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"cities");
			return;
		}
		
    }

	/**
	 * Function for update cities status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateCityStatus = (req,res)=>{
		let cityId		 = 	(req.params.id) 			?	req.params.id 			:"";
		let userStatus	 =	(req.params.status) 		? 	req.params.status	 	:"";
		let statusType	 =	(req.params.status_type) 	? 	req.params.status_type	:"";

		if (cityId && userStatus && (statusType == ACTIVE_INACTIVE_STATUS)) {
			try{
				let updateData = {
					updated_at	: getUtcDate(),
					status		: (userStatus == ACTIVE) ? DEACTIVE : ACTIVE,
				};
				let conditions = {
					_id : new ObjectId(cityId)
				}

				let optionObj = {
					updateData : {$set:updateData},
					conditions : conditions
				}

				CityModel.updateCities(req,res,optionObj).then(citiesResponse=>{
					if(citiesResponse.status == STATUS_SUCCESS){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.city.city_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+"cities");
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"cities");
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"cities");
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"cities");
		}
	};//End updateCityStatus()
}

module.exports = new citiesController();