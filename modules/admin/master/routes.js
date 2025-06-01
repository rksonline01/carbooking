/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/MasterController";
var modulePath	= 	"/"+ADMIN_NAME+"/master/";
const { addMasterValidationRules, editMasterValidationRules,validate } = require(__dirname+"/master_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get master list **/
app.all(modulePath+":type",checkLoggedInAdmin,(req, res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.getMasterList(req, res,next);
});

/** Routing is used to update master status **/
app.all(modulePath+":type/change_status/:id/:status",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.updateMasterStatus(req,res,next);
});

/** Routing is used to add master **/
app.all(modulePath+":type/add",checkLoggedInAdmin,convertMultipartReqBody,addMasterValidationRules(),validate,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.addMaster(req,res,next);
});

/** Routing is used to edit master **/
app.all(modulePath+":type/edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editMasterValidationRules(),validate,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.masterUpdate(req,res,next);
});

/** Routing is used to view master details **/
app.all(modulePath+":type/view/:id",checkLoggedInAdmin,(req,res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.viewMaster(req,res,next);
});


/** Routing is used to update favorite status **/
app.get(modulePath+":type/set_default/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminMaster = require(modelPath);
	adminMaster.updateDefaultStatus(req,res,next);
});