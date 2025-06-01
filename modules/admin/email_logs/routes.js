/** defing controller and model path */
var controllerPath 	= __dirname+"/emailLogController";
var modulePath	= "/"+ADMIN_NAME+"/email_logs/";

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get email logs list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var adminEmailLogs = require(controllerPath);
	adminEmailLogs.emailLogList(req, res);
});

/** Routing is used to view email log details **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req, res) => {
	var adminEmailLogs = require(controllerPath);
	adminEmailLogs.emailLogView(req, res);
});
