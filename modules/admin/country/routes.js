/** defining controller and module path */
var controllerPath 	= __dirname+"/countryController";
var modulePath	= "/"+ADMIN_NAME+"/country/";

var {addCountryValidationRules,editCountryValidationRules,validate} = require("./validation/country_validator")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/view";
    next();
});

/** Routing is used for list page **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => { 
	var country = require(controllerPath);
	country.getCountryList(req, res);
});

/** Routing is used for list page **/
app.all(modulePath+"add",checkLoggedInAdmin,addCountryValidationRules(),validate,(req, res) => { 
	var country = require(controllerPath);
	country.addCountry(req, res);
});

/** Routing is used to edit country **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editCountryValidationRules(),validate,(req,res,next)=>{
    var country	= require(controllerPath);
    country.editCountry(req,res,next);
});

/** Routing is used to update country status **/
app.all(modulePath+"update_country_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    var country	= require(controllerPath);
    country.updateCountryStatus(req, res);
});