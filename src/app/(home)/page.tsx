import HeroSection from "./_components/hero-section";

export default function Home() {
  console.log(process.env.NASA_S2S_ENCRYPTION_KEY);
  return (
    <div className="relative">
      <HeroSection />
    </div>
  );
}
