/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/GiftTransactionLogController";
var modulePath	= 	"/"+ADMIN_NAME+"/gift_transaction_logs/";

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get sms logs list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var giftTrancationLogs = require(modelPath);
	giftTrancationLogs.list(req, res);
});

/** Routing is used to update  export user details **/
app.all(modulePath+"export-gift-transaction-logs",checkLoggedInAdmin,(req, res,next)=>{
    var giftTrancationLogs = require(modelPath);
    giftTrancationLogs.exportGiftData(req,res,next);
});