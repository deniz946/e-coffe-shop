const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const crypto = require('crypto');

exports.loginForm = async (req, res, next) => {
  res.render('auth/login', { title: 'Login' })
}

exports.registerForm = async (req, res, next) => {
  res.render('auth/register', { title: 'Register' })
}

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password Cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('auth/register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name
  })
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next();
}

exports.account = (req, res, next) => {
  res.render('user/account', { title: 'Edit account' });
}

exports.updateAccount = async (req, res, next) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate({ '_id': req.user._id }, updates, {
    new: true,
    runValidators: true,
    context: 'query'
  });
  req.flash('success', 'You\'r account has been updated');
  res.redirect('/account');
}

exports.forgot = async (req, res, next) => {
  const user = await User.findOne({ 'email': req.body.email });
  if (!user) {
    /** We are showing a success message despite of that the user doesn't exist, to avoid knowing
     * outside people what email does have an account or not.
    **/
    req.flash('success', 'A password reset code has been mailed to your email')
    res.redirect('/login');
  }

  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `We have sent you an email with reset key to set a new password`)
  res.redirect('/login')
}

exports.resetForm = async (req, res, next) => {
  const resetKey = req.params.resetKey;
  const user = await User.findOne({
    'resetPasswordToken': resetKey,
    'resetPasswordExpires': { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Invalid reset or expired')
    res.redirect('/login');
  }

  res.render('auth/reset', { resetKey });
}

exports.validateResetPassword = async (req, res, next) => {
  req.checkBody('passwordNew', 'You must fill the new password').notEmpty();
  req.checkBody('passwordNewConfirm', 'You must fill the new confirm password').notEmpty();
  req.checkBody('passwordNewConfirm', 'Passwords didn\'t match').equals(req.body.passwordNew);
  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('auth/reset', { body: req.body, flashes: req.flash() });
    return;
  }
  next();
}

exports.resetPassword = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.resetKey,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Invalid reset or expired')
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.passwordNew);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
}

exports.register
