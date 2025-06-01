/** Model file path for current plugin **/
var modelPath = __dirname +"/SettingController";
var modulePath	= 	"/"+ADMIN_NAME+"/settings/";
const { addSettingValidationRules, editSettingValidationRules,validate } = require(__dirname+"/setting_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get setting list **/
app.all(modulePath,checkLoggedInAdmin,function(req, res) {
    var adminSettings = require(modelPath);
    adminSettings.getSettingList(req, res);
});

/** Routing is used to add setting **/
app.all(modulePath+"add",addSettingValidationRules(), validate,(req, res) => {
	var adminSetting = require(modelPath);
	adminSetting.addSetting(req, res);
});

/** Routing is used to delete setting **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req, res) => {
	var adminSetting = require(modelPath);
	adminSetting.deleteSetting(req, res);
});

/** Routing is used to edit setting **/
app.all(modulePath+"edit/:id",editSettingValidationRules(), validate,function(req, res) {
    var adminSettings = require(modelPath);
    adminSettings.editSetting(req, res);
});

/** Routing is used to get setting listing with edit page **/
app.all(modulePath+"prefix/:type",checkLoggedInAdmin,function(req, res) {

    var adminSettings = require(modelPath);
    adminSettings.prefix(req, res);
});
