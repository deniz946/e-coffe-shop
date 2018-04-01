const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true,
    },
    tags: [String]
})

storeSchema.pre('save', function (next) {
    // Just slugify if the name has changed
    if (!this.isModified('name')) {
        next()
        return;
    }
    this.slug = slug(this.name);
    next();
})

module.exports = mongoose.model('Store', storeSchema);