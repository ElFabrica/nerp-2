// Layout mínimo do painel da TV, fora do chrome de (main): sem sidebar/header
// do dashboard, em tela cheia e fundo escuro para leitura à distância.
export default function KitchenDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {children}
    </div>
  );
}
