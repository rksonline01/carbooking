/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/SubscriptionController";
var modulePath	= 	"/"+ADMIN_NAME+"/subscription-management/";
const { addSubscriptionValidationRules, editSubscriptionValidationRules,validate } = require(__dirname+"/subscription_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get Subscription list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminSubscription = require(modelPath);
    adminSubscription.getSubscriptionList(req, res,next);
});

/** Routing is used to add Subscription **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addSubscriptionValidationRules(),validate,(req,res,next) => {
    var adminSubscription = require(modelPath);
    adminSubscription.addSubscription(req,res,next);
});

/** Routing is used to edit Subscription **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editSubscriptionValidationRules(),validate,(req,res,next) => {
    var adminSubscription = require(modelPath);
    adminSubscription.editSubscription(req,res,next);
});

/** Routing is used to update Subscription **/
app.all(modulePath+"update_status/:id/:status",checkLoggedInAdmin,(req,res,next) => {
    var adminSubscription = require(modelPath);
    adminSubscription.updateSubscriptionStatus(req, res, next);
});

/**  Routing is used to delete Subscription **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	var adminSubscription = require(modelPath);
	adminSubscription.deleteSubscription(req, res, next);
});

/** Routing is used to view Subscription details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	let adminSubscription = require(modelPath);
	adminSubscription.viewSubscriptionDetails(req, res, next);
});
