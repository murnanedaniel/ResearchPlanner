import ResearchPlanner from '@/components/ResearchPlanner/ResearchPlanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto flex justify-center">
        <ResearchPlanner />
      </div>
    </main>
  );
}