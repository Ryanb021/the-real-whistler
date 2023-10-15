import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import WhistleCard from "../cards/WhistleCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const WhistlesTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result: any;

  if(accountType === 'Community') {
    result = await fetchCommunityPosts(accountId);
  } else {
    result = await fetchUserPosts(accountId);
  }

  if(!result) redirect('/')

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.whistles.map((whistle: any) => (
        <WhistleCard
        key={whistle._id}
        id={whistle._id}
        currentUserId={currentUserId}
        parentId={whistle.parentId}
        content={whistle.text}
        author={
          accountType === 'User'
          ? { name: result.name, image: result.image, id: result.id}:
          { name: whistle.author.name, image: whistle.author.image, id: whistle.author.id }
        } // TODO
        community={whistle.community} // TODO
        createdAt={whistle.createdAt}
        comments={whistle.children}
      />
      ))}
    </section>
  )
}

export default WhistlesTab;
