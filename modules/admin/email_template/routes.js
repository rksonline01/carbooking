/** defining controller and model path */
var controllerPath 	= __dirname+"/emailTemplateController";
var modulePath	= "/"+ADMIN_NAME+"/email_template/";

const { editEmailTemplateRules,validate } = require(__dirname+"/validations/validators.js");

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
	req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used for list page **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => { 
	var emailTemplates = require(controllerPath);
	emailTemplates.getTemplateList(req, res);
});

/** Routing is used to edit email template **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editEmailTemplateRules(),validate,(req,res,next) => {
	var adminEmailTemplate = require(controllerPath);
	adminEmailTemplate.editEmailTemplate(req,res);
});
