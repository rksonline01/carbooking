/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/EmailNotificationController";
var modulePath	= 	"/"+ADMIN_NAME+"/email-notification/";

const { addNotificationValidationRules, validate } = require(__dirname+"/email_notification_validation/validator.js")



/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get notification list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    var adminEmailNotification	= require(controllerPath);
    adminEmailNotification.getEmailNotificationList(req, res);
});

/** Routing is used to add push notification **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addNotificationValidationRules(),validate,(req,res,next) => {	
    var adminEmailNotification = require(controllerPath);
    adminEmailNotification.addEmailNotification(req,res,next);
});

/** Routing is used to get user list type wise **/
app.all(modulePath+"get_user_list_type_wise",checkLoggedInAdmin,(req, res)=>{
    var adminEmailNotification	= require(controllerPath);
    adminEmailNotification.getUserListUserTypeWise(req, res);
});

/** Routing is used to delete baner details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res)=>{
    var adminEmailNotification	= require(controllerPath);
    adminEmailNotification.deleteNotifications(req, res);
});

/** Routing is used to update push notification status **/
app.all(modulePath+"update_notification_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var adminEmailNotification	= require(controllerPath);
    adminEmailNotification.updateNotificationStatus(req, res);
});

/** Routing is used to upload ck editor image **/
app.post(modulePath+"ckeditor_uploader",checkLoggedInAdmin,(req,res,next) => {
    var adminEmailNotification = require(WEBSITE_ADMIN_MODULES_PATH+'users/model/user');
    adminEmailNotification.ckeditorUploader(req,res,next);
});

