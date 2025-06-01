/** Model file path for current plugin **/
var controllerPath   = 	__dirname+"/ProductController";
var modulePath	= 	"/"+ADMIN_NAME+"/products/";

var { addProductValidationRules,  editProductValidationRules,stockValidationRules, validate} = require('./product_validator/validations')

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get product list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.getProductList(req, res);
});


/** Routing is used to add product **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addProductValidationRules(),validate,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.productAdd(req, res);
});

/** Routing is used to edit product **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editProductValidationRules(),validate,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.productEdit(req, res);
});


/** Routing is used to add product **/
app.all(modulePath+"get_sub_category",checkLoggedInAdmin,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.getSubCategoryList(req, res);
});

/** Routing is used to add product **/
app.all(modulePath+"get_attribute_options",checkLoggedInAdmin,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.getAttributeOptionList(req, res);
});

/** Routing is used to get product details **/
app.all(modulePath+'view/:id',checkLoggedInAdmin,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.viewProductDetail(req, res);
});

/** Routing is used to change product status **/
app.all(modulePath+"update_product_status/:id/:status",checkLoggedInAdmin,(req, res, next) => {
    var adminProduct = require(controllerPath);
    adminProduct.updateProductStatus(req, res);
});

/** Routing is used to get list of products */
app.all(modulePath+"get_product_list/:term",checkLoggedInAdmin,(req, res, next) => {validate
    adminProduct.getSearchProductDetail(req, res);
});

/** Routing is used to edit product **/
app.all(modulePath+"add_video/:id",checkLoggedInAdmin,convertMultipartReqBody,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.addProductVideo(req, res);
});

/** Routing is used to stock manage **/
app.all(modulePath+"stock_manage",checkLoggedInAdmin,stockValidationRules(),validate,(req, res) => {
    var adminProduct = require(controllerPath);
    adminProduct.stockManage(req, res);
});




