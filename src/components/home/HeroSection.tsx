import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";

import professional1 from "@/assets/avatars/professional-1.jpg";
import professional2 from "@/assets/avatars/professional-2.jpg";
import professional3 from "@/assets/avatars/professional-3.jpg";
import professional4 from "@/assets/avatars/professional-4.jpg";
import professional5 from "@/assets/avatars/professional-5.jpg";

const professionalAvatars = [
  professional1,
  professional2,
  professional3,
  professional4,
  professional5,
];
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] md:min-h-screen flex items-center pt-20 md:pt-16 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-dots opacity-50" />
      
      {/* Gradient orb */}
      <div className="absolute top-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-muted rounded-full blur-3xl opacity-60" />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-body-sm text-muted-foreground">
                Teste grátis por 7 dias — sem cartão de crédito
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-display-md sm:text-display-lg lg:text-display-xl text-balance">
              Agendamentos simples.{" "}
              <span className="text-muted-foreground">Negócio eficiente.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-body-lg text-muted-foreground max-w-lg">
              Transforme a experiência de agendamento dos seus clientes com uma plataforma 
              minimalista, poderosa e feita para profissionais que valorizam seu tempo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/cadastro">
                  Começar grátis
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {professionalAvatars.map((avatar, i) => (
                  <img
                    key={i}
                    src={avatar}
                    alt={`Profissional ${i + 1}`}
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <div className="text-body-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2.500+</span> profissionais confiam na Agendali
              </div>
            </div>
          </div>

          {/* Right content - Preview card */}
          <div className="relative animate-fade-in max-w-md mx-auto lg:max-w-none" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              {/* Main card */}
              <div className="bg-card rounded-2xl border border-border shadow-strong p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Studio Elegance</h3>
                    <p className="text-body-sm text-muted-foreground">agendali.online/studio-elegance</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Calendar className="text-primary-foreground" size={24} />
                  </div>
                </div>

                {/* Services preview */}
                <div className="space-y-3">
                  <p className="text-label text-muted-foreground uppercase tracking-wider">Serviços populares</p>
                  {[
                    { name: "Corte + Barba", duration: "45min", price: "R$ 75" },
                    { name: "Progressiva", duration: "2h", price: "R$ 180" },
                    { name: "Hidratação", duration: "1h", price: "R$ 90" },
                  ].map((service, i) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-premium cursor-pointer"
                      style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                    >
                      <div>
                        <p className="font-medium text-body-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={12} />
                          {service.duration}
                        </p>
                      </div>
                      <span className="font-semibold text-body-sm">{service.price}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button variant="default" className="w-full">
                  Agendar horário
                  <ArrowRight size={16} />
                </Button>
              </div>

              {/* Floating notification */}
              <div className="absolute -top-4 -right-4 hidden sm:block bg-card rounded-xl border border-border shadow-elegant p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Users className="text-success" size={18} />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">+15 agendamentos</p>
                    <p className="text-xs text-muted-foreground">esta semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
