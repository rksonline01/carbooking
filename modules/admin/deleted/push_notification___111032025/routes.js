/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/PushNotificationController";
var modulePath	= 	"/"+ADMIN_NAME+"/push_notification/";

const { addNotificationValidationRules, validate } = require(__dirname+"/push_notification_validation/validator.js")



/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get notification list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(controllerPath);
    adminPushNotification.getPushNotificationList(req, res);
});

/** Routing is used to add push notification **/
app.all(modulePath+"add",checkLoggedInAdmin,addNotificationValidationRules(),validate,(req,res,next) => {	
    var adminPushNotification = require(controllerPath);
    adminPushNotification.addPushNotification(req,res,next);
});

/** Routing is used to get user list type wise **/
app.all(modulePath+"get_user_list_type_wise",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(controllerPath);
    adminPushNotification.getUserListUserTypeWise(req, res);
});

/** Routing is used to delete baner details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(controllerPath);
    adminPushNotification.deleteNotifications(req, res);
});

/** Routing is used to update push notification status **/
app.all(modulePath+"update_notification_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(controllerPath);
    adminPushNotification.updateNotificationStatus(req, res);
});