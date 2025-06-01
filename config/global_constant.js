require("./database_tables");
/** Website root directory path */
WEBSITE_ROOT_PATH = process.env.PWD + "/";

//WEBSITE_FRONT_URL	=	process.env.FRONT_URL + "/";

/** Website Push notification server key for Android devices */
WEBSITE_PN_ANDROID_SERVER_KEY = process.env.ANDROID_SERVER_KEY;
/** Website Header Auth Key for mobile api */
WEBSITE_HEADER_AUTH_KEY = process.env.API_HEADER_AUTH_KEY;

/** Website/Socket Url*/
WEBSITE_URL = process.env.URL + ":" + process.env.PORT + "/";

console.log(WEBSITE_URL);
//WEBSITE_URL			=	process.env.URL+"/";
//WEBSITE_FRONT_URL	=	process.env.URL+":"+process.env.FRONT_PORT+"/";
WEBSITE_FRONT_URL = process.env.URL + "/";
WEBSITE_SOCKET_URL = process.env.URL + ":" + process.env.PORT;
MOBILE_URL = process.env.MOBILE_URL;
/** Front end name **/
FRONT_END_NAME = "/";
/** Admin name **/
ADMIN_NAME = "admin";
/** Front end folder name */
FRONT_END_FOLDER_NAME = "frontend";
/** Admin folder name */
ADMIN_FOLDER_NAME = "admin";

/** Services folder name */
SERVICES_FOLDER_NAME = "services";

/** Classes folder name */
CLASS_FOLDER_NAME = "class";

/** Validation folder name */
VALIDATION_FOLDER_NAME = "validation";

/** Website public directory path */
WEBSITE_PUBLIC_PATH = WEBSITE_URL + "public/";
/** Website public folder path of front end*/
WEBSITE_FILES_URL = WEBSITE_URL + FRONT_END_FOLDER_NAME + "/";
/** Js file path for front pages of website */
WEBSITE_JS_PATH = WEBSITE_FILES_URL + "js/";
/** Css file path for front pages of website*/
WEBSITE_CSS_PATH = WEBSITE_FILES_URL + "css/";
/** Website images directory url */
WEBSITE_IMG_URL = WEBSITE_FILES_URL + "images/";
/** Website public images directory url */
WEBSITE_PUBLIC_IMG_URL = WEBSITE_PUBLIC_PATH + FRONT_END_FOLDER_NAME + "/images/";
/** Website Modules root path */
WEBSITE_MODULES_PATH = WEBSITE_ROOT_PATH + "modules/" + FRONT_END_FOLDER_NAME + "/";
/** Front layout root path */
WEBSITE_LAYOUT_PATH = WEBSITE_ROOT_PATH + "modules/" + FRONT_END_FOLDER_NAME + "/layouts/";

/** Services root path */
WEBSITE_SERVICES_FOLDER_PATH = WEBSITE_ROOT_PATH + "modules/" + SERVICES_FOLDER_NAME + "/";


/** Validation root path */
WEBSITE_VALIDATION_FOLDER_PATH = WEBSITE_ROOT_PATH + "modules/" + VALIDATION_FOLDER_NAME + "/";


WEBSITE_CLASSES_FOLDER_PATH = WEBSITE_ROOT_PATH + "classes";

/** Website public images directory url */
WEBSITE_PUBLIC_NOTIFICATION_IMG_URL = WEBSITE_PUBLIC_IMG_URL + "notification/";



/** Website Admin site Url */
WEBSITE_ADMIN_URL = WEBSITE_URL + ADMIN_NAME + "/";
/** Website public folder path of Admin panel*/
WEBSITE_ADMIN_FILES_URL = WEBSITE_URL + ADMIN_FOLDER_NAME + "/";
/** Js file path for admin pages of website */
WEBSITE_ADMIN_JS_PATH = WEBSITE_ADMIN_FILES_URL + "js/";
/** Js Path for specific pages */
WEBSITE_ADMIN_JS_PAGE_PATH = WEBSITE_ADMIN_JS_PATH + "pages/";
/** Css file path for admin pages of website*/
WEBSITE_ADMIN_CSS_PATH = WEBSITE_ADMIN_FILES_URL + "css/";
/** Website images directory url for admin */
WEBSITE_ADMIN_IMG_URL = WEBSITE_ADMIN_FILES_URL + "images/";
/**Js plugin directory path */
WEBSITE_ADMIN_JS_PLUGIN_PATH = WEBSITE_ADMIN_FILES_URL + "plugins/";
/** Admin Modules root path */
WEBSITE_ADMIN_MODULES_PATH = WEBSITE_ROOT_PATH + "modules/" + ADMIN_FOLDER_NAME + "/";
/** Admin layout root path */
WEBSITE_ADMIN_LAYOUT_PATH = WEBSITE_ROOT_PATH + "modules/" + ADMIN_FOLDER_NAME + "/layouts/";

/** Website public uploads directory path */
WEBSITE_PUBLIC_UPLOADS_PATH = WEBSITE_PUBLIC_PATH + FRONT_END_FOLDER_NAME + "/uploads/";

/** Website upload directory root path */
WEBSITE_UPLOADS_ROOT_PATH = WEBSITE_ROOT_PATH + "public/" + FRONT_END_FOLDER_NAME + "/uploads/";

WEBSITE_PUBLIC_CSV_FILE_FORMATS_UPLOADS_PATH = WEBSITE_PUBLIC_PATH + FRONT_END_FOLDER_NAME + "/uploads/csv_formats/";

FRONT_URL_FOR_SETTINGS = WEBSITE_ROOT_PATH.substr(0, WEBSITE_ROOT_PATH.lastIndexOf("fxbulls-backend/"));
FRONT_TEXT_SETTING_FILE_PATH = "fxbulls-frontend/public/locales/";

/** For User images file directory path and url*/
USERS_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "user/";
USERS_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "user/";

/** For Master images file directory path and url*/
MASTER_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "masters/";
MASTER_FILE_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "masters/";
MASTER_IMAGE_RESOLUTION = "60*60";

/** For CMS images file directory path and url*/
CMS_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "cms/";
CMS_FILE_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "cms/";
CMS_IMAGE_RESOLUTION = "60*60";

/** For ck editor images file directory path and url*/
CK_EDITOR_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "ckeditor/";
CK_EDITOR_IMG_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "ckeditor/";

/** For User images file directory path and url*/
CATEGORY_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "category/";
CATEGORY_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "category/";




/** Define upload image size **/
UPLOAD_FILE_SIZE = 2;

/** Website Admin tooltip images Url */
WEBSITE_ADMIN_TOOLTIP_IMAGE_URL = WEBSITE_PUBLIC_PATH + "admin/images/";

/** Urls of commonly used images */
NO_IMAGE_AVAILABLE = WEBSITE_PUBLIC_UPLOADS_PATH + "no-image.png";
ADD_PROFILE_IMAGE_ICON = WEBSITE_PUBLIC_UPLOADS_PATH + 'user-no-image.png';
DATATABLE_LOADER_IMAGE = WEBSITE_PUBLIC_IMG_URL + "Loading_icon.gif";
IMAGE_FIELD_NAME = "full_image_path";

/** User role ids */
SUPER_ADMIN_ROLE_ID = "5b6bc8111dd6a1219e632b03";
FRONT_ADMIN_ROLE_ID = "5fcb734c0990ad27e022cf67";


/** Text Setting types*/
TEXT_SETTINGS_ADMIN = "admin";
TEXT_SETTINGS_FRONT = "front";

/** Name of text setting types*/
TEXT_SETTINGS_NAME = {};
TEXT_SETTINGS_NAME[TEXT_SETTINGS_ADMIN] = "Admin Text Settings";
TEXT_SETTINGS_NAME[TEXT_SETTINGS_FRONT] = "Front Text Settings";

