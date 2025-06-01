const AreaModel = require("./model/Area");
const ContractModel = require("./../franchise_contracts/model/contractsModel");
const asyncParallel = require('async/parallel');
const turf = require('@turf/turf');
const UserModel = require("./../users/model/user");


require('dotenv').config()

const { ObjectId } = require('mongodb');
function Area() {

	/**
	 * Function to get Area List
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getAreaList = (req, res, next) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			const collection = db.collection(TABLE_AREAS);
			const async = require('async');

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {

				let commoncondition = {
					is_deleted: NOT_DELETED
				}

				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commoncondition);

				let search_data = (req.body.search_data) ? req.body.search_data : [];
				if (search_data.length) {
					search_data.map(formdata => {
						if (formdata.name != "search_open" && formdata.value != "") {
							dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
						}
					})
				}

				let conditions = [
					{
						$facet: {
							"area_list": [
								{
									$match: dataTableConfig.conditions
								},
								{
									$project: {
										_id: 1, title: 1, slug: 1, body: 1, coordinates: 1, status: 1, modified: 1
									}
								},
								{
									$sort: dataTableConfig.sort_conditions
								},
								{ $skip: skip },
								{ $limit: limit },
							],
							"area_all_count": [
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
							"area_filter_count": [
								{ $match: dataTableConfig.conditions },
								{
									$group: {
										_id: null,
										count: { $count: {} }
									}
								},
								{
									$project: { _id: 0, count: 1 }
								}
							]
						}
					}
				];

				let optionObj = {
					conditions: conditions
				}

				AreaModel.getAggregateAreaList(req, res, optionObj).then(areaResponse => {
					let responseStatus = (areaResponse.status) ? areaResponse.status : "";
					let responseResult = (areaResponse.result && areaResponse.result[0]) ? areaResponse.result[0] : "";

					let area_list = (responseResult && responseResult.area_list) ? responseResult.area_list : [];
					let area_all_count = (responseResult && responseResult.area_all_count && responseResult.area_all_count[0] && responseResult.area_all_count[0]["count"]) ? responseResult.area_all_count[0]["count"] : DEACTIVE;
					let area_filter_count = (responseResult && responseResult.area_filter_count && responseResult.area_filter_count[0] && responseResult.area_filter_count[0]["count"]) ? responseResult.area_filter_count[0]["count"] : DEACTIVE;

					res.send({
						status: responseStatus,
						draw: dataTableConfig.result_draw,
						data: area_list,
						recordsTotal: area_all_count,
						recordsFiltered: area_filter_count,
					});
				})

			});
		}
		else {
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/area/list']);
			res.render('list');
		}
	};//End getAreaList()


	/**
	 * Function to get Area's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getAreaDetails = (req, res, next) => {
		return new Promise(resolve => {
			let areaId = (req.params.id) ? req.params.id : "";
			/** Get Cms details **/
			let conditionsObj = { _id: new ObjectId(areaId), is_deleted: NOT_DELETED };
			let optionObj = {
				conditions: conditionsObj,
			}

			AreaModel.getAreaFindOne(optionObj).then(areaRes => {
				let result = (areaRes.result) ? areaRes.result : "";

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
	};// End getAreaDetails()


	/**
	 * Function for add Area
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addArea = async (req, res, next) => {
		if (isPost(req)) {

			/** Sanitize Data */
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

			if (req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '') {
				/** Send error response */
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			let area_name = (req.body.area_name) ? req.body.area_name : "";
			let coordinates = (req.body.coordinates) ? req.body.coordinates : "";
			let country_id = (req.body.country_id) ? req.body.country_id : "";
			let state_id = (req.body.state_id) ? req.body.state_id : "";
			let city_id = (req.body.city_id) ? req.body.city_id : "";

			const clone = require('clone');
			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody = (req.body.body) ? req.body.body : "";
			let title = (req.body.title) ? req.body.title : "";

			if (pageBody != "") {
				req.body.body = pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
			}

			asyncParallel({
				get_slug: (callback) => {
					getDatabaseSlug({
						title: area_name,
						table_name: TABLE_AREAS,
						slug_field: "slug"
					}).then(slugRes => {
						callback(null, slugRes.title || "");
					});
				},
			}, (asyncErr, asyncRes) => {

				if (asyncErr) return next(asyncErr);
				let errMessageArray = [];

				if (errMessageArray.length) {
					/** Send error response **/
					return res.send({
						status: STATUS_ERROR,
						message: errMessageArray,
					});
				}

				let slug = (asyncRes && asyncRes.get_slug) ? asyncRes.get_slug : "";

				let optionObj = {
					insertData: {
						area_name: area_name,
						coordinates: coordinates,
						body: pageBody,
						title: title,
						slug: slug,
						country_id: new ObjectId(country_id),
						state_id: new ObjectId(state_id),
						city_id: new ObjectId(city_id),
						status: ACTIVE,
						default_language_id: DEFAULT_LANGUAGE_CODE,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						is_deleted: NOT_DELETED,
						created: getUtcDate(),
						modified: getUtcDate()
					}
				}

				AreaModel.saveArea(req, res, optionObj).then(saveResult => {
					let responseStatus = (saveResult.status) ? saveResult.status : "";
					if (responseStatus == STATUS_ERROR) {
						/** Send error response **/
						res.send({
							status: STATUS_ERROR,
							message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
						});
					} else {
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.area.area_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'area',
							message: res.__("admin.area.area_has_been_added_successfully")
						});
					}
				})
			});
		}
		else {
			let draw = (req.params.draw) ? req.params.draw : "";
			let optionAllAreaObj = {conditions : {is_deleted: NOT_DELETED}};
			let allAreaListRersponse = await AreaModel.getAllAreaList(req, res, optionAllAreaObj);
			let allAreaList = (allAreaListRersponse.result) ? allAreaListRersponse.result : [];

			/** Get language list */
			getLanguages().then(languageList => {
				req.breadcrumbs(BREADCRUMBS['admin/area/add']);
				/**Render add Area page */

				let render_file_name = 'add';

				if (draw == 'draw') {
					render_file_name = 'add_by_draw';
				}


				let options = {
					collections: [
						{
							collection: TABLE_COUNTRY,
							columns: ["_id", "country_name"],
							conditions: { status: ACTIVE },
							sort_conditions: { country_name: 1 }
						}
					]
				};

				getDropdownList(req, res, options).then(response => {
					/** Render add page **/

					req.breadcrumbs(BREADCRUMBS["admin/users/add"]);
					res.render(render_file_name, {
						language_list: languageList,
						allAreaList: allAreaList,
						google_map_key: process.env.GOOGLE_MAP_API_KEY,
						google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
						google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
						country_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
					});
				});

			}).catch(next);
		}
	};//End addArea()


	/**
	 * Function to update Area's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editArea = async (req, res, next) => {

		if (isPost(req)) {
			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			let id = (req.params.id) ? req.params.id : "";

			if (id == "" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] || req.body.pages_descriptions[DEFAULT_LANGUAGE_CODE] == '')) {
				/** Send error response **/
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			let area_name = (req.body.area_name) ? req.body.area_name : "";
			let coordinates = (req.body.coordinates) ? req.body.coordinates : "";
			let country_id = (req.body.country_id) ? req.body.country_id : "";
			let state_id = (req.body.state_id) ? req.body.state_id : "";
			let city_id = (req.body.city_id) ? req.body.city_id : "";

			const clone = require('clone');
			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_CODE]);
			let pageBody = (req.body.body) ? req.body.body : "";
			let title = (req.body.title) ? req.body.title : "";

			if (pageBody != "") {
				req.body.body = pageBody.replace(new RegExp(/&nbsp;|<br \/\>/g), ' ').trim();
			}

			/** Update Area details **/
			let conditionsObj = { _id: new ObjectId(id) };
			let updateRecordObj = {
				$set: {
					area_name: area_name,
					coordinates: coordinates,
					body: pageBody,
					title: title,
					country_id: new ObjectId(country_id),
					state_id: new ObjectId(state_id),
					city_id: new ObjectId(city_id),
					default_language_id: DEFAULT_LANGUAGE_CODE,
					pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
					modified: getUtcDate()
				}
			}

			let optionObj = {
				conditions: conditionsObj,
				updateData: updateRecordObj,
			}

			AreaModel.updateOneArea(req, res, optionObj).then(updateResult => {
				let responseStatus = (updateResult.status) ? updateResult.status : "";
				if (responseStatus == STATUS_ERROR) {
					/** Send error response **/
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				} else {
					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.area.area_details_has_been_updated_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'area',
						message: res.__("admin.area.area_details_has_been_updated_successfully"),
					});
				}
			});

		}
		else {

			let areaId = (req.params.id) ? req.params.id : "";
			let optionAllAreaObj = { conditions: { _id: { $ne: new ObjectId(areaId) }, is_deleted: NOT_DELETED } }
			let allAreaListRersponse = await AreaModel.getAllAreaList(req, res, optionAllAreaObj);
			let allAreaList = (allAreaListRersponse.result) ? allAreaListRersponse.result : [];


			/** Get language list **/
			getLanguages().then(languageList => {
				/** Get area details **/
				getAreaDetails(req, res, next).then(response => {
					if (response.status != STATUS_SUCCESS) {
						/** Send error response **/
						req.flash(STATUS_ERROR, response.message);
						res.redirect(WEBSITE_ADMIN_URL + 'area');
						return;
					}

					let countryId = response.result.country_id;
					let stateId = response.result.state_id;
					let cityId = response.result.city_id;


					let options = {
						collections: [
							{
								collection: TABLE_COUNTRY,
								columns: ["_id", "country_name"],
								conditions: { status: ACTIVE },
								selected: [countryId],
							},
							{
								collection: TABLE_STATES,
								columns: ["_id", "state_name"],
								conditions: { status: ACTIVE, country_id: countryId },
								selected: [stateId],
							},
							{
								collection: TABLE_CITY,
								columns: ["_id", "city_name"],
								conditions: { status: ACTIVE, state_id: stateId },
								selected: [cityId],
							}
						]
					};

					getDropdownList(req, res, options).then(async (responseData) => {
						/** Render edit page **/
						req.breadcrumbs(BREADCRUMBS["admin/area/edit"]);
						res.render("edit", {
							country_list: (responseData && responseData.final_html_data && responseData.final_html_data["0"]) ? responseData.final_html_data["0"] : "",
							state_list: (responseData && responseData.final_html_data && responseData.final_html_data["1"]) ? responseData.final_html_data["1"] : "",
							city_list: (responseData && responseData.final_html_data && responseData.final_html_data["2"]) ? responseData.final_html_data["2"] : "",

							result: (response.result) ? response.result : {},
							allAreaList: allAreaList,
							coordinates: (response.result.coordinates) ? response.result.coordinates : [],
							language_list: languageList,
							google_map_key: process.env.GOOGLE_MAP_API_KEY,
							google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
							google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
						});
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editArea()


	/**
	 * Function for update Area status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.updateAreaStatus = (req, res, next) => {
		let areaId = (req.params.id) ? req.params.id : "";
		let areaStatus = (req.params.status) ? req.params.status : "";

		if (areaId && areaStatus) {
			try {
				let updateData = {
					modefied: getUtcDate(),
					status: (areaStatus == ACTIVE) ? DEACTIVE : ACTIVE,
				};
				let conditions = {
					_id: new ObjectId(areaId), is_deleted: NOT_DELETED
				}

				let optionObj = {
					updateData: { $set: updateData },
					conditions: conditions
				}

				AreaModel.updateOneArea(req, res, optionObj).then(updateResult => {
					if (updateResult.status == STATUS_SUCCESS) {
						/** Send success response **/
						req.flash(STATUS_SUCCESS, res.__("admin.area.area_status_has_been_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL + "area");
					} else {
						/** Send error response **/
						req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL + "area");
					}
				});
			} catch (e) {
				/** Send error response **/
				req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL + "area");
			}
		} else {
			/** Send error response **/
			req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "area");
		}
	};//End updateAreaStatus()


	/**
	 * Function for show All Areas
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.showAllAreas = (req, res, next) => {
		let optionAllAreaObj = { conditions: { is_deleted: NOT_DELETED } };
		AreaModel.getAllAreaList(req, res, optionAllAreaObj).then(areaListResult => {
			let responseStatus = (areaListResult.status) ? areaListResult.status : "";
			if (responseStatus == STATUS_SUCCESS) {

				/** Render edit page **/
				req.breadcrumbs(BREADCRUMBS['admin/area/show_all']);

				res.render('show_all', {
					result: (areaListResult.result) ? areaListResult.result : [],
					google_map_key: process.env.GOOGLE_MAP_API_KEY,
					google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
					google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
				});
			}
		})
	}


	/**
	 * Function for delete Area 
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.deleteArea = (req, res, next) => {
		let areaId = (req.params.id) ? req.params.id : "";

		if (!areaId) {
			/** Send error response **/
			req.flash("error", res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL + "area");
			return;
		}
		else {

			/** Set update data **/
			let updateData = {
				$set: {
					is_deleted: DELETED,
					modified: getUtcDate()
				}
			};

			let condition = {
				_id: new ObjectId(areaId)
			}

			let optionObj = {
				conditions: condition,
				updateData: updateData
			}

			AreaModel.updateOneArea(req, res, optionObj).then(updateResponse => {
				if (updateResponse.status == STATUS_SUCCESS) {

					let removeCondition = {
						area_id: new ObjectId(areaId)
					};

					let removeData = {
						'area_id': null,
					}

					let removeOptions = {
						conditions: removeCondition,
						updateData: { $set: removeData }
					};

					UserModel.updateManyUser(req, res, removeOptions).then(userRemovedDetails => {
						if (userRemovedDetails.status == STATUS_SUCCESS) {
							
							
							let contractCondition = {
								area_id: new ObjectId(areaId)
							};

							let updateContractData = {
								status: CONTRACT_STATUS_TERMINATED,
								terminated_date: getUtcDate(),
								modified: getUtcDate()
							}

							let updateContractOption = {
								conditions: contractCondition,
								updateData: { $set: updateContractData }
							};

							ContractModel.updateManyContract(req, res, updateContractOption).then(updateContractResponse => {
								if (updateContractResponse.status == STATUS_SUCCESS) {
									let message = res.__("admin.area.area_deleted_successfully");
									req.flash(STATUS_SUCCESS, message);
									res.redirect(WEBSITE_ADMIN_URL + "area");
								}
							});
						}
					});
				} 
				else {
					let message = res.__("admin.system.something_going_wrong_please_try_again");
					req.flash(STATUS_ERROR, message);
					res.redirect(WEBSITE_ADMIN_URL + "area");
				}
			});
		}
	}


	/**
	 * Function for add cms
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.polygon = (req, res, next) => {
		checkPointInPolygon();
		/** Get language list */
		getLanguages().then(languageList => {
			req.breadcrumbs(BREADCRUMBS['admin/cms/add']);
			/**Render add cms page */
			res.render('polygon', {
				language_list: languageList
			});
		}).catch(next);

	};//End addCms()


	function checkPointInPolygon() {
		// Define the polygon coordinates
		const path = [
			{ lat: 26.89419872208534, lng: 75.76432576673085 },
			{ lat: 26.894964194766064, lng: 75.82406392591054 },
			{ lat: 26.863728698988737, lng: 75.80449452893788 },
			{ lat: 26.865413186050223, lng: 75.76209416883046 }
		];

		const polygonCoordinates = path.map(point => [point.lng, point.lat]);
		polygonCoordinates.push([path[0].lng, path[0].lat]); // Close the polygon loop

		const polygon = turf.polygon([polygonCoordinates]);

		const pointToCheck01 = { lat: 26.878057167420618, lng: 75.78902880701379 };
		const pointToCheck02 = { lat: 26.84264179968785, lng: 75.80853413407556 };

		const point01 = turf.point([pointToCheck01.lng, pointToCheck01.lat]);
		const point02 = turf.point([pointToCheck02.lng, pointToCheck02.lat]);


		// Check if the point is inside the polygon
		const isWithin01 = turf.booleanPointInPolygon(point01, polygon);

		if (isWithin01) {
			console.log('point01 The point is inside the polygon.');
		} else {
			console.log('point01 The point is outside the polygon.');
		}

		// Check if the point is inside the polygon
		const isWithin02 = turf.booleanPointInPolygon(point02, polygon);

		if (isWithin02) {
			console.log('point02 The point is inside the polygon.');
		} else {
			console.log('point02 The point is outside the polygon.');
		}
	}


	/**
	 * Function to update Area's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.assignServiceProvicer = async (req, res, next) => {

		if (isPost(req)) {
			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			let area_id = (req.params.id) ? new ObjectId(req.params.id) : "";
			let id = (req.params.id) ? req.params.id : "";

			let serviceProviderIds = (req.body.service_provider_ids) ? req.body.service_provider_ids : [];

			// Convert the array of strings to an array of ObjectId
			const newServiceProviderIds = serviceProviderIds.map(spid => new ObjectId(spid));

			let removeCondition = {
				area_id: area_id
			};

			let removeData = {
				'area_id': null,
				'modified': getUtcDate()
			}

			let removeOptions = {
				conditions: removeCondition,
				updateData: { $set: removeData }
			};

			UserModel.updateManyUser(req, res, removeOptions).then(userRemovedDetails => {
				if (userRemovedDetails.status == STATUS_SUCCESS) {

					let updateCondition = {
						_id: { $in: newServiceProviderIds }
					};

					let insertData = {
						'area_id': area_id,
						'modified': getUtcDate()
					}

					let options = {
						conditions: updateCondition,
						updateData: { $set: insertData }
					};

					UserModel.updateManyUser(req, res, options).then(async userUpdateDetails => {
						if (userUpdateDetails.status == STATUS_SUCCESS) {
							let optionsObject = {
								area_id: id,
								service_provider_ids: newServiceProviderIds
							}

							await updateServiceProviderInContract(req, res, optionsObject);

							req.flash(STATUS_SUCCESS, res.__("admin.user.service_provider_has_been_assigned_successfully"));

							res.send({
								status: STATUS_SUCCESS,
								redirect_url: WEBSITE_ADMIN_URL + "area/assign-service-provider/" + id,
								message: res.__("admin.user.service_provider_has_been_assigned_successfully"),
							});
						}
						else {
							/** Send error response **/
							res.send({
								status: STATUS_ERROR,
								redirect_url: WEBSITE_ADMIN_URL + "area/assign-service-provider/" + id,
								message: res.__("admin.system.something_going_wrong_please_try_again")
							});
						}

					});

				}
			});

		}
		else {

			let areaId = (req.params.id) ? req.params.id : "";
			let conditionsObj = [
				{
					$match: {
						"is_deleted": NOT_DELETED,
						"user_type": SERVICE_PROVIDER_USER_TYPE,
						$or: [
							{ "area_id": '' },
							{ "area_id": null },
							{ "area_id": new ObjectId(areaId) }
						]
					}

				},
			]
			let optionObj = {
				conditions: conditionsObj,
				collection: TABLE_USERS
			}

			UserModel.userAggregateResult(req, res, optionObj).then(userResponse => {
				if (userResponse.status == STATUS_SUCCESS) {

					let conditionsObjArea = { _id: new ObjectId(areaId), is_deleted: NOT_DELETED };
					let optionObjArea = {
						conditions: conditionsObjArea,
					}

					AreaModel.getAreaFindOne(optionObjArea).then(areaRes => {
						let result = (areaRes.result) ? areaRes.result : "";

						req.breadcrumbs(BREADCRUMBS["admin/area/assign_service_provider"]);
						res.render("assign_service_provider", {
							result: userResponse.result,
							mapResult: result,
							area_id: areaId
						});

					});

				} else {
					/** Send error response **/
					req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
					res.redirect(WEBSITE_ADMIN_URL + "area");
				}
			})
		}
	};//End editArea()



}
module.exports = new Area();
