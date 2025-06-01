/** Model file path for current plugin **/
var modelPath = __dirname +"/BlockController";
var modulePath	=	"/"+ADMIN_NAME+"/block/";
const { addBlockValidationRules, editBlockValidationRules,validate } = require(__dirname+"/block_validation/validator.js")


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get block list **/
app.all(modulePath,checkLoggedInAdmin,(req, res, next) => {
    var adminBlock = require(modelPath);
    adminBlock.getBlockList(req, res, next);
});

/** Routing is used to add block **/
app.all(modulePath+"add",checkLoggedInAdmin,addBlockValidationRules(),validate,(req, res, next) => {
    var adminBlock = require(modelPath);
    adminBlock.addBlock(req,res, next);
});

/** Routing is used to edit block **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,editBlockValidationRules(),validate,(req, res, next) => {
    var adminBlock = require(modelPath);
    adminBlock.editBlock(req,res, next);
});

/** Routing is used to upload ck editor image **/
app.post(modulePath+"ckeditor_uploader",checkLoggedInAdmin,(req,res,next) => {
    var adminUser = require(WEBSITE_ADMIN_MODULES_PATH+'users/model/user');
    adminUser.ckeditorUploader(req,res,next);
});