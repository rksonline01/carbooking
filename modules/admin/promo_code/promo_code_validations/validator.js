const { body, validationResult } = require('express-validator');
const DbClass = require(WEBSITE_CLASSES_FOLDER_PATH + "/dbClass");
const { ObjectId } = require('mongodb');
const PromoCode = this;




/**
 * Function for add category validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const addPromoCodeValidationRules = (req, res) => {
  /** Check validation **/
  return [

    body("promo_code").optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter promo code.', { value, location, path });
    }).custom((value, { req, location, path }) => {
      return PromoCode.findCodeByName(value, req).then(user => {
        if (user.status == STATUS_SUCCESS) {
          return Promise.reject(req.__('Promo code already exists.', { value, location, path }));
        }
      });
    }),
    body("code_description").optional().trim().notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter description.', { value, location, path });
    }),
    body("code_discount_type").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please select code discount type.', { value, location, path });
    }),
    body("min_order_value").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter minimum order value.', { value, location, path });
    }).isNumeric().withMessage((value, { req, location, path }) => {
      return req.__('Please enter valid value.', { value, location, path });
    }),
    body("discount_value").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_FIX)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter discount value.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      }),
    body("discount_percent").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter discount percent.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      })
      .custom(discountValue => {
        if ((discountValue >= 0 && discountValue <= 100)) {
          return true;
        }
      }).withMessage((value, { req, location, path }) => {
        return req.__('Please enter value grater than 0 and less than 100.', { value, location, path });
      }),
    body("max_discount_amount").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter maximum discount amount.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      }),
    body("code_valid_from").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter validity start date.', { value, location, path });
    }),

    body("code_valid_to").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter  validity end date.', { value, location, path });
    }).custom((value, { req, location, path }) => {
      if (req.body.code_valid_to < req.body.code_valid_from) {
        throw new Error();
      }
      return true;
    }).withMessage((value, { req, location, path }) => {
      return req.__('Coupon end date should be grater than start date.', { value, location, path });
    }),
    
    body("start_hours").if((value, { req }) => !!req.body.end_hours).notEmpty().withMessage((value, { req, location, path }) => {
    return req.__('Please select start hours.', { value, location, path });
    }),
    body("end_hours").if((value, { req }) => !!req.body.start_hours).notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please select end hours.', { value, location, path });
    }),
   
    /*
    body("code_type")
    .notEmpty()
    .withMessage((value, { req, location, path }) => {
      return req.__('Please select code type.', { value, location, path });
    }),
    body("search_users").if((value, { req }) => req.body.code_type == COUPON_TYPE_USER_SPECIFIC)
    .notEmpty()
    .withMessage((value, { req, location, path }) => {
      return req.__('Please select users.', { value, location, path });
    }),
    */

  ]
}

/**
 * Function for add category validation
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const editPromoCodeValidationRules = (req, res) => {
  /** Check validation **/
  return [

    body("promo_code").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter promo code.', { value, location, path });
    }).custom((value, { req, location, path }) => {
      return PromoCode.findCodeByName(value, req).then(user => {
        if (user.status == STATUS_SUCCESS) {
          return Promise.reject(req.__('Promo code already exists.', { value, location, path }));
        }
      });
    }),
    body("code_discount_type").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please select code discount type.', { value, location, path });
    }),
    body("min_order_value").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter minimum order value.', { value, location, path });
    })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      }),
    body("discount_value").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_FIX)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter discount value.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      }),
    body("discount_percent").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter discount percent.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      })
      .custom(discountValue => {
        if ((discountValue >= 0 && discountValue <= 100)) {
          return true;
        }
      }).withMessage((value, { req, location, path }) => {
        return req.__('Please enter value grater than 0 and less than 100.', { value, location, path });
      }),
    body("max_discount_amount").if((value, { req }) => req.body.code_discount_type == COUPON_DISCOUNT_TYPE_PERCENT)
      .notEmpty()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter maximum discount amount.', { value, location, path });
      })
      .isNumeric()
      .withMessage((value, { req, location, path }) => {
        return req.__('Please enter valid value.', { value, location, path });
      }),
    body("code_valid_from").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter validity start date.', { value, location, path });
    }),

    body("code_valid_to").notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please enter  validity end date.', { value, location, path });
    }).custom((value, { req, location, path }) => {
      if (req.body.code_valid_to < req.body.code_valid_from) {
        throw new Error();
      }
      return true;
    }).withMessage((value, { req, location, path }) => {
      return req.__('Coupon end date should be grater than start date.', { value, location, path });
    }),
    
    body("start_hours").if((value, { req }) => !!req.body.end_hours).notEmpty().withMessage((value, { req, location, path }) => {
      return req.__('Please select start hours.', { value, location, path });
      }),
      body("end_hours").if((value, { req }) => !!req.body.start_hours).notEmpty().withMessage((value, { req, location, path }) => {
        return req.__('Please select end hours.', { value, location, path });
      }),
    /*
    body("code_type")
    .notEmpty()
    .withMessage((value, { req, location, path }) => {
      return req.__('Please select code type.', { value, location, path });
    }),*/
  ]
}


/**
 * Function for find color by name
 *
 * @param value As color name value
 * @param req As Request Data
 *
 * @return json
 */
PromoCode.findCodeByName = (value, req) => {

  let promoCodeId = (req.params.id) ? req.params.id : "";


  return new Promise(resolve => {

    let response = {};
    let conditions = {
      is_deleted: NOT_DELETED,
      promo_code: new RegExp(["^", value, "$"].join(""), "i")
    };
    if (promoCodeId != "") {
      conditions["_id"] = { $ne: new ObjectId(promoCodeId) };
    }
    let optionObj = {
      conditions: conditions,
      collection: TABLE_PROMO_CODES,
      fields: { _id: 1 },
    }
    DbClass.getFindOne(optionObj).then(promocodeData => {
      let responseResult = (promocodeData.result) ? promocodeData.result : "";
      if (Object.keys(responseResult).length > 0) {
        response = {
          status: STATUS_SUCCESS,
          result: responseResult,
        };
        resolve(response);

      } else {
        response = {
          status: STATUS_ERROR,
          result: {},
        };
        resolve(response);
      }
    })
  });
}



/**
 * Function for validate error and return
 * @param req As Request Data
 * @param res As Response Data
 * @return json
 */
const validate = (req, res, next) => {
  if (isPost(req)) {
    const allErrors = validationResult(req)
    if (allErrors.isEmpty()) {
      return next()
    }
    let formErrors = parseValidation(allErrors.errors);

    return res.send({
      status: STATUS_ERROR,
      message: formErrors
    });
  } else {
    return next()
  }
}

module.exports = {
  addPromoCodeValidationRules,
  editPromoCodeValidationRules,
  validate,
}
