var controllerPath = __dirname + "/controller/api";
var modulePath = "/api/";
var middlewarePath = __dirname + "/middleware/middleware";


global.atob = require("atob");
global.btoa = require("btoa");

/** Set current view folder **/
app.use(modulePath, (req, res, next) => {
	req.rendering.views = __dirname + "/views";
	next();
});


const { authenticateAccess, addReviewValidate, validate } = require(WEBSITE_VALIDATION_FOLDER_PATH + 'default_api_validator.js');
const { registrationValidate, otpValidate, loginValidate, updateProfileValidate, addGiftValidate } = require(WEBSITE_VALIDATION_FOLDER_PATH + 'registration_api_validator.js');
const { addUserAddressValidate } = require(WEBSITE_VALIDATION_FOLDER_PATH + 'user_address_api_validator.js');









/***************************************** Start registration Routing API *****************************************/
/** Routing is used to registration 
{"data": {"email":"rajesh123456@mailinator.com","full_name":"Rajesh Saini","mobile_number":"9638527410","mobile_code":"+966","gender":"1","language":"en", "terms_conditions":"true"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "registration", makeRequest, registrationValidate(), validate, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.userRegistration(req, res, next);
});


/** Routing is used to verify otp
{"data": {"validate_string": "322136ea40dcd48171f0e290d908d52b","otp":"1234", "otp_type":"registration"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "verify_otp", makeRequest, otpValidate(), validate, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.verifyOtp(req, res, next);
});


/** Routing is used for Resend OTP form 
{"data": {"validate_string":"108a2e304c3dccf9aaf487281e361cca", "otp_type": "registration"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "resend_otp", makeRequest, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.resendOtp(req, res, next);
});


/** Routing is used to login user 
{"data": {"slug":"","mobile_number":"9638527410","mobile_code":"+966","user_type" : "customer"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "login", makeRequest, loginValidate(), validate, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.login(req, res, next);
});


/** Routing is used to login user 
{"data": {"slug" : "rajesh-saini"},"device_id":"device_123456789","device_type":"android","device_token":"device_token_123456"}
**/
app.all(modulePath + "logout", makeRequest, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.logOut(req, res, next);
});


/** Routing is used to login user 
{"data": {"slug":"rajesh-saini","email":"rajesh123456@mailinator.com","full_name":"Rajesh Kumar Saini","mobile_number":"9638527410","mobile_code":"+966","gender":"1"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "edit_profile", makeRequest, updateProfileValidate(), validate, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.updateUserProfile(req, res, next);
});



/** Routing is used to update user language
{"data":{"slug" : "customer-lastname", "language" : "en" }, "api_type":"web", "lang":"en", "device_type":"desktop"}
**/
app.all(modulePath + "update-user-language", makeRequest, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.updateUserLanguage(req, res, next);
});



// ------------------------------------------------------------------------------------------------------------------------




/***************************************** End registration Routing API *****************************************/




/***************************************** Start Dashboard Routing API *****************************************/

/**
{"data": {"slug":"rajesh-saini"},"device_id":"","device_type":"","device_token":""}
 */
/** Routing is used to get dashboard **/
app.all(modulePath + "dashboard", makeRequest, function (req, res, next) {
	var dashboardApi = require(__dirname + "/controller/dashboard");
	dashboardApi.dashboard(req, res, next);
});

/***************************************** End Dashboard Routing API *****************************************/


/***************************************** Start Subscription Routing API *****************************************/

/** Routing is used to get subscription list 
{"data": {"slug":"","car_type":"1"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "subscription_list", makeRequest, function (req, res, next) {
	var subscriptionApi = require(__dirname + "/controller/subscription");
	subscriptionApi.getSubscriptionList(req, res, next);
});


/** Routing is used to get subscription detail 
{"data": {"slug":"","subscription_slug":"engine-care-plan"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "subscription_details", makeRequest, function (req, res, next) {
	var subscriptionApi = require(__dirname + "/controller/subscription");
	subscriptionApi.getSubscriptionDetail(req, res, next);
});

/***************************************** End Subscription Routing API *****************************************/



/***************************************** Start Notification Routing API *****************************************/

/** Routing is used get notification list **/

/**
{"data": {"slug":"rajesh-saini"},"device_id":"","device_type":"","device_token":""}
 */
app.all(modulePath + "notification-list", makeRequest, function (req, res, next) {
	var notificationApi = require(__dirname + "/controller/notification");
	notificationApi.getNotificationsList(req, res, next);
});


