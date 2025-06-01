/** Model file path for current plugin **/
var modelPath = __dirname +"/LeaveManagementCodeController";
var modulePath	= 	"/"+ADMIN_NAME+"/leave-management/";
const { addLeaveManagementValidationRules,validate } = require(__dirname+"/leave_management_validations/validator.js")
/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get promo code list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
	var adminLeaveManagement = require(modelPath);
	adminLeaveManagement.list(req, res);
});


/** Routing is used to add category **/
app.all(modulePath+"add",checkLoggedInAdmin,addLeaveManagementValidationRules(),validate,(req,res,next) => {
	var adminLeaveManagement = require(modelPath);
	adminLeaveManagement.addLeaveManagement(req, res);
});

/** Routing is used to delete promo code details  **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminLeaveManagement = require(modelPath);
	adminLeaveManagement.deleteLeaveManagement(req, res,next);
});

