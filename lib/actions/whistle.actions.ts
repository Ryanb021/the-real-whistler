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
