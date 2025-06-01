const { ObjectId } = require('mongodb');
const async = require("async");
const CountryModel = require("./model/country");
const clone				= 	require('clone');

function countryController(){

    /**
     * Function to get country list
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getCountryList = (req,res,next)=>{
        if(isPost(req)){
            let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) 	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? 	parseInt(req.body.start) 	:DEFAULT_SKIP;
			let search_data 	=   req.body.search_data;

            configDatatable(req,res,null).then(dataTableConfig=>{
                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {

                            if (formdata.name == "status" && formdata.value != "") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }

                        }

                    })

                }

                let conditions = [{
                    $facet : {
                        "country_list" : [
                            {
                                $match : dataTableConfig.conditions
                            },
                            {
                                $project : {
                                    _id:1, country_name :1, status:1, updated_at :1
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
                        "country_all_count" : [
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
                        "country_filter_count" : [
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
                }]

                let optionObj = {
                    conditions : conditions
                }

                CountryModel.getCountryAggregateList(req,res,optionObj).then(templateResponse=>{
					let responseStatus = (templateResponse.status) ? templateResponse.status : "";
                    let responseResult = (templateResponse.result && templateResponse.result[0]) ? templateResponse.result[0] : "";
                    
                    let country_list  = (responseResult && responseResult.country_list ) ? responseResult.country_list  : [];
                    let country_all_count = (responseResult && responseResult.country_all_count && responseResult.country_all_count[0] && responseResult.country_all_count[0]["count"]) ? responseResult.country_all_count[0]["count"] : DEACTIVE;
                    let country_filter_count = (responseResult && responseResult.country_filter_count && responseResult.country_filter_count[0] && responseResult.country_filter_count[0]["count"]) ? responseResult.country_filter_count[0]["count"] : DEACTIVE;
                    
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   country_list ,
                        recordsTotal	:	country_all_count,
                        recordsFiltered	:  	country_filter_count,
                    });
				})
            })
        }else{

			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS["admin/countries/list"]);
			res.render('list');
        }
    }

     /**
     * Function to add country
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addCountry = (req,res,next)=>{
        if (isPost(req)) {
            /** Sanitize Data */
            req.body =  sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
            if(req.body.pages_descriptions == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
                /** Send error response */
                return res.send({
                    status	: STATUS_ERROR,
                    message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                });
            }

            var allData				= 	JSON.parse(JSON.stringify(req.body));
            req.body				=	clone(allData);
            req.body.country_name	=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["country_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["country_name"] :"";

            var country_name		= (req.body.country_name) 		? req.body.country_name : "";
            var country_iso_code	= (req.body.country_iso_code)	? req.body.country_iso_code : "";
            var country_code		= (req.body.country_code)		? req.body.country_code : "";
            let dial_code 			=	(country_code) ? "+"+country_code : "";


            let multilinualData 	= 	allData.pages_descriptions;

            let insertData = {
                country_name: country_name,
                country_iso_code: country_iso_code,
                country_code: parseInt(country_code),
                pages_descriptions: multilinualData,
                dial_code: dial_code,
                status: ACTIVE,
                created_at: getUtcDate(),
                updated_at: getUtcDate(),
            }

            let optionObj = {
                insertData : insertData
            }
            CountryModel.addCountry(req,res,optionObj).then(countryResponse=>{
                if(countryResponse.status == STATUS_SUCCESS){
                    req.flash(STATUS_SUCCESS,res.__("admin.country.country_has_been_added_successfully"));
                    res.send({
                        status			:	STATUS_SUCCESS,
                        redirect_url	: 	WEBSITE_ADMIN_URL+"country",
                        message			:	res.__("admin.country.country_has_been_added_successfully"),
                    });
                }else{
                   /** Send error response **/
                    req.flash("error",countryResponse.message);
                    res.redirect(WEBSITE_ADMIN_URL+"country");
                    return;
                }
            })

        }else{
            getLanguages().then(languageList=>{
				/** Render edit page **/
				req.breadcrumbs(BREADCRUMBS["admin/countries/add"]);
				res.render("add", {
					language_list	: languageList
				});
			})
        }
    }

     /**
     * Function to add country
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     this.editCountry = (req,res,next)=>{
        let countryId 	= 	(req.params.id) 	? 	req.params.id 	:"";
        if(countryId){
            if (isPost(req)) {
                /** Sanitize Data */
                req.body =  sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                if(req.body.pages_descriptions == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == ''){
                    /** Send error response */
                    return res.send({
                        status	: STATUS_ERROR,
                        message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                    });
                }

                var allData				= 	JSON.parse(JSON.stringify(req.body));
                req.body				=	clone(allData);
                req.body.country_name	=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["country_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["country_name"] :"";

                var country_name		= (req.body.country_name) 		? req.body.country_name : "";
                var country_iso_code	= (req.body.country_iso_code)	? req.body.country_iso_code : "";
                var country_code		= (req.body.country_code)		? req.body.country_code : "";
                let dial_code 			=	(country_code) ? "+"+country_code : "";


                let multilinualData 	= 	allData.pages_descriptions;

                let updateData = {
                    country_name: country_name,
                    country_iso_code: country_iso_code,
                    country_code: parseInt(country_code),
                    pages_descriptions: multilinualData,
                    dial_code: dial_code,
                    updated_at: getUtcDate(),
                }

                let conditions = {
                    _id : new ObjectId(countryId)
                }

                let optionObj = {
                    conditions : conditions,
                    updateData : {$set:updateData},
                }
                CountryModel.updateCountry(req,res,optionObj).then(countryResponse=>{
                    if(countryResponse.status == STATUS_SUCCESS){
                        req.flash(STATUS_SUCCESS,res.__("admin.country.country_has_been_updated_successfully"));
                        res.send({
                            status			:	STATUS_SUCCESS,
                            redirect_url	: 	WEBSITE_ADMIN_URL+"country",
                            message			:	res.__("admin.country.country_has_been_updated_successfully"),
                        });
                    }else{
                    /** Send error response **/
                        req.flash("error",countryResponse.message);
                        res.redirect(WEBSITE_ADMIN_URL+"country");
                        return;
                    }
                })

            }else{
                let conditions = {
                    _id : new ObjectId(countryId)
                }

                let optionObj = {
                    conditions : conditions,
                    fields : {}
                }
                CountryModel.getCountryDetails(optionObj).then(countryResponse=>{
                    if(countryResponse == STATUS_ERROR){
                        /** Send error response **/
                        req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "country");
                    }else{
                        getLanguages().then(languageList=>{
                            /** Render edit page **/
                            req.breadcrumbs(BREADCRUMBS["admin/countries/edit"]);
                            res.render("edit", {
                                language_list	: languageList,
                                result : countryResponse.result
                            });
                        })
                    }
                });
            }
        }else{
            /** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "country");
        }
    }

    /**
	 * Function for update country's status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	*/
    this.updateCountryStatus = (req,res,next)=>{
		let countryId = (req.params.id) ? req.params.id : "";
		let userStatus = (req.params.status) ? req.params.status : "";
		let statusType = (req.params.status_type) ? req.params.status_type : "";

		if (countryId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))) {
			try {
				let updateData = {
					modified: getUtcDate()
				};
				if (statusType == ACTIVE_INACTIVE_STATUS) {
					updateData["status"] = (userStatus == ACTIVE) ? DEACTIVE : ACTIVE;
				}

				/** Update user status*/

                let updateCondition = {
                    _id : new ObjectId(countryId)
                }

                let optionObj = {
                    conditions : updateCondition,
                    updateData : {$set:updateData}
                }

                CountryModel.updateCountry(req,res,optionObj).then(countryResponse=>{
                    if (countryResponse.status == STATUS_SUCCESS) {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.country.country_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL + "country");
					} else {
						/** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + "country");
					}
                });
			} catch (e) {
				/** Send error response **/
				req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL + "country");
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "country");
		}
    }
}

module.exports = new countryController();