/** Password length configuration **/
PASSWORD_MIN_LENGTH = 6;
PASSWORD_LENGTH_VALIDATION = {};
PASSWORD_LENGTH_VALIDATION["min"] = PASSWORD_MIN_LENGTH;
PASSWORD_LENGTH = [PASSWORD_LENGTH_VALIDATION];
PASSWORD_VALIDATION_REGULAR_EXPRESSION = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

/** Commonly used status **/
ACTIVE = 1;
DEACTIVE = 0;
VERIFIED = 1;
NOT_VERIFIED = 0;
DELETED = 1;
NOT_DELETED = 0;
NOT_SEEN = 0;
SEEN = 1;
SENT = 1;
NOT_SENT = 0;
SHOWN = 1;
NOT_SHOWN = 0;
NOT_READ = 0;
READ = 1;
APPROVE = 1;
REJECT = 2;

/** Gender type*/
MALE = 1;
FEMALE = 0;

/** Two show only subadmin */
IS_SUBADMIN = 1;

/** Date Formats **/
DATABASE_DATE_TIME_FORMAT = "yyyy-mm-dd HH:MM:ss";	// 2018-01-01 00:00:00
DATATABLE_DATE_TIME_FORMAT = "DD/MM/YYYY hh:mm a";
DATATABLE_DATE_FORMAT = "DD/MM/YYYY";
DATABASE_DATE_FORMAT = "yyyy-mm-dd";
DATE_TIME_FORMAT = "YYYY-MM-DD hh:mm a";
DATEPICKER_DATE_TIME_FORMAT = "DD-MM-YYYY hh:mm a";
DATE_TIME_FORMAT_EXPORT = "dd/mm/yyyy hh:MM TT";

/**Date formats used in datetange picker	 */
SITE_DATE_FORMAT = "YYYY/MM/DD";
DATEPICKER_DATE_FORMAT = "DD/MM/YYYY";
DATEPICKER_START_DATE_FORMAT = "YYYY-MM-DD 00:00:00";
DATEPICKER_END_DATE_FORMAT = "YYYY-MM-DD 23:59:59";
DATE_RANGE_DATE_FORMAT = "YYYY-MM-DD";
DATE_FORMAT = "DD-MM-YYYY";// 31-01-2018

DATE_RANGE_DISPLAY_FORMAT_FOR_START_DATE = "YYYY-MM-DD HH:mm:00";
DATE_RANGE_DISPLAY_FORMAT_FOR_END_DATE = "YYYY-MM-DD HH:mm:59";

/** Default language configurations */
DEFAULT_LANGUAGE_FOLDER_CODE = "en";
DEFAULT_LANGUAGE_CODE = "en";
DEFAULT_LANGUAGE_MONGO_ID = "5a3a13238481824b077b23ca";
HINDI_LANGUAGE_CODE = "hi";
HINDI_LANGUAGE_MONGO_ID = "657afde6c1915608b8254d57";

/** Time zone used in html **/
DEFAULT_TIME_ZONE = process.env.TZ;


/**  NOTIFICATION TYPE */
NOTIFICATION_USER_REGISTER = 1;
NOTIFICATION_FRONT_USER_REGISTER_VERIFY_OTP = 2;
NOTIFICATION_NEW_USER_ADDED_BY_ADMIN = 3;

NOTIFICATION_MESSAGES = {};
NOTIFICATION_MESSAGES[NOTIFICATION_USER_REGISTER] = {
	'title': 'A new user registered with us.',
	'message': '{USER_NAME} registered as Trixxie Taxi.',
	'constants': ['{USER_NAME}', '{USER_TYPE}'],
	'icon_class': 'bg-light-green',
	'icon': 'notifications_active'
};

/** Round precision (default number of decimal digits to round to) **/
ROUND_PRECISION = 2;

CURRENCY_SYMBOL = 'INR';
PERCENT_SYMBOL = '%';


/** Type of Flash messages */
STATUS_SUCCESS = "success";
STATUS_ERROR = "error";
STATUS_ERROR_INVALID_ACCESS = "invalid_access_error";
STATUS_ERROR_FORM_VALIDATION = "form_validation_error";
ATTRIBUTE_ERROR = "attribute_error";

/** Datatable configurations **/
SORT_DESC = -1;
SORT_ASC = 1;
DEFAULT_SKIP = 0;
DEFAULT_LIMIT = 10;
API_DEFAULT_LIMIT = 10;

/** Type Of Export Records **/
EXPORT_ALL = "export_all";
EXPORT_FILTERED = "export_filtered";

/** For status use in redirect page with status (user listing) **/
ACTIVE_INACTIVE_STATUS = "active_inactive";
APPROVE_REJECT_STATUS = "approve_reject";
VERIFIED_STATUS = "verified_user";
PUBLISH_UNPUBLISH_STATUS = "publish_unpublish";

/** Setting input type dropdown **/
SETTING_INPUT_TYPE_DROPDOWN = [
	{
		input_id: "text",
		input_name: "Text"
	},
	{
		input_id: "textarea",
		input_name: "Textarea"
	},
	{
		input_id: "checkbox",
		input_name: "Checkbox"
	},
	{
		input_id: "time",
		input_name: "Time Picker"
	},
	{
		input_id: "select",
		input_name: "Select Box"
	},
];

/** Setting validate type dropdown **/
SETTINGS_VALIDATE_TYPE_DROPDOWN = [
	{
		input_id: "number",
		input_name: "Number"
	},
	{
		input_id: "float",
		input_name: "Float"
	},
	{
		input_id: "start_time",
		input_name: "Start time"
	},
	{
		input_id: "end_time",
		input_name: "End time"
	},
	{
		input_id: "percentage",
		input_name: "Percentage"
	},
];

/** to ignore Case sensitive searching/sorting in mongo collections  **/
COLLATION_VALUE = { locale: "en_US", caseLevel: true };

/** Default number of records to be shown in admin */
ADMIN_LISTING_LIMIT = 10;
FRONT_LISTING_LIMIT = 10;
LATEST_BLOG_LIMIT = 6;
SIMILAR_BLOG_LIMIT = 3;

/** On submit loading text */
ADMIN_LOADING_TEXT = 'data-loading-text=\'<i class="material-icons font-14">save</i> Loading...\'';


/** Not allowed html tags list*/
NOT_ALLOWED_TAGS_XSS = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi];

/** To show error message on top of page **/
ADMIN_GLOBAL_ERROR = "invalid-access";
/** Search status for global section **/
/** For data table data types **/
NUMERIC_FIELD = 'numeric';
OBJECT_ID_FIELD = 'objectId';
EXACT_FIELD = 'exact';

/** Dashboard redirect type **/
TYPE_ACTIVE = "active";
TYPE_DEACTIVE = "deactive";
TYPE_REJECT = "Rejected"

GLOBAL_STATUS_SEARCH_DROPDOWN = {};
GLOBAL_STATUS_SEARCH_DROPDOWN[ACTIVE] = {
	status_name: "Active",
	status_type: TYPE_ACTIVE,
	label_class: "label-success"
};
GLOBAL_STATUS_SEARCH_DROPDOWN[DEACTIVE] = {
	status_name: "Deactive",
	status_type: TYPE_DEACTIVE,
	label_class: "label-danger"
};

ALLOWED_ADMIN_TO_SET_COOKIE = DEACTIVE;

VIDEO_FILES_RESOLUTION = 2;
ALLOWED_VIDEO_SIZE = 150;


