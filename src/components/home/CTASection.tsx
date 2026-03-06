import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-primary text-primary-foreground">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-display-md md:text-display-lg text-balance mb-6">
            Pronto para transformar seus agendamentos?
          </h2>
          <p className="text-body-lg text-primary-foreground/80 mb-8">
            Teste grátis por 7 dias. Junte-se a milhares de profissionais que já simplificaram sua rotina com Agendali.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/cadastro">
                Começar grátis
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
