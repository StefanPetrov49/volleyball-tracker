import Schedule from "@/components/Schedule";
import NextMatch from "@/components/NextMatch";
import { matches } from "@/data/matches";

export default function Home() {
  return (
    <main className="container">
      <header className="hero">
        <div className="ball">🏐</div>
        <h1>Our Volleyball Team</h1>
        <p>Set. Spike. Win.</p>
      </header>
      <NextMatch matches={matches} />
      <Schedule matches={matches} />
    </main>
  );
}