/** Upload image configurations*/
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg"];
ALLOWED_IMAGE_ERROR_MESSAGE = "Please select valid file, Valid file extensions are " + ALLOWED_IMAGE_EXTENSIONS.join(", ") + ".";

ALLOWED_IMAGE_MIME_EXTENSIONS = ["image/jpg", "image/jpeg", "image/png", "image/svg", "image/svg+xml"];
ALLOWED_IMAGE_MIME_ERROR_MESSAGE = "Please select valid mime type, Valid mime types are " + ALLOWED_IMAGE_MIME_EXTENSIONS.join(", ") + ".";

/** Upload Video Configuration */
// ALLOWED_VIDEO_EXTENSIONS 			= ["mp4", "mov"] ;
ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "gif", "webm", "below size " + ALLOWED_VIDEO_SIZE + " MB"];
ALLOWED_VIDEO_ERROR_MESSAGE = "Please select valid video. Valid video extensions are " + ALLOWED_VIDEO_EXTENSIONS.join(", ") + ".";

// ALLOWED_VIDEO_MIME_EXTENSIONS 		= ["video/mp4", "video/quicktime" ];
ALLOWED_VIDEO_MIME_EXTENSIONS = ["video/mp4", "application/x-mpegURL", "video/MP2T", "video/3gpp", "video/quicktime", "video/x-ms-wmv", "video/x-ms-asf", "video/x-flv", "image/gif", "video/x-msvideo", "video/webm", "video/mpeg", "application/octet-stream", "video/x-m4v"];
ALLOWED_VIDEO_MIME_ERROR_MESSAGE = "Please select valid video mime type, Valid video mime types are " + ALLOWED_VIDEO_MIME_EXTENSIONS.join(", ") + ".";


ALLOWED_CMS_CONTENT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg"];
ALLOWED_CMS_CONTENT_IMAGE_ERROR_MESSAGE = "Please select valid file, Valid file extensions are " + ALLOWED_CMS_CONTENT_IMAGE_EXTENSIONS.join(", ") + ".";

ALLOWED_CMS_CONTENT_IMAGE_MIME_EXTENSIONS = ["image/jpg", "image/jpeg", "image/png", "image/svg", "image/svg+xml"];
ALLOWED_CMS_CONTENT_IMAGE_MIME_ERROR_MESSAGE = "Please select valid mime type, Valid mime types are " + ALLOWED_CMS_CONTENT_IMAGE_MIME_EXTENSIONS.join(", ") + ".";

/** Upload document configurations*/
ALLOWED_DOCUMENT_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "xls", "xlsx", "csv"];

