import { CalendarDays, ChefHat, Clock, Heart, Salad, Users, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#3A332C] selection:bg-[#EBE6DE] relative overflow-hidden">
      {/* Subtle Background Layers */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#F5F2EB] to-transparent -z-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#AF8F7C]/10 blur-[120px] -z-10" />
      <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#8C7362]/5 blur-[100px] -z-10" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/60 border-b border-[#AF8F7C]/10 transition-all duration-300">
        <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-[#AF8F7C]/10 p-2 rounded-xl group-hover:bg-[#AF8F7C]/20 transition-colors">
              <ChefHat size={24} className="text-[#AF8F7C]" />
            </div>
            <span className="text-[#3A332C] font-semibold text-xl tracking-wide font-serif">MenuMagic</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="#features" className="hidden md:block text-sm font-medium tracking-wide text-[#7A7168] hover:text-[#3A332C] transition-colors">
              Features
            </Link>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center relative">
        {/* Product Name Badge */}
        <div className="inline-flex items-center gap-2 bg-[#AF8F7C]/10 border border-[#AF8F7C]/20 text-[#8C7362] px-5 py-2 rounded-full text-sm font-semibold tracking-widest uppercase mb-8">
          <ChefHat size={15} />
          MenuMagic
        </div>

        {/* Tagline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight text-[#3A332C] mb-6 leading-[1.1]">
          Your Weekly Menu, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8C7362] to-[#AF8F7C] italic pr-2">
            Perfectly Planned.
          </span>
        </h1>

        {/* Value Proposition */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#7A7168] mb-4 leading-relaxed font-light">
          The AI-powered meal planner that turns your family&apos;s dietary needs, schedule, and preferences into a ready-to-shop weekly menu — in under 60 seconds.
        </p>
        <p className="max-w-xl mx-auto text-base text-[#AF8F7C] font-medium mb-12">
          No more "what&apos;s for dinner?" stress. No more wasted groceries. Just delicious, personalized meals every week.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/planner" className="group w-full sm:w-auto bg-[#AF8F7C] text-white px-9 py-4 rounded-full font-semibold text-lg hover:bg-[#9A7B68] transition-all shadow-xl shadow-[#AF8F7C]/25 flex items-center justify-center gap-3 border border-[#AF8F7C]">
            <Utensils size={20} className="text-white/80" />
            <span>Get Started For Free</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/sample-plan" className="w-full sm:w-auto bg-white/50 backdrop-blur-sm text-[#3A332C] border border-[#EBE6DE] px-8 py-4 rounded-full font-medium text-lg hover:bg-white hover:border-[#AF8F7C]/30 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md">
            <CalendarDays size={20} className="text-[#AF8F7C]" />
            View Sample Plan
          </Link>
        </div>

        {/* Social Proof / Trust Signal */}
        <p className="mt-8 text-sm text-[#A69B91] font-light">
          Free to use &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Ready in 60 seconds
        </p>
      </section>

      {/* Features/Inputs Section */}
      <section id="features" className="py-32 border-t border-[#EBE6DE]/50 bg-white relative">
        <div className="absolute inset-0 bg-[#F5F2EB]/30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <span className="text-[#AF8F7C] font-semibold tracking-wider uppercase text-sm mb-4 block">The Algorithm</span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#3A332C] mb-6">Hyper-Personalized to Your Life</h2>
            <p className="text-xl text-[#7A7168] max-w-2xl mx-auto font-light">
              Our system takes in all the messy variables of real life to craft a menu that actually works for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards Loop */}
            {[
              { icon: Users, title: "Family Composition", desc: "Specify exactly who is eating. Input the number of adults, kids, and total servings needed so you never waste food." },
              { icon: Clock, title: "Smart Scheduling", desc: "Tell us your preferred cooking schedule. Need quick 20-minute meals on Tuesdays? We adapt to your week." },
              { icon: Utensils, title: "Meal Structure", desc: "Plan exactly what you need. Choose from Breakfast, Lunch, Dinner, or Snacks. Skip what you have covered." },
              { icon: Salad, title: "Dietary & Cuisine", desc: "Strict keto? Gluten-free? Craving Mexican food? Mix and match dietary requirements effortlessly." },
              { icon: Heart, title: "Kid-Approved Focus", desc: "Input specific child preferences and aversions. We ensure there's always an element they'll actually eat." }
            ].map((feat, i) => (
              <div key={i} className="group p-10 rounded-[2rem] bg-[#FDFBF7] border border-[#EBE6DE] hover:border-[#AF8F7C]/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#AF8F7C]/10">
                <div className="w-14 h-14 bg-white text-[#AF8F7C] border border-[#EBE6DE] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#AF8F7C] group-hover:text-white transition-colors duration-500 shadow-sm">
                  <feat.icon size={26} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif mb-4 text-[#3A332C]">{feat.title}</h3>
                <p className="text-[#7A7168] leading-relaxed font-light">
                  {feat.desc}
                </p>
              </div>
            ))}

            {/* Feature 6 - CTA Card */}
            <div className="p-10 rounded-[2rem] bg-gradient-to-br from-[#8C7362] to-[#6B584B] text-white flex flex-col justify-center items-start text-left shadow-2xl shadow-[#8C7362]/30 border border-[#8C7362]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-white/5 group-hover:scale-110 transition-transform duration-700">
                <ChefHat size={180} />
              </div>
              <h3 className="text-3xl font-serif mb-4 relative z-10">Ready to Start?</h3>
              <p className="text-[#E8E2DD] mb-8 relative z-10 font-light text-lg">Build your first custom menu in under 60 seconds.</p>
              <Link href="/planner" className="bg-[#FDFBF7] text-[#8C7362] px-8 py-4 rounded-full font-medium w-full hover:bg-white transition-colors shadow-lg flex items-center justify-between group/btn relative z-10">
                <span>Launch Planner</span>
                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#231F1C] text-[#A69B91] py-16 text-center border-t border-[#3A332C]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 text-[#FDFBF7] font-serif text-2xl mb-8">
            <ChefHat size={28} className="text-[#AF8F7C]" />
            <span>MenuMagic</span>
          </div>
          <div className="flex justify-center gap-8 mb-12 text-sm">
            <Link href="#" className="hover:text-[#FDFBF7] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#FDFBF7] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#FDFBF7] transition-colors">Contact</Link>
          </div>
          <p className="text-sm font-light tracking-wide">© {new Date().getFullYear()} MenuMagic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
