const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res, next) => {
    res.render('index');
}

exports.addStore = (req, res, next) => {
    res.render('editStore', {title: "Add store"});
}

exports.createStore = async (req, res, next) => {
    const store = await new Store(req.body).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res, next) => {
  const stores = await Store.find({});
  res.render('stores', {title: "Stores", stores})
}

exports.editStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  res.render('editStore', {title: "Edit store", store})
}

exports.updateStore = async (req, res, next) => {
  const store = await Store.findOneAndUpdate({'_id': req.params.id}, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash('info', `Successfully updated the store <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View store</a>`)
  res.redirect(`/stores/${store._id}/edit`);
}