ALLOWED_DOCUMENT_ERROR_MESSAGE = "Please select valid file, Valid file extensions are " + ALLOWED_DOCUMENT_EXTENSIONS.join(", ") + ".";
ALLOWED_DOCUMENT_MIME_EXTENSIONS = ["image/jpg", "image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];
ALLOWED_DOCUMENT_MIME_ERROR_MESSAGE = "Please select valid mime type, Valid mime types are " + ALLOWED_DOCUMENT_MIME_EXTENSIONS.join(", ") + ".";

/** Default country code */
DEFAULT_COUNTRY_CODE = "+91";
DEFAULT_COUNTRY_ID = "5b56b1aff190ae08d94474cd";

COUNTRY_STATE_CITY_URL = WEBSITE_URL + ADMIN_NAME + "/country_state_city";
TIME_URL = WEBSITE_URL + ADMIN_NAME + "/orders";
 
MONGO_ID = "5dad3d84af37c90e342c450b";
ADMIN_ID = "5f7c0fbdced1c84625f4c52b";
REQUEST_FROM_ADMIN = "admin";
REQUEST_FROM_API = "api";

WEP_API_TYPE = "web";
MOBILE_API_TYPE = "mobile";
ADMIN_API_TYPE = "admin";

/** settings input value required and editable status **/
REQUIRED = 1;
EDITABLE = 1;



/** blocked type*/
BLOCK = 1;
UN_BLOCK = 0;

BLOCK_DROPDOWN = {};
BLOCK_DROPDOWN[BLOCK] = "Block";
BLOCK_DROPDOWN[UN_BLOCK] = "Un-Block";

BLOCK_TYPE_DROP_DOWN = [
	{
		status_id: BLOCK,
		status_name: BLOCK_DROPDOWN[BLOCK]
	},
	{
		status_id: UN_BLOCK,
		status_name: BLOCK_DROPDOWN[UN_BLOCK]
	},
];

/** Max character allwoed length */
MAX_CHARACTER_ALLOWED_IN_LISTING = 100;

/** User Type **/
CUSTOMER_USER_TYPE = "customer";
SERVICE_PROVIDER_USER_TYPE = "service-provider";
FRNCHIES_USER_TYPE = "franchise";

USER_TYPE = {};
USER_TYPE[CUSTOMER_USER_TYPE] = "Customer";
USER_TYPE[SERVICE_PROVIDER_USER_TYPE] = "Service Provider";


ACTIVE_DEACTIVE_DROPDOWN = [
	{
		status_id: ACTIVE,
		status_name: "admin.system.active"
	},
	{
		status_id: DEACTIVE,
		status_name: "admin.system.deactive"
	}
]

DATABLE_EN_CDN = "https://cdn.datatables.net/plug-ins/1.13.7/i18n/en-GB.json";
DATABLE_AR_CDN = "https://cdn.datatables.net/plug-ins/1.13.7/i18n/ar.json";
DATABLE_LANG_CDN = DATABLE_EN_CDN;

/** Not allowed characters in regular expresssion **/
NOT_ALLOWED_CHARACTERS_FOR_REGEX = ['(', ')', '+', '*', '?', '[', ']'];


SEARCHING_ACTIVE = 1;
SEARCHING_DEACTIVE = 2;

/** Promo code status*/
PROMO_CODE_UNPUBLISHED = 0;
PROMO_CODE_PUBLISHED = 1;
PROMO_CODE_EXPIRED = 2;
PROMO_CODE_EXHAUSTED = 3;


/** Promo code publish Object **/
PROMO_CODE_STATUS_DROPDOWN = {};
PROMO_CODE_STATUS_DROPDOWN[PROMO_CODE_PUBLISHED] = {
	"title": "Published",
	"label_class": "label-success",
};
PROMO_CODE_STATUS_DROPDOWN[PROMO_CODE_UNPUBLISHED] = {
	"title": "Unpublished",
	"label_class": "label-warning",
};

/** Search status **/
PROMO_CODE_STATUS_SEARCH_DROPDOWN = [
	{
		status_id: SEARCHING_ACTIVE,
		status_name: "Published",
		status_type: TYPE_ACTIVE
	},
	{
		status_id: SEARCHING_DEACTIVE,
		status_name: "Unpublished",
		status_type: TYPE_DEACTIVE
	},

];


/** Types of promocode*/
PERCENT_OF_AMOUNT = "percentage";
FLAT_AMOUNT = "flat_amount";

/** Promocode discount type*/
PROMO_DISCOUNT_TYPE = {};
PROMO_DISCOUNT_TYPE[PERCENT_OF_AMOUNT] = "Percentage";
PROMO_DISCOUNT_TYPE[FLAT_AMOUNT] = "Fixed Amount";


PROMO_DISCOUNT_TYPE_DROPDOWN = [
	{
		id: PERCENT_OF_AMOUNT,
		name: "Percentage",
	}, {
		id: FLAT_AMOUNT,
		name: "Fixed Amount",
	},
]


/** Promocode Validity Type**/
PROMO_PERMANENT_VALIDITY_TYPE = "permanent";
PROMO_CUSTOM_VALIDITY_TYPE = "custom";

/** Promocode Validity type*/
PROMO_VALIDITY_TYPE = {};
PROMO_VALIDITY_TYPE[PROMO_PERMANENT_VALIDITY_TYPE] = "Permanent";
PROMO_VALIDITY_TYPE[PROMO_CUSTOM_VALIDITY_TYPE] = "Custom";

/** Promo code user selted global*/
PROMO_CODE_ALL_USER = 'all_user';
PROMO_CODE_SELECTED_USER = 'selected_user';

PROMO_CODE_FOR_ORDER = "order_amount";
PROMO_CODE_FOR_SHIPPING = "shipping_amount";

/** Search status for global (master) **/
GLOBAL_STATUS_SEARCH_DROPDOWN_NEW = [
	{
		status_id: ACTIVE,
		status_name: "Active",
		label_class: "label-success",
		status_type: TYPE_ACTIVE
	},
	{
		status_id: DEACTIVE,
		status_name: "Deactive",
		label_class: "label-danger",
		status_type: TYPE_DEACTIVE
	}
];

BLOG_PAGE_STATUS = [
	{
		id: ACTIVE,
		text: "Published",
		status_type: ACTIVE
	},
	{
		id: DEACTIVE,
		text: "Unpublished",
		status_type: DEACTIVE
	}
];

/**Notificaiton dispaly limit in admin header */
ADMIN_HEADER_NOTIFICATION_DISPLAY_LIMIT = 5;
TESTIMONIAL_DESCRIPTION_MIN_LENGTH = 10;
TESTIMONIAL_DESCRIPTION_MAX_LENGTH = 250;

/** For slider file directory path and url*/
SLIDER_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "sliders/";
SLIDERS_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "sliders/";

/** For slider file directory path and url*/
POPUP_ADS_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "popup_ads/";
POPUP_ADS_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "popup_ads/";



/*** JWT Configuration **/
JWT_CONFIG = {
	"secret": "some-secret-shit-goes-here",
	"refreshTokenSecret": "some-secret-refresh-token-shit",
	"port": 3000,
	"tokenLife": 30072000,
	"refreshTokenLife": 30072000
}

/**encrypt deccrypt API key for crypto**/
CRYPTO_ENCRYPT_DECRYPT_API_KEY = "123456$#@$^@1ERF123456$#@$^@1ERF";
CRYPTO_ENCRYPT_DECRYPT_API_IV = "123456$#@$^@1ERF";
JWT_ENCRYPT_DECRYPT_API_KEY = "123456$#@$^@1ERF";

/** Random string for coupons*/
RANDOM_STRING_VALUE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
RANDOM_STRING_LENGTH = "5";

WEB_API_TYPE = "web";
MOBILE_API_TYPE = "mobile";
ADMIN_API_TYPE = "admin";

/** For cms file directory path and url*/
CMS_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "cms/";
CMS_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "cms/";




/** Action to update cart data **/
CART_ADD = 'add';
CART_REMOVE = 'remove';

/**Payment status */
PAYMENT_FAIL = 2;
PAYMENT_PAID = 1;
PAYMENT_PARTIAL = 3;
PAYMENT_UNPAID = 0;
PAYMENT_PREPAID = 4;

PAYMENT_STATUS_DROPDOWN = [
	{
		key: PAYMENT_UNPAID,
		value: "admin.system.payment_unpaid"
	},
	{
		key: PAYMENT_PAID,
		value: "admin.system.payment_paid"
	},
	{
		key: PAYMENT_FAIL,
		value: "admin.system.payment_failed"
	},
	{
		key: PAYMENT_PARTIAL,
		value: "admin.system.payment_partial"
	},
	{
		key: PAYMENT_PREPAID,
		value: "admin.system.payment_prepaid"
	},
];

/**order status */
ORDER_IN_PANDING = 0;
ORDER_PLACED = 1;

ORDER_STATUS_DROPDOWN = [
	{
		key: ORDER_IN_PANDING,
		value: "admin.system.pending"
	},
	{
		key: ORDER_PLACED,
		value: "admin.system.placed"
	},
]

/*** Order Item status **/
ITEM_PLACED = 1;

/** Coupon Discount Type */
COUPON_DISCOUNT_TYPE_PERCENT = 'percent';
COUPON_DISCOUNT_TYPE_FIX = 'fix';
COUPON_DISCOUNT_TYPE_DROPDOWN = [
	{
		coupon_id: COUPON_DISCOUNT_TYPE_PERCENT,
		coupon_name: 'admin.coupon_discount_type.percent'
	},
	{
		coupon_id: COUPON_DISCOUNT_TYPE_FIX,
		coupon_name: 'admin.coupon_discount_type.fix'
	}
]

/** Coupon Type */
COUPON_TYPE_FREE_SHIPPING = 'free-shipping';
COUPON_TYPE_USER_SPECIFIC = 'user-specific';
COUPON_TYPE_DROPDOWN = [
	{
		coupon_id: COUPON_TYPE_FREE_SHIPPING,
		coupon_name: 'admin.coupon_type.free_shipping'
	},
	{
		coupon_id: COUPON_TYPE_USER_SPECIFIC,
		coupon_name: 'admin.coupon_type.user_specific'
	}
]

/** For system image file directory path and url*/
SYSTEM_IMAGE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "system_image/";
SYSTEM_IMAGE_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "system_image/";

/** For cms file directory path and url*/
CMS_CONTENT_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "cms_content/";
CMS_CONTENT_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "cms_content/";


IMAGE_LEFT_ALIGN = "left";
IMAGE_RIGHT_ALIGN = "right";

FEATURE_CONTENT_LENGTH = 3;

OTP_EXPIRE_TIME = 600;


OTP_TYPE_LOGIN = "login";
OTP_TYPE_REGISTRATION = "registration";
OTP_TYPE_PROFILE_UPDATE = "profile_update";

PAYMENT_BY_PAYMENT_GATEWAY = 'Payment Gateway';
PAYMENT_BY_WALLET = 'Wallet';
PAYMENT_BY_COD = 'COD';
PAYMENT_BY_APPLE_PAY = 'Apple Pay';

AMOUNT_CREDIT = "credit";
AMOUNT_DEBIT = "debit";

AMOUNT_TYPE_DROPDOWN = {}
AMOUNT_TYPE_DROPDOWN[AMOUNT_CREDIT] = 'Credit'
AMOUNT_TYPE_DROPDOWN[AMOUNT_DEBIT] = 'Debit'

ALL_TYPE = "all";

/**  NOTIFICATION TYPE */
NOTIFICATION_TO_SEND_GIFT = 101;
NOTIFICATION_TO_RECEIVE_GIFT = 102;
NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME = 103;
NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION = 104;
NOTIFICATION_TO_USER_CANCEL_BOOKING = 105;
NOTIFICATION_TO_USER_ACCEPT_BOOKING = 106;
NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING = 107;
NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING = 108;
NOTIFICATION_TO_USER_START_BOOKING = 109;
NOTIFICATION_TO_USER_FINISH_BOOKING = 110;
NOTIFICATION_TO_USER_CONFIRM_BOOKING = 111;
NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET = 112;
NOTIFICATION_TO_USER_DELIVERED_PRODUCT = 15;
NOTIFICATION_USER_REGISTER = 1;
NOTIFICATION_TO_USER_SAVE_ORDER = 2;
NOTIFICATION_TO_USER_COMPLETE_BOOKING = 10;
NOTIFICATION_TO_USER_CASH_RECEIVED_BOOKING = 11;
NOTIFICATION_TO_USER_FOR_ADMIN_ADD_POINT = 113;
NOTIFICATION_TO_USER_FOR_ADMIN_DEDUCT_POINT = 114;
NOTIFICATION_TO_USER_FOR_ADMIN_ADD_WALLET_AMOUNT = 115;
NOTIFICATION_TO_USER_FOR_ADMIN_CHANGE_WALLET_STATUS = 116;
NOTIFICATION_TO_USER_FOR_ADMIN_REFUND_PRODUCT_AMOUNT = 117;
NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING = 120;
NOTIFICATION_TO_USER_POINTS_EARNED	=	118;
NOTIFICATION_TO_USER_POINTS_REDEEM	=	119;

NOTIFICATION_TO_CUSTOM_NOTIFICATION = 1000;
NOTIFICATION_TO_CUSTOM_IMAGE = "custom_notification.png";


NOTIFICATION_IMAGE_DROPDOWN = [
	{
		key: NOTIFICATION_TO_SEND_GIFT,
		value: "send_gift.png"
	},
	{
		key: NOTIFICATION_TO_RECEIVE_GIFT,
		value: "receive_gift.png"
	},
	{
		key: NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
		value: "change_booking_date.png"
	},
	{
		key: NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
		value: "change_booking_location.png"
	},
	{
		key: NOTIFICATION_TO_USER_CANCEL_BOOKING,
		value: "cencel_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_ACCEPT_BOOKING,
		value: "accept_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
		value: "go_to_location.png"
	},
	{
		key: NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
		value: "reached_location.png"
	},
	{
		key: NOTIFICATION_TO_USER_START_BOOKING,
		value: "start_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_FINISH_BOOKING,
		value: "finish_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_CONFIRM_BOOKING,
		value: "confirm_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET,
		value: "order_from_wallet.png"
	},
	{
		key: NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
		value: "delivered_product.png"
	},
	{
		key: NOTIFICATION_USER_REGISTER,
		value: "user.png"
	},
	{
		key: NOTIFICATION_TO_USER_SAVE_ORDER,
		value: "save_order.png"
	},
	{
		key: NOTIFICATION_TO_USER_COMPLETE_BOOKING,
		value: "completing_booking.png"
	},
	{
		key: NOTIFICATION_TO_USER_CASH_RECEIVED_BOOKING,
		value: "cash_receive.png"
	},
	{
		key: NOTIFICATION_TO_USER_FOR_ADMIN_ADD_POINT,
		value: "add_point.png"
	},
	{
		key: NOTIFICATION_TO_USER_FOR_ADMIN_DEDUCT_POINT,
		value: "deduct_point.png"
	},
	{
		key: NOTIFICATION_TO_USER_FOR_ADMIN_ADD_WALLET_AMOUNT,
		value: "add_point.png"
	},
	{
		key: NOTIFICATION_TO_USER_FOR_ADMIN_CHANGE_WALLET_STATUS,
		value: "change_wallet_status.png"
	},
	{
		key: NOTIFICATION_TO_USER_FOR_ADMIN_REFUND_PRODUCT_AMOUNT,
		value: "refund_product.png"
	},
]



/**  PUSH NOTIFICATION TYPE */

PUSH_NOTIFICATION_TO_USER_COMPLETE_BOOKING = 10;
PUSH_NOTIFICATION_TO_USER_CASH_RECEIVED_BOOKING = 11;
PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT = 15;
PUSH_NOTIFICATION_TO_SEND_GIFT = 101;
PUSH_NOTIFICATION_TO_RECEIVE_GIFT = 102;
PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME = 103;
PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION = 104;
PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING = 105;
PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING = 106;
PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING = 107;
PUSH_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING = 108;
PUSH_NOTIFICATION_TO_USER_START_BOOKING = 109;
PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING = 110;
PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING = 111;
PUSH_NOTIFICATION_TO_USER_CHECKOUT_ORDER_FROM_WALLET = 112;
PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_ADD_POINT = 113;
PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_DEDUCT_POINT = 114;
PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_ADD_WALLET_AMOUNT = 115;
PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_CHANGE_WALLET_STATUS = 116;
PUSH_NOTIFICATION_TO_USER_FOR_ADMIN_REFUND_PRODUCT_AMOUNT = 117;
PUSH_NOTIFICATION_TO_SERVICE_PROVIDER_NEW_BOOKING = 118;
 
PUSH_NOTIFICATION_TO_USER_POINTS_EARNED	=	121;
PUSH_NOTIFICATION_TO_USER_POINTS_REDEEM	=	122;




PUSH_NOTIFICATION_CUSTOM_NOTIFICATION = 1000;


/**  FRANCHISE NOTIFICATION TYPE */
FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME = 201;
FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION = 202;
FRANCHISE_NOTIFICATION_TO_USER_CANCEL_BOOKING = 203;
FRANCHISE_NOTIFICATION_TO_USER_ACCEPT_BOOKING = 204;
FRANCHISE_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING = 205;
FRANCHISE_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING = 206;
FRANCHISE_NOTIFICATION_TO_USER_START_BOOKING = 207;
FRANCHISE_NOTIFICATION_TO_USER_FINISH_BOOKING = 208;
FRANCHISE_NOTIFICATION_TO_USER_CONFIRM_BOOKING = 209;
FRANCHISE_NOTIFICATION_TO_USER_DELIVERED_PRODUCT = 210;
FRANCHISE_NOTIFICATION_TO_USER_COMPLETE_BOOKING = 211;


/**  FRANCHISE PUCH NOTIFICATION TYPE */
FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME = 201;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION = 202;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_CANCEL_BOOKING = 203;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_ACCEPT_BOOKING = 204;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING = 205;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING = 206;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_START_BOOKING = 207;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_FINISH_BOOKING = 208;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_CONFIRM_BOOKING = 209;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_DELIVERED_PRODUCT = 210;
FRANCHISE_PUSH_NOTIFICATION_TO_USER_COMPLETE_BOOKING = 111;


FRANCHISE_NOTIFICATION_IMAGE_DROPDOWN = [
	
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_DATE_TIME,
		value: "change_booking_date.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_CHANGE_BOOKING_LOCATION,
		value: "change_booking_location.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_CANCEL_BOOKING,
		value: "cencel_booking.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_ACCEPT_BOOKING,
		value: "accept_booking.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_GO_TO_LOCATION_BOOKING,
		value: "go_to_location.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_REACHED_ON_LOCATION_BOOKING,
		value: "reached_location.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_START_BOOKING,
		value: "start_booking.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_FINISH_BOOKING,
		value: "finish_booking.png"
	},
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_CONFIRM_BOOKING,
		value: "confirm_booking.png"
	},	
	{
		key: FRANCHISE_NOTIFICATION_TO_USER_DELIVERED_PRODUCT,
		value: "delivered_product.png"
	},
		{
		key: FRANCHISE_NOTIFICATION_TO_USER_COMPLETE_BOOKING,
		value: "completing_booking.png"
	},		
]



















