import WhistleCard from "@/components/cards/WhistleCard";
import { fetchPosts } from "@/lib/actions/whistle.actions";
import { currentUser } from "@clerk/nextjs";

import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import Pagination from "@/components/shared/Pagination";
import { redirect } from "next/navigation";

async function Home ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if(!user) return null;

  const userInfo = await fetchUser(user.id);
  if(!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchPosts(
    searchParams.page ? +searchParams.page : 1,
    30
  );

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-reuslt">No whistles found</p>
        ) : (
          <>
            {result.posts.map((post) => (
              <WhistleCard
                key={post._id}
                id={post._id}
                currentUserId={user?.id || ""}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section >

      <Pagination 
        path='/'
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
}

export default Home;