/** Routing is used get notification list **/

/**
{"data": {"slug":"rajesh-saini"},"device_id":"","device_type":"","device_token":""}
 */

app.all(modulePath + "mark-as-read-all-notification", makeRequest, function (req, res, next) {
	var notificationApi = require(__dirname + "/controller/notification");
	notificationApi.markAsReadAllNotification(req, res, next);
});
/***************************************** End Notification Routing API *****************************************/


/***************************************** Start global settings  Routing API *****************************************/

/** Routing is used to get get global settings 
{"data":{"type":"Social"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "get_global_settings", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getGlobalSettings(req, res, next);
});

/***************************************** End global settings  Routing API *****************************************/




/***************************************** Start CMS page detail  Routing API *****************************************/

/** Routing is used to get page detail 
{"data":{"page_slug":"privacy-policy"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "get_page_details", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getPageDetails(req, res, next);
});

/***************************************** End CMS page detail Routing API *****************************************/





/***************************************** Start Faqs Routing API *****************************************/

/** Routing is used to get faq list 
{"data":{},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "faq_list", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getFAQList(req, res, next);
});

/***************************************** End Faqs Routing API *****************************************/





/***************************************** Start driver Routing API *****************************************/

/** Routing is used to get subscription list **/
app.all(modulePath + "my-subscription-list", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.getMySubscriptionList(req, res, next);
});


/** Routing is used to get subscription detail **/
app.all(modulePath + "my-subscription-detail", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.getMySubscriptionDetail(req, res, next);
});


/** Routing is used to get provider profile
{"data":{"slug" : "service-provider"}, "api_type":"web", "lang":"en", "device_type":"desktop"}
**/
app.all(modulePath + "get-driver-profile", makeRequest, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.getProviderprofile(req, res, next);
});
/***************************************** End driver Routing API *****************************************/



/***************************************** Start User Routing API *****************************************/


/** Routing is used to get customer profile
{"data": {"slug":"rajesh"},"device_id":"","device_type":"","device_token":""}
**/
app.all(modulePath + "get-customer-profile", makeRequest, function (req, res, next) {
	var registrationApi = require(__dirname + "/controller/registration");
	registrationApi.getCustomerProfile(req, res, next);
});











/***************************************** End driver Routing API *****************************************/




/***************************************** Start Payment transaction list Routing API *****************************************/
/** Routing is used to get Payment transaction list **/
app.all(modulePath + "payment-transaction-list", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.getPaymentTransactionList(req, res, next);
});


/** Routing is used to get wallet list**/
app.all(modulePath + "wallet-transaction-logs", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.walletTransactionLogsList(req, res, next);
});


/** Routing is used to add wallet amount **/
app.all(modulePath + "add-wallet-amount", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/order");
	orderBookingApi.addWalletAmount(req, res, next);
});



/***************************************** End Payment transaction list Routing API *****************************************/




/***************************************** End Order Booking Routing API *****************************************/


app.all(modulePath + "get-booking-list", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.getBookingList(req, res, next);
});

/** Routing is used get booking details 

{"data":{"slug":"service-provider", "booking_id":"67aee672862bf82b3501d23a", "is_available":"1"},"api_type":"web","lang_code":"en", "device_type":"desktop"}

{"data":{"slug":"service-provider", "booking_id":"67bda0636d4581dd5d2171d4"},"api_type":"web","lang_code":"en", "device_type":"desktop"}

{"data":{"slug":"amit-pareek",  "booking_id":"67bda0636d4581dd5d2171d4"},"api_type":"web","lang_code":"en","view_country":"IN","device_type":"desktop"}


**/
app.all(modulePath + "get-booking-details", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.getBookingDetails(req, res, next);
});


/** Routing is used to user rating

{"data":{"slug":"service-provider", "booking_id":"67bda0636d4581dd5d2171d4", "rating":"4", "review":"Good Customer" },"api_type":"web","lang_code":"en","device_type":"desktop"}

{"data":{"slug":"amit-pareek", "booking_id":"67bda0636d4581dd5d2171d4", "rating":"5", "review":"Good Service Provider" },"api_type":"web","lang_code":"en","device_type":"desktop"}

**/
app.all(modulePath + "submit-review-rating", makeRequest, addReviewValidate(), validate, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.submitReviewRating(req, res, next);
});

/** Routing is used to update service provider lat long **/
app.all(modulePath + "update-service-provider-lat-long", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.updateServiceProviderLatLong(req, res, next);
});



/////////////////////For User ////////////////////////////////////