COIN_VALUE = 50;



WEEK_DAYS_DROPDOWN = [
	{
		key: '0',
		value: "Sunday"
	},
	{
		key: '1',
		value: "Monday"
	},
	{
		key: '2',
		value: "Tuesday"
	},
	{
		key: '3',
		value: "Wednesday"
	},
	{
		key: '4',
		value: "Thursday"
	},
	{
		key: '5',
		value: "Friday"
	},
	{
		key: '6',
		value: "Saturday"
	},

];


ONE_TIME_USE = "one-time-use";
FIRST_BOOKING_ONLY = "first-booking-only";

CUPON_TYPE_DROPDOWN = [
	{
		coupon_id: ONE_TIME_USE,
		coupon_name: "admin.coupon_type.one_time_use"
	},
	{
		coupon_id: FIRST_BOOKING_ONLY,
		coupon_name: "admin.coupon_type.first_booking_only"
	},

];



PRODUCT_REVIEW = "product";
USER_REVIEW = "user";

PRODUCT_USER_REVIEW_DROPDOWN = [
	{
		status_id: PRODUCT_REVIEW,
		status_name: "admin.rating.product"
	},
	{
		status_id: USER_REVIEW,
		status_name: "admin.rating.user"
	}
]


/** For franchise contract status*/
GIFT_TRANSACTION = 1;
PAY_FOR_ORDER_BOOKING = 2;
ORDER_ITEM_REFUND = 3;
REDEEM_POINS = 4;
ADDED_BY_ADMIN = 5;
REFUND_FOR_CANCEL_ORDER = 6;
ADDED_BY_USER = 7;

