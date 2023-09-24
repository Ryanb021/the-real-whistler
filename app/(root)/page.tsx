export default async function Home() {

  const result = await fetchPosts();
  return (
    <div>
      <h1 className="head-text text-left">Home</h1>
    </div>
  )
}