app.all(modulePath + "create-booking", makeRequest, function (req, res, next) {
	var orderApi = require(__dirname + "/controller/default");
	orderApi.createBooking(req, res, next);
});


/** Routing is used change booking date-time **/
app.all(modulePath + "cancel-booking", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.cancelBooking(req, res, next);
});


/** Routing is used change booking date-time **/
app.all(modulePath + "change-booking-date-time", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.changeDateTimeOfBooking(req, res, next);
});


/** Routing is used change booking location

{"data":{"slug":"rajesh", "address_id" : "xxxxxxxxxx", "booking_id":"xxxxxxxxxx"}, "api_type":"web", "lang":"en", "device_type":"desktop"}

{"data":{"slug":"rajesh", "user_address" : { "full_name" : "Address Name", "country_name" : "India", "state_name" : "Rajasthan",
"city_name" : "Jaipur", "zip_code" : "302017", "address_line_1" : "shopping center, Plot No 68, Kanwatia Cir",
"address_line_2" : "Sector 01, Ram Nagar, Shastri Nagar", "latitude" : "26.9452092", "longitude" : "75.7973332"}, "booking_id":"xxxxxxxxxx"}, "api_type":"web", "lang":"en", "device_type":"desktop"}

**/
app.all(modulePath + "change-booking-location", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.changeBookingLocation(req, res, next);
});

/** Routing is used get order details **/
app.all(modulePath + "add-note-order-booking", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.addNoteOrderBooking(req, res, next);
});






///////////////// For Driver //////////////////////////////////

/** Routing is used to accept booking **/
app.all(modulePath + "accept-booking", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.acceptBooking(req, res, next);
});


/** Routing is used update booking status go to location **/
app.all(modulePath + "update-booking-status-go-to-location", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.updateBookingStatusGoToLocation(req, res, next);
});


/** Routing is used update booking reached on location **/
app.all(modulePath + "update-booking-reached-on-location", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.reachedOnLocationBooking(req, res, next);
});


/** Routing is used to complete booking **/
app.all(modulePath + "start-booking-service", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.startBookingService(req, res, next);
});


app.all(modulePath + "finish-booking-service-with-image", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.FinishBookingServiceWithImage(req, res, next);
});



/***************************************** Common Routing API *****************************************/

























































/***************************************** Start Blog Routing API *****************************************/

/** Routing is used to get page detail **/
app.all(modulePath + "blog_list", makeRequest, function (req, res, next) {
	var blogApi = require(__dirname + "/controller/blog");
	blogApi.getBlogList(req, res, next);
});


/** Routing is used to get page detail **/
app.all(modulePath + "blog_detail", makeRequest, function (req, res, next) {
	var blogApi = require(__dirname + "/controller/blog");
	blogApi.getBlogDetail(req, res, next);
});


/** Routing is used to get page detail **/
app.all(modulePath + "blog_category_list", makeRequest, function (req, res, next) {
	var blogApi = require(__dirname + "/controller/blog");
	blogApi.getBlogCategory(req, res, next);
});

/***************************************** End Blog Routing API *****************************************/


/***************************************** Start Default Routing API *****************************************/

/** Routing is used to get home page detail 
{"data":{"slug":""},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "home_page_detail", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getHomePageDetails(req, res, next);
});






/** Routing is used to get page detail 
{"data":{"block_slug":"privacy-first"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "get_block_details", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getBlockDetails(req, res, next);
});




/** Routing is used to get slider_list list 
{"data":{},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "slider_list", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getSliderList(req, res, next);
});


/** Routing is used to get popup ads list 
{"data":{},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "popup_ads_list", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getPopupAdsList(req, res, next);
});


/** Routing is used to get area list 
{"data":{},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "area_list", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getAreaList(req, res, next);
});


/** Routing is used to get area list by_lat_long
{"data":{"slug":"","latitude":"26.8415971","longitude":"75.7988198"},"device_id":"iPhone17,2","device_type":"Handset","device_token":"","lang_code":"en"}
**/
app.all(modulePath + "get_area_list_by_lat_long", makeRequest, function (req, res, next) {
	var defaultApi = require(__dirname + "/controller/default");
	defaultApi.getAreaListByLatLong(req, res, next);
});

/***************************************** End Default Routing API *****************************************/




/***************************************** Start Product Routing API *****************************************/

