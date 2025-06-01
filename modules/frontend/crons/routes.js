/** Model file path for current plugin **/
var modelPath   		= 	__dirname+"/model/crons";
var modulePath			= 	"/"+FRONT_END_FOLDER_NAME+"/crons/";
var modulePathView			= 	FRONT_END_NAME;
/** Set current view folder **/
app.use(modulePathView,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** cron update admin dashboard */
app.get(modulePath+"admin_dashboard_stats",(req, res)=>{
    var model	= require(modelPath);
    model.adminDashboardStats(req,res);
}); 


/** cron send email notification */
app.all(modulePath+"send_email_notification",(req, res)=>{
    var model	= require(modelPath);
    model.sendEmailNotification(req,res);
}); 


/** cron send push notification */
app.all(modulePath+"send_push_notification",(req, res)=>{
    var model	= require(modelPath);
    model.sendPushNotification(req,res);
}); 

/**cron send web notification */
app.all(modulePath+"send_web_notification",(req, res)=>{
    var model	= require(modelPath);
    model.sendWebNotification(req,res);
}); 


/**cron send email to admin if product stock quantity is low */
app.all(modulePath+"send_email_admin_low_stock_quantity",(req, res)=>{
    var model	= require(modelPath);
    model.sendEmailAdminLowStockQuantity(req,res);
}); 
 