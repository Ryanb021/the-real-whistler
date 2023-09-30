import WhistleCard from "@/components/cards/WhistleCard";
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
    </section>
  )
}

export default Page;
