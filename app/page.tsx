import ResearchPlanner from '@/components/ResearchPlanner/ResearchPlanner';
import { GraphProvider } from '@/components/ResearchPlanner/context/GraphContext';

export default function Home() {
  return (
    <main className="h-screen bg-gray-100">
      <div className="h-full">
        <GraphProvider>
          <ResearchPlanner />
        </GraphProvider>
      </div>
    </main>
  );
}