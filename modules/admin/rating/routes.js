/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/RatingController.js";
var modulePath	= 	"/"+ADMIN_NAME+"/rating/";

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
 next();
});

/** Routing is used to get newsletter subscriber list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var rating = require(controllerPath);
	rating.getRatingList(req, res);
});


/** Routing is used to rating status **/
app.all(modulePath+"approve_rating_status/:id/:status/:status_type",checkLoggedInAdmin,(req,res,next) => {	
    
	var rating = require(controllerPath);
    rating.updateApproveRatingStatus(req,res,next);
});