WALLET_TRANSACTION_TYPES_DROPDOWN = [
	{
		status_id: GIFT_TRANSACTION,
		status_name: "admin.system.gift_transaction"
	},
	{
		status_id: PAY_FOR_ORDER_BOOKING,
		status_name: "admin.system.pay_for_order_booking"
	},
	{
		status_id: ORDER_ITEM_REFUND,
		status_name: "admin.system.order_item_refund"
	},
	{
		status_id: REDEEM_POINS,
		status_name: "admin.system.redeem_points"
	},
	{
		status_id: ADDED_BY_ADMIN,
		status_name: "admin.system.added_by_admin"
	},
	{
		status_id: REFUND_FOR_CANCEL_ORDER,
		status_name: "admin.system.refund_for_cancel_order"
	},
	{
		status_id: ADDED_BY_USER,
		status_name: "admin.system.added_by_user"
	}
]

SIX_DIGIT_OTP = 6;
FOUR_DIGIT_OTP = 4;

EARNED_BY_ORDER = 1;
EARNED_BY_REFERRAL = 2;
EARNED_BY_LOYALTY = 3;
REDEEMED = 4;
POINT_ADDED_BY_ADMINISTRATOR = 5;

POINT_TRANSACTION_REASON_DROPDOWN = [
	{
		key: EARNED_BY_ORDER,
		value: 'admin.points.earned_by_order',
	},
	
	/*
	{
		key: EARNED_BY_REFERRAL,
		value: 'admin.points.earned_by_referral',
	},
	{
		key: EARNED_BY_LOYALTY,
		value: 'admin.points.earned_by_loyalty',
	},
	*/
	{
		key: REDEEMED,
		value: 'admin.points.redeemed',
	},
	{
		key: POINT_ADDED_BY_ADMINISTRATOR,
		value: 'admin.points.added_deducted_by_administrator',
	},
]

POINT_TYPE_EARNED = 'earned';
POINT_TYPE_DEDUCT = 'deducted';
POINT_TYPE_REDEEM = 'redeem';

POINT_TYPE_DROPDOWN = {}
POINT_TYPE_DROPDOWN[POINT_TYPE_EARNED] = 'Earned';
POINT_TYPE_DROPDOWN[POINT_TYPE_DEDUCT] = 'Deducted';
POINT_TYPE_DROPDOWN[POINT_TYPE_REDEEM] = 'Redeemed';

/** Push notification user type **/
CUSTOMER_USER_TYPE = "customer";
SERVICE_PROVIDER_USER_TYPE = "service-provider";
FRNCHIES_USER_TYPE = "franchise";


PUSH_NOTIFICATION_USER_TYPE_DROPDOWN = [
	{
		id: CUSTOMER_USER_TYPE,
		name: "Customer",
	},
	{
		id: SERVICE_PROVIDER_USER_TYPE,
		name: "Service Provider",
	},
	
];


/**Display Frequency */
ONCE_PER_USER = 1;
EVERY_TIME_THE_APP_IS_CLOSED = 2;
ONCE_EVERY_24_HOURS = 3;

DISPLAY_FREQUENCY_DROPDOWN = [
	{
		key: ONCE_PER_USER,
		value: "admin.system.once_per_user"
	},
	{
		key: EVERY_TIME_THE_APP_IS_CLOSED,
		value: "admin.system.every_time_the_app_is_closed"
	},
	{
		key: ONCE_EVERY_24_HOURS,
		value: "admin.system.once_every_24_hours"
	},
];

/**Display Frequency */
ONCE_PER_USER = 1;
EVERY_TIME_THE_APP_IS_CLOSED = 2;
ONCE_EVERY_24_HOURS = 3;

DISPLAY_FREQUENCY_DROPDOWN = [
	{
		key: ONCE_PER_USER,
		value: "admin.system.once_per_user"
	},
	{
		key: EVERY_TIME_THE_APP_IS_CLOSED,
		value: "admin.system.every_time_the_app_is_closed"
	},
	{
		key: ONCE_EVERY_24_HOURS,
		value: "admin.system.once_every_24_hours"
	},
];

/** Broadcasts Type */
BROADCASTS_TYPE_ALL = "all";
BROADCASTS_TYPE_NEW_USERS = "new_users";
BROADCASTS_TYPE_FIRST_TIME_USERS = "first_time_users";
BROADCASTS_TYPE_ACTIVE_USERS = "active_users";
BROADCASTS_TYPE_LOYAL_USERS = "loyal_users";
BROADCASTS_TYPE_INACTIVE_USERS = "inactive_users";


BROADCASTS_TYPE_DROPDOWN = [
	{
		type_id: BROADCASTS_TYPE_ALL,
		type_value: 'admin.broadcasts.all'
	},
	{
		type_id: BROADCASTS_TYPE_NEW_USERS,
		type_value: 'admin.broadcasts.new_users'
	},
	{
		type_id: BROADCASTS_TYPE_FIRST_TIME_USERS,
		type_value: 'admin.broadcasts.first_time_users'
	},
	{
		type_id: BROADCASTS_TYPE_ACTIVE_USERS,
		type_value: 'admin.broadcasts.active_users'
	},
	{
		type_id: BROADCASTS_TYPE_LOYAL_USERS,
		type_value: 'admin.broadcasts.loyal_users'
	},
	{
		type_id: BROADCASTS_TYPE_INACTIVE_USERS,
		type_value: 'admin.broadcasts.inactive_users'
	},
]

SCHEDULE_TYPE_IMMEDIATELY = "immediately";
SCHEDULE_TYPE_SCHEDULE_NOTICE = "schedule_notification";

SCHEDULE_TYPE_DROPDOWN = [
	{
		type_id: SCHEDULE_TYPE_IMMEDIATELY,
		type_value: 'admin.broadcasts.send_immediately'
	},
	{
		type_id: SCHEDULE_TYPE_SCHEDULE_NOTICE,
		type_value: 'admin.broadcasts.schedule_notification'
	},	
]


NOTIFICATION_TYPE_WEB_NOTIFICATION = "web_notification";
NOTIFICATION_TYPE_PUSH_NOTIFICATION = "push_notification";

NOTIFICATION_TYPE_DROPDOWN = [
	{
		type_id: NOTIFICATION_TYPE_WEB_NOTIFICATION,
		type_value: 'admin.broadcasts.web_notification'
	},
	{
		type_id: NOTIFICATION_TYPE_PUSH_NOTIFICATION,
		type_value: 'admin.broadcasts.push_notification'
	},	
]






// ==================================================================================


/** For blog record image file directory path and url*/
BLOG_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "blog/";
BLOG_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "blog/";

/** For Product images file directory path and url*/
PRODUCT_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "products/";
PRODUCT_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "products/";

/** For blog record image file directory path and url*/
EVENT_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "event/";
EVENT_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "event/";


/** For Product images file directory path and url*/
PACKAGE_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "packages/";
PACKAGE_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "packages/";

