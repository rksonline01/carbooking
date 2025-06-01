/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/CustomNotificationController";
var modulePath	= 	"/"+ADMIN_NAME+"/custom-notification/";

const { addNotificationValidationRules, validate } = require(__dirname+"/custom_notification_validation/validator.js")



/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get notification list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var adminCustomNotification	= require(controllerPath);
    adminCustomNotification.getCustomNotificationList(req, res);
});

/** Routing is used to add custom notification **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addNotificationValidationRules(),validate,(req,res,next) => {	
    var adminCustomNotification = require(controllerPath);
    adminCustomNotification.addCustomNotification(req,res,next);
});

/** Routing is used to get user list type wise **/
app.all(modulePath+"get_user_list_type_wise",checkLoggedInAdmin,(req, res)=>{   
    var adminCustomNotification	= require(controllerPath);
    adminCustomNotification.getUserListUserTypeWise(req, res);
});

/** Routing is used to delete custom notification details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res)=>{
    var adminCustomNotification	= require(controllerPath);
    adminCustomNotification.deleteNotifications(req, res);
});

/** Routing is used to update custom notification status **/
app.all(modulePath+"update_notification_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var adminCustomNotification	= require(controllerPath);
    adminCustomNotification.updateNotificationStatus(req, res);
});

/** Routing is used to view custom notification details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	let adminCustomNotification = require(controllerPath);
	adminCustomNotification.viewDetails(req, res, next);
});
