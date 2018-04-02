const express = require('express');
const router = express.Router();
const storeController = require('./../controllers/storeController');
const usersController = require('./../controllers/usersController');
const authController = require('./../controllers/authController');
const { catchErrors } = require('./../handlers/errorHandlers')

// Stores
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.post('/add',
  storeController.upload,
  storeController.resize,
  catchErrors(storeController.createStore)
);
router.post('/add/:id',
  storeController.upload,
  storeController.resize,
  catchErrors(storeController.updateStore)
);

// Tags
router.get('/tags', catchErrors(storeController.getStoresByTag))
router.get('/tags/:id', catchErrors(storeController.getStoresByTag))

// Login
router.get('/login', catchErrors(usersController.loginForm))
router.post('/login', authController.login),
router.get('/logout', authController.logout)
router.get('/register', catchErrors(usersController.registerForm))
router.post('/register',
  usersController.validateRegister,
  usersController.register,
  authController.login
)

// Account
router.get('/account', authController.isLoggedIn, usersController.account)
router.post('/account', authController.isLoggedIn, catchErrors(usersController.updateAccount))
router.post('/account/forgot', catchErrors(authController.forgot))
router.get('/account/reset/:resetKey', catchErrors(authController.resetForm))
router.post('/account/reset/:resetKey', authController.validateResetPassword, catchErrors(authController.resetPassword))




module.exports = router;
