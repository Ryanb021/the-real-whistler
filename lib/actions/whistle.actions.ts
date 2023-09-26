"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import Whistle from "../models/whistle.model";
import { connectToDB } from "../mongoose";

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createWhistle({ text, author, communityId, path }: Params) {
  try {
    connectToDB();

    const createdWhistle = await Whistle.create({
      text,
      author,
      community: null,
    });

    // Update user model
    await User.findByIdAndUpdate(author, {
      $push: { whistles: createdWhistle._id }
    })

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create whistle: ${error.message}`)
  }
};

export async function fetchPosts(pageNumber = 1, pageSize =20) {
  connectToDB();

  // calculate number of posts to skip
  const skipAmount = (pageNumber -1) * pageSize;

  const postsQuery = Whistle.find({ parentId: { $in: [null, undefined] } })
  .sort({ createdAt: 'desc'})
  .skip(skipAmount)
  .limit(pageSize)
  .populate({ path: 'author' })
  .populate({
    path: 'children',
    populate: {
      path: 'author',
      model: User,
      select: "_id name parentId image"
    }
  })

  const totalPostsCount = await Whistle.countDocuments({ parentId: { $in: [null, undefined] } })

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext }
}
