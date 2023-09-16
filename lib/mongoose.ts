import mongoose from 'mongoose';

let isConnected = false; //check if connection is established with Mongoose

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if(!process.env.MONGODB_URL) return console.log('MONGODB_URL not found');
  if(isConnected) return console.log('Successfully connected to MongoDB');

  try {

  } catch (error) {

  }
}
