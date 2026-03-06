import { PlanCardsGrid } from "@/components/billing/PlanCardsGrid";

export function PricingSection() {
  return (
    <section id="precos" className="py-16 md:py-24">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-label text-muted-foreground uppercase tracking-wider mb-3">Preços</p>
          <h2 className="text-display-sm md:text-display-md text-balance mb-4">Planos simples, sem surpresas</h2>
          <p className="text-body-md text-muted-foreground">
            Escolha o plano ideal para o seu negócio e comece a usar agora.
          </p>
        </div>

        <PlanCardsGrid ctaLabel="Escolher plano" />

        <div className="text-center mt-10">
          <p className="text-body-sm text-muted-foreground">
            Precisa de mais?{" "}
            <a href="https://www.agendali.online/contato" className="text-foreground font-medium animate-underline">
              Fale com nosso time
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
