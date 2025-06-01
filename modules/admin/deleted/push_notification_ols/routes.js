/** Model file path for current plugin **/
var modelPath   =	__dirname+"/model/push_notification";
var modulePath	= 	"/"+ADMIN_NAME+"/push_notification/";
const { addNotificationValidationRules, editNotificationValidationRules,validate } = require(__dirname+"/push_notification_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
   req.rendering.views	=	__dirname + "/views";
   next();
});

/** Routing is used to get notification list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(modelPath);
    adminPushNotification.getPushNotificationList(req, res);
});

/** Routing is used to add push notification **/
app.all(modulePath+"add",checkLoggedInAdmin,addNotificationValidationRules(),validate,(req,res,next) => {	
    var adminPushNotification = require(modelPath);
    adminPushNotification.addPushNotification(req,res,next);
});


/** Routing is used to get user list type wise **/
app.post(modulePath+"get_user_list_type_wise/:user_type",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(modelPath);
    adminPushNotification.getUserListUserTypeWise(req, res);
});


/** Routing is used to edit push notification details  **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,(req,res,next)=>{
    var adminPushNotification	= require(modelPath);
    adminPushNotification.updateNotificationsDetails(req,res,next);
});

/** Routing is used to delete baner details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(modelPath);
    adminPushNotification.deleteNotifications(req, res);
});

/** Routing is used to update push notification status **/
app.all(modulePath+"update_notification_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var adminPushNotification	= require(modelPath);
    adminPushNotification.updateNotificationStatus(req, res);
});


/** Routing is get user list (ajax throw) **/
app.all(modulePath+"get_user_list_type_wise_ajax",checkLoggedInAdmin,(req,res,next)=>{
    var adminGetaways	= require(modelPath);
    adminGetaways.getUserListUserTypeWiseAjax(req,res,next);
});