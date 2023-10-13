"use server";

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
      community: communityId,
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

export async function fetchWhistleById(id: string) {
  connectToDB();

  try {

    // TODO: populate community
    const whistle = await Whistle.findById(id)
    .populate({
      path: 'author',
      model: User,
      select: "_id id name image"
    })
    .populate({
      path: 'children',
      populate: [
        {
          path: 'author',
          model: User,
          select: "_id id name parentId image"
        },
        {
          path: 'children',
          model: Whistle,
          populate: {
            path: 'author',
            model: User,
            select: "_id id name parentId image"
          }
        }
      ]
    }).exec();

    return whistle;
  } catch (error: any) {
    throw new Error(`Error fetching whistle: ${error.message}`);
  }
}

export async function addCommentToWhistle(
  whistleId: string,
  commentText: string,
  userId: string,
  path: string,
  ) {
    connectToDB();

    try {
      // Find original whistle by its ID
      const originalWhistle = await Whistle.findById(whistleId);

      if(!originalWhistle) {
        throw new Error("Whistle not found!")
      }

      // Create a new whistle with the comment text
      const commentWhistle = new Whistle({
        text: commentText,
        author: userId,
        parentId: whistleId,
      })

      // Save the new whistle
      const savedCommentWhistle = await commentWhistle.save();

      // Update original whistle to include the new comment
      originalWhistle.children.push(savedCommentWhistle._id);

      // Save the original whistle
      await originalWhistle.save();

      revalidatePath(path);
    } catch (error: any) {
      throw new Error(`Error adding comment to whistle: ${error.message}`);
    }
  
}
