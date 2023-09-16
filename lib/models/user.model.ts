import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  bio: String,
  whistles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Whistle'
    }
  ],
  onboarded: {
    type: Boolean,
    default: false,
  },
  communitites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }
  ]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
