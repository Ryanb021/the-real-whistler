import mongoose from 'mongoose';

const whistleSchema = new mongoose.Schema({
  text: { type: String, required: true},
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  parentId: {
    type: String
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Whistle'
    }
  ]
});

const Whistle = mongoose.models.Whistle || mongoose.model('Whistle', whistleSchema);

export default Whistle;
