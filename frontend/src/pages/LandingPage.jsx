import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Sparkles, Camera, Video, Palette, Star, CheckCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CREDIT_PLANS, FEATURES, TESTIMONIALS } from "@/lib/constants";

const iconMap = {
  Sparkles: Sparkles,
  Camera: Camera,
  Video: Video,
  Palette: Palette,
};

// Generate particles for subtle background animation
const generateParticles = () => {
  return [...Array(30)].map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 3,
  }));
};

const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-clip-text text-transparent ${className}`}
    style={{
      backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 25%, #BFBFBF 50%, #F5F5F5 75%, #FFFFFF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}
  >
    {children}
  </span>
);

const GlassCard = ({ children, className = "", isPrimary = false }) => (
  <div
    className={`relative backdrop-blur-xl border rounded-[18px] ${className} ${
      isPrimary
        ? 'border-white/50'
        : 'border-white/12'
    }`}
    style={{
      background: isPrimary
        ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      boxShadow: isPrimary ? '0 0 40px rgba(255,255,255,0.15)' : undefined,
    }}
  >
    {children}
  </div>
);

const LandingPage = () => {
  const particles = useMemo(() => generateParticles(), []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar variant="landing" />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        {/* Radial gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, #000000 70%)`,
          }}
        />

        {/* Subtle particles */}
        <div className="absolute inset-0 opacity-20">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                animation: `float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40 text-center relative z-10">
          <h1 className="font-sans text-5xl sm:text-6xl lg:text-7xl font-normal leading-tight mb-8 tracking-tight whitespace-nowrap">
            <GradientText>
              Professional Jewelry Photography
              <br />
              Without the Shoot
            </GradientText>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-12 max-w-2xl mx-auto font-light">
            Generate photorealistic jewelry images with AI.
            <br />
            No studios. No models. No expensive shoots.
            <br />
            Just instant, professional results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login" className="w-full sm:w-auto">
              <button
                className="w-full px-8 py-4 rounded-[14px] font-semibold text-black text-base transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 25%, #BFBFBF 50%, #F5F5F5 75%, #FFFFFF 100%)',
                  boxShadow: 'var(--shadow-glow)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 0 40px rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'var(--shadow-glow)';
                }}
              >
                Generate Images Now <span className="ml-2">→</span>
              </button>
            </Link>
            <button
              className="w-full sm:w-auto px-8 py-4 rounded-[14px] font-semibold border border-white/25 text-white bg-transparent transition-all duration-300 hover:border-white/50"
            >
              Explore Gallery
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-sans text-4xl sm:text-5xl font-semibold mb-6 tracking-tight">
              Why Jewelry Businesses Love JewelAI
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light">
              Generate professional jewelry images in minutes. From rings to mangalsutras, showcase your collection with luxury.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = iconMap[feature.icon];
              return (
                <GlassCard key={feature.title} className="p-8">
                  <div className="mb-6 flex justify-center">
                    <Icon className="w-12 h-12 text-white opacity-70" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-white mb-4 tracking-tight text-center">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light text-center">
                    {feature.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl sm:text-5xl font-semibold mb-6 tracking-tight">
              Generate More Images. Spend Less.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light">
              Pick a credit plan and start creating. Each plan includes credits for image generation, regeneration, and video creation. Cancel anytime.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CREDIT_PLANS.map((plan, index) => (
              <GlassCard
                key={plan.id}
                className={`p-8 ${plan.popular ? 'lg:scale-105' : ''}`}
                isPrimary={plan.popular}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black border border-white/30 rounded-full text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="font-sans text-xl font-semibold text-white mb-3 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-8 font-light h-14 leading-relaxed">
                    {index === 0
                      ? 'Perfect for testing JewelAI. Generate up to 10 jewelry images and see the quality yourself.'
                      : index === 1
                      ? 'Ideal for small jewelry stores. Generate 100+ images monthly to build your entire catalog.'
                      : 'For serious merchants. Unlimited monthly generation with batch processing and API access.'}
                  </p>

                  <div className="mb-8">
                    <span className="text-5xl font-semibold text-white">₹{plan.price}</span>
                    <span className="text-slate-400 font-light"> /month</span>
                  </div>

                  <button
                    className={`w-full py-3 rounded-[12px] font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'text-black'
                        : 'border border-white/25 text-white hover:border-white/50'
                    }`}
                    style={
                      plan.popular
                        ? {
                            background:
                              'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 25%, #BFBFBF 50%, #F5F5F5 75%, #FFFFFF 100%)',
                          }
                        : {}
                    }
                  >
                    Start Free Trial
                  </button>
                </div>

                <div className="border-t border-white/10 pt-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300 font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-12 font-light">
            Cancel anytime. No credit card required.
          </p>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl sm:text-5xl font-semibold mb-6 tracking-tight">
              Trusted by Jewelry Merchants Across India
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light">
              Jewelers and e-commerce businesses have cut photography costs by 90% and increased listings by 5x.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <GlassCard key={testimonial.name} className="p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-white text-white"
                    />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed font-light">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400 font-light">{testimonial.location}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 bg-black relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-sans text-5xl sm:text-6xl font-semibold mb-8 tracking-tight">
            Ready to
            <br />
            <GradientText>Transform Your Jewelry Photography?</GradientText>
          </h2>

          <p className="text-slate-400 max-w-2xl mx-auto mb-12 text-lg font-light">
            Join hundreds of jewelry merchants who've already upgraded their product imaging.
          </p>

          <Link to="/login">
            <button
              className="px-10 py-4 rounded-[14px] font-semibold text-black text-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 25%, #BFBFBF 50%, #F5F5F5 75%, #FFFFFF 100%)',
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 0 50px rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            >
              Start Creating Free <span className="ml-2">→</span>
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER DIVIDER */}
      <div className="border-t border-white/8" />

      <Footer />

      {/* Animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
