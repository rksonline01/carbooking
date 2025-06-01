/** Model file path for current plugin **/
var modulePath	= 	"/"+ADMIN_NAME+"/orders/";
const modelPath     =	require(__dirname+"/ordersController");

const { changeStatusValidationRules,acceptOrderValidationRules,refundProductAmountValidationRules,changeDateTimeValidationRules,cancelOrderValidationRules,validate } = require(__dirname+"/validation/validator.js")

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});


/** Routing is used to cancel booking orders **/
app.all(modulePath+'get-time-slot-list',checkLoggedInAdmin, (req, res, next) => {
	modelPath.getTimeSlotList(req, res, next);
});

/** Routing is used to get order list **/
app.all(modulePath+":type?",checkLoggedInAdmin,(req, res) => {
    modelPath.getOrdersList(req, res);
});

/** Routing is used to view details **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	modelPath.viewDetails(req, res, next);
});

/** Routing is used to view details **/
app.all(modulePath+"view/update_date_time/:order_id",checkLoggedInAdmin,changeDateTimeValidationRules(), validate, (req, res, next) => {
	modelPath.changeDateTimeOfBooking(req, res, next);
});

/** Routing is used to change status of orders **/
app.all(modulePath+'change_status/:_id/:customer_id/:order_id',checkLoggedInAdmin,changeStatusValidationRules(),validate,(req, res, next) => {
    modelPath.changeStatus(req, res,next);
});

/** Routing is used to accept booking orders **/
app.all(modulePath+'accept-booking/:order_id',checkLoggedInAdmin, acceptOrderValidationRules(), validate,(req, res, next) => {
    modelPath.acceptBookings(req, res,next);
});

/** Routing is used update booking status go to location **/
app.all(modulePath + "update-booking-status-go-to-location/:order_id", checkLoggedInAdmin, (req, res, next) => {
	modelPath.updateBookingStatusGoToLocation(req, res, next);
});
 
/** Routing is used update booking reached on location **/
app.all(modulePath + "update-booking-reached-on-location/:order_id", checkLoggedInAdmin, (req, res, next) => {
	modelPath.reachedOnLocationBooking(req, res, next);
});

/** Routing is used to start booking orders **/
app.all(modulePath+'start-booking/:order_id',checkLoggedInAdmin, (req, res, next) => {
    modelPath.startBooking(req, res,next);
});

/** Routing is used finish booking service **/
app.all(modulePath + "finish-booking-service/:order_id", checkLoggedInAdmin, function (req, res, next) {
	modelPath.FinishBookingService(req, res, next);
}); 


/** Routing is used to complete booking orders **/
app.all(modulePath+'complete-booking/:order_id',checkLoggedInAdmin, (req, res, next) => {
    modelPath.completeBooking(req, res,next);
});

/** Routing is used to refund product amount  **/
app.all(modulePath+'delivered-booking-product/:product_id/:order_id',checkLoggedInAdmin, (req, res, next) => {
    modelPath.deliveredProduct(req, res,next);
});

/** Routing is used to refund product amount  **/
app.all(modulePath+'refund_product_amount/:product_id/:order_id',checkLoggedInAdmin, refundProductAmountValidationRules(), validate,(req, res, next) => {
    modelPath.refundProductAmount(req, res,next);
});


/** Routing is used to cancel booking orders **/
app.all(modulePath+'cancel-booking/:order_id',checkLoggedInAdmin, cancelOrderValidationRules(), validate,(req, res, next) => {
    modelPath.cancelBookings(req, res,next);
});

 /** Routing is used to cancel booking orders **/
app.all(modulePath+'note-booking/:order_id',checkLoggedInAdmin, (req, res, next) => {
    modelPath.noteBookings(req, res,next);
});

