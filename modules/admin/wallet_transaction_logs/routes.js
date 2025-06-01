/** Model file path for current plugin **/
var controllerPath   = 	__dirname+"/WalletTransactionLogsController";
var modulePath	= 	"/"+ADMIN_NAME+"/";

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   req.rendering.views	=	__dirname + "/views";
    next();
});

app.all(modulePath+"view-wallet-history",checkLoggedInAdmin,(req, res)=>{
    var adminUser	= require(controllerPath);
    adminUser.getUserWalletList(req, res);
});
 
 
/** Routing is used for exportig user list */
app.all(modulePath+"export-wallet-history",checkLoggedInAdmin,(req,res,next)=>{
    var adminUser  =  require(controllerPath);
    adminUser.exportUserWalletHistory(req,res,next);
});