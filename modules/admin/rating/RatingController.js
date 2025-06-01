const RatingModel = require("./model/RatingModel");
const clone			= require('clone');
const crypto 	    = 	require("crypto");
const { ObjectId } = require('mongodb');
function RattingController(){

    /**
	* Function for get list of newsletter subscribers
	*
	* @param req As Request Data
	* @param res As Response Data
	*
	* @return render/json
	*/
    this.getRatingList = async(req, res)=>{
        let user        = (req.query.user) ? req.query.user : "";
        let product  = (req.query.product) ? req.query.product : "";
        let user_id ; 
        
		if(isPost(req)){
			let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start)	?	parseInt(req.body.start)  :DEFAULT_SKIP;
			let search_data 	=   req.body.search_data;
            let fromDate        =   "";
            let toDate          =   "";
			/** Configure DataTable conditions*/
			configDatatable(req,res,null).then(async dataTableConfig=>{
                 let common_conditions = {
                    is_deleted  : DEACTIVE  
                };

                 if(user){
                    let userData = await getUserFromSlug(null, null, {slug : user});
                    let user_id = (userData && userData._id) ? userData._id : null;
                    common_conditions.user_id	=	new ObjectId(user_id);
                    common_conditions.review_for	=	USER_REVIEW;
                }

                if(product){
                    let productData = await getProductFromSlug(null, null, {slug : user});
                    let product_id = (productData && productData._id) ? productData._id : null;
                    common_conditions.product_id	=	new ObjectId(product_id);
                    common_conditions.review_for	=	PRODUCT_REVIEW;
                }
                    
                 
               
                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,common_conditions);
            
                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "from_date" && formdata.value != "") {
                                fromDate = formdata.value;
                            } else if (formdata.name == "to_date" && formdata.value != "") {
                                toDate = formdata.value;
                            } else if (formdata.name == "status") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else if (formdata.name == "registration_date") {

                            } else if (formdata.name == "product_id" || formdata.name == "user_id") {
                                dataTableConfig.conditions[formdata.name] = new ObjectId(formdata.value);
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
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

                 
                 let conditions = [{
                    $facet : {
                        "rating_list" : [
                            {$match : dataTableConfig.conditions},
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: "user_id",
                                    foreignField: "_id",
                                    as: "user_details"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: "posted_by",
                                    foreignField: "_id",
                                    as: "posted_by_details"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_PRODUCTS,
                                    localField: "product_id",
                                    foreignField: "_id",
                                    as: "product_details"
                                }
                            },
                            {
                                $project: {
                                    "rating"            : 1,
                                    "review"            : 1,
                                    "created"           : 1,
                                    "status"            : 1,
                                    "review_for"        : 1,
                                    "user_name"         : { $arrayElemAt: [ "$user_details.full_name", 0 ] },
                                    "user_type"         : { $arrayElemAt: [ "$user_details.user_type", 0 ] },
                                    "posted_by_name"    : { $arrayElemAt: [ "$posted_by_details.full_name", 0 ] },
                                    "posted_by_user_type": { $arrayElemAt: [ "$posted_by_details.user_type", 0 ] },
                                    "product_name"      : { $arrayElemAt: [ "$product_details.product_title", 0 ] },
                                }
                            },
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit : limit} 
                        ],
                        "rating_all_count" : [
                            {$group:{
                                _id: null,
                                count: { $count : {} }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "rating_filter_count" : [
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

                RatingModel.getRatingAggregateList(req,res,options).then(newsletterResponse=>{
					let responseStatus = (newsletterResponse.status) ? newsletterResponse.status : "";
                    let responseResult = (newsletterResponse.result && newsletterResponse.result[0]) ? newsletterResponse.result[0] : "";

                    let rating_list = (responseResult && responseResult.rating_list) ? responseResult.rating_list : [];
                    let rating_all_count = (responseResult && responseResult.rating_all_count && responseResult.rating_all_count[0] && responseResult.rating_all_count[0]["count"]) ? responseResult.rating_all_count[0]["count"] : DEACTIVE;
                    let rating_filter_count = (responseResult && responseResult.rating_filter_count && responseResult.rating_filter_count[0] && responseResult.rating_filter_count[0]["count"]) ? responseResult.rating_filter_count[0]["count"] : DEACTIVE;
                    res.send({
                        status			: 	responseStatus,
                        draw			:	dataTableConfig.result_draw,
                        data			:   rating_list,
                        recordsTotal	:	rating_all_count,
                        recordsFiltered	:  	rating_filter_count,
                    });
				});
			});
		}else{

            let options = {
                collections: [
                    {
                        collection: TABLE_PRODUCTS,
                        columns: ["_id", "product_title"],
                        conditions: { is_active: ACTIVE, is_deleted: DEACTIVE },
                        sort_conditions: { _id: -1 },
                    },
                    {
                        collection: TABLE_USERS,
                        columns: ["_id", "full_name"],
                        conditions: { status: ACTIVE, is_deleted: DEACTIVE, user_type:SERVICE_PROVIDER_USER_TYPE },
                        sort_conditions: { _id: -1 },
                        selected: { user_id },
                    }
					,
                    {
                        collection: TABLE_USERS,
                        columns: ["_id", "full_name"],
                        conditions: { status: ACTIVE, is_deleted: DEACTIVE, user_type:CUSTOMER_USER_TYPE },
                        sort_conditions: { _id: -1 },
                    }
                ]
            };
            getDropdownList(req, res, options).then(async (responseData) => {

			    /** render listing page **/
			    req.breadcrumbs(BREADCRUMBS["admin/rating_reviews/list"]);
			    res.render("list",{
                    user : user, 
                    product : product,
                    product_list: (responseData && responseData.final_html_data && responseData.final_html_data["0"]) ? responseData.final_html_data["0"] : "",
                    service_provider_list: (responseData && responseData.final_html_data && responseData.final_html_data["1"]) ? responseData.final_html_data["1"] : "",
                    customer_list: (responseData && responseData.final_html_data && responseData.final_html_data["2"]) ? responseData.final_html_data["2"] : "",

                });
            });
		}
	};//End getSubscriberList()

   


        /**
         * Function for update Approve Rating status
         *
         * @param req 	As Request Data
         * @param res 	As Response Data
         * @param next 	As Callback argument to the middleware function
         *
         * @return null
         */


        this.updateApproveRatingStatus = async (req, res, next) => {
            try {
                const ratingStatus = req.params.status || "";
                const statusType = req.params.status_type || "";
                const ratingId = req.params.id || "";
        
                if (!ratingId || !statusType || statusType !== APPROVE_REJECT_STATUS) {
                    req.flash("error", res.__("admin.system.invalid_access"));
                    return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                }
        
                /** Set update data **/
                const updateData = {
                    $set: {
                        modified: getUtcDate(),
                        status: (ratingStatus == APPROVE) ? APPROVE : REJECT
                    }
                };
        
                const condition = { _id: new ObjectId(ratingId) };
                const optionObj = { conditions: condition, updateData };
        
                const updateResponse = await RatingModel.updateOneRating(req, res, optionObj);
        
              
                if (updateResponse.status === STATUS_ERROR) {
                    req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                    return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                }
        
                if (updateResponse.status === STATUS_SUCCESS) {
                    const ratingResponse = await RatingModel.ratingDetails(req, res, { conditions: { _id: new ObjectId(ratingId) } });
                    if (!ratingResponse.result) {
                        req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                        return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                    }
        
                    const { user_id: userId, product_id: productId, review_for: reviewFor } = ratingResponse.result;
        
                    if (!userId && !productId) {
                        req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                        return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                    }
        
                    let ratingOptionObj = {};
                    if (reviewFor === USER_REVIEW) {
                        ratingOptionObj = {
                            conditions: { user_id: userId, review_for: USER_REVIEW, status: ACTIVE },
                            fields: { rating: 1, review: 1 }
                        };
                    } else if (reviewFor === PRODUCT_REVIEW) {
                        ratingOptionObj = {
                            conditions: { product_id: productId, review_for: PRODUCT_REVIEW, status: ACTIVE },
                            fields: { rating: 1, review: 1 }
                        };
                    }
        
                    const allRatingResponse = await RatingModel.getAllRatingList(ratingOptionObj);
        
                    let totalRating = 0;
                    let ratingCount = 0;
                    if (allRatingResponse.result?.length) {
                        allRatingResponse.result.forEach(data => {
                            totalRating += data.rating;
                            ratingCount++;
                        });
                    }
        
                    const userRating = ratingCount > 0 ? Math.round(totalRating / ratingCount) : 0;
        
                    let updateObj = {};
                    if (reviewFor === USER_REVIEW) {
                        updateObj = {
                            conditions: { _id: userId },
                            updateData: {
                                $set: {
                                    rating: userRating,
                                    rating_count: ratingCount
                                }
                            }
                        };
        
                        const userResponse = await RatingModel.updateUser(req, res, updateObj);
                        if (userResponse.status === STATUS_ERROR) {
                            req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                            return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                        }      
                        
                        
                        req.flash(STATUS_SUCCESS, res.__("front.review_approved_successfully"));
                    } else if (reviewFor === PRODUCT_REVIEW) {
                        updateObj = {
                            conditions: { _id: productId },
                            updateData: {
                                $set: {
                                    rating: userRating,
                                    rating_count: ratingCount
                                }
                            }
                        };
        
                        const productResponse = await RatingModel.updateProduct(req, res, updateObj);
                        if (productResponse.status === STATUS_ERROR) {
                            req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                            return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                        }      
                       

                        req.flash(STATUS_SUCCESS, res.__("front.review_status_updated_successfully"));
                    }
        
                    return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
                }
            } catch (error) {
                console.error("Error in updateApproveRatingStatus:", error);
                req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                return res.redirect(`${WEBSITE_ADMIN_URL}rating`);
            }
        };
        











        
        this.updateApproveRatingStatus_old = (req, res, next) => {
             
            let reatingStatus   =   (req.params.status) ? req.params.status : "";
             let statusType      =   (req.params.status_type) ? req.params.status_type : "";
             let reatingId       =   (req.params.id) ? req.params.id : "";
     
            if (!reatingId || !statusType || (statusType != APPROVE_REJECT_STATUS)) {
                /** Send error response **/
                req.flash("error", res.__("admin.system.invalid_access"));
                res.redirect(WEBSITE_ADMIN_URL + "rating");
                return;
            } else {
                /** Set update data **/
                let updateData = {
                    $set: {
                        modified: getUtcDate()
                    }
                };
    
                if (statusType == APPROVE_REJECT_STATUS) {
                    updateData["$set"]["status"] = (reatingStatus == APPROVE) ? APPROVE : REJECT;
                }
    
                let condition = {
                    _id: new ObjectId(reatingId)
                }
    
                let optionObj = {
                    conditions: condition,
                    updateData: updateData
                }
     
                RatingModel.updateOneRating(req, res, optionObj).then(updateResponse => {
                      
                    if (updateResponse.status == STATUS_ERROR) {
                        req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                        res.redirect(WEBSITE_ADMIN_URL + "rating");
                        return;
                    }

                    if (updateResponse.status == STATUS_SUCCESS) {
                    
                        let optionObjData = {
                            conditions: { "_id": new ObjectId(reatingId) },
                        }
                        RatingModel.ratingDetails(req, res, optionObjData).then(ratingResponse => {
                            
                            let oppositeUserId  =   (ratingResponse.result.posted_by) ? ratingResponse.result.posted_by : "";; 
                            let productId       =   (ratingResponse.result.product_id) ? ratingResponse.result.product_id : "";; 
                            let ratingOptionObj =   {};
                            if(ratingResponse.result.review_for == USER_REVIEW)
                            {
                                ratingOptionObj = {
                                    conditions: { "posted_by": oppositeUserId, "review_for": USER_REVIEW, "status": ACTIVE },
                                    fields: { rating: 1, review: 1 },
                                }
                            }
                            if(ratingResponse.result.review_for ==  PRODUCT_REVIEW)
                            {
                                ratingOptionObj = {
                                    conditions: { "product_id": productId, "review_for": PRODUCT_REVIEW, "status": ACTIVE },
                                    fields: { rating: 1, review: 1 },
                                }
                               
                            }
 
                            RatingModel.getAllRatingList(ratingOptionObj).then((allRatingResponse) => {
                         
                                let userRating = 0;
                                let count = 0;
                                if (allRatingResponse.result && allRatingResponse.result.length > 0) {
                                    allRatingResponse.result.map(data => {
                                        userRating += data.rating;
                                        count++;
                                    });
                                    userRating = round((userRating / count), 0);
                                    
                                }
                                

                                if(ratingResponse.result.review_for ==  USER_REVIEW)
                                {
                                    let userObj = {
                                        conditions: { _id: oppositeUserId },
                                        updateData: {
                                            $set: {
                                                rating: userRating,
                                                rating_count: count
                                            }
                                        }
                                    };

                                    RatingModel.updateUser(req, res, userObj).then((userResposne) => {
                                        if (userResposne.status == STATUS_ERROR) {
                                            req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                                            res.redirect(WEBSITE_ADMIN_URL + "rating");
                                            return;
                                        }
         
                                        req.flash(STATUS_SUCCESS, res.__("front.review_approved_successfully"));
                                        res.redirect(WEBSITE_ADMIN_URL + "rating");
                                        return;
                                    });
                                }

                                if(ratingResponse.result.review_for ==  PRODUCT_REVIEW)
                                {
                                    let productObj = {
                                        conditions: { _id: productId },
                                        updateData: {
                                            $set: {
                                                rating: userRating,
                                                rating_count: count
                                            }
                                        }
                                    };
                                    RatingModel.updateProduct(req, res, productObj).then((userResposne) => {
                                        if (userResposne.status == STATUS_ERROR) {
                                            req.flash("error", res.__("front.system.something_going_wrong_please_try_again"));
                                            res.redirect(WEBSITE_ADMIN_URL + "rating");
                                            return;
                                        }
         
                                        req.flash(STATUS_SUCCESS, res.__("front.review_status_updated_successfully"));
                                        res.redirect(WEBSITE_ADMIN_URL + "rating");
                                        return;
                                    });
                                }
                            });
                        });
                    } 
                });
    
            }
    
        };//End updateApproveRatingStatus()
        

};

module.exports = new RattingController()