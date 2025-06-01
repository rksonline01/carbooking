/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/PushNotificationTypeController";
var modulePath	= 	"/"+ADMIN_NAME+"/push_notification_type/";
let adminPushNotificationType = require(modelPath);
const { addEditPushNotificationTypeValidationRules,validate } = require(__dirname+"/push_notification_type_validation/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get faq list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
    adminPushNotificationType.getPushNotificationTypeList(req, res);
});

/** Routing is used to add Notification Type **/
app.all(modulePath+"add_edit",checkLoggedInAdmin,addEditPushNotificationTypeValidationRules(),validate,(req,res,next) => {
    adminPushNotificationType.addEditPushNotificationType(req,res,next);
});

/** Routing is used to edit Notification Type **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,addEditPushNotificationTypeValidationRules(),validate,(req,res,next) => {
    adminPushNotificationType.addEditPushNotificationType(req,res,next);
});

/** Routing is used to view Notification Type details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	adminPushNotificationType.viewPushNotificationTypeDetails(req, res, next);
});

/** Routing is used to update Notification Type status **/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res, next) => {
	adminPushNotificationType.updatePushNotificationTypeStatus(req, res, next);
});

/**  Routing is used to delete Notification Type **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	adminPushNotificationType.deletePushNotificationType(req,res);
});
