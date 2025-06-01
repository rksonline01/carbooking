const { ObjectId } = require('mongodb');
var crypto = require('crypto');
var async = require('async');
var moment = require('moment');
const util = require('util');
const CategoryModel = require("../../../admin/blog/model/CategoryModel");
const BlogModel = require("../../../admin/blog/model/BlogModel");

function Blog() {

	/**
     * Function for get blog category
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
	this.getBlogCategory = (req,res,next)=>{
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;

		let conditions = [{
			$facet: {
				"blog_category_list": [

					{
						"$project": {
							category_name: 1,
							slug: 1,
							status: 1,
							pages_descriptions: 1,
							created: 1,

						}
					},

					{ $match: { "status": ACTIVE } },
					{ $sort: {"created":SORT_DESC} },
					{ $skip: 0 },
					{ $limit: 100 },

				],
				"blog_category_all_count": [
					{ $match: { "status": ACTIVE } },
					{
						$group: {
							_id: null,
							count: { $count: {} }
						}
					},
					{
						$project: { count: 1, _id: 0 }
					}
				],

			}
		}];

		let optionObj = {
			conditions: conditions
		}
		CategoryModel.getBlogCategoryAggregateList(req, res, optionObj).then(blogCategoryResponse => {
			let responseStatus = (blogCategoryResponse.status) ? blogCategoryResponse.status : "";
			let responseResult = (blogCategoryResponse.result && blogCategoryResponse.result[0]) ? blogCategoryResponse.result[0] : "";

			let blogCategoryList = (responseResult && responseResult.blog_category_list) ? responseResult.blog_category_list : [];
			let totalRecord = (responseResult && responseResult.blog_category_all_count && responseResult.blog_category_all_count[0] && responseResult.blog_category_all_count[0]["count"]) ? responseResult.blog_category_all_count[0]["count"] : DEACTIVE;

			if (blogCategoryList && blogCategoryList.length > 0){
				blogCategoryList.map(records => {
					records['category_name'] = (records.pages_descriptions[langCode].category_name) ? records.pages_descriptions[langCode].category_name : records.category_name;
					delete records.pages_descriptions;
					return records;
				})
			}

			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					result: blogCategoryList,
					message: "",
				}
			};
			return returnApiResult(req, res, finalResponse);
		})

	}


	/**
     * Function for get blog list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
	this.getBlogList= async(req,res,next)=>{
	
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let categorySlug = (req.body.category_slug) ? (req.body.category_slug) : "";
		let searchKeyword = (req.body.search_keyword) ? (req.body.search_keyword) : "";
		let	page 		= (req.body.page)	? parseInt(req.body.page)	: 1;
		let limit 		= (req.body.limit) 	? parseInt(req.body.limit) 	: FRONT_LISTING_LIMIT;
		let skip 		= (limit * page) - limit;

		var categoryNameVal = "";
	

		let commonConditions = { is_deleted: NOT_DELETED, status: ACTIVE, is_publish: ACTIVE };
		if (searchKeyword != "") {

			var titleRegex = { "$regex": searchKeyword, "$options": "i" };//new RegExp(searchKeyword, "i"); //case-insensitive query?
			commonConditions['$or'] = [
				{ blog_title: titleRegex },
				{ description: titleRegex },
			]

		}
		if (categorySlug != ""){
			let detailConditions = {
				slug: categorySlug
			};
			let options = {
				conditions: detailConditions,
				fields: { "_id": 1,"category_name":1},
			}
			let categoryDetail = await CategoryModel.blogCategoryDetails(options);
			let categoryResult = (categoryDetail.result) ? categoryDetail.result : {};
			let categoryId = (categoryResult._id) ? categoryResult._id : "";
			let categoryName = (categoryResult.category_name) ? categoryResult.category_name : "";
			categoryNameVal = categoryName;
			commonConditions['blog_category_id'] = categoryId;
		}

		let conditions = [{
			$facet: {
				"blog_list": [
					{ $match: commonConditions },
					
					{
						$project: {
							_id: 1, blog_category_id: 1, blog_title: 1, blog_url: 1, meta_title: 1, blog_summery: 1, description:1,meta_keywords: 1, meta_description: 1,  created: 1,  blog_image: 1, pages_descriptions:1,

						}
					},
					{
						$sort: { "created": SORT_DESC }
					},
					{ $skip: skip },
					{ $limit: limit },
				],
				"blog_all_count": [
					{
						$match: commonConditions
					},
					{
						$group: {
							_id: null,
							count: { $count: {} }
						}
					},
					{
						$project: { _id: 0, count: 1 }
					}
				],
			}
		}];

		let options = {
			conditions: conditions
		};
		const asyncParallel = require("async/parallel");
		asyncParallel({

			blog_list: (callback) => {
				BlogModel.getBlogAggregateList(req, res, options).then(blogResponse => {
					let responseStatus = (blogResponse.status) ? blogResponse.status : "";
					let responseResult = (blogResponse.result && blogResponse.result[0]) ? blogResponse.result[0] : "";

					let blogList = (responseResult && responseResult.blog_list) ? responseResult.blog_list : [];

					let totalRecord = (responseResult && responseResult.blog_all_count && responseResult.blog_all_count[0] && responseResult.blog_all_count[0]["count"]) ? responseResult.blog_all_count[0]["count"] : DEACTIVE;

					if (blogList && blogList.length > 0) {
						blogList.map(records => {
							records['blog_title'] = (records.pages_descriptions[langCode].blog_title) ? records.pages_descriptions[langCode].blog_title : records.blog_title;
							records['blog_summery'] = (records.pages_descriptions[langCode].blog_summery) ? records.pages_descriptions[langCode].blog_summery : records.blog_summery;
							records['description'] = (records.pages_descriptions[langCode].description) ? records.pages_descriptions[langCode].description : records.description;
							delete records.pages_descriptions;
							return records;
						})
					}
					let finalBlogResult = {
						blogList: blogList,
						totalRecord: totalRecord,
					}
					callback(null, finalBlogResult);
				})

			}

		}, (error, response) => {
		
			let allBlogList = (response.blog_list) ? response.blog_list : {};
			
			let blogResult = (allBlogList.blogList) ? allBlogList.blogList : [];
			let totalRecord = (allBlogList.totalRecord) ? allBlogList.totalRecord :DEACTIVE;
			
			var pageTitle = res.__("BLOGS");

			
			let finalResponse = {
				'data': {
					status: STATUS_SUCCESS,
					blog_list: blogResult,
					page_title: pageTitle,
					total_record: totalRecord,
					limit: limit,
					skip: skip,
					current_page: page,
					total_page: Math.ceil(totalRecord / limit),
					blog_image_url: BLOG_URL,
					message: "",
				}
			};

			return returnApiResult(req, res, finalResponse);


		})

	}


	/**
     * Function for get blog detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
	this.getBlogDetail = (req, res, next) => {
		let langCode = (req.body.lang_code && req.body.lang_code != "") ? req.body.lang_code : DEFAULT_LANGUAGE_CODE;
		let blogSlug = (req.body.blog_slug && req.body.blog_slug != "") ? req.body.blog_slug : "";

		let finalResponse	=	{};

        if(blogSlug == ""){
            finalResponse = {
                'data': {
                    status: STATUS_ERROR_INVALID_ACCESS,
                    result: [],
                    message: res.__("api.global.parameter_missing")
                }
            };
            return returnApiResult(req, res,finalResponse);

        }else{

			let conditions = [
				{ $match: { blog_url: blogSlug } },
				{
					$lookup: {
						from: TABLE_USERS,
						localField: 'user_id',
						foreignField: '_id',
						as: 'userdetails'
					}
				},
				{
					$project: {
						_id: 1, blog_category_id: 1, blog_url: 1, user_id: 1, meta_title: 1,meta_keywords: 1, meta_description: 1, created: 1, trending: 1,  blog_image: 1, banner_image: 1,
						blog_title: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".blog_title", ''] }, then: "$pages_descriptions." + langCode + ".blog_title", else: "$blog_title" } },
						blog_summery: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".blog_summery", ''] }, then: "$pages_descriptions." + langCode + ".blog_summery", else: "$blog_summery" } },
						description: { $cond: { if: { $ne: ["$pages_descriptions." + langCode + ".description", ''] }, then: "$pages_descriptions." + langCode + ".description", else: "$description" } },
						user_name: { "$arrayElemAt": ["$userdetails.full_name", 0] },
						user_image: { "$arrayElemAt": ["$userdetails.profile_image", 0] },
						user_name      : { "$arrayElemAt": ["$userdetails.full_name", 0] }
	
	
					}
				}
			];
	
			let options = {
				'conditions': conditions
			};
	
			BlogModel.getBlogAggregateList(req, res, options).then(detailResponse => {
				let blogResult = (detailResponse.result && detailResponse.result[0]) ? detailResponse.result[0] : {};
				let categoryName = (blogResult.category_name) ? blogResult.category_name : "";
	
				finalResponse = {
					'data': {
						status: STATUS_SUCCESS,
						blog_data: blogResult,
						category_name: categoryName,
						blog_image_url: BLOG_URL,
						user_image_url: USERS_URL,
						message: "",
					}
				};

				return returnApiResult(req, res, finalResponse);
			})
		}
	}

}
module.exports = new Blog();