const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) next(null, true);
    else next('That file type isn\'t allowed', false);
  }
}

exports.homePage = (req, res, next) => {
  res.render('index');
}

exports.addStore = (req, res, next) => {
  res.render('editStore', { title: "Add store" });
}

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
  if (!req.file) {
    next()
    return;
  }
  // We take the 2 part of the splitted mimetype as extension i.e: image/jpeg
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
}

exports.createStore = async (req, res, next) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res, next) => {
  const stores = await Store.find({});
  res.render('stores', { title: "Stores", stores })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it')
  }
}

exports.editStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  confirmOwner(store, req.user);
  res.render('editStore', { title: "Edit store", store })
}

exports.updateStore = async (req, res, next) => {
  // set the location type to point
  console.log(req.body.photo);
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ '_id': req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash('info', `Successfully updated the store <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View store</a>`)
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ 'slug': req.params.slug }).populate('author');
  if (!store) {
    next();
    return;
  }
  res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res, next) => {
  const tag = req.params.id;
  const tagQuery = tag || { $exists: true }
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ 'tags': tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', { tags, stores, tag, title: 'Tags' })
}

