const async = require('async');
const SlotModel = require("./model/Slot");
const { ObjectId } = require('mongodb');

function SlotController() {
 
    /**
     * Function for add or edit slot's detail
     *
     * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addEditSlot = async (req, res, next) => {

        let isEditable = true ;//(req.params.id) ? true : false;
        if (isPost(req)) {
            /** Sanitize Data */
            req.body            =   sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
            req.user_data       =   (req.session.user) ? req.session.user : "";
            req.body.isEditable =   isEditable;
            isEditable          =   req.body.isEditable;
            let slotId          =   (req.body.id) ? new ObjectId(req.body.id) : "";
            let conditionsObj = { _id: slotId };
            let updateRecordObj = {
                $set: {
                    is_deleted  : DEACTIVE,
                    time_slot   : req.body.time_slot,
                    modified    : getUtcDate(),
                }
            }
            let optionObj = {
                conditions: conditionsObj,
                updateData: updateRecordObj,
            }

            SlotModel.updateOneSlot(req, res, optionObj).then(updateResult => {
                let responseStatus = (updateResult.status) ? updateResult.status : "";
                if (responseStatus == STATUS_ERROR) {
                    /** Send error response **/
                    res.send({
                        status: STATUS_ERROR,
                        message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
                    });
                } else {
                    /** Send success response **/
                    req.flash("success", res.__("admin.slot.slot_details_has_been_updated_successfully"));
                    res.send({
                        status: STATUS_SUCCESS,
                        redirect_url: WEBSITE_ADMIN_URL + "slot-management",
                        message: res.__("admin.slot.slot_details_has_been_updated_successfully"),
                    });
                }
            })
        } else {
            // Ensure conditions object is not empty
            let options = {
                conditions:  { is_deleted: DEACTIVE } // Add a default condition
            };
            SlotModel.SlotDetails(req, res, options).then(detailResponse => {
                let slotDetails = (detailResponse.result) ? detailResponse.result : {};

                
                //console.log(slotDetails.time_slot.saturday);

                req.breadcrumbs(BREADCRUMBS["admin/slot_management/add"]);
                res.render("add_edit", {
                    'result': slotDetails,
                    'is_editable': isEditable,
                });
            });
        }
    };//End addEditSlot()

    
}
module.exports = new SlotController();
