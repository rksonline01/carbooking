/** Model file path for current plugin **/
var controllerPath = __dirname+"/AdminPermissionsController";
var modulePath	= 	"/"+ADMIN_NAME+"/admin_permissions/";
const { addPermissionValidationRules, editPermissionValidationRules, validate } = require(__dirname+"/admin_permission_validations/validation.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used for listing page **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var adminPermissions = require(controllerPath);
	adminPermissions.list(req, res);
});

//~ /** Routing is used to add permission **/
app.all(modulePath+"add",checkLoggedInAdmin,addPermissionValidationRules(),validate,(req, res) => {
	var adminPermissions = require(controllerPath);
	adminPermissions.add(req, res);
});

/** Routing is used to edit permission **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editPermissionValidationRules(),validate,(req, res) => {
	var adminPermissions = require(controllerPath);
	adminPermissions.edit(req, res);
});

/** Routing is used to view permission **/
app.get(modulePath+"view/:id",checkLoggedInAdmin,(req, res)=>{
    var adminPermissions = require(controllerPath);
    adminPermissions.viewDetials(req, res);
});

/** Routing is used to delete user details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
    var adminPermissions	= require(controllerPath);
    adminPermissions.deleteUser(req,res,next);
});

/** Routing is used to update status**/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res) => {
	var adminPermissions = require(controllerPath);
	adminPermissions.updateStatus(req, res);
});

/** Routing is used to send login credentials **/
app.get(modulePath+"send_login_credentials/:id",checkLoggedInAdmin,(req, res)=>{
    var adminPermissions	= require(controllerPath);
    adminPermissions.sendLoginCredentials(req, res);
});

/** Routing is used to get allowed modules of a role **/
app.post(modulePath+"get_role_modules",checkLoggedInAdmin,(req, res)=>{
    var adminPermissions = require(controllerPath);
    adminPermissions.getAdminRoleModulesData(req, res);
});