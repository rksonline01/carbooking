/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/CustomerAddrsController";
var modulePath	= 	"/"+ADMIN_NAME+"/customer_address/:user_id/";

const { editCustomerAddrsValidationRules, validate } = require(__dirname+"/customer_addresses._validator/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
 next();
});

/** Routing is used to get newsletter subscriber list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var adminCustomerAddrs = require(controllerPath);
	adminCustomerAddrs.getAddressList(req, res);
});


/** Routing is used to edit newsletter subscriber **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editCustomerAddrsValidationRules(),validate,(req, res,next) => {
	var adminCustomerAddrs = require(controllerPath);
	adminCustomerAddrs.editAddress(req,res,next);
});

/** Routing is used to update favorite status **/
app.get(modulePath+"set_default/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminCustomerAddrs = require(controllerPath);
	adminCustomerAddrs.updateDefaultStatus(req,res,next);
});

/** Routing is used to update favorite status **/
app.get(modulePath+"update_favorite_status/:id/:status",checkLoggedInAdmin,(req, res,next) => {
	var adminCustomerAddrs = require(controllerPath);
	adminCustomerAddrs.updateFavoriteAddressStatus(req,res,next);
});

