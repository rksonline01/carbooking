/** Model file path for current plugin **/
//var modelPath               = __dirname+"/model/posts";
var modelReviewsPath  	    = __dirname+"/model/reviews";
//var modelBiddingPostsPath  	= __dirname+"/model/bidding_posts";

var modulePath = "/"+ADMIN_NAME+"/reviews/";

const { editReviewValidationRules,validate } = require(__dirname+"/validation/validator.js")

//var postsModel	        = require(modelPath);
var reviewModel	        = require(modelReviewsPath);
//var biddingPostsModel	= require(modelBiddingPostsPath);

/** Set current view folder **/
app.use(modulePath,(req,res,next)=>{
   req.rendering.views	=	__dirname + "/views";
   next();
});

/** Routing is used to get posts List 
//app.all(modulePath+":type?",checkLoggedInAdmin,(req, res)=>{
app.all(modulePath,checkLoggedInAdmin,(req, res)=>{
    postsModel.getPostList(req, res);
});
**/
/** Routing is used to export ads details 
app.get(modulePath+"export_data/:export_type",checkLoggedInAdmin,(req, res,next)=>{
    postsModel.exportData(req,res,next);
});
**/
/** Routing is used to view post 
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.viewPost(req,res,next);
});
**/
/** Routing is used to update posts status 
app.all(modulePath+"update_post_status/:id/:status",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.updatePostStatus(req,res,next);
});
**/
/** Routing is used to update reported posts status
app.all(modulePath+"update_post_block/:id/:status",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.updatePostBlock(req,res,next);
});
 **/
/** Routing is used to mark/unmark post as best seller 
app.all(modulePath+"mark_best_seller/:id/:status",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.markAsBestSeller(req,res,next);
})
*/
/** Routing is used for umegamart favorite 
app.all(modulePath+"umegamart_favorite",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.getUmegamartFavourite(req,res,next);
})
*/
/** Routing is used for mark umegamart favorite
app.all(modulePath+"mark_umegamart_favorite/:id/:status",checkLoggedInAdmin,(req,res,next)=>{
    postsModel.markAsUmegamartFavorite(req,res,next);
})
 */

/** Routing is used to get reviews list **/
app.all(modulePath,checkLoggedInAdmin,(req, res, next) => {   
    reviewModel.getAdReviews(req,res, next);
});

/** Routing is used to edit category 
app.all(modulePath+"reviews/edit/:id",checkLoggedInAdmin,editReviewValidationRules(),validate,(req, res, next) => {
    reviewModel.editReview(req,res, next);
});
**/
/** Routing is used to change category status **/
app.all(modulePath+"update_review_status/:id/:status/:status_type",checkLoggedInAdmin,(req, res, next) => {
    reviewModel.updateReviewStatus(req,res, next);
});

/** Routing is used to approve review **/
app.all(modulePath+"apprve_review/:id",checkLoggedInAdmin,(req, res, next) => {
    reviewModel.approveReview(req,res, next);
});

/**  Routing is used to delete review **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
    reviewModel.deleteReview(req,res, next);
});


/** Routing is used to get bidding post list 
app.all(modulePath+"bidding_posts",checkLoggedInAdmin,(req, res, next) => {   
    biddingPostsModel.getBiddingPosts(req,res, next);
});
**/
/** Routing is used to view bidding post 
app.all(modulePath+"bidding_posts/view/:id",(req,res,next)=>{
    biddingPostsModel.viewPost(req,res,next);
});
**/
/** Routing is used to get bid_listing of paticular bidding post 
app.all(modulePath+"bidding_posts/bid_listing/:id",(req,res,next)=>{
    biddingPostsModel.bidListing(req,res,next);
});
**/
/** Routing is used to update posts status 
app.all(modulePath+"bidding_posts/update_post_status/:id/:status",(req,res,next)=>{
    biddingPostsModel.updatePostStatus(req,res,next);
});
**/
/** Routing is used to update reported posts status 
app.all(modulePath+"bidding_posts/update_post_block/:id/:status",(req,res,next)=>{
    biddingPostsModel.updatePostBlock(req,res,next);
});
**/
/** Routing is used to show the comment list 
app.all(modulePath+"comments",(req,res,next)=>{
    postsModel.commentListing(req,res,next);
});
**/