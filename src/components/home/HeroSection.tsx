import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Users, Scissors, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";

import professional1 from "@/assets/avatars/professional-1.jpg";
import professional2 from "@/assets/avatars/professional-2.jpg";
import professional3 from "@/assets/avatars/professional-3.jpg";
import professional4 from "@/assets/avatars/professional-4.jpg";
import professional5 from "@/assets/avatars/professional-5.jpg";

const professionalAvatars = [professional1, professional2, professional3, professional4, professional5];

const examples = [
  {
    type: "barbearia",
    label: "Barbearia",
    icon: Scissors,
    title: "Barbearia Royal",
    slug: "barbearia-royal",
    weekly: 18,
    services: [
      { name: "Corte + Barba", duration: "45min", price: "R$ 75" },
      { name: "Fade", duration: "30min", price: "R$ 55" },
      { name: "Sobrancelha", duration: "15min", price: "R$ 25" },
    ],
  },
  {
    type: "nail",
    label: "Nail Design",
    icon: Sparkles,
    title: "Nail Studio",
    slug: "nail-studio",
    weekly: 12,
    services: [
      { name: "Alongamento em Gel", duration: "2h", price: "R$ 180" },
      { name: "Manicure Completa", duration: "1h", price: "R$ 60" },
      { name: "Spa dos Pés", duration: "45min", price: "R$ 75" },
    ],
  },
  {
    type: "estetica",
    label: "Estética",
    icon: Heart,
    title: "Clínica Estética",
    slug: "clinica-estetica",
    weekly: 9,
    services: [
      { name: "Limpeza de Pele", duration: "1h", price: "R$ 120" },
      { name: "Drenagem Linfática", duration: "50min", price: "R$ 150" },
      { name: "Massagem Relaxante", duration: "1h", price: "R$ 160" },
    ],
  },
];

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchTo = useCallback((index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 200);
  }, [activeIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      switchTo((activeIndex + 1) % examples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, switchTo]);

  const current = examples[activeIndex];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-dots opacity-50" />
      {/* Gradient orb */}
      <div className="absolute top-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-muted rounded-full blur-3xl opacity-60" />

      <div className="relative w-full max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="animate-fade-in-up text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-body-sm text-muted-foreground">
                Teste grátis por 7 dias — sem cartão de crédito
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-display-md sm:text-display-lg lg:text-display-xl text-balance max-w-[650px] mx-auto lg:mx-0 mb-6">
              Agendamentos simples.{" "}
              <span className="text-muted-foreground">Negócio eficiente.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-body-lg text-muted-foreground max-w-[520px] mx-auto lg:mx-0 mb-8">
              Transforme a experiência de agendamento dos seus clientes com uma plataforma
              minimalista, poderosa e feita para profissionais que valorizam seu tempo.
            </p>

            {/* CTAs */}
            <div className="flex justify-center lg:justify-start mb-8">
              <Button variant="hero" size="xl" asChild>
                <Link to="/cadastro">
                  Começar grátis
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center lg:justify-start gap-6">
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

          {/* Right content - Mockup card with tabs */}
          <div className="relative animate-fade-in max-w-[380px] mx-auto lg:max-w-[370px] lg:mx-auto" style={{ animationDelay: "0.2s" }}>
            {/* Category tabs */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {examples.map((ex, i) => {
                const Icon = ex.icon;
                return (
                  <button
                    key={ex.type}
                    onClick={() => switchTo(i)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${i === activeIndex
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon size={13} />
                    {ex.label}
                  </button>
                );
              })}
            </div>

            {/* Main card */}
            <div
              className={`
                bg-card rounded-2xl border border-border shadow-strong p-6 space-y-5
                transition-all duration-300 ease-out
                ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
              `}
            >
              {/* Header with badge inside */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Calendar className="text-primary-foreground" size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{current.title}</h3>
                    <p className="text-xs text-muted-foreground">agendali.com/{current.slug}</p>
                  </div>
                </div>
                {/* Weekly badge - inside card */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 shrink-0">
                  <Users className="text-success" size={13} />
                  <span className="text-xs font-semibold text-success">+{current.weekly}</span>
                </div>
              </div>

              {/* Services preview */}
              <div className="space-y-2.5">
                <p className="text-label text-muted-foreground uppercase tracking-wider">Serviços populares</p>
                {current.services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-premium cursor-pointer"
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
          </div>
        </div>
      </div>
    </section>
  );
}
