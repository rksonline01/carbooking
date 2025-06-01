/** Model file path for current plugin **/
var controllerPath = __dirname+"/AdminRoleController";
var modulePath	= "/"+ADMIN_NAME+"/admin_role/";

const {addRoleValidationRules, validate} = require('./admin_role_validations/validator');

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/**Routing is used to show list of roles */
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var adminRole = require(controllerPath);
	adminRole.list(req, res);
});

/**Routing is used to add roles */
app.all(modulePath+"add",checkLoggedInAdmin,addRoleValidationRules(),validate,(req, res) => {
	var adminRole = require(controllerPath);
	adminRole.add(req, res);
});

/** Routing is used to edit admin module **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,addRoleValidationRules(),validate,(req, res) => {
	var adminModules = require(controllerPath);
	adminModules.edit(req, res);
});