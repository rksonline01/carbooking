/** Model file path for current plugin **/
var controllerPath  	=	__dirname+"/NotificationController";
var modulePath	= 	"/"+ADMIN_NAME+"/notifications/";

/** Set current view folder **/
app.use(modulePath,(req,res,next) => {
	req.rendering.views	=	__dirname + "/views";
    next();
});

/**Routing is used to show notification listing */
app.all(modulePath,checkLoggedInAdmin,(req,res) => {
	var notifications = require(controllerPath);
	notifications.list(req,res);
});



/**Routing is used to show notification listing */
app.all(modulePath+ 'get_header_notifications',checkLoggedInAdmin,(req,res) => {
	 
	var notifications = require(controllerPath);
	notifications.getHeaderNotifications(req,res);
});

/**Routing is used to show notification listing */
app.all(modulePath+ 'get_header_notifications_counter',checkLoggedInAdmin,(req,res) => {
 
	var notifications = require(controllerPath);
	notifications.getHeaderNotificationsCounter(req,res);
});
