const { ObjectId } = require('mongodb');
const async = require("async");
const StateModel = require("./model/states");
const clone				= 	require('clone');

function stateController(){

    /**
	 * Function for get list of States
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getStatesList = (req, res)=>{
		if(isPost(req)){

            let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) 	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? 	parseInt(req.body.start) 	:DEFAULT_SKIP;
			let search_data 	=   req.body.search_data;


			/** Configure DataTable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{

				/** Set conditions **/
				let commonConditions = {
					"is_deleted"  	: 	NOT_DELETED
				};
				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {

							if (formdata.name == "status" && formdata.value != "") {
								dataTableConfig.conditions[formdata.name] = Number(formdata.value);
							} else if (formdata.name == "country_id" && formdata.value != "") {
								dataTableConfig.conditions[formdata.name] = new ObjectId(formdata.value)
							} else {
								dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
							}
						}
					})
				}
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);

				let conditions = [{
					$facet : {
						state_list : [
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
								$project	:	{
									_id				:	1,
									state_name		:	1,
									country_id		:	1,
									status			:	1,
									created_at		:	1,
									country_name	: 	{ "$arrayElemAt" : ["$country_detail.country_name",0] }
								}
							},
						],
						state_all_count : [
							{$match : commonConditions},
							{$group:{
								_id: null,
								count: { $sum: 1 }
							}},
							{
								$project:{count:1,_id:0}
							}
						],
						state_filter_count : [
							{$match : commonConditions},
							{$group:{
								_id: null,
								count: { $sum: 1 }
							}},
							{
								$project:{count:1,_id:0}
							}
						]
					}
				}];

				let optionObj = {
					conditions : conditions 
				}

				StateModel.getStateAggregateList(req,res,optionObj).then(stateResponse=>{
					let responseStatus = (stateResponse.status) ? stateResponse.status : "";
					let responseResult = (stateResponse.result && stateResponse.result[0]) ? stateResponse.result[0] : "";
					
					let state_list = (responseResult && responseResult.state_list) ? responseResult.state_list : [];
					let state_all_count = (responseResult && responseResult.state_all_count && responseResult.state_all_count[0] && responseResult.state_all_count[0]["count"]) ? responseResult.state_all_count[0]["count"] : DEACTIVE;
					let state_filter_count = (responseResult && responseResult.state_filter_count && responseResult.state_filter_count[0] && responseResult.state_filter_count[0]["count"]) ? responseResult.state_filter_count[0]["count"] : DEACTIVE;
					res.send({
						status			: 	responseStatus,
						draw			:	dataTableConfig.result_draw,
						data			:   state_list,
						recordsTotal	:	state_all_count,
						recordsFiltered	:  	state_filter_count,
					});
				})
				
			});
		}else{
			let dropdownOptions = {
				collections : [
					{
						collection 	: 	TABLE_COUNTRY,
						columns 	: 	["_id","country_name"],
						conditions 	: 	{
							status		:	 ACTIVE,
						},
					},
				]
			};
			getDropdownList(req, res,dropdownOptions).then(dropdownResponse=>{
				/** render listing page **/
				req.breadcrumbs(BREADCRUMBS["admin/states/list"]);
				res.render("list",{
					country_list	: (dropdownResponse && dropdownResponse.final_html_data && dropdownResponse.final_html_data["0"])	?	dropdownResponse.final_html_data["0"]:"",

				});
			});
		}
	};//End getStateList()


    /**
	 * Function for add state
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addState = (req, res, next) => {
		if (isPost(req)) {
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

            req.body.state_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["state_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["state_name"] :"";
            let multilinualData = allData.pages_descriptions;

            var country_id = (req.body.country_id) ? req.body.country_id : "";
            var state_name = (req.body.state_name) ? req.body.state_name : "";

            let insertData = {
                country_id: new ObjectId(country_id),
                state_name: state_name,
                pages_descriptions: multilinualData,
                status: ACTIVE,
                is_default:ACTIVE,
                is_deleted: DEACTIVE,
                created_at: getUtcDate(),
                updated_at: getUtcDate(),
            }

            let optionObj = {
                insertData : insertData
            }

            StateModel.addState(req,res,optionObj).then(stateResponse=>{
                if(stateResponse.status === STATUS_ERROR){
                     /** Send error response **/
                     req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
                     res.redirect(WEBSITE_ADMIN_URL+"states");
                     return;
                }else{
                    req.flash(STATUS_SUCCESS, res.__("admin.states.states_details_has_been_save_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "states",
                        message: res.__("admin.states.states_details_has_been_save_successfully"),
                    });
                }
            });
		} else {
			getLanguages().then(languageList=>{
				/** Render edit page **/

				let options = {
					collections: [
						{
							collection: TABLE_COUNTRY,
							columns: ["_id", "country_name"],
							conditions: {
								status: ACTIVE
							}
						},
					]
				}
				getDropdownList(req, res, options).then(response => {
					req.breadcrumbs(BREADCRUMBS["admin/states/add"]);
					res.render("add", {
						country_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
						language_list	: languageList
					});
				});
			});
		}
	};//End addState()

    /**
	 * Function for edit State
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editState = (req, res, next) => {
		var stateId = (req.params.id) ? req.params.id : "";
        if(stateId){
            if (isPost(req)) {
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

				req.body.state_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["state_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["state_name"] :"";
				let multilinualData = allData.pages_descriptions;



				var country_id = (req.body.country_id) ? req.body.country_id : "";
				var state_name = (req.body.state_name) ? req.body.state_name : "";


                /** Set Update data */
                let updateData = {
                    country_id: new ObjectId(country_id),
                    state_name: state_name,
                    pages_descriptions: multilinualData,
                    updated_at: getUtcDate(),
                };

                let conditions = {
                    _id : new ObjectId(stateId)
                }

                let optionObj = {
                    conditions : conditions,
                    updateData : {$set:updateData}
                }

                StateModel.updateState(req,res,optionObj).then(state_response=>{
                    if(state_response.status == STATUS_ERROR){
                          /** Send error response **/
                        req.flash("error",res.__("admin.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL+"states");
                        return;
                    }else{
                        /** Send success response **/
                        req.flash(STATUS_SUCCESS, res.__("admin.states.states_details_has_been_updated_successfully"));
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + "states",
                            message: res.__("admin.states.states_details_has_been_updated_successfully"),
                        });
                    }
                })
            } else {
                getLanguages().then(languageList=>{

                    let condition = {
                        _id : new ObjectId(stateId)
                    }

                    let optionObj = {
                        conditions : condition,
                        fields : {}
                    }
                    /** Get state details **/
                    StateModel.getStateDetails(optionObj).then(response => {
                        var country_id = response.result['country_id'];
                        if (response.status != STATUS_SUCCESS) {
                            /** Send error response **/
                            req.flash(STATUS_ERROR, response.message);
                            res.redirect(WEBSITE_ADMIN_URL + "states");
                            return;
                        }
                        let options = {
                            collections: [
                                {
                                    collection: "countries",
                                    columns: ["_id", "country_name"],
                                    selected: [country_id],
                                    conditions: {
                                        status: ACTIVE
                                    }
                                }
                            ]
                        }
                        /** Render edit page **/
                        getDropdownList(req, res, options).then(country_response => {
                            req.breadcrumbs(BREADCRUMBS["admin/states/edit"]);
                            res.render("edit", {
                                country_list: (country_response && country_response.final_html_data && country_response.final_html_data["0"]) ? country_response.final_html_data["0"] : "",
                                result: (response.result) ? response.result : {},
                                language_list	: languageList
                            });
                        });
                    }).catch(next);
                });
            }
        }else{
             /** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "states");
        }

	};//End editstate()


    /**
	 * Function for update state's status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateStateStatus = (req, res) => {
		let stateId = (req.params.id) ? req.params.id : "";
		let userStatus = (req.params.status) ? req.params.status : "";
		let statusType = (req.params.status_type) ? req.params.status_type : "";

		if (stateId && (statusType && (statusType == ACTIVE_INACTIVE_STATUS))) {
			try {
				let updateData = {
					modified: getUtcDate()
				};
				if (statusType == ACTIVE_INACTIVE_STATUS) {
					updateData["status"] = (userStatus == ACTIVE) ? DEACTIVE : ACTIVE;
				}

                let condition = {
                    _id : new ObjectId(stateId)
                }

                let optionObj = {
                    conditions : condition,
                    updateData : {$set:updateData}
                }

                StateModel.updateState(req,res,optionObj).then(stateResponse=>{
                    if(stateResponse == STATUS_SUCCESS){
                        	/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.states.states_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL + "states");
                    }else{
                        /** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + "states");
                    }
                })

			} catch (e) {
				/** Send error response **/
				req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL + "states");
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "states");
		}
	};//End updateStateStatus()

}

module.exports = new stateController();
