import mongoose from 'mongoose';

const lhcCategorySchema = new mongoose.Schema(
  {
    key:         { type: String, required: true, unique: true, index: true }, // e.g. 'labour'
    name:        { type: String, required: true, trim: true },                 // mk display
    description: { type: String, trim: true },
    icon:        { type: String, trim: true },
    color:       { type: String, trim: true },
    order:       { type: Number, default: 0 },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('LhcCategory', lhcCategorySchema);