/** For Subscription images file directory path and url*/
SUBSCRIPTION_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "subscriptions/";
SUBSCRIPTION_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "subscriptions/";

/** For franchise contract file directory path and url*/
FRANCHISE_CONTRACT_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "franchise_contract/";
FRANCHISE_CONTRACT_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "franchise_contract/";

/** For email notification images file directory path and url*/
EMAIL_NOTIFICATION_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "email_notification/";
EMAIL_NOTIFICATION_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "email_notification/";


/** For custon notification images file directory path and url*/
CUSTOM_NOTIFICATION_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "custon_notification/";
CUSTOM_NOTIFICATION_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "custon_notification/";



/** For testimonial file directory path and url*/
TESTIMONIAL_FILE_PATH = WEBSITE_UPLOADS_ROOT_PATH + "testimonial/";
TESTIMONIAL_URL = WEBSITE_PUBLIC_UPLOADS_PATH + "testimonial/";

/** Car type dropdown **/
CAR_TYPE_DROPDOWN = [
	{
		key: 1,
		value: "Small Car"
	},
	{
		key: 2,
		value: "Medium Car"
	},
	{
		key: 3,
		value: "Big Car"
	},
];

/** Duration type dropdown **/
DURATION_TYPE_DROPDOWN = [
	{
		key: 1,
		value: "30 Minutes"
	},
	{
		key: 2,
		value: "1 Hours"
	},
	{
		key: 3,
		value: "2 Hours"
	},
	{
		key: 4,
		value: "3 Hours"
	},
];



BOOKING_STATUS_NEW = 0;
BOOKING_STATUS_ACCEPTED = 1;
BOOKING_STATUS_GO_TO_LOCATION = 2;
BOOKING_STATUS_REACHED_LOCATION = 3;
BOOKING_STATUS_SERVICE_STARTED = 4;
BOOKING_STATUS_SERVICE_FINISHED = 5;
BOOKING_STATUS_COMPLETED = 6;
BOOKING_STATUS_CANCELLED = 7;

FOR_SERVICE_PROVIDERS_MY_BOOKING_STATUS = [
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_GO_TO_LOCATION,
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED,
	BOOKING_STATUS_SERVICE_FINISHED,
	BOOKING_STATUS_COMPLETED
];

FOR_CUSTOMER_CANCEL_BOOKING_STATUS = [
	BOOKING_STATUS_NEW,
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_GO_TO_LOCATION
];

FOR_SERVICE_PROVIDER_CANCEL_BOOKING_STATUS = [
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_GO_TO_LOCATION,
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED
];

FOR_ADMIN_CANCEL_BOOKING_STATUS = [
	BOOKING_STATUS_NEW,
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_GO_TO_LOCATION,
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED
];

FOR_START_BOOKING_STATUS = [
	BOOKING_STATUS_REACHED_LOCATION
];

FOR_COMPLETE_BOOKING_STATUS = [
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED,
	BOOKING_STATUS_SERVICE_FINISHED
];

FOR_INPROCESS_BOOKING_STATUS = [
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED,
	BOOKING_STATUS_SERVICE_FINISHED
];

FOR_ALL_START_BOOKING_STATUS = [
	BOOKING_STATUS_NEW,
	BOOKING_STATUS_ACCEPTED,
	BOOKING_STATUS_GO_TO_LOCATION,
	BOOKING_STATUS_REACHED_LOCATION,
	BOOKING_STATUS_SERVICE_STARTED
];

 



BOOKING_STATUS_DROPDOWN = [
	{
		key: BOOKING_STATUS_NEW,
		value: "New"
	},
	{
		key: BOOKING_STATUS_ACCEPTED,
		value: "Accepted"
	},
	{
		key: BOOKING_STATUS_GO_TO_LOCATION,
		value: "Go TO Location"
	},
	{
		key: BOOKING_STATUS_REACHED_LOCATION,
		value: "Reached Location"
	},
	{
		key: BOOKING_STATUS_SERVICE_STARTED,
		value: "Service Started"
	},
	{
		key: BOOKING_STATUS_SERVICE_FINISHED,
		value: "Service Finished"
	},
	{
		key: BOOKING_STATUS_COMPLETED,
		value: "Order Completed"
	},
	{
		key: BOOKING_STATUS_CANCELLED,
		value: "Order Cancelled"
	}
];


BOOKING_STATUS_DROPDOWN_FOR_CUSTOMER = [
	{
		key: [BOOKING_STATUS_NEW, BOOKING_STATUS_ACCEPTED, BOOKING_STATUS_GO_TO_LOCATION, BOOKING_STATUS_REACHED_LOCATION, BOOKING_STATUS_SERVICE_STARTED, BOOKING_STATUS_SERVICE_FINISHED, BOOKING_STATUS_COMPLETED, BOOKING_STATUS_CANCELLED],
		value: "All"
	},
	{
		key: [BOOKING_STATUS_NEW],
		value: "Upcoming"
	},
	{
		key: [BOOKING_STATUS_ACCEPTED, BOOKING_STATUS_GO_TO_LOCATION, BOOKING_STATUS_REACHED_LOCATION, BOOKING_STATUS_SERVICE_STARTED, BOOKING_STATUS_SERVICE_FINISHED],
		value: "Active"
	},
	{
		key: [BOOKING_STATUS_COMPLETED],
		value: "Completed"
	},
	{
		key: [BOOKING_STATUS_CANCELLED],
		value: "Cancelled"
	}
];

BOOKING_STATUS_DROPDOWN_FOR_SP = [
	{
		key: [BOOKING_STATUS_ACCEPTED, BOOKING_STATUS_GO_TO_LOCATION, BOOKING_STATUS_REACHED_LOCATION, BOOKING_STATUS_SERVICE_STARTED, BOOKING_STATUS_SERVICE_FINISHED, BOOKING_STATUS_COMPLETED, BOOKING_STATUS_CANCELLED],
		value: "All",
		type: 'all'
	},
	{
		key: [BOOKING_STATUS_ACCEPTED],
		value: "Accepted"
	},
	{
		key: [BOOKING_STATUS_GO_TO_LOCATION, BOOKING_STATUS_REACHED_LOCATION, BOOKING_STATUS_SERVICE_STARTED, BOOKING_STATUS_SERVICE_FINISHED],
		value: "In-Progress"
	},
	{
		key: [BOOKING_STATUS_COMPLETED],
		value: "Completed"
	}
];

BOOKING_STATUS_DROPDOWN_FOR_FRANCHISE = [
	{
		key: [BOOKING_STATUS_NEW],
		value: "New"
	},
	{
		key: [BOOKING_STATUS_ACCEPTED],
		value: "Assigned"
	},
	{
		key: [BOOKING_STATUS_GO_TO_LOCATION, BOOKING_STATUS_REACHED_LOCATION, BOOKING_STATUS_SERVICE_STARTED, BOOKING_STATUS_SERVICE_FINISHED],
		value: "In-Progress"
	},
	{
		key: [BOOKING_STATUS_COMPLETED],
		value: "Completed"
	},
	{
		key: [BOOKING_STATUS_CANCELLED],
		value: "Cancelled"
	}
];

BOOKING_STATUS_LABLE_FOR_CUSTOMER = [];
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_NEW] = 'booking_lable.booked';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_ACCEPTED] = 'booking_lable.service_provider_assigned';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_GO_TO_LOCATION] = 'booking_lable.service_provider_on_the_way';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_REACHED_LOCATION] = 'booking_lable.service_provider_reached_on_location';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_SERVICE_STARTED] = 'booking_lable.service_started';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_SERVICE_FINISHED] = 'booking_lable.service_finished';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_COMPLETED] = 'booking_lable.order_completed';
BOOKING_STATUS_LABLE_FOR_CUSTOMER[BOOKING_STATUS_CANCELLED] = 'booking_lable.order_cancelled';

