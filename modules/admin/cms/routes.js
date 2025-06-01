/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/CmsController";
var modulePath	= 	"/"+ADMIN_NAME+"/cms/";
const { addCMSValidationRules, editCMSValidationRules,validate } = require(__dirname+"/cms_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get cms list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminCms = require(modelPath);
    adminCms.getCmsList(req, res,next);
});

/** Routing is used to add cms  **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addCMSValidationRules(),validate,(req,res,next) => {
    var adminCms = require(modelPath);
    adminCms.addCms(req,res,next);
});


/** Routing is used to edit cms **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editCMSValidationRules(),validate,(req,res,next) => {
    var adminCms = require(modelPath);
    adminCms.editCms(req,res,next);
});

/** Routing is used to upload ck editor image **/
app.post(modulePath+"ckeditor_uploader",checkLoggedInAdmin,(req,res,next) => {
    var adminUser = require(WEBSITE_ADMIN_MODULES_PATH+'users/model/user');
    adminUser.ckeditorUploader(req,res,next);
});