const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const CategoryModel = require("../../category/model/category");
const { ObjectId } = require('mongodb');
const clone	= require('clone');
const asyncParallel 	= require("async/parallel");
const asyncEach         = 	require("async/each");
class ProductModel{

    constructor(){
        this.db_collection_name = TABLE_PRODUCTS;
        this.db_incr_collection_name = TABLE_INCREMENTALS
        this.db_stock_log_collection_name = TABLE_PRODUCT_STOCK_LOGS
    }

    /**
	 * Function to get product id
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getProductId = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_incr_collection_name;
            DbClass.findAndupdateOneRecord(req,res,options).then(productResponse=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
				let responseResult = (productResponse.result) ? productResponse.result : {};

                if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
            })
        })
    }

    /**
	 * Function to save product
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    saveOneProduct = (req,res,options)=>{
        return new Promise(resolve=>{
            options["collection"] = this.db_collection_name;

            DbClass.saveInsertOne(req,res,options).then(productResponse=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
				let responseResult = (productResponse.result) ? productResponse.result : {};

                if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
            })
        })
    }


	/**
	 * Function to get product list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
    getProductAggregateList = (req,res,optionObj)=>{
        return new Promise(resolve=>{
            optionObj["collection"] = this.db_collection_name;

            DbClass.getAggregateResult(req,res,optionObj).then((productResponse)=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
                let responseResult = (productResponse.result) ? productResponse.result : "";

                if (responseStatus == STATUS_ERROR) {
                    let response = {
                        status: STATUS_ERROR,
                        result: {},
                        error: true,
                        message: "in error case"
                    };
                    return resolve(response);

                } else {
                    let response = {
                        status: STATUS_SUCCESS,
                        result: responseResult,
                        error: false,
                        message: ""
                    };
                    return resolve(response);

                }
                
            });
        });

    }

    /**
   * Function to get product update one
   *
   * @param req As Request Data
   * @param res As Response Data
   *
   * @return render/json
   */
	updateOneProduct = (req, res, optionObj) => {
		return new Promise(resolve => {
			optionObj["collection"] = this.db_collection_name;
			DbClass.updateOneRecord(req, res, optionObj).then(updateResult => {
				let responseStatus = (updateResult.status) ? updateResult.status : "";
				let responseResult = (updateResult.result) ? updateResult.result : {};
				
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: responseResult,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
			})
		})
	}


	/**
	 * Function to get attribute and options
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	getAttributesAndOptions = (req,res)=>{
        return new Promise(resolve=>{

            let language		= (req.body.lang_code)	  ? req.body.lang_code	    : DEFAULT_LANGUAGE_CODE;
            let categoryId      = (req.body.category_id)  ? req.body.category_id    : "";

            let conditions = {
                _id : new ObjectId(categoryId),
                status : ACTIVE
            };

            let fields = {
                _id : 1,
                attribute_id : 1
            };

            let listOption = {
                conditions : conditions,
                fields : fields
            };
            
            CategoryModel.getCategoryDetail(listOption).then(categoryResponse=>{
                if(categoryResponse.status == STATUS_SUCCESS){
                    let attributes = (categoryResponse.result && categoryResponse.result.attribute_id) ? categoryResponse.result.attribute_id : [];

                    let conditions = [
                        {
                            $match : {
                                _id			: { $in : attributes },
                                is_active	: ACTIVE,
                                is_deleted	: DEACTIVE	
                            }
                        },
                        { $lookup: {
							from		: TABLE_ATTRIBUTE_OPTIONS,
							let			: { attributeId: "$_id" },
							pipeline	: [
								{
									$match: {
										$expr: {
											$and: [
												{ $eq: ["$attribute_id", "$$attributeId"] },
												{ $eq: ["$is_active", ACTIVE] },
												{ $eq: ["$is_deleted", DEACTIVE] },
											]
										},
									}
								},
								{ 
									$project: { 
										"_id": 1,
										"title":{ $cond : {if: { $ne : ["$pages_descriptions."+language+".title",'']},then:"$pages_descriptions."+language+".title",else:"$title"}}, 
									} 
								}
							],
							as	: "optionData"
						}},
						{
							$project : {
								_id			:1,
								title 		:{ $cond : {if: { $ne : ["$pages_descriptions."+language+".display_title",'']},then:"$pages_descriptions."+language+".display_title",else:"$display_title"}}, 
								optionData	:"$optionData",
							}
						}
                    ];

                    let attrOptions = {
                        conditions : conditions
                    };
                    
                    AttributeModel.getAttributeAggregateList(req,res,attrOptions).then(attrResponse=>{
                        if(attrResponse.status == STATUS_SUCCESS){
                            let response = {
                                status : STATUS_SUCCESS,
                                result : attrResponse.result,
                            };
                            return resolve(response);
                        }else{
                            let response = {
                                status : STATUS_ERROR,
                                result : [],
                                message : attrResponse.message
                            };
                            return resolve(response);
                        }
                    })
                }else{
                    let response = {
                        status : STATUS_ERROR,
                        result : [],
                        message : categoryResponse.message
                    };
                    return resolve(response);
                }
            });
        });
    }


    /**
	 * Function to save product
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	saveProduct = (req,res)=>{
        return new Promise(resolve=>{
            req.body 	= sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS); 
			//var apiType	= (req.body.api_type) ? req.body.api_type 	:"";
            let finalResponse = [];

            let image				    = (req.files && req.files.product_image) ? req.files.product_image	            :"";
            let files                   = req.files || '';

            delete files.product_image;
            if(Object.keys(files).length){
                files = Object.keys(files).map(key => ({ image: files[key] }));
            }


            asyncParallel({
                userDetail:(callback)=>{
                    let conditions = {
                        slug : req.body.slug
                    }
                    /** Set options data for get user details **/
                    let userOptions = {
                        conditions	:	conditions
                    };