/** Routing is used to get product list 
{"data":{"parent_category": "67d27501eda7adf86adee4b5"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "product_list", makeRequest, function (req, res, next) {
	var productApi = require(__dirname + "/controller/product");
	productApi.getProductList(req, res, next);
});


/** Routing is used to get product detail 
{"data":{"slug": "camera"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "product_details", makeRequest, function (req, res, next) {
	var productApi = require(__dirname + "/controller/product");
	productApi.getProductDetail(req, res, next);
});


/** Routing is used to get category list 
{"data":{},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "get_category_list", makeRequest, function (req, res, next) {
	var productApi = require(__dirname + "/controller/product");
	productApi.getCategoryList(req, res, next);
});

/***************************************** End Product Routing API *****************************************/



/***************************************** Start cart API *****************************************/

/** Routing is used add product To Cart  
{"data":{"slug":"rajesh-saini", "product_id":"67d27ad8ec8ce90262d861e5", "quantity": 1},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "add-to-cart", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.addToCart(req, res, next);
});


/** Routing is used add package To Cart  
{"data":{"slug":"rajesh-saini", "package_id":"67d27a3f0a0d90740ea96c06", "quantity": 1},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "add-package-to-cart", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.addPackageToCart(req, res, next);
});


/** Routing is used add subscription To Cart  
{"data":{"slug":"rajesh-saini", "subscription_id":"67d2794e0a0d90740ea96c03", "quantity": 1},"api_type":"web","lang":"en","device_type":"desktop"}
**/
app.all(modulePath + "add-subscription-to-cart", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.addSubscriptionToCart(req, res, next);
});


/** Routing is used cart list  
{"data":{"slug":"rajesh-saini"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "cart-list", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.getCartList(req, res, next);
});


/** Routing is used empty cart list 
{"data":{"slug":"rajesh-saini"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "empty-cart", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.emptyCart(req, res, next);
});


/** Routing is used remove items from cart  
{"data":{"slug":"rajesh-saini", "product_id": "67d27ad8ec8ce90262d861e5"},"api_type":"web","lang":"en","device_type":"desktop"}
**/
app.all(modulePath + "remove-from-cart", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.removeFromCart(req, res, next);
});


/** Routing is used update Cart  
{"data":{"slug":"rajesh-saini", "product_id":"67d27985ec8ce90262d861e1", "action": "add"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "update-cart-data", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.updateCartData(req, res, next);
});


/** Routing is used apply-promo-code  **/
app.all(modulePath + "apply-promo-code", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.applyPromoCode(req, res, next);
});


/** Routing is used remove-promo-code 
{"data":{"slug":"rajesh-saini"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "remove-promo-code", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.removePromoCode(req, res, next);
});


/** Routing is used promo code list  
{"data":{"slug":"rajesh-saini"},"api_type":"web","lang_code":"en","device_type":"desktop"}
**/
app.all(modulePath + "promo-code-list", makeRequest, function (req, res, next) {
	var cartApi = require(__dirname + "/controller/cart");
	cartApi.getPromoCodeList(req, res, next);
});
/***************************************** End cart API *****************************************/


/***************************************** Start Order Routing API *****************************************/
/** Routing is used save order  

BOOKING FROM PACKAGE or (PACKAGE + PRODUCTS)
{"data":{"slug":"amit-pareek", "address_id":"679b3f0ca9a840ec5a599a39", "booking_date":"2025-03-07", "booking_time":"15:00"},"api_type":"web","lang":"en", "device_type":"desktop"}


BOOKING FROM MY-SUBSCRIPTION  or (MY-SUBSCRIPTION + PRODUCTS)
{"data":{"slug":"amit-pareek", "address_id":"679b3f0ca9a840ec5a599a39", "booking_date":"2025-04-05", "booking_time":"15:00", "my_subscription_id":"67bdafd3d0e204795c32bc30"}, "api_type":"web", "lang":"en", "device_type":"desktop"}


ORDER FOR PRODUCTS ONLY
{"data":{"slug":"amit-pareek", "address_id":"679b3f0ca9a840ec5a599a39" }, "api_type":"web", "lang":"en",  "device_type":"desktop"}


save-order FOR SUBSCRIPTION ONLY
{"data":{"slug":"user-3"},"api_type":"web", "lang":"en",  "device_type":"desktop"}


IF CUSTOMER NOT WANT TO SAVE ADDRESS AND DONT SEND address_id, hE/SHE WILL SEND COMPLETE ADDRESS DETAIL

{"data":{"slug":"rajesh", "user_address" : { "full_name" : "Address Name", "country_name" : "India", "state_name" : "Rajasthan",
"city_name" : "Jaipur", "zip_code" : "302017", "address_line_1" : "shopping center, Plot No 68, Kanwatia Cir",
"address_line_2" : "Sector 01, Ram Nagar, Shastri Nagar", "latitude" : "26.9452092", "longitude" : "75.7973332"}, "booking_date":"2025-04-04", "booking_time":"15:00"}, "api_type":"web", "lang":"en", "device_type":"desktop"}


**/
app.all(modulePath + "save-order", makeRequest, function (req, res, next) {
	var orderApi = require(__dirname + "/controller/order");
	orderApi.saveOrder(req, res, next);
});


