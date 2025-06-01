/** Model file path for current plugin **/
var modelPath   = 	__dirname+"/ContactController";
var modulePath	= 	"/"+ADMIN_NAME+"/contact/";

const { contactReplyValidationRules, validate } = require('./validations/contact_validations')


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get contact list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    var adminContact = require(modelPath);
    adminContact.getContactList(req, res,next);
});

/** Routing is used to view contact details **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,contactReplyValidationRules(),validate,(req,res,next) => {
	var adminContact = require(modelPath);
	adminContact.view(req,res,next);
});
