const { ObjectId } = require('mongodb');
const async = require("async");
const CategoryModel = require("./model/category");
const clone				= 	require('clone');

function CategoryController(){

    const CategoryController = this;
    /**
     * function to get list of categories
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.categoryList = (req,res)=>{

        if(isPost(req)){
            let limit			= 	(req.body.length) 	? 	parseInt(req.body.length) 	:ADMIN_LISTING_LIMIT;
			let skip			= 	(req.body.start) 	? 	parseInt(req.body.start) 	:DEFAULT_SKIP;
			let search_data 	=   req.body.search_data;
            let language        =   (req.session.lang)  ?   req.session.lang            : DEFAULT_LANGUAGE_CODE; 

            configDatatable(req,res,null).then(dataTableConfig=>{
                if(search_data.length){
                    search_data.map(formdata=>{
                        if(formdata.name!="search_open" && formdata.value!=""){

                            if(formdata.name == "status" && formdata.value != ""){
                                dataTableConfig.conditions[formdata.name] 	= Number(formdata.value);
                            }else{
                                dataTableConfig.conditions[formdata.name] 	= { "$regex":  formdata.value, "$options" : "i" };
                            }
                            
                        }
                
                    })

                }

                let conditions = [{
                    $facet : {
                        "category_list":[
                            { 
                                $graphLookup: {
                                    from: TABLE_CATEGORIES,
                                    startWith: "$parent_id",
                                    connectFromField: "parent_id",
                                    connectToField: "_id",
                                    as: "parent_category",
                                    maxDepth: 5 // Specify the maximum depth of the hierarchy
                                }
                                
                            },
                            {
                                $project	:	{
                                    _id				:	1,
                                    parent_id       :   1,
                                    category_name   :   { $cond : {if: { $ne : ["$pages_descriptions."+language+".category_name",'']},then:"$pages_descriptions."+language+".category_name",else:"$category_name"}},
                                    parent_category :   1,
                                    status          :   1,
                                    modified        :   1
                                }
                            },
                            {$match : dataTableConfig.conditions},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip  : skip},
                            {$limit : limit},
                            
                        ],
                        "total_categories_count":[
                            {$group:{
                                _id: null,
                                count: { $sum: 1 }
                            }},
                            {
                                $project:{count:1,_id:0}
                            }
                        ],
                        "filtered_categories_count":[
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

                CategoryModel.getCategoryAggregateList(req,res,optionObj).then(categoryResponse=>{

                  
                    let responseStatus = (categoryResponse.status) ? categoryResponse.status : "";
                    let responseResult = (categoryResponse.result && categoryResponse.result[0]) ? categoryResponse.result[0] : "";
                    
                    let category_list = (responseResult && responseResult.category_list) ? responseResult.category_list : [];
                    let total_category_count = (responseResult && responseResult.total_categories_count && responseResult.total_categories_count[0] && responseResult.total_categories_count[0]["count"]) ? responseResult.total_categories_count[0]["count"] : DEACTIVE;
                    let filtered_categories_count = (responseResult && responseResult.filtered_categories_count && responseResult.filtered_categories_count[0] && responseResult.filtered_categories_count[0]["count"]) ? responseResult.filtered_categories_count[0]["count"] : DEACTIVE;
                    CategoryController.formatCategoryList(category_list,language).then(formatedCategoryList=>{
                        res.send({
                            status			: 	responseStatus,
                            draw			:	dataTableConfig.result_draw,
                            data			:   formatedCategoryList,
                            recordsTotal	:	total_category_count,
                            recordsFiltered	:  	filtered_categories_count,
                        });
    
                    })
                   

                })				

            })
        }else{
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS["admin/category/list"]);
            res.render("list");
        }
    }


    this.formatCategoryList = (categoryList,language)=>{
        return new Promise(resolve=>{
            var finalResult	= [];
		    if(categoryList && categoryList.length > 0){
                async.eachSeries(categoryList,function iterate(category,callback){
                    let category_parent = (category.parent_id) ? category.parent_id : DEACTIVE;
                    
                    var parent_category_map = "";
                    if(category_parent){
                        let parent_category_array = (category.parent_category) ? category.parent_category : [];
                        parent_category_array.map((parent,index)=>{
                            if(parent._id.toString() == category_parent.toString()){
                                let parent_name = (parent.pages_descriptions && parent.pages_descriptions[language] && parent.pages_descriptions[language]["category_name"]) ? parent.pages_descriptions[language]["category_name"] : parent.category_name;
                                if(parent_category_array.length > 1){
                                    parent_category_array.map(root=>{
                                        if(parent.parent_id.toString() == root._id.toString()){
                                            let parent_name = (root.pages_descriptions && root.pages_descriptions[language] && root.pages_descriptions[language]["category_name"]) ? root.pages_descriptions[language]["category_name"] : root.category_name;
                                            parent_category_map += parent_name;
                                        }
                                        
                                    })
                                    parent_category_map += ' <span>&#8594;</span> ';
                                }
                                parent_category_map += parent_name;
                            }
                        });

                        category['is_assign_attribute'] = (parent_category_array.length == ACTIVE) ? ACTIVE : DEACTIVE ;
                       
                        category["parent_map"] = parent_category_map;
                        finalResult.push(category);
                        callback(null)
                    }else{
                        category['is_assign_attribute'] = DEACTIVE;
                        category["parent_map"]="";
                        finalResult.push(category);
                        callback(null);
                    }
                },function done(err,res){
                    return resolve(finalResult)
                })

            }else{
                return resolve(categoryList)
            }
        })
    }


     /**
     * function to get list of categories
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.addCategory = (req,res)=>{
        convertMultipartFormData(req,res).then(()=>{
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

                req.body.category_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["category_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["category_name"] :"";

               // let parentId		=	(req.body.parent_category)	? 	new ObjectId(req.body.parent_category) 	: DEACTIVE;
                let subCategoryId   =   (req.body.sub_category)     ?   new ObjectId(req.body.sub_category) : "";
                let category_name   =   (req.body.category_name)    ?   req.body.category_name : "";

                /** Set options for upload image **/
				let image	= 	(req.files && req.files.category_image)	?	req.files.category_image	:"";
				let options = {
					'image' 	:	image,
					'filePath' 	: 	CATEGORY_FILE_PATH,
					'oldPath' 	: 	""
				};

                let errors = []

				/** Upload master  image **/
				moveUploadedFile(req, res,options).then(categoryImageResponse=>{
                    var categoryImageName = "";

console.log("CATEGORY_FILE_PATH",CATEGORY_FILE_PATH);




                    if(categoryImageResponse.status == STATUS_ERROR){
						errors.push({'path':'category_image','msg':categoryImageResponse.message});
					}else{
						categoryImageName = (typeof categoryImageResponse.fileName !== typeof undefined) ? categoryImageResponse.fileName : '';
					}

					if(errors.length > 0){
						/** Send error response **/
						return res.send({
							status	: STATUS_ERROR,
							message	: errors,
						});
					}

                    let slugOptions = {
                        title 		:	category_name,
                        table_name 	: 	TABLE_CATEGORIES,
                        slug_field 	: 	"slug"
                    };

                    getDatabaseSlug(slugOptions).then(categorySlugResponse=>{
                        let categorySlugName   			= categorySlugResponse.title;
                        let insertData = {
                            category_name		:	category_name,
                            image				:	categoryImageName,
                            slug                :   categorySlugName,
                            pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions :{},
                            status	 			:	ACTIVE,
                            created 			:	getUtcDate(),
                            modified 			: 	getUtcDate()
                        }
                        
                        if(subCategoryId){
                            insertData["parent_id"] = subCategoryId
                        }
                        
    
                        let optionObj = {
                            insertData : insertData
                        };
    
                        CategoryModel.saveCagetory(req,res,optionObj).then(categoryResponse=>{
                            if(categoryResponse.status == STATUS_SUCCESS){
                                req.flash(STATUS_SUCCESS,res.__("admin.category.category_has_been_added_successfully"));
                                res.send({
                                    status			:	STATUS_SUCCESS,
                                    redirect_url	: 	WEBSITE_ADMIN_URL+"category",
                                    message			:	res.__("admin.category.category_has_been_added_successfully"),
                                });
                            }else{
                                return next(categoryResponse.error)
                            }
                        })
                    })

                  

                });
                

            }else{
                let options = {
                    collections:[
                        {
                            collection:	TABLE_CATEGORIES,
                            columns	:	["_id","category_name"],
                            conditions:{
                                status      : ACTIVE,
                                parent_id   : DEACTIVE
                            }
                        }
                    ]
                };
                getDropdownList(req,res,options).then(response=> {
                    getLanguages().then(languageList=>{
                        /** render listing page **/
                        req.breadcrumbs(BREADCRUMBS["admin/category/add"]);
                        res.render("add",{
                            parent_category	: (response && response.final_html_data && response.final_html_data["0"])	?	response.final_html_data["0"]:"",
                            language_list	: languageList
                        });
                    });
                });
            }
        });
    }

     /**
     * function to get list of categories
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getSubCategoryList = (req,res)=>{
        let value = (req.body.value) ? req.body.value : "";
        let field_name = (req.body.field_name) ? req.body.field_name : "";
        let language        =   (req.session.lang)  ?   req.session.lang            : DEFAULT_LANGUAGE_CODE;
        if(value && field_name){

            let conditions = {
			    status	   : ACTIVE,
            }
            if(field_name=='parent_category'){
                conditions["parent_id"] = new ObjectId(value);
                conditions["sub_category_id"] = {$exists : false}
            }
          

            let sort_conditions = {
                category_name : SORT_ASC
            }

            let fields = {
                _id			    :	1,
			    category_name	:	 { $cond : {if: { $ne : ["$pages_descriptions."+language+".category_name",'']},then:"$pages_descriptions."+language+".category_name",else:"$category_name"}},
            };

            let optionObj = {
                conditions : conditions,
                sort_conditions : sort_conditions,
                fields : fields
            }

            CategoryModel.getCategoriesList(optionObj).then(categoryResponse=>{
                if(categoryResponse.status == STATUS_ERROR){
                    res.send({
                        status	:STATUS_ERROR,
                        result	:[],
                        message	:res.__("admin.system.something_going_wrong_please_try_again")
                    });
                }else{
                    res.send({
                        status:STATUS_SUCCESS,
                        result:categoryResponse.result
                    });
                }
            })

        }else{
            res.send({
                status	:STATUS_ERROR,
                result	:[],
                message	:res.__("admin.system.something_going_wrong_please_try_again")
            });
        }
    }


     /**
     * function to get list of categories
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
     this.editCategory = (req,res)=>{
        let categoryId = (req.params.id) ? req.params.id : "";
        if(categoryId){
            convertMultipartFormData(req,res).then(()=>{
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
    
                    req.body.category_name		=	(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["category_name"])	?	allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]["category_name"] :"";
    
                    let parentId		=	(req.body.parent_category)	? 	new ObjectId(req.body.parent_category) 	: DEACTIVE;
                    let subCategoryId   =   (req.body.sub_category)     ?   new ObjectId(req.body.sub_category) : "";
                    let category_name   =   (req.body.category_name)    ?   req.body.category_name : "";
    
                    /** Set options for upload image **/
                    let image	= 	(req.files && req.files.category_image)	?	req.files.category_image	:"";
                    let oldImage = 	(req.body.old_image) 			?	req.body.old_image	:"";
                    let options = {
                        'image' 	:	image,
                        'filePath' 	: 	CATEGORY_FILE_PATH,
                        'oldPath' 	: 	oldImage
                    };
    
                    let errors = []
    
                    /** Upload master  image **/
                    moveUploadedFile(req, res,options).then(categoryImageResponse=>{
                        var categoryImageName = "";
    
                        if(categoryImageResponse.status == STATUS_ERROR){
                            errors.push({'path':'category_image','msg':categoryImageResponse.message});
                        }else{
                            categoryImageName = (typeof categoryImageResponse.fileName !== typeof undefined) ? categoryImageResponse.fileName : '';
                        }
    
                        if(errors.length > 0){
                            /** Send error response **/
                            return res.send({
                                status	: STATUS_ERROR,
                                message	: errors,
                            });
                        }

                        let condition = {
                            _id : new ObjectId(categoryId)
                        }
    
                        let updateData = {
                            category_name		:	category_name,
                            parent_id			:	parentId,
                            image				:	categoryImageName,
                            pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions :{},
                            modified 			: 	getUtcDate()
                        }
    
                        if(subCategoryId){
                            updateData["sub_category_id"] = subCategoryId;
                        }
    
                        let optionObj = {
                            conditions : condition,
                            updateData : {$set:updateData}
                        };
    
                        CategoryModel.updateCategory(req,res,optionObj).then(categoryResponse=>{
                            if(categoryResponse.status == STATUS_SUCCESS){
                                req.flash(STATUS_SUCCESS,res.__("admin.category.category_has_been_updated_successfully"));
                                res.send({
                                    status			:	STATUS_SUCCESS,
                                    redirect_url	: 	WEBSITE_ADMIN_URL+"category",
                                    message			:	res.__("admin.category.category_has_been_updated_successfully"),
                                });
                            }else{
                                return next(categoryResponse.error)
                            }
                        })
    
                    }).catch();
                    
    
                }else{
                    let detailCondition = {
                        _id : new ObjectId(categoryId)
                    };

                    let optionObj = {
                        conditions : detailCondition
                    }

                    CategoryModel.getCategoryDetail(optionObj).then(categryDetailResponse=>{
                        if(categryDetailResponse.status != STATUS_SUCCESS){
                            /** Send error response **/
                            req.flash("error",categryDetailResponse.message);
                            res.redirect(WEBSITE_ADMIN_URL+"category");
                            return;
                        }else{
                            let categoryDetail 		= categryDetailResponse.result;
                            let parentId = (categoryDetail.parent_id)?categoryDetail.parent_id:'';

                            let options = {
                                collections:[
                                    {
                                        collection:	TABLE_CATEGORIES,
                                        columns	:	["_id","category_name"],
                                        selected : [parentId],
                                        conditions:{
                                            status      : ACTIVE,
                                            parent_id   : DEACTIVE
                                        }
                                    }
                                ]
                            };
                            getDropdownList(req,res,options).then(response=> {
                                getLanguages().then(languageList=>{
                                    /** render listing page **/
                                    req.breadcrumbs(BREADCRUMBS["admin/category/edit"]);
                                    res.render("edit",{
                                        result : categoryDetail,
                                        parent_category	: (response && response.final_html_data && response.final_html_data["0"])	?	response.final_html_data["0"]:"",
                                        language_list	: languageList
                                    });
                                });
                            });
                        }
                    })
                    
                }
            });
        }else{
            /** Send error response **/
			req.flash("error",res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"category");
			return;
        }
        
    }


    /**
	 * Function for update category status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateCategoryStatus = (req,res)=>{
		let categoryId		 = 	(req.params.id) 			?	req.params.id 			:"";
		let userStatus	 =	(req.params.status) 		? 	req.params.status	 	:"";
		let statusType	 =	(req.params.status_type) 	? 	req.params.status_type	:"";

		if (categoryId && userStatus && (statusType == ACTIVE_INACTIVE_STATUS)) {
			try{
				let updateData = {
					modefied	: getUtcDate(),
					status		: (userStatus == ACTIVE) ? DEACTIVE : ACTIVE,
				};
				let conditions = {
					_id : new ObjectId(categoryId)
				}

				let optionObj = {
					updateData : {$set:updateData},
					conditions : conditions
				}

				CategoryModel.updateCategory(req,res,optionObj).then(categoryResponse=>{
					if(categoryResponse.status == STATUS_SUCCESS){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.category.category_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+"category");
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+"category");
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+"category");
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+"category");
		}
	};//End updateCategoryStatus()


    this.assignAttribute = (req,res)=>{
        let id = (req.body.attribute) ? req.body.attribute : [];
        let categoryId = (req.body.categoryId) ? req.body.categoryId : "";
        if(categoryId){
            let selectedAttributes = [];
            selectedAttributes = id.map((id)=>{return new ObjectId(id)});

            let condition = {
                _id : new ObjectId(categoryId)
            };

            let updateData = {
                attribute_id : selectedAttributes
            };

            let updateOption = {
                conditions : condition,
                updateData : {$set: updateData}
            };

            CategoryModel.updateCategory(req,res,updateOption).then(categoryResponse=>{
                if(categoryResponse.status == STATUS_SUCCESS){
                    req.flash(STATUS_SUCCESS,res.__("admin.category.category_attributes_has_been_updated_successfully"));
                    res.send({
                        status			:	STATUS_SUCCESS,
                        redirect_url	: 	WEBSITE_ADMIN_URL+"category",
                        message			:	res.__("admin.category.category_attributes_has_been_updated_successfully"),
                    });
                }else{
                    return next(categoryResponse.error)
                }
            })
        }else{
            return res.send({
                status	: STATUS_ERROR,
                message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
            });
        }
        
    }

    this.getAttributeList = (req,res)=>{
        let categoryId = (req.params.id) ? req.params.id : {};
        let conditions  = {
            _id : new ObjectId(categoryId)
        };
        let detailOptions = {
            conditions : conditions
        };

        CategoryModel.getCategoryDetail(detailOptions).then(categryDetailResponse=>{
            if(categryDetailResponse.status != STATUS_SUCCESS){
                /** Send error response **/
                req.flash("error",categryDetailResponse.message);
                res.redirect(WEBSITE_ADMIN_URL+"category");
                return;
            }else{

                let selectedAttributes = (categryDetailResponse.result && categryDetailResponse.result.attribute_id) ? categryDetailResponse.result.attribute_id : [];
                let options = {
                    collections:[
                        {
                            collection:	TABLE_ATTRIBUTES,
                            columns	:	["_id","title"],
                            selected : selectedAttributes,
                            conditions:{
                                is_active      : ACTIVE,
                                is_deleted   : DEACTIVE
                            }
                        }
                    ]
                };
                getDropdownList(req,res,options).then(response=> {
                    res.send({
                        status:STATUS_SUCCESS,
                        result:(response && response.final_html_data && response.final_html_data["0"])	?	response.final_html_data["0"]:""
                    });
                })
            }
        });
    }

}

module.exports = new CategoryController()
