/** Controller file path for current plugin **/
var controllerPath   =	__dirname+"/NewsLetterSubscriberController";
var modulePath	= 	"/"+ADMIN_NAME+"/newsletter_subscribers/";

const { newsletterSubscriberValidationRules, validate } = require(__dirname+"/newsletter_subscriber_validator/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
 next();
});

/** Routing is used to get newsletter subscriber list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	var adminNewsletterSubscriber = require(controllerPath);
	adminNewsletterSubscriber.getSubscriberList(req, res);
});

/** Routing is used to add newsletter subscriber **/
app.all(modulePath+"add",checkLoggedInAdmin,newsletterSubscriberValidationRules(),validate,(req, res,next) => {
	var adminNewsletterSubscriber = require(controllerPath);
	adminNewsletterSubscriber.addSubscriber(req,res,next);
});

/** Routing is used to edit newsletter subscriber **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,newsletterSubscriberValidationRules(),validate,(req, res,next) => {
	var adminNewsletterSubscriber = require(controllerPath);
	adminNewsletterSubscriber.editSubscriber(req,res,next);
});

/** Routing is used to delete newsletter subscriber **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req, res,next) => {
	var adminNewsletterSubscriber = require(controllerPath);
	adminNewsletterSubscriber.deleteSubscriber(req,res,next);
});

/** Routing is used to update newsletter subscriber status **/
app.all(modulePath+"update_subscriber_status/:id/:status",checkLoggedInAdmin,(req, res,next) => {
	var adminNewsletterSubscriber = require(controllerPath);
	adminNewsletterSubscriber.updateSubscriberStatus(req,res,next);
});
