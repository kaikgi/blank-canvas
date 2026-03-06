import { PlanCardsGrid } from "@/components/billing/PlanCardsGrid";

export function PricingSection() {
  return (
    <section id="precos" className="py-24 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-label text-muted-foreground uppercase tracking-wider mb-4">Preços</p>
          <h2 className="text-display-md md:text-display-lg text-balance mb-6">Planos simples, sem surpresas</h2>
          <p className="text-body-lg text-muted-foreground">
            Escolha o plano ideal para o seu negócio e comece a usar agora.
          </p>
        </div>

        <PlanCardsGrid ctaLabel="Escolher plano" />

        <div className="text-center mt-12">
          <p className="text-body-md text-muted-foreground">
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
