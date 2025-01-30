import ResearchPlanner from '@/components/ResearchPlanner/ResearchPlanner';
import { GraphProvider } from '@/components/ResearchPlanner/context/GraphContext';

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <GraphProvider>
        <ResearchPlanner />
      </GraphProvider>
    </main>
  );
}