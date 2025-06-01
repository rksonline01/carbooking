/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/AreaController";
var modulePath	= 	"/"+ADMIN_NAME+"/area/";
const { areaValidationRules, validate } = require(__dirname+"/area_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get Area list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminArea = require(modelPath);
    adminArea.getAreaList(req, res,next);
});

/** Routing is used to add Area **/
app.all(modulePath+"add/:draw?",checkLoggedInAdmin,convertMultipartReqBody,areaValidationRules(),validate,(req,res,next) => {
    var adminArea = require(modelPath);
    adminArea.addArea(req,res,next);
});

/** Routing is used to edit Area **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,areaValidationRules(),validate,(req, res, next) => {
    var adminArea = require(modelPath);
    adminArea.editArea(req,res,next);
});

/** Routing is used to update area status **/
app.all(modulePath+"update_area_status/:id/:status",checkLoggedInAdmin,(req, res, next)=>{
    var adminArea = require(modelPath);
	adminArea.updateAreaStatus(req, res, next);
});

/** Routing is used to add Area **/
app.all(modulePath+"show-all", checkLoggedInAdmin, (req,res,next) => {
    var adminArea = require(modelPath);
    adminArea.showAllAreas(req,res,next);
});

/**  Routing is used to delete Area **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
	var adminArea = require(modelPath);
	adminArea.deleteArea(req, res, next);
});

/** Routing is used to edit Area **/
app.all(modulePath+"assign-service-provider/:id",checkLoggedInAdmin,(req, res, next) => {
    var adminArea = require(modelPath);
    adminArea.assignServiceProvicer(req,res,next);
});
