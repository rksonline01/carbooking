
const ContractModel = require("./model/contractsModel");
const { ObjectId } = require('mongodb');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");

const asyncParallel = require('async/parallel');
const asyncEach = require("async/each");
const { log } = require("async");
function FranchiseContract() {

    /**
    * Function for get list of franchise contracts
    *
    * @param req As Request Data
    * @param res As Response Data
    *
    * @return render/json
    */
    this.getContractList = (req, res) => {
        let franchise = (req.query.franchise) ? req.query.franchise : "";

        if (isPost(req)) {
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let search_data = req.body.search_data;

            /** Configure DataTable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "status") {
                                dataTableConfig.conditions[formdata.name] = Number(formdata.value);
                            } else if (formdata.name == "franchise") {
                                dataTableConfig.conditions["franchise_slug"] = formdata.value;
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }
                    })
                }

                let commonConditions = {
                    is_deleted: NOT_DELETED
                }

                if (franchise) {
                    dataTableConfig.conditions["franchise_slug"] = franchise
                }

                let conditions = [{
                    $facet: {
                        "franchise_contract_list": [
                            { $match: commonConditions },
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: "franchise_id",
                                    foreignField: "_id",
                                    as: "franchise"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_AREAS,
                                    localField: "area_id",
                                    foreignField: "_id",
                                    as: "area"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    localField: "_id",
                                    foreignField: "booking_contract_id",
                                    as: "orders"
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    status: 1,
                                    created: 1,
                                    franchise_id: 1,
                                    start_date: 1,
                                    end_date: 1,
                                    service_provider_in_area: 1,
                                    purely_amount_commission_store:1,
                                    purely_amount_commission:1,
                                    franchise: { $arrayElemAt: ["$franchise.display_name", 0] },
                                    franchise_slug: { $arrayElemAt: ["$franchise.slug", 0] },
                                    area: { $arrayElemAt: ["$area.title", 0] },
                                    totalSellingAmount: { $sum: "$orders.total_selling_amount" }
                                }
                            },
                            { $match: dataTableConfig.conditions },
                            { $sort: dataTableConfig.sort_conditions },
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        "franchise_contract_all_count": [
                            { $match: commonConditions },
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
                        "franchise_contract_filter_count": [
                            { $match: commonConditions },
                            {
                                $lookup: {
                                    from: TABLE_USERS,
                                    localField: "franchise_id",
                                    foreignField: "_id",
                                    as: "franchise"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_AREAS,
                                    localField: "area_id",
                                    foreignField: "_id",
                                    as: "area"
                                }
                            },
                            {
                                $lookup: {
                                    from: TABLE_ORDERS,
                                    localField: "_id",
                                    foreignField: "booking_contract_id",
                                    as: "orders"
                                }
                            },

                            {
                                $project: {
                                    status: 1,
                                    created: 1,
                                    franchise_id: 1,
                                    franchise: { $arrayElemAt: ["$franchise.display_name", 0] },
                                    franchise_slug: { $arrayElemAt: ["$franchise.slug", 0] },
                                    area: { $arrayElemAt: ["$area.title", 0] },
                                    totalSellingAmount: { $sum: "$orders.total_selling_amount" }
                                }
                            },
                            { $match: dataTableConfig.conditions },
                            {
                                $group: {
                                    _id: null,
                                    count: { $count: {} },
                                }
                            },
                            {
                                $project: { count: 1, _id: 0 }
                            }
                        ]
                    }
                }];

                let options = {
                    conditions: conditions
                };

                ContractModel.getFranchiseContractAggregateList(req, res, options).then(contractResponse => {

                    let responseStatus = (contractResponse.status) ? contractResponse.status : "";
                    let responseResult = (contractResponse.result && contractResponse.result[0]) ? contractResponse.result[0] : "";

                    let franchise_contract_list = (responseResult && responseResult.franchise_contract_list) ? responseResult.franchise_contract_list : [];
                    let franchise_contract_all_count = (responseResult && responseResult.franchise_contract_all_count && responseResult.franchise_contract_all_count[0] && responseResult.franchise_contract_all_count[0]["count"]) ? responseResult.franchise_contract_all_count[0]["count"] : DEACTIVE;
                    let franchise_contract_filter_count = (responseResult && responseResult.franchise_contract_filter_count && responseResult.franchise_contract_filter_count[0] && responseResult.franchise_contract_filter_count[0]["count"]) ? responseResult.franchise_contract_filter_count[0]["count"] : DEACTIVE;

                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: franchise_contract_list,
                        recordsTotal: franchise_contract_all_count,
                        recordsFiltered: franchise_contract_filter_count,
                    });
                });
            });

        } else {

            let options = {
                collections: [
                    {
                        collection: TABLE_USERS,
                        columns: ["slug", "display_name"],
                        conditions: {
                            status: ACTIVE,
                            user_type: FRNCHIES_USER_TYPE,
                            is_deleted: NOT_DELETED
                        },
                        sort_conditions: { display_name: 1 },
                        ...(franchise ? { selected: [franchise] } : {})
                    },
                ]
            };

            getDropdownList(req, res, options).then(response => {

                let responseObj = {
                    franchise_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                    franchise: franchise
                }

                /** render listing page **/
                req.breadcrumbs(BREADCRUMBS["admin/franchise_contracts/list"]);
                res.render("list", responseObj);

            });


        }
    };//End getContractList()

    /**
 * Function to add franchise contract
 *
 * @param req 	As 	Request Data
 * @param res 	As 	Response Data
 * @param next 	As 	Callback argument to the middleware function
 *
 * @return render/json
 */
    this.addContract = async (req, res, next) => {
        let franchise = (req.query.franchise) ? req.query.franchise : "";

        if (isPost(req)) {
            try {
                req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

                let franchise_slug              = (req.body.franchise) ? req.body.franchise : "";
                let area_id                     = (req.body.area_id) ? new ObjectId(req.body.area_id) : "";
                let start_date                  = (req.body.start_date) ? req.body.start_date : "";
                let end_date                    = (req.body.end_date) ? req.body.end_date : "";
                let purelyAmountCommission      = (req.body.purely_amount_commission) ? req.body.purely_amount_commission : "";
                let purelyAmountCommissionStore = (req.body.purely_amount_commission_store) ? req.body.purely_amount_commission_store : "";
                let contractFile                = (req.files.contract_file) ? req.files.contract_file : "";
                let franchiseOptions = {
                    collection: TABLE_USERS,
                    conditions: { slug: franchise_slug, status: ACTIVE, user_type: FRNCHIES_USER_TYPE, is_deleted: NOT_DELETED }
                }

                let franchiseResult = await DbClass.getFindOne(franchiseOptions)


                if (franchiseResult.status == STATUS_ERROR) {

                    /** Send error response **/
                    return res.send({
                        status: STATUS_ERROR,
                        message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                }


                let franchiseType = franchiseResult.result.franchise_type ? franchiseResult.result.franchise_type : null;
                let franchiseId = (franchiseResult.result._id) ? franchiseResult.result._id : null;
                let franchiseContractOptoptions = { franchise_id: franchiseId };
                let allActiveAreaIds = await getAllActiveAreaIdsFromFranchise(franchiseContractOptoptions);
                let activeAreaCount = allActiveAreaIds ? allActiveAreaIds.length : 0;               

                if (franchiseType == FRANCHISE_SINGLE_TYPE) {
                    if (activeAreaCount > ACTIVE) {
                        /** Send error response **/
                        return res.send({
                            status: STATUS_ERROR,
                            message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.already_active_franchise_contact") }]
                        });
                    }
                }

                let optionsForContract = {
                    conditions: [
                        {
                            $match: {
                                area_id: area_id,
                                status: { $in: [CONTRACT_STATUS_ACTIVE, CONTRACT_STATUS_INACTIVE] },
                                is_deleted: NOT_DELETED,
                                start_date: { $lt: convertToISO(end_date) },
                                end_date: { $gt: convertToISO(start_date) },
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                            }
                        }
                    ]
                };

                ContractModel.getFranchiseContractAggregateList(req, res, optionsForContract).then(contractResponse => {

                    if (contractResponse && contractResponse.result && contractResponse.result.length > 0) {
                        return res.send({
                            status: STATUS_ERROR,
                            message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.franchise_contract.contract_has_been_already_added.") }]
                        });
                    }

                    let franchise_id = (franchiseResult.result && franchiseResult.result._id) ? franchiseResult.result._id : "";

                    asyncParallel({
                        contract_file: (callback) => {
                            if (!contractFile) return callback(null, null);

                            let options = {
                                image: contractFile,
                                filePath: FRANCHISE_CONTRACT_FILE_PATH,
                                allowedExtensions: ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS,
                                allowedImageError: ALLOWED_CONTRACT_DOCUMENT_ERROR_MESSAGE,
                                allowedMimeTypes: ALLOWED_CONTRACT_DOCUMENT_MIME_EXTENSIONS,
                                allowedMimeError: ALLOWED_CONTRACT_DOCUMENT_MIME_ERROR_MESSAGE,
                            };

                            moveUploadedFile(req, res, options).then(fileRes => {
                                callback(null, fileRes)
                            });
                        },
                        service_provider_in_area: (callback) => {
                            if (!area_id) return callback(null, null);

                            let search_options = {
                                collection: TABLE_USERS,
                                conditions: [
                                    {
                                        $match: { area_id: area_id, is_deleted: NOT_DELETED, status: ACTIVE, user_type: SERVICE_PROVIDER_USER_TYPE }
                                    },
                                    {
                                        $group: {
                                            _id: null, // Grouping all documents together
                                            service_provider_ids: { $push: "$_id" } // Collecting area_id into an array
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0, // Removing _id from the result
                                            service_provider_ids: 1
                                        }
                                    }
                                ]
                            }

                            DbClass.getAggregateResult(null, null, search_options).then(response => {
                                let responseResult = (response.result) ? response.result : "";
                                let service_provider_ids = (responseResult && responseResult[0] && responseResult[0].service_provider_ids) ? responseResult[0].service_provider_ids : [];

                                callback(null, service_provider_ids);
                            })
                        }
                    }, (asyncErr, asyncRes) => {
                        let errMessageArray = [];
                        if (asyncRes.contract_file && asyncRes.contract_file.status == STATUS_ERROR) {
                            errMessageArray.push({ param: 'contract_file', path: 'contract_file', msg: asyncRes.contract_file.message });
                            /** Send error response **/
                            return res.send({
                                status: STATUS_ERROR,
                                message: errMessageArray
                            });
                        }

                        let contractFilePath = (asyncRes && asyncRes.contract_file && asyncRes.contract_file.fileName) ? asyncRes.contract_file.fileName : '';
                        let serviceProviderInArea = (asyncRes && asyncRes.service_provider_in_area) ? asyncRes.service_provider_in_area : [];

                        let insertData = {
                            franchise_id                    : new ObjectId(franchise_id),
                            area_id                         : area_id,
                            start_date                      : (start_date) ? convertToISO(start_date) : "",
                            end_date                        : (end_date) ? convertToISO(end_date) : "",
                            contract_file                   : contractFilePath,
                            status                          : CONTRACT_STATUS_ACTIVE,
                            is_deleted                      : NOT_DELETED,
                            service_provider_in_area        : serviceProviderInArea,
                            purely_amount_commission_store  : purelyAmountCommissionStore,
                            purely_amount_commission        : purelyAmountCommission,
                            modified                        : getUtcDate(),
                            created                         : getUtcDate()
                        };

                        let saveOption = {
                            insertData: insertData
                        }

                        ContractModel.saveContract(req, res, saveOption).then(contractResponse => {
                            let responseStatus = (contractResponse.status) ? contractResponse.status : "";
                            if (responseStatus == STATUS_ERROR) {
                                /** Send error response **/
                                res.send({
                                    status: STATUS_ERROR,
                                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                                });
                            } else {
                                /** Send success response */
                                req.flash('success', res.__("admin.franchise_contract.contract_has_been_added_successfully"));
                                res.send({
                                    status: STATUS_SUCCESS,
                                    redirect_url: WEBSITE_ADMIN_URL + 'franchise_contracts',
                                    message: res.__("admin.franchise_contract.contract_has_been_added_successfully")
                                });
                            }
                        })
                    })
                });
            }
            catch (err) {

                /** Send error response **/
                res.send({
                    status: STATUS_ERROR,
                    message: [{ path: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                });
            }
        }
        else {

            const today = new Date();

            let optionsForContract = {
                conditions: [
                    {
                        $match: {
                            status: { $in: [CONTRACT_STATUS_ACTIVE, CONTRACT_STATUS_INACTIVE] },
                            is_deleted: NOT_DELETED,
                            start_date: { $lte: today },
                            end_date: { $gte: today },
                        }
                    },
                    {
                        $group: {
                            _id: null, // Grouping all documents together
                            area_ids: { $push: "$area_id" } // Collecting area_id into an array
                        }
                    },
                    {
                        $project: {
                            _id: 0, // Removing _id from the result
                            area_ids: 1
                        }
                    }
                ]
            };

            ContractModel.getFranchiseContractAggregateList(req, res, optionsForContract).then(contractResponse => {
                let responseResult = (contractResponse.result && contractResponse.result[0]) ? contractResponse.result[0] : "";
                let area_ids = (responseResult && responseResult.area_ids) ? responseResult.area_ids : [];

                console.log(responseResult);

                let options = {
                    collections: [
                        {
                            collection: TABLE_AREAS,
                            columns: ["_id", "title"],
                            conditions: {
                                status: ACTIVE,
								is_deleted:NOT_DELETED,
                                /* _id: {$nin: area_ids} */
                            },
                            sort_conditions: { title: 1 }
                        },
                        {
                            collection: TABLE_USERS,
                            columns: ["slug", "display_name"],
                            conditions: {
                                status: ACTIVE,
                                user_type: FRNCHIES_USER_TYPE,
                                is_deleted: NOT_DELETED
                            },
                            sort_conditions: { display_name: 1 },
                            ...(franchise ? { selected: [franchise] } : {})
                        },
                    ]
                };
                getDropdownList(req, res, options).then(response => {

                    let responseObj = {
                        area_list: (response && response.final_html_data && response.final_html_data["0"]) ? response.final_html_data["0"] : "",
                        franchise_list: (response && response.final_html_data && response.final_html_data["1"]) ? response.final_html_data["1"] : "",
                        franchise: franchise
                    }

                    /** Render add page **/
                    req.breadcrumbs(BREADCRUMBS["admin/franchise_contracts/add"]);
                    res.render("add", responseObj);
                });

            })

        }
    }// end addContract()


    /**
     * Function for view contract
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.viewContract = (req, res) => {
        let contractId = (req.params.id) ? req.params.id : "";
        if (contractId) {
            let conditions = [
                { $match: { _id: new ObjectId(contractId) } },
                {
                    $lookup: {
                        from: TABLE_USERS,
                        localField: "franchise_id",
                        foreignField: "_id",
                        as: "franchise"
                    }
                },
                {
                    $lookup: {
                        from: TABLE_AREAS,
                        localField: "area_id",
                        foreignField: "_id",
                        as: "area"
                    }
                },
                {
                    $lookup: {
                        from: TABLE_USERS, // Collection to join
                        let: { service_provider_ids: "$service_provider_in_area" }, // Local field
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [{ $in: ["$_id", "$$service_provider_ids"] }] // Match IDs
                                    }
                                }
                            }
                        ],
                        as: "service_providers" // Output field
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        created: 1,
                        franchise_id: 1,
                        start_date: 1,
                        end_date: 1,
                        contract_file: 1,
                        purely_amount_commission:1,
                        purely_amount_commission_store:1,
                        service_provider_in_area: 1,
                        franchise: { $arrayElemAt: ["$franchise.display_name", 0] },
                        franchise_slug: { $arrayElemAt: ["$franchise.slug", 0] },
                        area_name: { $arrayElemAt: ["$area.title", 0] },
                        area: { $arrayElemAt: ["$area", 0] },//"$area"
                        service_providers: {
                            $map: {
                                input: "$service_providers", // Iterate over service_providers array
                                as: "provider",
                                in: {
                                    full_name: "$$provider.full_name",
                                    email: "$$provider.email",
                                    mobile_number: "$$provider.mobile_number",
                                    registration_date: "$$provider.created"
                                }
                            }
                        }
                    }
                },
            ]

            let options = {
                conditions: conditions
            };

            ContractModel.getFranchiseContractAggregateList(req, res, options).then(contractResponse => {
                let responseStatus = (contractResponse && contractResponse?.status) ? contractResponse.status : '';
                let responseResult = (contractResponse && contractResponse?.result && contractResponse.result?.[0]) ? contractResponse.result[0] : {};
 

                if (responseStatus == STATUS_SUCCESS) {
                    /** Render edit page **/
                    req.breadcrumbs(BREADCRUMBS['admin/franchise_contracts/view']);

                    res.render('view', {
                        result: responseResult,
                        google_map_key: process.env.GOOGLE_MAP_API_KEY,
                        google_map_default_lat: process.env.GOOGLE_MAP_DEFAULT_LAT,
                        google_map_default_long: process.env.GOOGLE_MAP_DEFAULT_LONG,
                    });
                } else {
                    /** Send error response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
                    return;
                }
            })
        } else {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
            return;
        }
    };//End viewContract()


    /**
     * Function for delete contract
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.deleteContract = (req, res) => {
        let contractId = (req.params.id) ? req.params.id : "";
        if (contractId) {

            let condition = {
                _id: new ObjectId(contractId)
            }

            let updateOptions = {
                conditions: condition,
                updateData: { $set: { is_deleted: DELETED, modified: getUtcDate() } }
            }

            ContractModel.updateContract(req, res, updateOptions).then(contractResponse => {
                if (contractResponse.status == STATUS_SUCCESS) {
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, res.__("admin.franchise_contract.contract_deleted_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
                } else {
                    /** Send success response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
                }
            })

        } else {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
            res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
            return;
        }
    };//End deleteContract()


    /**
     * Function for update contract status
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.updateContractStatus = (req, res, next) => {
        let contractId = (req.params.id) ? req.params.id : "";
        let status = (req.params.status) ? req.params.status : "";
        status = (status == CONTRACT_STATUS_ACTIVE) ? CONTRACT_STATUS_INACTIVE : CONTRACT_STATUS_ACTIVE;

        if (req.params.status == CONTRACT_STATUS_TERMINATED) {
            status = CONTRACT_STATUS_TERMINATED;
        }

        if (contractId) {

            let condition = {
                _id: new ObjectId(contractId)
            };

            let updateData = {
                status: status,
                modified: getUtcDate()
            }

            if (status = CONTRACT_STATUS_TERMINATED) {
                updateData.terminated_date = getUtcDate();
            }

            let updateOption = {
                conditions: condition,
                updateData: { $set: updateData }
            };

            ContractModel.updateContract(req, res, updateOption).then(updateResponse => {
                if (updateResponse.status == STATUS_SUCCESS) {
                    let message = res.__("admin.franchise_contract.contract_status_has_been_updated_successfully");

                    if (status == CONTRACT_STATUS_TERMINATED) {
                        message = res.__("admin.franchise_contract.contract_has_been_terminated_successfully");
                    }
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, message);
                    res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
                } else {
                    /** Send success response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
                }
            })

        } else {
            /** Send error response **/
            req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "franchise_contracts");
            return;
        }
    };//End updateContractStatus()

};

module.exports = new FranchiseContract()