/** Routing is used checkout order  
{"data":{"slug":"user-3", "order_number":"PURELY-99", "pay_from_wallet":"1"}, "api_type":"web", "lang":"en",  "device_type":"desktop"}

{"data":{"slug":"user-3", "order_number":"PURELY-128", "payment_gatway_transaction_id":"payment_gatway_transaction_id", "payment_gatway_response":"payment_gatway_response", "payment_gatway_amount":"28140", "payment_gatway_status":"success", "pay_from_pg":"1"},"api_type":"web","lang":"en", "device_type":"desktop"}

{"data":{"slug":"amit-pareek", "order_number":"PURELY-117", "pay_cod":"1"},"api_type":"web","lang":"en", "device_type":"desktop"}

**/
app.all(modulePath + "checkout-order", makeRequest, function (req, res, next) {
	var orderApi = require(__dirname + "/controller/order");
	orderApi.checkoutOrder(req, res, next);
});


/** Routing is used get order list **/
app.all(modulePath + "get-order-list", makeRequest, function (req, res, next) {
	var orderApi = require(__dirname + "/controller/order");
	orderApi.getOrderList(req, res, next);
});


/** Routing is used get order details **/
app.all(modulePath + "get-order-details", makeRequest, function (req, res, next) {
	var orderApi = require(__dirname + "/controller/order");
	orderApi.getOrderDetail(req, res, next);
});

/***************************************** End Order Routing API *****************************************/


/***************************************** Start user Routing API *****************************************/



/** Routing is used to get package list **/
app.all(modulePath + "my-package-list", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.getMyPackageList(req, res, next);
});


/** Routing is used to get package detail **/
app.all(modulePath + "my-package-detail", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.getMyPackageDetail(req, res, next);
});





/** Routing is used to get user points logs list**/
app.all(modulePath + "user-points-logs-list", makeRequest, function (req, res, next) {
	var userApi = require(__dirname + "/controller/user");
	userApi.userPointsLogsList(req, res, next);
});


/** Routing is used to apply organization code **/
app.all(modulePath + "apply-organization-code", makeRequest, function (req, res, next) {
	var organizationCodeApi = require(__dirname + "/controller/user");
	organizationCodeApi.applyOrganizationCode(req, res, next);
});

/***************************************** End user Routing API *****************************************/


/***************************************** Start Order Booking Routing API *****************************************/






/** Routing is used to check available time slot
{"data":{"slug":"mohammed-shafique", "booking_date":"2025-07-05", "area_ids":["67d275f242d8bf882d659b36"], "provider_type":"van_fleet"},"api_type":"web","lang_code":"en","device_type":"desktop"}
 **/
app.all(modulePath + "get-time-slot-list", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.getTimeSlotList(req, res, next);
});




/** Routing is used change service provider booking **/
app.all(modulePath + "cancel-service-provider-booking", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.cancelServiceProviderBooking(req, res, next);
});

/** Routing is used to redeem points **/
app.all(modulePath + "redeem-points", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/orderBooking");
	orderBookingApi.redeemPoints(req, res, next);
});




/** Routing is used to update service provider lat long **/
app.all(modulePath + "upload-images-for-booking", makeRequest, function (req, res, next) {
	var orderBookingApi = require(__dirname + "/controller/order");
	orderBookingApi.uploadImagesForBooking(req, res, next);
});



/**
 *  Function to make request for api
 * */
