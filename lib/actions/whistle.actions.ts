"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import Whistle from "../models/whistle.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";


interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createWhistle({ text, author, communityId, path }: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdWhistle = await Whistle.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update user model
    await User.findByIdAndUpdate(author, {
      $push: { whistles: createdWhistle._id }
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { whistles: createdWhistle._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create whistle: ${error.message}`)
  }
};

async function fetchAllChildWhistles(whistleId: string): Promise<any[]> {
  const childWhistles = await Whistle.find({ parentId: whistleId });

  const descendantWhistles = [];
  for (const childWhistle of childWhistles) {
    const descendants = await fetchAllChildWhistles(childWhistle._id);
    descendantWhistles.push(childWhistle, ...descendants);
  }

  return descendantWhistles;
}

export async function deleteWhistle(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the whistle to be deleted (the main whistle)
    const mainWhistle = await Whistle.findById(id).populate("author community");

    if (!mainWhistle) {
      throw new Error("Whistle not found");
    }

    // Fetch all child whistles and their descendants recursively
    const descendantWhistles = await fetchAllChildWhistles(id);

    //Get all descendant whistle IDs including the main whistle ID and child whistle IDs
    const descendantWhistleIds = [
      id,
      ...descendantWhistles.map((whistle) => whistle._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantWhistles.map((whistle) => whistle.author?._id.toString()), // Use optional chaining to handle posiible undefined values
        mainWhistle.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...await descendantWhistles.map((whistle) => whistle.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainWhistle.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

     // Recursively delete child threads and their descendants
     await Whistle.deleteMany({ _id: { $in: descendantWhistleIds } });

     // Update User model
     await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { whistles: { $in: descendantWhistleIds} } }
     );

     // Update Community model
     await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { whistles: { $in: descendantWhistleIds} } }
     );

     revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete whistle: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // calculate number of posts to skip
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
  const postsQuery = Whistle.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: 'author',
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: 'children',
      populate: {
        path: 'author',
        model: User,
        select: "_id name parentId image"
      },
    });

  const totalPostsCount = await Whistle.countDocuments({ parentId: { $in: [null, undefined] } })

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext }
}

export async function fetchWhistleById(id: string) {
  connectToDB();

  try {

    const whistle = await Whistle.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: "_id id name image"
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
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

    if (!originalWhistle) {
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
