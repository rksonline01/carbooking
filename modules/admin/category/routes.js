/** Model file path for current plugin **/
var controllerPath   =	__dirname+"/CategoryController";
var modulePath		= 	"/"+ADMIN_NAME+"/category/";
var category	    =   require(controllerPath);

const { addCategoryValidationRules,editCategoryValidationRules,assignAttributeValidationRules,validate} = require(__dirname+"/validations/category_validations.js")

/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
   req.rendering.views	=	__dirname + "/views";
   next();
});

/** Routing is used to get category list **/
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    category.categoryList(req, res);
});

/** Routing is used to add category **/
app.all(modulePath+"add",checkLoggedInAdmin,convertMultipartReqBody,addCategoryValidationRules(),validate,(req,res,next) => {	
    category.addCategory(req,res,next);
});

/**Routing is used get sub category*/
app.all(modulePath+"get_sub_category_list",checkLoggedInAdmin,(req,res,next) => {	
    category.getSubCategoryList(req,res,next);
});

/** Routing is used to edit category **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,convertMultipartReqBody,editCategoryValidationRules(),validate,(req,res,next) => {	
    category.editCategory(req,res,next);
});

/** Routing is used to update city status **/
app.all(modulePath+"update_category_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res)=>{
    category.updateCategoryStatus(req, res);
});

/** Routing is used to assign attribute on category **/
app.all(modulePath+"assign_attribute",checkLoggedInAdmin,assignAttributeValidationRules(),validate,(req,res,next) => {	
    category.assignAttribute(req,res,next);
});

/** Routing is used to assign attribute on category **/
app.all(modulePath+"get_attribute_list/:id",checkLoggedInAdmin,(req,res,next) => {	
    category.getAttributeList(req,res,next);
});