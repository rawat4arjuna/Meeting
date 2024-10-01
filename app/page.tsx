import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div>
      <h1>Video Calling App</h1>
      <Link href="/create">Create a New Meeting</Link>
    </div>
  );
};

export default Home;
