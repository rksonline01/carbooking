BREADCRUMBS = {

	/** DASHBOARD SECTION**/
	'admin/dashboard': [{ name: 'Dashboard', url: '', icon: 'dashboard' }],

	/**EDIT PROFILE SECTION**/
	'admin/user_profile/edit': [{ name: 'Edit profile', url: '', icon: 'mode_edit' }],

	/**USER MANAGEMENT SECTION**/
	'admin/users/list': [{ name: 'dynamic_variable Users Management', url: '', icon: 'person' }],
	'admin/users/edit': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'Edit ', url: '', icon: 'mode_edit' }],
	'admin/users/add': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/users/view': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'View ', url: '', icon: 'find_in_page' }],
	'admin/users/view_wallet_list': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'View ', url: '', icon: 'find_in_page' }, { name: 'Wallet ', url: '', icon: 'wallet' }],
	'admin/users/view_points_list': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'View ', url: '', icon: 'find_in_page' }, { name: 'Points ', url: '', icon: 'wallet' }],
	'admin/users/view_subscription_list': [{ name: 'dynamic_variable Users Management', url: WEBSITE_ADMIN_URL + 'users/{dynamic_variable}', icon: 'person' }, { name: 'View ', url: '', icon: 'find_in_page' }, { name: 'Subscriptions ', url: '', icon: 'picture_in_picture' }],

	/**CMS SECTION**/
	'admin/cms/list': [{ name: 'CMS Management', url: '', icon: 'picture_in_picture' }],
	'admin/cms/edit': [{ name: 'CMS Management', url: WEBSITE_ADMIN_URL + 'cms', icon: 'picture_in_picture' }, { name: 'Edit CMS', url: '', icon: 'mode_edit' }],
	'admin/cms/add': [{ name: 'CMS Management', url: WEBSITE_ADMIN_URL + 'cms', icon: 'picture_in_picture' }, { name: 'Add CMS', url: '', icon: 'add' }],

	/**BLOCK SECTION**/
	'admin/block/list': [{ name: 'Block Management', url: '', icon: 'chrome_reader_mode' }],
	'admin/block/edit': [{ name: 'Block Management', url: WEBSITE_ADMIN_URL + 'block', icon: 'chrome_reader_mode' }, { name: 'Edit Block', url: '', icon: 'mode_edit' }],
	'admin/block/add': [{ name: 'Block Management', url: WEBSITE_ADMIN_URL + 'block', icon: 'chrome_reader_mode' }, { name: 'Add Block', url: '', icon: 'add' }],

	/**TEXT SETTING SECTION**/
	'admin/text_setting/list': [{ name: 'dynamic_variable', url: '', icon: 'text_format' }],
	'admin/text_setting/edit': [{ name: 'dynamic_variable', url: WEBSITE_ADMIN_URL + 'text-setting/{dynamic_variable}', icon: 'text_format' }, { name: 'Edit Text Setting', url: '', icon: 'mode_edit' }],
	'admin/text_setting/add': [{ name: 'dynamic_variable', url: WEBSITE_ADMIN_URL + 'text-setting/{dynamic_variable}', icon: 'text_format' }, { name: 'Add Text Setting', url: '', icon: 'add' }],

	/**EMAIL MANAGEMENT SECTION**/
	'admin/email_template/list': [{ name: 'Email Templates', url: '', icon: 'contact_mail' }],
	'admin/email_template/edit': [{ name: 'Email Templates', url: WEBSITE_ADMIN_URL + 'email_template', icon: 'contact_mail' }, { name: 'Edit Email Template', url: '', icon: 'mode_edit' }],

	/**SETTING MANAGEMENT SECTION**/
	'admin/setting/list': [{ name: 'Settings', url: '', icon: 'settings' }],
	'admin/setting/add': [{ name: 'Settings', url: WEBSITE_ADMIN_URL + 'settings', icon: 'settings' }, { name: 'Add Setting', url: '', icon: 'add' }],
	'admin/setting/edit': [{ name: 'Settings', url: WEBSITE_ADMIN_URL + 'settings', icon: 'settings' }, { name: 'Edit Setting', url: '', icon: 'mode_edit' }],
	'admin/setting/prefix': [{ name: 'dynamic_variable', url: '', icon: 'settings' }],

	/**MASTER MANAGEMENT SECTION**/
	'admin/master/list': [{ name: 'dynamic_variable', url: '', icon: 'subject' }],
	'admin/master/add': [{ name: 'dynamic_variable', url: WEBSITE_ADMIN_URL + 'master/{dynamic_variable}', icon: 'subject' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/master/edit': [{ name: 'dynamic_variable', url: WEBSITE_ADMIN_URL + 'master/{dynamic_variable}', icon: 'subject' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/master/view': [{ name: 'dynamic_variable', url: WEBSITE_ADMIN_URL + 'master/{dynamic_variable}', icon: 'subject' }, { name: 'View', url: '', icon: 'find_in_page' }],

	/**ADMIN ROLE SECTION**/
	'admin/admin_role/list': [{ name: 'Manage Roles', url: '', icon: 'security' }],
	'admin/admin_role/add': [{ name: 'Manage Roles', url: WEBSITE_ADMIN_URL + 'admin_role', icon: 'security' }, { name: 'Add Role', url: '', icon: 'add' }],
	'admin/admin_role/edit': [{ name: 'Manage Roles', url: WEBSITE_ADMIN_URL + 'admin_role', icon: 'security' }, { name: 'Edit Role', url: '', icon: 'edit' }],

	/**ADMIN PERMISSIONS SECTION**/
	'admin/admin_permissions/list': [{ name: 'Sub-admin', url: '', icon: 'perm_data_setting' }],
	'admin/admin_permissions/add': [{ name: 'Sub-admin', url: WEBSITE_ADMIN_URL + 'admin_permissions', icon: 'perm_data_setting' }, { name: 'Add Sub-admin ', url: '', icon: 'add' }],
	'admin/admin_permissions/edit': [{ name: 'Sub-admin', url: WEBSITE_ADMIN_URL + 'admin_permissions', icon: 'perm_data_setting' }, { name: 'Edit Sub-admin ', url: '', icon: 'edit' }],
	'admin/admin_permissions/view': [{ name: 'Sub-admin', url: WEBSITE_ADMIN_URL + 'admin_permissions', icon: 'perm_data_setting' }, { name: 'View Sub-admin ', url: '', icon: 'find_in_page' }],

	/** ADMIN MODULES SECTION**/
	'admin/admin_modules/list': [{ name: 'Admin Modules', url: '', icon: 'pages' }],
	'admin/admin_modules/add': [{ name: 'Admin Modules', url: WEBSITE_ADMIN_URL + 'admin_modules', icon: 'pages' }, { name: 'Add Admin Modules', url: '', icon: 'add' }],
	'admin/admin_modules/edit': [{ name: 'Admin Modules', url: WEBSITE_ADMIN_URL + 'admin_modules', icon: 'pages' }, { name: 'Edit Admin Modules', url: '', icon: 'edit' }],

	/** PN LOGS SECTION**/
	'admin/sms_logs/list': [{ name: 'Sms Logs', url: '', icon: 'textsms' }],
	'admin/sms_logs/view': [{ name: 'Sms Logs', url: WEBSITE_ADMIN_URL + 'sms_logs', icon: 'textsms' }, { name: 'Sms Log Details', url: '', icon: 'find_in_page' }],

	/** Sms LOGS SECTION**/
	'admin/pn_logs/list': [{ name: 'Pn Logs', url: '', icon: 'view_agenda' }],
	'admin/pn_logs/view': [{ name: 'Pn Logs', url: WEBSITE_ADMIN_URL + 'pn_logs', icon: 'view_agenda' }, { name: 'Pn Log Details', url: '', icon: 'find_in_page' }],

	/** EMAIL LOGS SECTION**/
	'admin/email_logs/list': [{ name: 'Email Logs', url: '', icon: 'mail_outline' }],
	'admin/email_logs/view': [{ name: 'Email Logs', url: WEBSITE_ADMIN_URL + 'email_logs', icon: 'mail_outline' }, { name: 'Email Logs Details', url: '', icon: 'find_in_page' }],

	/** EMAIL ACTIONS SECTION**/
	'admin/email_actions/list': [{ name: 'Email Actions', url: '', icon: 'dvr' }],
	'admin/email_actions/add': [{ name: 'Email Actions', url: WEBSITE_ADMIN_URL + 'email_actions', icon: 'dvr' }, { name: 'Add Email Actions', url: '', icon: 'add' }],
	'admin/email_actions/edit': [{ name: 'Email Actions', url: WEBSITE_ADMIN_URL + 'email_actions', icon: 'dvr' }, { name: 'Edit Email Actions', url: '', icon: 'edit' }],

	/** NOTIFICATION SECTION**/
	'admin/notification/list': [{ name: 'Notification Management', url: '', icon: 'notifications' }],

	/**PROMO CODE MANAGEMENT SECTION**/
	'admin/promo_code/list': [{ name: 'Promo Code Management', url: '', icon: 'style' }],
	'admin/promo_code/edit': [{ name: 'Promo Code Management', url: WEBSITE_ADMIN_URL + 'promo_codes', icon: 'style' }, { name: 'Edit Promo Code', url: '', icon: 'mode_edit' }],
	'admin/promo_code/add': [{ name: 'Promo Code Management', url: WEBSITE_ADMIN_URL + 'promo_codes', icon: 'style' }, { name: 'Add Promo Code', url: '', icon: 'add' }],
	'admin/promo_code/view': [{ name: 'Promo Code Management', url: WEBSITE_ADMIN_URL + 'promo_codes', icon: 'style' }, { name: 'View Promo Code Details', url: '', icon: 'find_in_page' }],


	/**BANNER SECTION**/
	'admin/banner/list': [{ name: 'Banner', url: '', icon: 'picture_in_picture' }],
	'admin/banner/add': [{ name: 'Banner', url: WEBSITE_ADMIN_URL + 'banner', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/banner/edit': [{ name: 'Banner', url: WEBSITE_ADMIN_URL + 'banner', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],

	/** NEWSLETTER SUBSCRIBER SECTION **/
	'admin/newsletter_subscribers/list': [{ name: 'Newsletter Subscriber', url: '', icon: 'chrome_reader_mode' }],
	'admin/newsletter_subscribers/edit': [{ name: 'Newsletter Subscriber', url: WEBSITE_ADMIN_URL + 'newsletter_subscribers', icon: 'chrome_reader_mode' }, { name: 'Edit Newsletter Subscribers', url: '', icon: 'mode_edit' }],
	'admin/newsletter_subscribers/add': [{ name: 'Newsletter Subscriber', url: WEBSITE_ADMIN_URL + 'newsletter_subscribers', icon: 'chrome_reader_mode' }, { name: 'Add Newsletter Subscribers', url: '', icon: 'add' }],

	/** CONTACT SECTION**/
	'admin/contact/list': [{ name: 'Contact Management', url: '', icon: 'person' }],
	'admin/contact/view': [{ name: 'Contact Management', url: WEBSITE_ADMIN_URL + 'contact', icon: 'person' }, { name: 'View', url: '', icon: 'find_in_page' }],



	/**FAQ SECTION**/
	'admin/faq/list': [{ name: 'Faq Management', url: '', icon: 'question_answer' }],
	'admin/faq/edit': [{ name: 'Faq Management', url: WEBSITE_ADMIN_URL + 'faq', icon: 'question_answer' }, { name: 'Edit Faq', url: '', icon: 'mode_edit' }],
	'admin/faq/add': [{ name: 'Faq Management', url: WEBSITE_ADMIN_URL + 'faq', icon: 'question_answer' }, { name: 'Add Faq', url: '', icon: 'add' }],
	'admin/faq/view': [{ name: 'Faq Management', url: WEBSITE_ADMIN_URL + 'faq', icon: 'question_answer' }, { name: 'View Faq', url: '', icon: 'find_in_page' }],

	/**BANNER SECTION**/
	'admin/splash_screens/list': [{ name: 'Splash Screens', url: '', icon: 'fullscreen' }],
	'admin/splash_screens/add': [{ name: 'Splash Screens', url: WEBSITE_ADMIN_URL + 'splash_screens', icon: 'fullscreen' }, { name: 'Add Screen', url: '', icon: 'add' }],
	'admin/splash_screens/edit': [{ name: 'Splash Screens', url: WEBSITE_ADMIN_URL + 'splash_screens', icon: 'fullscreen' }, { name: 'Edit Screen', url: '', icon: 'mode_edit' }],
	'admin/splash_screens/view': [{ name: 'Splash Screens', url: WEBSITE_ADMIN_URL + 'splash_screens', icon: 'fullscreen' }, { name: 'View Screen', url: '', icon: 'find_in_page' }],


	/** WALLET TRANSACTION SECTION**/
	'admin/wallet_transaction/list': [{ name: 'Wallet Reports', url: '', icon: 'account_balance_wallet' }],


	/** Update profile requests**/
	'admin/update_profile_requests/list': [{ name: 'Update Profile Requests', url: '', icon: 'fullscreen' }],
	'admin/update_profile_requests/add': [{ name: 'Update Profile Requests', url: WEBSITE_ADMIN_URL + 'update_profile_requests', icon: 'fullscreen' }, { name: 'Add Update Profile Request', url: '', icon: 'add' }],
	'admin/update_profile_requests/view': [{ name: 'Update Profile Requests', url: WEBSITE_ADMIN_URL + 'update_profile_requests', icon: 'fullscreen' }, { name: 'View', url: '', icon: 'find_in_page' }],

	/**NOTIFICATION MANAGEMENT SECTION**/
	'admin/notification_templates/list': [{ name: 'Notification Templates', url: '', icon: 'contact_mail' }],
	'admin/notification_templates/edit': [{ name: 'Notification Templates', url: WEBSITE_ADMIN_URL + 'notification_templates', icon: 'contact_mail' }, { name: 'Edit Notification Template', url: '', icon: 'mode_edit' }],

	/** LOCATION MANAGEMENT**/
	'admin/locations/list': [{ name: 'Workable Locations', url: '', icon: 'fullscreen' }],
	'admin/locations/add': [{ name: 'Workable Locations', url: WEBSITE_ADMIN_URL + 'locations/workable_locations', icon: 'fullscreen' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/locations/edit': [{ name: 'Workable Locations', url: WEBSITE_ADMIN_URL + 'locations/workable_locations', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'edit' }],
	'admin/locations/view': [{ name: 'Workable Locations', url: WEBSITE_ADMIN_URL + 'locations/workable_locations', icon: 'fullscreen' }, { name: 'View', url: '', icon: 'find_in_page' }],



	/**ADS MANAGEMENT SECTION**/
	'admin/ad_managements/list': [{ name: 'ADS Management', url: '', icon: 'picture_in_picture' }],
	'admin/ad_managements/add': [{ name: 'ADS Management', url: WEBSITE_ADMIN_URL + 'ad_managements', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/ad_managements/edit': [{ name: 'ADS Management', url: WEBSITE_ADMIN_URL + 'ad_managements', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/ad_managements/view': [{ name: 'ADS Management', url: WEBSITE_ADMIN_URL + 'ad_managements', icon: 'picture_in_picture' }, { name: 'View', url: '', icon: 'find_in_page' }],

	/**CUSTOM NOTIFICATION SECTION**/
	'admin/custom_notification/list': [{ name: 'Custom Notification', url: '', icon: 'notifications' }],
	'admin/custom_notification/add': [{ name: 'Custom Notification', url: WEBSITE_ADMIN_URL + 'custom-notification', icon: 'notifications' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/custom_notification/edit': [{ name: 'Custom Notification', url: WEBSITE_ADMIN_URL + 'custom-notification', icon: 'notifications' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/custom_notification/view': [{ name: 'Custom Notification', url: WEBSITE_ADMIN_URL + 'custom-notification', icon: 'notifications' }, { name: 'View', url: '', icon: 'find_in_page' }],


	/**Category SECTION**/
	'admin/category/list': [{ name: 'Category Management', url: '', icon: 'chrome_reader_mode' }],
	'admin/category/edit': [{ name: 'Category Management', url: WEBSITE_ADMIN_URL + 'category', icon: 'chrome_reader_mode' }, { name: 'Edit Category', url: '', icon: 'mode_edit' }],
	'admin/category/add': [{ name: 'Category Management', url: WEBSITE_ADMIN_URL + 'category', icon: 'chrome_reader_mode' }, { name: 'Add Category', url: '', icon: 'add' }],

	/**Country SECTION**/
	'admin/countries/list': [{ name: 'Country Management', url: '', icon: 'chrome_reader_mode' }],
	'admin/countries/edit': [{ name: 'Country Management', url: WEBSITE_ADMIN_URL + 'country', icon: 'chrome_reader_mode' }, { name: 'Edit Country', url: '', icon: 'mode_edit' }],
	'admin/countries/add': [{ name: 'Country Management', url: WEBSITE_ADMIN_URL + 'country', icon: 'chrome_reader_mode' }, { name: 'Add Country', url: '', icon: 'add' }],

	/**Sates SECTION**/
	'admin/states/list': [{ name: 'State Management', url: '', icon: 'chrome_reader_mode' }],
	'admin/states/edit': [{ name: 'State Management', url: WEBSITE_ADMIN_URL + 'states', icon: 'chrome_reader_mode' }, { name: 'Edit State', url: '', icon: 'mode_edit' }],
	'admin/states/add': [{ name: 'State Management', url: WEBSITE_ADMIN_URL + 'states', icon: 'chrome_reader_mode' }, { name: 'Add State', url: '', icon: 'add' }],

	/**CITIES SECTION**/
	'admin/cities/list': [{ name: 'City Management', url: '', icon: 'chrome_reader_mode' }],
	'admin/cities/edit': [{ name: 'City Management', url: WEBSITE_ADMIN_URL + 'cities', icon: 'chrome_reader_mode' }, { name: 'Edit State', url: '', icon: 'mode_edit' }],
	'admin/cities/add': [{ name: 'City Management', url: WEBSITE_ADMIN_URL + 'cities', icon: 'chrome_reader_mode' }, { name: 'Add State', url: '', icon: 'add' }],


	/** BLOG  SECTION**/
	'admin/blog/list': [{ name: 'Blog Management', url: '', icon: 'play_lesson' }],
	'admin/blog/view': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'View', url: '', icon: 'find_in_page' }],
	'admin/blog/add': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'Add Blog', url: '', icon: 'add' }],
	'admin/blog/edit': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'Edit Blog', url: '', icon: 'mode_edit' }],
	'admin/blog/categories/list': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'Blog Category Listing', url: '', icon: 'chrome_reader_mode' }],
	'admin/blog/categories/add': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'Blog Category Listing', url: WEBSITE_ADMIN_URL + 'blog/categories', icon: 'chrome_reader_mode' }, { name: 'Add Blog Category', url: '', icon: 'add' }],
	'admin/blog/categories/edit': [{ name: 'Blog Management', url: WEBSITE_ADMIN_URL + 'blog/list', icon: 'play_lesson' }, { name: 'Blog Category Listing', url: WEBSITE_ADMIN_URL + 'blog/categories', icon: 'chrome_reader_mode' }, { name: 'Edit Blog Category', url: '', icon: 'mode_edit' }],


	/**TESTIMONIALS SECTION**/
	'admin/testimonials/list': [{ name: 'Testimonials', url: '', icon: 'style' }],
	'admin/testimonials/edit': [{ name: 'Testimonials', url: WEBSITE_ADMIN_URL + 'testimonials', icon: 'style' }, { name: 'Edit Testimonial', url: '', icon: 'mode_edit' }],
	'admin/testimonials/add': [{ name: 'Testimonials', url: WEBSITE_ADMIN_URL + 'testimonials', icon: 'style' }, { name: 'Add Testimonial', url: '', icon: 'add' }],
	'admin/testimonials/view': [{ name: 'Testimonials', url: WEBSITE_ADMIN_URL + 'testimonials', icon: 'style' }, { name: 'View Testimonial', url: '', icon: 'find_in_page' }],

	/**Slider SECTION**/
	'admin/slider/list': [{ name: 'Slider Management', url: '', icon: 'picture_in_picture' }],
	'admin/slider/edit': [{ name: 'Slider Management', url: WEBSITE_ADMIN_URL + 'slider', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/slider/add': [{ name: 'Slider Management', url: WEBSITE_ADMIN_URL + 'slider', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],


	/**PRODUCT SECTION**/
	'admin/products/list': [{ name: 'Product Management', url: '', icon: 'picture_in_picture' }],
	'admin/products/add': [{ name: 'Product Management', url: WEBSITE_ADMIN_URL + 'products', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/products/edit': [{ name: 'Product Management', url: WEBSITE_ADMIN_URL + 'products', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/products/view': [{ name: 'Product Management', url: WEBSITE_ADMIN_URL + 'products', icon: 'picture_in_picture' }, { name: 'View Product', url: '', icon: 'find_in_page' }],


	/**CMS SECTION**/
	'admin/cms_content/list': [{ name: 'CMS Content Management', url: '', icon: 'picture_in_picture' }],
	'admin/cms_content/edit': [{ name: 'CMS Content Management', url: WEBSITE_ADMIN_URL + 'cms-content-management', icon: 'picture_in_picture' }, { name: 'Edit CMS Content', url: '', icon: 'mode_edit' }],
	'admin/cms_content/add': [{ name: 'CMS Content Management', url: WEBSITE_ADMIN_URL + 'cms-content-management', icon: 'picture_in_picture' }, { name: 'Add CMS Content', url: '', icon: 'add' }],


	/**PRODUCT SECTION**/
	'admin/packages/list': [{ name: 'Package Management', url: '', icon: 'picture_in_picture' }],
	'admin/packages/add': [{ name: 'Package Management', url: WEBSITE_ADMIN_URL + 'package-management', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/packages/edit': [{ name: 'Package Management', url: WEBSITE_ADMIN_URL + 'package-management', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/packages/view': [{ name: 'Package Management', url: WEBSITE_ADMIN_URL + 'package-management', icon: 'picture_in_picture' }, { name: 'View Package', url: '', icon: 'find_in_page' }],

	/**SUBSCRIPTION SECTION**/
	'admin/subscription/list': [{ name: 'Subscription Management', url: '', icon: 'picture_in_picture' }],
	'admin/subscription/add': [{ name: 'Subscription Management', url: WEBSITE_ADMIN_URL + 'subscription-management', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],
	'admin/subscription/edit': [{ name: 'Subscription Management', url: WEBSITE_ADMIN_URL + 'subscription-management', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/subscription/view': [{ name: 'Subscription Management', url: WEBSITE_ADMIN_URL + 'subscription-management', icon: 'picture_in_picture' }, { name: 'View Subscription', url: '', icon: 'find_in_page' }],


	/**AREA SECTION**/
	'admin/area/list': [{ name: 'Area', url: '', icon: 'style' }],
	'admin/area/edit': [{ name: 'Area', url: WEBSITE_ADMIN_URL + 'area', icon: 'style' }, { name: 'Edit Area', url: '', icon: 'mode_edit' }],
	'admin/area/add': [{ name: 'Area', url: WEBSITE_ADMIN_URL + 'area', icon: 'style' }, { name: 'Add Area', url: '', icon: 'add' }],
	'admin/area/show_all': [{ name: 'Area', url: WEBSITE_ADMIN_URL + 'area', icon: 'style' }, { name: 'Show All Area', url: '', icon: 'find_in_page' }],
	'admin/area/assign_service_provider': [{ name: 'Area', url: WEBSITE_ADMIN_URL + 'area', icon: 'style' }, { name: 'Assign Service Provider', url: '', icon: 'person' }],


	/** GIFT TRANSACTION LOGS SECTION**/
	'admin/gift_transaction_logs/list': [{ name: 'Gift Transaction Logs', url: '', icon: 'picture_in_picture' }],

	/** ORDERS SECTION**/
	'admin/orders/list': [{ name: 'Orders Management', url: '', icon: 'picture_in_picture' }],
	'admin/orders/view': [{ name: 'Orders Management', url: WEBSITE_ADMIN_URL + 'orders', icon: 'picture_in_picture' }, { name: 'View Order', url: '', icon: 'find_in_page' }],


	/** ORDERS BOOKING SECTION**/
	'admin/orders_booking/list': [{ name: 'Booking Management', url: '', icon: 'picture_in_picture' }],
	'admin/orders_booking/view': [{ name: 'Booking Management', url: WEBSITE_ADMIN_URL + 'orders_booking', icon: 'picture_in_picture' }, { name: 'View Booking', url: '', icon: 'find_in_page' }],

	/** FRANCHISE CONTRACT SECTION**/
	'admin/franchise_contracts/list': [{ name: 'Franchise Contracts', url: '', icon: 'assignment_turned_in' }],
	'admin/franchise_contracts/add': [{ name: 'Franchise Contracts', url: WEBSITE_ADMIN_URL + 'franchise_contracts', icon: 'assignment_turned_in' }, { name: 'Add Contract', url: '', icon: 'add' }],
	'admin/franchise_contracts/view': [{ name: 'Franchise Contracts', url: WEBSITE_ADMIN_URL + 'franchise_contracts', icon: 'assignment_turned_in' }, { name: 'View Contract', url: '', icon: 'find_in_page' }],

	/** RATING SECTION**/
	'admin/rating_reviews/list': [{ name: 'Rating & Reviews', url: '', icon: 'star' }],

	/**CUSTOMER ADDRESS SECTION**/
	'admin/customer_address/list': [{ name: 'Customer Addresses', url: '', icon: 'map' }],
	'admin/customer_address/add': [{ name: 'Customer Addresses', url: WEBSITE_ADMIN_URL + 'customer_address/{dynamic_variable}', icon: 'map' }, { name: 'Add Address', url: '', icon: 'add' }],
	'admin/customer_address/edit': [{ name: 'Customer Addresses', url: WEBSITE_ADMIN_URL + 'customer_address/{dynamic_variable}', icon: 'map' }, { name: 'Edit Address', url: '', icon: 'mode_edit' }],
	'admin/customer_address/view': [{ name: 'Customer Addresses', url: WEBSITE_ADMIN_URL + 'customer_address/{dynamic_variable}', icon: 'map' }, { name: 'View Address', url: '', icon: 'find_in_page' }],

	/**COMPANY MANAGEMENT SECTION**/
	'admin/company_management/list': [{ name: 'Company Management', url: '', icon: 'apartment' }],
	'admin/company_management/add': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'Add Company', url: '', icon: 'add' }],
	'admin/company_management/edit': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'Edit Company', url: '', icon: 'mode_edit' }],
	'admin/company_management/view': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'View Company', url: '', icon: 'find_in_page' }],

	/**COMPANY MANAGEMENT SECTION**/
	'admin/company_management/B2B_Discount/list': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'B2B Discount Management', url: '', icon: 'local_activity' }],
	'admin/company_management/B2B_Discount/add': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'B2B Discount Management', url: WEBSITE_ADMIN_URL + 'company_management/{dynamic_variable}', icon: 'local_activity' }, { name: 'Add Discount', url: '', icon: 'add' }],
	'admin/company_management/B2B_Discount/edit': [{ name: 'Company Management', url: WEBSITE_ADMIN_URL + 'company_management', icon: 'apartment' }, { name: 'B2B Discount Management', url: WEBSITE_ADMIN_URL + 'company_management/{dynamic_variable}', icon: 'local_activity' }, { name: 'Edit Discount', url: '', icon: 'mode_edit' }],

	/** POINTS MANAGEMENT SECTION */
	'admin/points/list': [{ name: 'Points ', url: '', icon: 'wallet' }],

	/**popup ads SECTION**/
	'admin/popup_ads/list': [{ name: 'Popup Ads Management', url: '', icon: 'picture_in_picture' }],
	'admin/popup_ads/edit': [{ name: 'Popup Ads Management', url: WEBSITE_ADMIN_URL + 'popup_ads', icon: 'picture_in_picture' }, { name: 'Edit', url: '', icon: 'mode_edit' }],
	'admin/popup_ads/add': [{ name: 'Popup Ads Management', url: WEBSITE_ADMIN_URL + 'popup_ads', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],

	/**popup ads SECTION**/
	'admin/leave-management/list': [{ name: 'Leave Management', url: '', icon: 'picture_in_picture' }],
	'admin/leave-management/add': [{ name: 'Leave Management', url: WEBSITE_ADMIN_URL + 'leave-management', icon: 'picture_in_picture' }, { name: 'Add', url: '', icon: 'add' }],

	'admin/slot_management/add': [{ name: 'Slot Management', url: WEBSITE_ADMIN_URL + 'slot-management', icon: 'picture_in_picture' }],
	'admin/view_wallet_list': [{ name: 'Wallet Transaction Logs', url: '', icon: 'picture_in_picture' }],

};
