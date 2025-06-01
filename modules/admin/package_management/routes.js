/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/PackageController";
var modulePath	= 	"/"+ADMIN_NAME+"/package-management/";
const { addPackageValidationRules, editPackageValidationRules,validate } = require(__dirname+"/package_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get package list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminPackage = require(modelPath);
    adminPackage.getPackageList(req, res,next);
});

/** Routing is used to add package **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addPackageValidationRules(),validate,(req,res,next) => {
    var adminPackage = require(modelPath);
    adminPackage.addPackage(req,res,next);
});

/** Routing is used to edit package **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editPackageValidationRules(),validate,(req,res,next) => {
    var adminPackage = require(modelPath);
    adminPackage.editPackage(req,res,next);
});

/** Routing is used to update package **/
app.all(modulePath+"update_status/:id/:status",checkLoggedInAdmin,(req,res,next) => {
    var adminPackage = require(modelPath);
    adminPackage.updatePackageStatus(req,res,next);
});

/**  Routing is used to delete package **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	var adminPackage = require(modelPath);
	adminPackage.deletePackage(req, res, next);
});

/** Routing is used to view package details **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	let adminPackage = require(modelPath);
	adminPackage.viewPackageDetails(req, res, next);
});

