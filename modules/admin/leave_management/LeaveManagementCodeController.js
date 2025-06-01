const async = require('async');
const LeaveManagementModel = require("./model/LeaveManagement");


const { ObjectId } = require('mongodb');
function LeaveManagementCodeController() {
  
    /**
     * Function to Leave list
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.list = async (req, res, next) => {

        if (isPost(req)) {           
            let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
            let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
            let search_data = req.body.search_data;
          
            /** Configure Datatable conditions*/
            configDatatable(req, res, null).then(dataTableConfig => {
                // let commonConditions = {
                //     is_deleted: NOT_DELETED,
                // };

                if (search_data.length) {
                    search_data.map(formdata => {
                        if (formdata.name != "search_open" && formdata.value != "") {
                            if (formdata.name == "date" && formdata.value != "") {
                                dataTableConfig.conditions[formdata.name] = formdata.value;
                            } else {
                                dataTableConfig.conditions[formdata.name] = { "$regex": formdata.value, "$options": "i" };
                            }
                        }
                    })
                }

                let conditions = [
                    {
                        $facet: {
                            "leave_list": [
                                { $match: dataTableConfig.conditions },
                                { $sort: dataTableConfig.sort_conditions },
                                { $skip: skip },
                                { $limit: limit },
                                {
                                    $project: {
                                        _id: 1,
                                        date: 1,
                                        leave_reason: 1,
                                        modified: 1,
                                        created_at: 1,
                                    }
                                },


                            ],
                            "leave_all_count": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 }
                                    }
                                },
                                {
                                    $project: { count: 1, _id: 0 }
                                }
                            ],
                            "leave_filter_count": [
                                { $match: dataTableConfig.conditions },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 }
                                    }
                                },
                                {
                                    $project: { count: 1, _id: 0 }
                                }
                            ]
                        }
                    }
                ];

                let optionObj = {
                    conditions: conditions
                }

                LeaveManagementModel.getLeaveManagementAggregateList(req, res, optionObj).then(leavesResponse => {



                    let responseStatus = (leavesResponse) ? leavesResponse.status : "";
                    let responseResult = (leavesResponse.result && leavesResponse.result[0]) ? leavesResponse.result[0] : "";

                    let leave_list = (responseResult && responseResult.leave_list) ? responseResult.leave_list : [];

                    let leave_all_count = (responseResult && responseResult.leave_all_count && responseResult.leave_all_count[0] && responseResult.leave_all_count[0]["count"]) ? responseResult.leave_all_count[0]["count"] : DEACTIVE;

                    let leave_filter_count = (responseResult && responseResult.leave_filter_count && responseResult.leave_filter_count[0] && responseResult.leave_filter_count[0]["count"]) ? responseResult.leave_filter_count[0]["count"] : DEACTIVE;

                    res.send({
                        status: responseStatus,
                        draw: dataTableConfig.result_draw,
                        data: leave_list,
                        recordsTotal: leave_all_count,
                        recordsFiltered: leave_filter_count,
                    });
                })


            });
        } else {
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS['admin/leave-management/list']);
            res.render("list", {

            });
        }
    };//End list()

    /**
     * Function for add Leave
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addLeaveManagement = async (req, res, next) => {

        if (isPost(req)) {
            /** Sanitize Data */
            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            req.user_data = (req.session.user) ? req.session.user : "";

            req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            let date = (req.body.date) ? req.body.date : "";
            let leaveReason = (req.body.leave_reason) ? req.body.leave_reason : "";


            let optionObj = {
                insertData: {
                    date: date,
                    leave_reason: leaveReason,
                    is_deleted: DEACTIVE,
                    created: getUtcDate(),
                    modified: getUtcDate(),
                }
            }

            LeaveManagementModel.saveLeaveManagement(req, res, optionObj).then(saveResult => {
                let responseStatus = (saveResult.status) ? saveResult.status : "";
                if (responseStatus == STATUS_ERROR) {
                    /** Send error response **/
                    res.send({
                        status: STATUS_ERROR,
                        message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                } else {
                    /** Send success response */
                    req.flash('success', res.__("admin.leave_has_been_save_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + 'leave-management',
                        message: res.__("admin.leave_has_been_save_successfully")
                    });
                }
            })


        } else {
            req.breadcrumbs(BREADCRUMBS["admin/leave-management/add"]);
            res.render("add");
        }
    };//End addLeaveManagement()


    /**
     * Function for delete Leave
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return null
     */
    this.deleteLeaveManagement = function (req, res, next) {
        var leaveId = req.params.id;
        if (leaveId) {
            let condition = {
                _id: new ObjectId(leaveId)
            };           

            let updateOption = {
                conditions: condition,               
            }

            LeaveManagementModel.deleteOneLeaveManagement(req, res, updateOption).then(promoResponse => {
                if (promoResponse.status == STATUS_SUCCESS) {
                    /** Send success response **/
                    req.flash(STATUS_SUCCESS, res.__("admin.leave_management.leave_management_deleted_successfully"));
                    res.redirect(WEBSITE_ADMIN_URL + "leave-management");
                } else {
                    /** Send success response **/
                    req.flash(STATUS_ERROR, res.__("admin.system.something_going_wrong_please_try_again"));
                    res.redirect(WEBSITE_ADMIN_URL + "leave-management");
                }
            })
        } else {
            /** Send error response **/
            req.flash("error", res.__("admin.system.invalid_access"));
            res.redirect(WEBSITE_ADMIN_URL + "leave-management");
            return;
        }

    };//End deleteLeave()
}
module.exports = new LeaveManagementCodeController();
