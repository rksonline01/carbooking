/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/NotificationTypeController";
var modulePath	= 	"/"+ADMIN_NAME+"/notification_type/";
let adminNotificationType = require(modelPath);
const { addEditNotificationTypeValidationRules,validate } = require(__dirname+"/notification_type_validation/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get faq list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
    adminNotificationType.getNotificationTypeList(req, res);
});

/** Routing is used to add Notification Type **/
app.all(modulePath+"add_edit",checkLoggedInAdmin,addEditNotificationTypeValidationRules(),validate,(req,res,next) => {
    adminNotificationType.addEditNotificationType(req,res,next);
});

/** Routing is used to edit Notification Type **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,addEditNotificationTypeValidationRules(),validate,(req,res,next) => {
    adminNotificationType.addEditNotificationType(req,res,next);
});

/** Routing is used to view Notification Type details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	adminNotificationType.viewNotificationTypeDetails(req, res, next);
});

/** Routing is used to update Notification Type status **/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res, next) => {
	adminNotificationType.updateNotificationTypeStatus(req, res, next);
});

/**  Routing is used to delete Notification Type **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	adminNotificationType.deleteNotificationType(req,res);
});