TRAVEL_TIME_VALUE = {'15 Mins': 900000, '30 Mins': 1800000, '45 Mins': 2700000, '1 Hour': 3600000 };

TRAVEL_TIME_DROPDOWN = [
	{
		key: 1800000,
		value: "30 Minutes"
	},
	{
		key: 2700000,
		value: "45 Minutes"
	},
	{
		key: 3600000,
		value: "1 Hour"
	}
];

DURATION_TIMESTAMP = { 1: 1800000, 2: 3600000, 3: 7200000, 4: 10800000 };
BOOKING_TRAVELLING_TIME = 1800000;

/**order item type */
ITEM_TYPE_PRODUCT = "product";
ITEM_TYPE_PACKAGE = "package";
ITEM_TYPE_SUBSCRIPTION = "subscription";



ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "doc", "docx"];
ALLOWED_CONTRACT_DOCUMENT_ERROR_MESSAGE = "Invalid file format. Allowed formats: " + ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS.join(", ") + ".";
ALLOWED_CONTRACT_DOCUMENT_MIME_EXTENSIONS = ["image/jpg", "image/jpeg", "image/png", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
ALLOWED_CONTRACT_DOCUMENT_MIME_ERROR_MESSAGE = "Invalid file format. Allowed formats: " + ALLOWED_CONTRACT_DOCUMENT_EXTENSIONS.join(", ") + ".";

/** For franchise contract status*/
CONTRACT_STATUS_INACTIVE = 0;
CONTRACT_STATUS_ACTIVE = 1;
CONTRACT_STATUS_TERMINATED = 2;

CONTRACT_STATUS_DROPDOWN = [
	{
		status_id: CONTRACT_STATUS_ACTIVE,
		status_name: "admin.system.active"
	},
	{
		status_id: CONTRACT_STATUS_INACTIVE,
		status_name: "admin.franchise_contracts.inactive"
	},
	{
		status_id: CONTRACT_STATUS_TERMINATED,
		status_name: "admin.franchise_contracts.terminated"
	},
]

/** For Service Provider types*/
SERVICE_PROVIDER_TYPE_VAN_FLEET = "van_fleet";
SERVICE_PROVIDER_TYPE_BIKE_FLEET = "bike_fleet";

SERVICE_PROVIDER_TYPE_DROPDOWN = {}
SERVICE_PROVIDER_TYPE_DROPDOWN[SERVICE_PROVIDER_TYPE_VAN_FLEET] = "Van Fleet";
SERVICE_PROVIDER_TYPE_DROPDOWN[SERVICE_PROVIDER_TYPE_BIKE_FLEET] = "Bike Fleet";

BOOKING_FROM_PACKAGE = "Package";
BOOKING_FROM_SUBSCRIPTION = "Subscription";

BOOKING_FROM_DROPDOWN = {}
BOOKING_FROM_DROPDOWN[BOOKING_FROM_PACKAGE] = BOOKING_FROM_PACKAGE;
BOOKING_FROM_DROPDOWN[BOOKING_FROM_SUBSCRIPTION] = BOOKING_FROM_SUBSCRIPTION;




SLOT_TIME_DROPDOWN = [
	{ key: "00:00", value: "00:00" },
	{ key: "00:30", value: "00:30" },
	{ key: "01:00", value: "01:00" },
	{ key: "01:30", value: "01:30" },
	{ key: "02:00", value: "02:00" },
	{ key: "02:30", value: "02:30" },
	{ key: "03:00", value: "03:00" },
	{ key: "03:30", value: "03:30" },
	{ key: "04:00", value: "04:00" },
	{ key: "04:30", value: "04:30" },
	{ key: "05:00", value: "05:00" },
	{ key: "05:30", value: "05:30" },
	{ key: "06:00", value: "06:00" },
	{ key: "06:30", value: "06:30" },
	{ key: "07:00", value: "07:00" },
	{ key: "07:30", value: "07:30" },
	{ key: "08:00", value: "08:00" },
	{ key: "08:30", value: "08:30" },
	{ key: "09:00", value: "09:00" },
	{ key: "09:30", value: "09:30" },
	{ key: "10:00", value: "10:00" },
	{ key: "10:30", value: "10:30" },
	{ key: "11:00", value: "11:00" },
	{ key: "11:30", value: "11:30" },
	{ key: "12:00", value: "12:00" },
	{ key: "12:30", value: "12:30" },
	{ key: "13:00", value: "13:00" },
	{ key: "13:30", value: "13:30" },
	{ key: "14:00", value: "14:00" },
	{ key: "14:30", value: "14:30" },
	{ key: "15:00", value: "15:00" },
	{ key: "15:30", value: "15:30" },
	{ key: "16:00", value: "16:00" },
	{ key: "16:30", value: "16:30" },
	{ key: "17:00", value: "17:00" },
	{ key: "17:30", value: "17:30" },
	{ key: "18:00", value: "18:00" },
	{ key: "18:30", value: "18:30" },
	{ key: "19:00", value: "19:00" },
	{ key: "19:30", value: "19:30" },
	{ key: "20:00", value: "20:00" },
	{ key: "20:30", value: "20:30" },
	{ key: "21:00", value: "21:00" },
	{ key: "21:30", value: "21:30" },
	{ key: "22:00", value: "22:00" },
	{ key: "22:30", value: "22:30" },
	{ key: "23:00", value: "23:00" },
	{ key: "23:30", value: "23:30" }
];


FRANCHISE_SINGLE_TYPE = 1;
FRANCHISE_MASTER_TYPE = 2;

FRANCHISE_TYPE = [
	{
		key: 1,
		value: "Single"
	},
	{
		key: 2,
		value: "Master"
	},
];

/**Display subscription filte type */
FILTER_ALL = "all";
FILTER_ACTIVE = "active";
FILTER_EXPIRED = "expired";

FILTER_TYPE = [
	{
		key: FILTER_ALL,
		value: "All"
	},
	{
		key: FILTER_ACTIVE,
		value: "Active"
	},
	{
		key: FILTER_EXPIRED,
		value: "Expired"
	},
];




FILTER_TODAY = "today";
FILTER_THIS_WEEK = "this_week";
FILTER_THIS_MONTH = "this_month";
FILTER_SIX_MONTH = "six_month";
FILTER_THIS_YEAR = "this_year";
FILTER_LAST_YEAR = "last_year";

HOME_FILTER_TYPE = [
	{
		key: FILTER_TODAY,
		value: "Today"
	},
	{
		key: FILTER_THIS_WEEK, 
		value: "This Week"
	},
	{
		key: FILTER_THIS_MONTH,
		value: "This Month"
	},
	{
		key: FILTER_SIX_MONTH,
		value: "Last 6 Months"
	},
	{
		key: FILTER_LAST_YEAR,
		value: "Last Year"
	},
	{
		key: FILTER_ALL,
		value: "All"
	},
];

// service filter
FILTER_STORED = "store";
FILTER_SERVICE = "service";

HOME_SERVICE_FILTER_TYPE = [
	{
		key: FILTER_ALL,
		value: "All"
	},
	{
		key: FILTER_STORED,
		value: "Store Order"
	},
	{
		key: FILTER_SERVICE, 
		value: "Car Wash"
	},
	
	
];



ADD = "add";
REMOVE = "remove";

STOCK_ACTION_TYPE = [
	{
		key: ADD,
		value: "Add"
	},
	{
		key: REMOVE,
		value: "Remove"
	},	
];



TIME_SLOT_INTERVAL = 1800000; 