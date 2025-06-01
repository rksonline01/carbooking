/** Model file path for current plugin **/
var modelPath = __dirname +"/SlotController";
var modulePath	= 	"/"+ADMIN_NAME+"/slot-management/";
const { validate } = require(__dirname+"/slot_validations/validator.js")
/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   req.rendering.views	=	__dirname + "/views";
    next();
});

 
/** Routing is used to add Slot **/
app.all(modulePath,checkLoggedInAdmin, (req,res,next) => {
	var adminSlot = require(modelPath);
	adminSlot.addEditSlot(req, res);
});
 