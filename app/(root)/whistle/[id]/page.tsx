import WhistleCard from "@/components/cards/WhistleCard";
import Comment from "@/components/forms/Comment";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchWhistleById } from "@/lib/actions/whistle.actions";
import { currentUser } from '@clerk/nextjs';
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect('/onboarding')

  const whistle = await fetchWhistleById(params.id);

  return (
    <section className="relative">
      <div>
        <WhistleCard
          key={whistle._id}
          id={whistle._id}
          currentUserId={user?.id || ""}
          parentId={whistle.parentId}
          content={whistle.text}
          author={whistle.author}
          community={whistle.community}
          createdAt={whistle.createdAt}
          comments={whistle.children}
        />
      </div>

      <div className="mt-7">
        <Comment
        whistleId={whistle.id}
        currentUserImg={userInfo.image}
        currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {whistle.children.map((childItem: any) => (
          <WhistleCard
          key={childItem._id}
          id={childItem._id}
          currentUserId={childItem?.id || ""}
          parentId={childItem.parentId}
          content={childItem.text}
          author={childItem.author}
          community={childItem.community}
          createdAt={childItem.createdAt}
          comments={childItem.children}
          isComment
        />
        ))}
      </div>
    </section>
  )
}

export default Page;
