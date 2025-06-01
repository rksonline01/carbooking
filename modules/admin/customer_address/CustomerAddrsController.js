const CustomerAddrsModel = require("./model/CustomerAddrsModel");
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const AreaModel 		= 	require("../area_management/model/Area");
const asyncParallel = require("async/parallel");
const clone			= require('clone');
const crypto 	    = 	require("crypto");
const { ObjectId, Collection } = require('mongodb');
function NewsLetterSubscriberController(){

    /**
	* Function for get list of newsletter subscribers
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
    this.getAddressList = async (req, res)=>{
        let userId = req.params.user_id ?  new ObjectId(req.params.user_id) : '';
        
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

                let commonConditions = {
                    user_id :  userId,
					is_deleted:NOT_DELETED
                }

                dataTableConfig.conditions = {...dataTableConfig.commonConditions, ...commonConditions}
                let conditions = [{
                    $facet : {
                        "customer_address_list" : [
                            {$match : dataTableConfig.conditions},
                            {$project : {
                                full_name       : 1,
                                country         : 1,
                                city            : 1,
                                state           : 1,
                                address_line_1  : 1,
                                address_line_2  : 1,
                                country_name    : 1,
                                state_name      : 1,
                                city_name       : 1,
                                area_id         : 1,
                                latitude        : 1,
                                longitude       : 1,
                                is_default      : 1,
                                is_favourite    : 1
                            }},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit : limit} 
                        ],
                        "customer_address_all_count" : [
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "customer_address_filter_count" : [
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

                CustomerAddrsModel.getCustomerAddressAggregateList(req,res,options).then(addressResponse=>{
					let responseStatus = (addressResponse.status) ? addressResponse.status : "";
                    let responseResult = (addressResponse.result && addressResponse.result[0]) ? addressResponse.result[0] : "";

                    let customer_address_list = (responseResult && responseResult.customer_address_list) ? responseResult.customer_address_list : [];
                    
                    let customer_address_all_count = (responseResult && responseResult.customer_address_all_count && responseResult.customer_address_all_count[0] && responseResult.customer_address_all_count[0]["count"]) ? responseResult.customer_address_all_count[0]["count"] : DEACTIVE;
                    let customer_address_filter_count = (responseResult && responseResult.customer_address_filter_count && responseResult.customer_address_filter_count[0] && responseResult.customer_address_filter_count[0]["count"]) ? responseResult.customer_address_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   customer_address_list,
                        recordsTotal	:	customer_address_all_count,
                        recordsFiltered	:  	customer_address_filter_count,                       
                    });
				});
			});
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
					},
				]
			};

            const options = {
                collection: TABLE_USERS,
                conditions: [
                    { $match: { _id: userId } },
                    {
                        $project: {
                            full_name: { $ifNull: ["$full_name", "N/A"] },
                            email: { $ifNull: ["$email", "N/A"] },
                            mobile_number: { $ifNull: ["$mobile_number", "N/A"] }
                        }
                    }
                ]
            };
        
            const [userDetails] = await Promise.all([
                DbClass.getAggregateResult(null, null, options).then(res => res?.result?.[0] || {})
            ]);

			getDropdownList(req, res,dropdownOptions).then(dropdownResponse=>{
                /** render listing page **/
                req.breadcrumbs(BREADCRUMBS["admin/customer_address/list"]);
                res.render("list",{
                    country_list	: (dropdownResponse && dropdownResponse.final_html_data && dropdownResponse.final_html_data["0"])	?	dropdownResponse.final_html_data["0"]:"",
                    user_id : userId,
                    user_details : userDetails,
                    dynamic_variable : userId
                });
            })
		}
	};//End getSubscriberList()

    /**
	 * Function for update newsletter subscriber's detail
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editAddress = async (req, res, next) => {
        let addressId = (req.params.id) ? req.params.id : "";
        let userId = (req.params.user_id) ? req.params.user_id : "";
    
        if (addressId) {
            if (isPost(req)) {
                req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
                let fullName = (req.body.full_name) ? req.body.full_name : '';

                let countryName = (req.body.country_id) ? req.body.country_id : '';
                let stateName   = (req.body.state_id) ? req.body.state_id : '';
                let cityName    = (req.body.city_id) ? req.body.city_id : '';

                let addressLine1 = (req.body.address_line_1) ? req.body.address_line_1 : '';
                let addressLine2 = (req.body.address_line_2) ? req.body.address_line_2 : '';
                let latitude     = (req.body.latitude) ? req.body.latitude : '';
                let longitude    = (req.body.longitude) ? req.body.longitude : '';
     

                let areaIds  = await getAreasForAddress(latitude, longitude) || []
    
                let updateCondition = {
                    _id: new ObjectId(addressId)
                }
    
                let updateData = {
                    full_name: fullName,
                    country : countryName,
                    state   : stateName,
                    city    :cityName,
                    address_line_1: addressLine1,
                    address_line_2: addressLine2,
                    country_name: countryName,
                    state_name: stateName,
                    city_name: cityName,
                    area_id : areaIds,
                    latitude : latitude,
                    longitude : longitude,
                    modified: getUtcDate()
                }
                
                
                let updateOption = {
                    conditions: updateCondition,
                    updateData: { $set: updateData }
                }
    
                CustomerAddrsModel.updateCustomerAddress(req, res, updateOption).then(updateResponse => {
                    if (updateResponse.status == STATUS_SUCCESS) {
                        req.flash(STATUS_SUCCESS, res.__("admin.customer_address.address_has_been_updated_successfully"));
                        res.send({
                            status: STATUS_SUCCESS,
                            redirect_url: WEBSITE_ADMIN_URL + "customer_address/" + userId,
                            message: res.__("admin.customer_address.address_has_been_updated_successfully"),
                        });
                    } else {
                        res.send({
                            status: STATUS_ERROR,
                            message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                        });
                    }
                })
    
            } else {
    
                let detailCondition = {
                    _id : new ObjectId(addressId)
                };
    
                let optionObj = {
                    conditions : detailCondition
                }
    
                CustomerAddrsModel.getCustomerAddressDetail(optionObj).then(addressResponse=>{
    
                    if(addressResponse.status != STATUS_SUCCESS){
                        /** Send error response **/
                        req.flash("error",addressResponse.message);
                        res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId );
                        return;
                    }else{
    
                        let result = addressResponse.result;
    
                 
                        asyncParallel({
                            get_area_list :(callback)=>{
                                let optionAllAreaObj	=	{conditions: {is_deleted: NOT_DELETED}};
                                AreaModel.getAllAreaList(req, res, optionAllAreaObj).then(areaListResult => {
                                    callback(null, areaListResult.result)
                                })
                            }
                        }, (asyncErr, asyncRes) => {
                            if (asyncErr) {
                                req.flash("error", asyncErr);
                                res.redirect(WEBSITE_ADMIN_URL + "customer_address/" + userId);
                                return;
                            }
                            let areaList = asyncRes.get_area_list || [];
                        
                            
                            req.breadcrumbs(BREADCRUMBS["admin/customer_address/edit"]);
                            res.render("edit", {
                                result: result || {},
                                address_id: addressId,
                                user_id: userId,
                                dynamic_url: userId,
                                area_list : areaList,
                                google_map_key: process.env.GOOGLE_MAP_API_KEY,
                                google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
                                google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
                            });
                        })
                    }
                })
            }
        }else{
             /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId );
			return;
        }
    }


    /**
	 * Function for update newsletter subscriber's status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	 */
	this.updateDefaultStatus = (req,res,next)=>{
		let addressId	= 	(req.params.id) 	    ?	req.params.id 		:"";
        let userId      =   (req.params.user_id)    ? req.params.user_id    :"";
		
        if(addressId){

            let condition = { user_id: new ObjectId(userId) };

            let updateData = {
                $set: {
                    is_default: {
                        $cond: { if: { $eq: ["$_id", new ObjectId(addressId)] }, then: ACTIVE, else: DEACTIVE }
                    },
                    modified: getUtcDate()
                }
            };

            let updateOption = {
                collection : TABLE_USER_ADDRESSES,
                conditions : condition,
                updateData : [updateData]
            };

            DbClass.updateManyRecords(null,null,updateOption).then(updateResponse=>{
                if(updateResponse.status == STATUS_SUCCESS){
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS,res.__("admin.customer_address.address_status_has_been_set_to_default"));
                    res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId);
                }else{
                     /** Send success response **/
                     req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                     res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId);
                }
            })

        }else{
            /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId );
			return;
        }
	};//End updateAddressStatus()

     /**
	 * Function for update newsletter subscriber's status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return null
	 */
	this.updateFavoriteAddressStatus = (req,res,next)=>{
		let addressId	= 	(req.params.id) 	?	req.params.id 		:"";
		let userId	    = 	(req.params.user_id) 	?	req.params.user_id 		:"";
		let status	    =	(req.params.status)	? 	req.params.status	:"";
		status	 	    =	(status==ACTIVE) 	? 	DEACTIVE 			:ACTIVE;

        if(addressId){

            let condition = {
                _id : new ObjectId(addressId)
            };

            let updateData = {
                is_favourite		:	status,
                modified 	:	getUtcDate()
            }

            let updateOption = {
                conditions : condition,
                updateData : {$set: updateData}
            };

            CustomerAddrsModel.updateCustomerAddress(req,res,updateOption).then(updateResponse=>{
                if(updateResponse.status == STATUS_SUCCESS){
                    let message  = (status==ACTIVE) ? res.__("admin.customer_address.address_set_favorite_successfully") : res.__("admin.customer_address.address_unset_favorite_successfully") ;
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS,message);
                    res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId);
                }else{
                     /** Send success response **/
                     req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
                     res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId);
                }
            })

        }else{
            /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"customer_address/" +userId );
			return;
        }
	};//End updateAddressStatus()

};

module.exports = new NewsLetterSubscriberController()