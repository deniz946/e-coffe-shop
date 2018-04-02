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
  tags: [String],
  photo: String,
  created: {
    type: Date,
    default: new Date()
  },
  location: {
    type: {
      type: String,
      default: 'Pointer'
    },
    /** The array of coordinates stores in the first
    index the longitude and in the second index the latitude **/
    coordinates: [{
      type: Number,
      required: 'You must enter coordinates'
    }],
    address: {
      type: String,
      required: 'You must enter an address'
    }
  }
})

storeSchema.pre('save', async function(next) {
  // Dont slugify if the name has not changed
  if (!this.isModified('name')) {
    next();
    return;
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of bulldog, bulldog-1, bulldog-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