function makeRequest(req, res, next) {

	var ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress



	if (ip.substr(0, 7) == "::ffff:") {
		ip = ip.substr(7)
	}

	var inputData = (req.body.req) ? req.body.req : "";
	var debugJsonView = (req.body.debug_json_view) ? req.body.debug_json_view : 0;
	var isCrypto = (req.body.is_crypto) ? Number(req.body.is_crypto) : DEACTIVE;
	let apiType = (req.body.api_type) ? req.body.api_type : WEP_API_TYPE;

	var decodedData = false;
	/** Blank validation **/
	if (inputData != '') {

		var decodedData = atob(inputData);
		if (debugJsonView && inputData.indexOf("{") === 0) {
			decodedData = inputData;
		} else {
			/** crypto wise and base64wise conditions **/
			if (isCrypto == ACTIVE && apiType == WEP_API_TYPE) {
				inputData = decryptCrypto(inputData)
			}
			var decodedData = b64DecodeUnicode(inputData);
		}
		var APIData = JSON.parse(decodedData);

		var methodName = (APIData.method_name) ? APIData.method_name : '';

		var device_type = (APIData.device_type) ? APIData.device_type : "";
		var device_id = (APIData.device_id) ? APIData.device_id : "";
		var device_token = (APIData.device_token) ? APIData.device_token : "";
		var lang_code = (APIData.lang_code) ? APIData.lang_code : "";
		req.body = (APIData.data) ? APIData.data : {};
		res.setLocale(lang_code)
		req.setLocale(lang_code)
		/** User slug accourding fetch  data**/

		let slug = (req.body.slug) ? req.body.slug : "";
		let conditionOptions = {}
		//if (slug != "") {
		conditionOptions = {
			conditions: { slug: slug },
		}
		//}

		/** JWT Authentication **/
		let jwtOption = {
			token: (req.headers.authorization) ? req.headers.authorization : "",
			secretKey: JWT_CONFIG.secret,
			slug: (req.body.slug) ? req.body.slug : "",
		}

		//JWTAuthentication(req, res, jwtOption).then(responseData => {
		req.body['debugJsonView'] = debugJsonView;
		// if (responseData.status != STATUS_SUCCESS) {
		// 	let returnResponse = {
		// 		'data': {
		// 			status: STATUS_ERROR,
		// 			message: res.__("admin.system.invalid_access"),
		// 		}
		// 	};
		// 	return returnApiResult(req, res, returnResponse);
		// }

		getUserDetailBySlug(req, res, conditionOptions).then(userDetailResponse => {
			if (userDetailResponse.status == STATUS_SUCCESS) {
				req.user_data = (userDetailResponse.result) ? userDetailResponse.result : {};
			}

			/** By common key use by default send*/
			req.body['request_from'] = REQUEST_FROM_API;
			req.body['is_mobile_verified'] = NOT_VERIFIED;
			req.body['is_email_verified'] = NOT_VERIFIED;
			req.body['api_type'] = apiType;
			req.body['is_crypto'] = isCrypto;
			req.body['device_type'] = device_type;
			req.body['device_id'] = device_id;
			req.body['device_token'] = device_token;
			req.body['method_name'] = methodName;
			req.body['lang_code'] = lang_code;
			return next();
		});
		//})
	} else {

		res.send({
			message: res.__("admin.system.invalid_access"),
			status: STATUS_ERROR,
		});
	}

}
/** Going backwards: from bytestream, to percent-encoding, to original string.*/
b64DecodeUnicode = (str) => {
	return decodeURIComponent(atob(str).split('').map(function (c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));
}


/**
 *  Function to check if admin is accessing the front end website in the same browser
 * */
function authenticateMiddlewareAccess(req, res, next) {
	setTimeout(function () {
		/*** Start authentication functionality **/
		var inputdata = (req.body.req) ? req.body.req : "";

		var decordedData = false;
		if (inputdata != '') {

			var decordedData = atob(inputdata);
			if (inputdata.indexOf("{") === 0) {
				decordedData = inputdata;
			}
			var data = JSON.parse(decordedData);
			method_name = data.method_name;
			slug = (data.data && data.data.slug) ? data.data.slug : "";

		} else {
			let response = {
				status: TOKEN_STATUS_ERROR,
				message: res.__("admin.system.invalid_access")
			}
			let result = JSON.stringify(response);
			let utf8 = require('utf8');
			let myJSON = utf8.encode(result);


			res.send({ response: btoa(myJSON) });
			return false;
		}
		/*** end authentication functionality **/

		var middlewareUser = require(middlewarePath);
		middlewareUser.authenticateAccess(req, res, next, method_name, slug, function (accessPermission) {
			if (accessPermission) {
				return next();
			} else {
				let response = {
					status: TOKEN_STATUS_ERROR,
					message: res.__("admin.system.invalid_access")
				}
				let result = JSON.stringify(response);
				let utf8 = require('utf8');
				let myJSON = utf8.encode(result);


				res.send({ response: btoa(myJSON) });
				return false;
			}
		});
	}, 250);
}