                    getUserDetailBySlug(req, res, userOptions).then(userResponse => {
                        callback(null, userResponse.result);
                    });
                },
                categories:(callback)=>{
                    let conditions = { status:ACTIVE };
                    let fields = { _id:1,category_name:1 };
                    let cateOption = {
                        conditions : conditions,
                        fields : fields,
                    }
                    CategoryModel.getCategoriesList(cateOption).then((cateResponse)=> {
                        var categoryArray = {};
                        cateResponse.result.map(records => {
                            if( records._id && records.category_name ){
                                categoryArray[records._id] 	= records.category_name;
                            }
                        });
                        callback(cateResponse.message, categoryArray);
                    });
                },
                categoriesAr:(callback)=>{
                    let conditions = { status:ACTIVE };
                    let fields = { _id:1,category_name:1,pages_descriptions:1 };
                    let cateOption = {
                        conditions : conditions,
                        fields : fields,
                    }
                    CategoryModel.getCategoriesList(cateOption).then((cateResponse)=> {

                        var categoryArray = {};
                        cateResponse.result.map(records => {
                            if( records._id && records.pages_descriptions && records.pages_descriptions["ar"] && records.pages_descriptions["ar"].category_name ){
                                categoryArray[records._id] 	= records.pages_descriptions["ar"].category_name;
                            }
                            else if( records._id && records.category_name ){
                                categoryArray[records._id] 	= records.category_name;
                            }
                        });

                        callback(cateResponse.message, categoryArray);
                    });
                },
                product_images : (callback) => {
                    if(!files) return callback(null, null);
 
                    let productImages = []
                    asyncEach(files,(records, eachCallback)=>{
                         if(!records.image.name) return eachCallback(null);
 
                         /** Upload category image **/
                         moveUploadedFile(req, res,{filePath: PRODUCT_FILE_PATH, image: records.image}).then(imgRes=>{
                             if(imgRes.status == STATUS_ERROR) return callback([{'param':'images','msg': imgRes.message}]);
 
                             let obj ={
                                 _id : new ObjectId(),
                                 image : imgRes.fileName
                             }
                             productImages.push(obj);
                             eachCallback(null);
                         });
                         
                     },()=>{
                         callback(null, productImages);
                     });
                 },
                
            },(asyncError,asyncResponse)=>{

                var userDetail			= (asyncResponse.userDetail)				? asyncResponse.userDetail 	  			: [];

                var categories			= (asyncResponse.categories) 			? asyncResponse.categories 	    		: [];
                var categoriesAr		= (asyncResponse.categoriesAr) 			? asyncResponse.categoriesAr 	    	: [];

                let userId					= (userDetail._id) 					? (userDetail._id)							:"";
                
                req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                if(typeof req.body.pages_descriptions == typeof undefined && (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == typeof undefined && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == "")){
                    return res.send({
                        status	: STATUS_ERROR,
                        message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                    });
                }
    
                let allData			= req.body;

               
                req.body		    = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
                let multilinualData = allData.pages_descriptions;

                let price 				=	 (allData.price) 			? Number(allData.price)	:	DEACTIVE;
				let parent_category		= 	(allData.parent_category) 	? (allData.parent_category)	:	"";
				let offerPrice			= 	(allData.offer_price)		?	Number(allData.offer_price)	: 0;
				let offerType			= 	(allData.offer_type)		?	allData.offer_type				: "";
				let vatIncluded			= 	(allData.vat_included)		?	Number(allData.vat_included)	: "";
				let mrpPrice			=	price;
				
				if(offerPrice > 0 ){
					if(offerType == PERCENT_OF_AMOUNT){
						mrpPrice	=	(Number(price) * 100 ) / (100 - Number(offerPrice));
					}
					else if(offerType == FLAT_AMOUNT){
						mrpPrice	=	Number(price) + Number(offerPrice);
					}
				}
				 
                let productTitle 			= (req.body.product_title) 			? (req.body.product_title) 				    :"";
                let description  		    = (req.body.detailed_description) 	? (req.body.detailed_description) 		    :"";
                let brief_description  	    = (req.body.brief_description) 	    ? (req.body.brief_description) 			    :"";

                

                let parent_category_name		= 	( categories && allData.parent_category && categories[allData.parent_category]) 			? 	categories[allData.parent_category] 		:"";

                let productSku 			= (allData.product_sku) 			? (allData.product_sku) 				    :"";
                
                let options	=	{
                    'image' 	:	image,
                    'filePath' 	: 	PRODUCT_FILE_PATH
                };

                moveUploadedFile(req, res,options).then(response=>{
                    if(response.status == STATUS_ERROR){
                        /** Send error response **/
                        finalResponse = {
                            status	: STATUS_ERROR,
                            message	: [{path:ADMIN_GLOBAL_ERROR,msg:response.message}],
                        };
                        return resolve(finalResponse);
                    }else{
                        let imageName 	= 	(response.fileName) ? response.fileName 	: "";

                        let slugOptions = {
                            title 		:	productTitle,
                            table_name 	: 	TABLE_PRODUCTS,
                            slug_field 	: 	"slug"
                        };

                        getDatabaseSlug(slugOptions).then(slugResponse=>{

                            let insertEnData = multilinualData[DEFAULT_LANGUAGE_CODE];

                            let insertArData = multilinualData[ARABIC_LANGUAGE_CODE];

                            insertEnData["parent_category_name"] = parent_category_name;

                            insertArData["parent_category_name"] = ( categoriesAr && allData.parent_category && categoriesAr[allData.parent_category]) 			? categoriesAr[allData.parent_category] 		:"";

                            let productSlug = (slugResponse && slugResponse.title)	?	slugResponse.title	:"";

                            let insertData = {
                                product_title				: 	productTitle,
                                price   					: 	price,
                                mrp_price  					: 	mrpPrice,
								offer_price					: 	offerPrice,
								offer_type  				: 	offerType,
								vat_included  				: 	vatIncluded,
								product_sku   				: 	productSku,
                                
                                detailed_description	    : 	description,	
                                brief_description			: 	brief_description,
                                parent_category				: 	(parent_category) ? new ObjectId(parent_category) : "",
                                
                                main_image_name				: 	imageName,
                                images                  	:   [],
                                user_id						: 	new ObjectId(userId),
                                slug 						: 	productSlug,
                                parent_category_name		: 	parent_category_name,
                                pages_descriptions          : {
                                    "en" : insertEnData,
                                    "ar" : insertArData,
                                },
                                is_sold						: DEACTIVE,
                                is_deleted 					: NOT_DELETED,
                                is_active					: ACTIVE,
                                is_block					: DEACTIVE,
                                created 					: getUtcDate(),
                                modified 					: getUtcDate(),
                                view_count					: DEACTIVE,
                                average_rating				: DEACTIVE,
                                total_reviews				: DEACTIVE,
                                is_marked_as_deal 			: DEACTIVE,
                            }

                            if(asyncResponse.product_images) insertData["images"] = asyncResponse.product_images;

                            let option = {
                                insertData : insertData
                            }

                            this.saveOneProduct(req,res,option).then(productSaveResponse=>{
                                if(productSaveResponse.status == STATUS_SUCCESS){
                                    finalResponse = {
                                        status	: STATUS_SUCCESS,
                                        product_slug	: productSlug,
                                        message	: res.__("front.ads.post_ad_save_successfully"),
                                    };
                                    return resolve(finalResponse);
                                }else{
                                    finalResponse = {
                                        status	: STATUS_ERROR,
                                        message	:[{path:ADMIN_GLOBAL_ERROR,msg:res.__("system.something_going_wrong_please_try_again")}]
                                    };
                                    return resolve(finalResponse);
                                }
                            });
                        });
                    }
                });
                
            })
            
        });
    }


    /**
     * 
     * to get product find one
     */
    productFindOne = (option)=>{
        return new Promise(resolve=>{
            option["collection"] = this.db_collection_name;
            DbClass.getFindOne(option).then(productResponse=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
				let responseResult = (productResponse.result) ? productResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
            })
        })
    }

     /**
	 * Function to save product
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	updateProduct = (req,res)=>{
        return new Promise(resolve=>{
            req.body 	= sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS); 
            let productId = (req.body.id) ? req.body.id : '';
            let image				    = (req.files && req.files.product_image) ? req.files.product_image	            :"";
            let files                   = req.files || '';
            let finalResponse = [];
            delete files.product_image;
            if(Object.keys(files).length){
                files = Object.keys(files).map(key => ({ image: files[key] }));
            }

            asyncParallel({
                categories:(callback)=>{
                    let conditions = { status:ACTIVE };
                    let fields = { _id:1,category_name:1 };
                    let cateOption = {
                        conditions : conditions,
                        fields : fields,
                    }
                    CategoryModel.getCategoriesList(cateOption).then((cateResponse)=> {
                        var categoryArray = {};
                        cateResponse.result.map(records => {
                            if( records._id && records.category_name ){
                                categoryArray[records._id] 	= records.category_name;
                            }
                        });
                        callback(cateResponse.message, categoryArray);
                    });
                },
                categoriesAr:(callback)=>{
                    let conditions = { status:ACTIVE };
                    let fields = { _id:1,category_name:1,pages_descriptions:1 };
                    let cateOption = {
                        conditions : conditions,
                        fields : fields,
                    }
                    CategoryModel.getCategoriesList(cateOption).then((cateResponse)=> {

                        var categoryArray = {};
                        cateResponse.result.map(records => {
                            if( records._id && records.pages_descriptions && records.pages_descriptions["ar"] && records.pages_descriptions["ar"].category_name ){
                                categoryArray[records._id] 	= records.pages_descriptions["ar"].category_name;
                            }
                            else if( records._id && records.category_name ){
                                categoryArray[records._id] 	= records.category_name;
                            }
                        });

                        callback(cateResponse.message, categoryArray);
                    });
                },
				
				product_images : (callback) => {
                    if(!files) return callback(null, null);
 
                    let productImages = []
                    asyncEach(files,(records, eachCallback)=>{
                         if(!records.image.name) return eachCallback(null);
 
                         /** Upload category image **/
                         moveUploadedFile(req, res,{filePath: PRODUCT_FILE_PATH, image: records.image}).then(imgRes=>{
                             if(imgRes.status == STATUS_ERROR) return callback([{'param':'images','msg': imgRes.message}]);
 
                             let obj ={
                                 _id : new ObjectId(),
                                 image : imgRes.fileName
                             }
                             productImages.push(obj);
                             eachCallback(null);
                         });
                         
                     },()=>{
                         callback(null, productImages);
                     });
				},
				
				 
            },(asyncError,asyncResponse)=>{

                var categories			= (asyncResponse.categories) 			? asyncResponse.categories 	    		: [];
                var categoriesAr		= (asyncResponse.categoriesAr) 			? asyncResponse.categoriesAr 	    	: [];
                var product_images		= (asyncResponse.product_images) 		? asyncResponse.product_images 	    	: [];

               
			   
			   
			   req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                if(typeof req.body.pages_descriptions == typeof undefined && (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == typeof undefined && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] && req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == "")){
                    return res.send({
                        status	: STATUS_ERROR,
                        message	: [{path:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
                    });
                }
    
                let allData			= req.body;
                req.body		    = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
                let multilinualData = allData.pages_descriptions;

                let price 				= 	(allData.price) 					? Number(allData.price) 					:DEACTIVE;
                let offerPrice			= 	(allData.offer_price)		?	Number(allData.offer_price)	: 0;
				let offerType			= 	(allData.offer_type)		?	allData.offer_type				: "";
				let vatIncluded			= 	(allData.vat_included)		?	Number(allData.vat_included)	: "";
				let mrpPrice			=	price;
				
				if(offerPrice > 0 ){
					if(offerType == PERCENT_OF_AMOUNT){
						mrpPrice	=	(Number(price) * 100 ) / (100 - Number(offerPrice));
					}
					else if(offerType == FLAT_AMOUNT){
						mrpPrice	=	Number(price) + Number(offerPrice);
					}
				}
 
                let parent_category			= (allData.parent_category) 	    ? (allData.parent_category) 				:"";  
                let productTitle 			= (req.body.product_title) 			? (req.body.product_title) 				    :"";
                let productSku 				= (allData.product_sku) 			? (allData.product_sku) 				    :"";
                let description  		    = (req.body.detailed_description) 	? (req.body.detailed_description) 		    :"";
                let brief_description  	    = (req.body.brief_description) 	    ? (req.body.brief_description) 			    :"";
                let parent_category_name	= 	( categories && allData.parent_category && categories[allData.parent_category]) 			? 	categories[allData.parent_category] 		:"";
                
                let oldImage                = (allData.old_image) 			         ? allData.old_image	                :"";

                let options	=	{
                    'image' 	:	image,
                    'filePath' 	: 	PRODUCT_FILE_PATH,
                    'oldPath' 	: 	oldImage
                };
                
                moveUploadedFile(req, res,options).then(response=>{
                    if(response.status == STATUS_ERROR){
                        /** Send error response **/
                        finalResponse = {
                            status	: STATUS_ERROR,
                            message	: [{path:ADMIN_GLOBAL_ERROR,msg:response.message}],
                        };
                        return resolve(finalResponse);
                    }else{
                        let imageName 	= 	(response.fileName) ? response.fileName 	: "";

                        
                        let insertEnData = multilinualData[DEFAULT_LANGUAGE_CODE];

                        let insertArData = multilinualData[ARABIC_LANGUAGE_CODE];

                        insertEnData["parent_category_name"] = parent_category_name;


                        insertArData["parent_category_name"] = ( categoriesAr && allData.parent_category && categoriesAr[allData.parent_category]) 			? categoriesAr[allData.parent_category] 		:"";
                     

                        let updateData = {
                            product_title				: 	productTitle,  
                            price   					: 	price,
                            product_sku   				: 	productSku,
							mrp_price  					: 	mrpPrice,
							offer_price					: 	offerPrice,
							offer_type  				: 	offerType,
							vat_included  				: 	vatIncluded,
                            description					: 	description,	
                            brief_description			: 	brief_description,
                            main_image_name				: 	imageName,   
                            pages_descriptions          : {
                                "en" : insertEnData,
                                "ar" : insertArData,
                            },
                            modified 					: getUtcDate(),
                        }
 
						if(product_images.length > 0){	
							const productsTable = db.collection(TABLE_PRODUCTS);
							 
							productsTable.updateOne(
								{_id : new ObjectId(productId)}, 
								{
									$addToSet: {
										images: {
											$each: product_images
										}
									}
								}
							);
						}
                        

                        let option = {
                            conditions : { _id : new ObjectId(productId)},
                            updateData : {$set : updateData},
                            collection : this.db_collection_name
                        }
 
                        DbClass.updateOneRecord(req,res,option).then(productSaveResponse=>{
                            if(productSaveResponse.status == STATUS_SUCCESS){
                                let finalResponse = {
                                    status	: STATUS_SUCCESS,
                                    message	: res.__("front.product.product_updated_successfully"),
                                };
                                return resolve(finalResponse);
                            }else{
                                let finalResponse = {
                                    status	: STATUS_ERROR,
                                    message	:[{path:ADMIN_GLOBAL_ERROR,msg:res.__("system.something_going_wrong_please_try_again")}]
                                };
                                return resolve(finalResponse);
                            }
                        });
                        
                    }
                });
                
            })
        });
    }

     /**
     * 
     * to get product find one
     */
    productFindAllList = (option)=>{
        return new Promise(resolve=>{
            option["collection"] = this.db_collection_name;
            DbClass.getFindAllWithoutLimit(option).then(productResponse=>{
                let responseStatus = (productResponse.status) ? productResponse.status : "";
				let responseResult = (productResponse.result) ? productResponse.result : "";
				if (responseStatus == STATUS_ERROR) {
					let response = {
						status: STATUS_ERROR,
						result: {},
						error: false,
						message: ""
					};
					return resolve(response);
				}
				let response = {
					status: STATUS_SUCCESS,
					result: responseResult,
					error: false,
					message: ""
				};
				return resolve(response);
            })
        })
    }


  /**
	 * Function to save product
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
  saveOneStockLog = (req,res,options)=>{
    return new Promise(resolve=>{
        options["collection"] = this.db_stock_log_collection_name;

        DbClass.saveInsertOne(req,res,options).then(productResponse=>{
            let responseStatus = (productResponse.status) ? productResponse.status : "";
            let responseResult = (productResponse.result) ? productResponse.result : {};

            if (responseStatus == STATUS_ERROR) {
                let response = {
                    status: STATUS_ERROR,
                    result: {},
                    error: responseResult,
                    message: ""
                };
                return resolve(response);
            }
            let response = {
                status: STATUS_SUCCESS,
                result: responseResult,
                error: false,
                message: "in error case"
            };
            return resolve(response);
        })
    })
}




}
module.exports = new ProductModel();