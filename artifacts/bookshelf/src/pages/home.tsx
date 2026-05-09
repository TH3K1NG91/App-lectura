import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users, UploadCloud, Library, Star, Zap, Globe2 } from "lucide-react";

const STATS = [
  { value: "10K+", label: "Libros" },
  { value: "50K+", label: "Lectores" },
  { value: "15+", label: "Géneros" },
  { value: "100%", label: "Gratis" },
];

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Comparte tu obra",
    desc: "Sube tus PDFs y EPUBs con portadas y descripciones. Hazlos públicos o mantenlos privados.",
  },
  {
    icon: Library,
    title: "Construye tu biblioteca",
    desc: "Guarda tus lecturas favoritas. Organiza lo que has leído y lo que está pendiente.",
  },
  {
    icon: Users,
    title: "Conecta con lectores",
    desc: "Comenta en libros, envía mensajes directos y descubre nuevos autores.",
  },
  {
    icon: Globe2,
    title: "17 idiomas",
    desc: "Lumina habla tu idioma. Disponible en español, inglés, francés, árabe, chino y más.",
  },
  {
    icon: Zap,
    title: "Lectura instantánea",
    desc: "Lee online sin descargar. Nuestro lector integrado funciona en cualquier dispositivo.",
  },
  {
    icon: Star,
    title: "Feed personalizado",
    desc: "Recomendaciones según tus géneros favoritos. Descubre libros hechos para ti.",
  },
];

const QUOTES = [
  { text: "Un faro en el mar de historias.", author: "— María G., lectora" },
  { text: "Por fin un lugar donde mis libros encuentran su hogar.", author: "— Carlos P., escritor" },
  { text: "La comunidad más cálida para los amantes de los libros.", author: "— Sofía R., autora" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-[92dvh] flex flex-col items-center justify-center text-center overflow-hidden px-4 py-24">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(43_100%_50%_/_0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(222_36%_8%)_0%,_transparent_60%)]" />
        
        {/* Floating gold orbs */}
        <div className="pointer-events-none absolute top-24 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-32 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Tu faro literario
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground tracking-tight leading-[1.05]">
            <span className="text-primary">Lumina.</span>
            <br />
            <span className="text-foreground/90">Enciende tu</span>
            <br />
            <span className="text-foreground/80">imaginación.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Descubre, comparte y da vida a las historias. La plataforma comunitaria donde libros y lectores se encuentran.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-base h-12 px-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20">
                Únete a la comunidad
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-10 border-border hover:bg-accent">
                <BookOpen className="mr-2 h-4 w-4" />
                Explorar libros
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-primary animate-pulse" />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section className="py-16 px-4 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl md:text-5xl font-serif font-bold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Por qué Lumina</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Todo lo que necesitas</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Una plataforma completa para lectores y escritores apasionados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTES / TESTIMONIALS ──────────────────────── */}
      <section className="py-20 px-4 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">La comunidad habla</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Voces de Lumina</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {QUOTES.map((q) => (
              <div key={q.author} className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-4">
                <div className="flex gap-1 text-primary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-foreground/90 font-serif italic text-lg leading-relaxed">"{q.text}"</p>
                <p className="text-sm text-muted-foreground">{q.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-background text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <Sparkles className="h-10 w-10 text-primary mx-auto opacity-80" />
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            ¿Listo para encender tu historia?
          </h2>
          <p className="text-muted-foreground text-lg">
            Únete a miles de lectores y escritores que ya son parte de Lumina.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="mt-4 text-base h-12 px-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xl shadow-primary/20">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="py-10 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-serif font-bold text-xl">Lumina</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground transition-colors">Explorar</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Registrarse</Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Lumina. Tu faro literario.
          </p>
        </div>
      </footer>
    </div>
  );
}
