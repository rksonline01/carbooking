/** Model file path for current plugin **/
var controllerPath   = 	__dirname+"/PointController";
var modulePath	= 	"/"+ADMIN_NAME+"/points/";
const {addPointRules,deductPointRules, validate } = require(__dirname+"/points_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get package list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminPoints = require(controllerPath);
    adminPoints.getUserPointsList(req, res,next);
});

/** Routing is used for exportig user list */
app.all(modulePath+"add_point",checkLoggedInAdmin,addPointRules(),validate,(req,res,next)=>{
    var adminPoints  =  require(controllerPath);
    adminPoints.addPoint(req,res,next);
});
/** Routing is used for exportig user list */
app.all(modulePath+"deduct_point",checkLoggedInAdmin,deductPointRules(),validate,(req,res,next)=>{
    var adminPoints  =  require(controllerPath);
    adminPoints.deductPoint(req,res,next);
});


/** Routing is used for exportig user list */
app.all(modulePath+"export-points-list",checkLoggedInAdmin,(req,res,next)=>{
    var adminPoints  =  require(controllerPath);
    adminPoints.exportUserPointsList(req,res,next);
});

