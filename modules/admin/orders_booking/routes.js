/** Model file path for current plugin **/
var modulePath	= 	"/"+ADMIN_NAME+"/orders_booking/";
const modelPath     =	require(__dirname+"/ordersBookingController");


/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get order list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
    modelPath.getOrdersBookingList(req, res);
});

/** Routing is used to view details **/
app.all(modulePath+"view/:id",checkLoggedInAdmin,(req, res, next) => {
	modelPath.viewBookingDetails(req, res, next);
});


