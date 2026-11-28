'use client';

import { useState } from 'react';
import { CheckCircle, Star, Users, Shield, Zap, MapPin, Phone, Mail, Clock, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContextualLinks } from './internal-linking';

// SEO-optimized hero section with conversion focus
export function SEOHero() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative bg-[#171717] dark:bg-[#19191B] border-b border-white/[0.08] text-white py-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FB432C]/20 border border-[#FB432C]/30 rounded-full">
                <Shield className="w-4 h-4 text-[#FB432C]" />
                <span className="text-sm font-medium text-[#FB432C]">100% Secure Printing</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
                Find Xerox Shops Near You
                <span className="block text-[#FB432C]">Print Documents Securely</span>
              </h1>
              <p className="text-xl text-white/75 leading-relaxed">
                India's #1 privacy-first document printing platform. Upload files online, 
                find local xerox shops, and print without WhatsApp. Zero-knowledge encryption, 
                military-grade security, 100% free.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold px-8 py-4"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Printing Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/25 text-white hover:bg-white hover:text-[#171717]"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Find Shops Near Me
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FB432C]" />
                <span>50,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FB432C]" />
                <span>500+ Cities</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FB432C]" />
                <span>Bank-Level Security</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/15">
            <h3 className="text-2xl font-bold mb-6">Quick Print Estimate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Type</label>
                <select className="w-full px-4 py-3 bg-[#232325] border border-white/20 rounded-lg text-white">
                  <option value="">Select document type</option>
                  <option value="pdf">PDF Document</option>
                  <option value="docx">Word Document</option>
                  <option value="image">Image File</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Number of Pages</label>
                <input 
                  type="number" 
                  placeholder="Enter number of pages"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                />
              </div>
              <Button className="w-full bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold">
                Get Instant Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Trust signals and social proof section
export function TrustSignals() {
  const testimonials = [
    {
      name: "Raj Kumar",
      role: "Student, Delhi University",
      content: "XeroxQ saved me so much time! Found a print shop near my college in 2 minutes.",
      rating: 5,
      location: "Delhi"
    },
    {
      name: "Priya Sharma",
      role: "Business Owner, Mumbai",
      content: "The security features are amazing. No more worrying about sensitive documents on WhatsApp.",
      rating: 5,
      location: "Mumbai"
    },
    {
      name: "Amit Patel",
      role: "Freelancer, Bangalore",
      content: "Best printing service in India. Fast, secure, and affordable. Highly recommend!",
      rating: 5,
      location: "Bangalore"
    }
  ];

  const stats = [
    { number: "500+", label: "Cities Covered", icon: MapPin },
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "1M+", label: "Documents Printed", icon: Shield },
    { number: "4.9/5", label: "User Rating", icon: Star },
  ];

  return (
    <section className="py-20 bg-[#F4F4F5] dark:bg-[#161618]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#171717] dark:text-[#EDEDED] mb-4">
            Trusted by 50,000+ Users Across India
          </h2>
          <p className="text-xl text-[#525252] dark:text-[#A1A1A6] max-w-3xl mx-auto">
            Join thousands of students, professionals, and businesses who trust XeroxQ for secure document printing.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#FB432C]/10 rounded-full flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-[#FB432C]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#171717] dark:text-[#EDEDED] mb-2">{stat.number}</div>
              <div className="text-[#525252] dark:text-[#A1A1A6]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white dark:bg-[#19191B] p-6 rounded-xl shadow-sm border border-[#171717]/[0.08] dark:border-white/[0.08]">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-[#525252] dark:text-[#A1A1A6] mb-4 italic">"{testimonial.content}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#171717] dark:text-[#EDEDED]">{testimonial.name}</div>
                  <div className="text-sm text-[#525252] dark:text-[#A1A1A6]">{testimonial.role}</div>
                </div>
                <div className="text-sm text-[#737373] dark:text-[#85858B]">{testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features and benefits section
export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Zero-knowledge encryption ensures your documents are completely private. No data stored, no traces left.",
      benefits: ["AES-256 encryption", "Auto-deletion after printing", "No data mining", "GDPR compliant"]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Upload and print documents in under 5 minutes. No app downloads, no registrations required.",
      benefits: ["5-minute processing", "Instant QR codes", "Real-time tracking", "Mobile optimized"]
    },
    {
      icon: MapPin,
      title: "500+ Cities Covered",
      description: "Find verified print shops in every major city across India. From Delhi to Bangalore, we've got you covered.",
      benefits: ["All major cities", "Verified shops", "Quality assured", "Local support"]
    },
    {
      icon: Users,
      title: "WhatsApp Alternative",
      description: "Stop sharing sensitive documents on WhatsApp. Our secure platform protects your privacy.",
      benefits: ["No WhatsApp required", "Privacy-first", "Secure file transfer", "Professional interface"]
    }
  ];

  return (
    <section className="py-20 bg-[#FAFAFA] dark:bg-[#111113]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#171717] dark:text-[#EDEDED] mb-4">
            Why Choose XeroxQ?
          </h2>
          <p className="text-xl text-[#525252] dark:text-[#A1A1A6] max-w-3xl mx-auto">
            Experience the future of document printing with our revolutionary privacy-first platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#FB432C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-[#FB432C]" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#171717] dark:text-[#EDEDED]">{feature.title}</h3>
                  <p className="text-[#525252] dark:text-[#A1A1A6]">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-[#525252] dark:text-[#A1A1A6]">
                        <CheckCircle className="w-4 h-4 text-[#16A34A] dark:text-[#4CC38A] mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <ContextualLinks context="printing" />
        </div>
      </div>
    </section>
  );
}

// Comparison section
export function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Privacy Protection",
      xeroxq: "✅ Military-grade",
      whatsapp: "❌ No privacy",
      traditional: "⚠️ Basic"
    },
    {
      feature: "Document Security",
      xeroxq: "✅ Zero-knowledge",
      whatsapp: "❌ Stored forever",
      traditional: "⚠️ Manual"
    },
    {
      feature: "Processing Time",
      xeroxq: "✅ 5 minutes",
      whatsapp: "⚠️ Variable",
      traditional: "❌ Hours"
    },
    {
      feature: "Location Coverage",
      xeroxq: "✅ 500+ cities",
      whatsapp: "⚠️ Limited",
      traditional: "❌ Local only"
    },
    {
      feature: "Cost",
      xeroxq: "✅ Free platform",
      whatsapp: "⚠️ Data cost",
      traditional: "⚠️ Travel cost"
    },
    {
      feature: "Mobile Support",
      xeroxq: "✅ Full mobile",
      whatsapp: "✅ Mobile only",
      traditional: "❌ Desktop only"
    }
  ];

  return (
    <section className="py-20 bg-[#F4F4F5] dark:bg-[#161618] border-y border-[#171717]/[0.08] dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#171717] dark:text-[#EDEDED] mb-4">
            XeroxQ vs Traditional Printing Methods
          </h2>
          <p className="text-xl text-[#525252] dark:text-[#A1A1A6] max-w-3xl mx-auto">
            See why XeroxQ is the superior choice for secure document printing in India.
          </p>
        </div>

        <div className="bg-white dark:bg-[#19191B] rounded-xl shadow-sm border border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-6 bg-[#F4F4F5] dark:bg-[#232325] border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
            <div className="font-semibold text-[#171717] dark:text-[#EDEDED]">Feature</div>
            <div className="font-semibold text-[#FB432C] text-center">XeroxQ</div>
            <div className="font-semibold text-[#525252] dark:text-[#A1A1A6] text-center">WhatsApp</div>
            <div className="font-semibold text-[#525252] dark:text-[#A1A1A6] text-center">Traditional</div>
          </div>
          
          {comparisonData.map((row, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08] last:border-b-0">
              <div className="font-medium text-[#171717] dark:text-[#EDEDED]">{row.feature}</div>
              <div className="text-center text-[#16A34A] dark:text-[#4CC38A]">{row.xeroxq}</div>
              <div className="text-center text-[#DC2626] dark:text-[#E5484D]">{row.whatsapp}</div>
              <div className="text-center text-amber-600 dark:text-amber-400">{row.traditional}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold px-8">
            Try XeroxQ Now - It's Free
          </Button>
        </div>
      </div>
    </section>
  );
}

// CTA section
export function CTASection() {
  return (
    <section className="py-20 bg-[#171717] dark:bg-[#19191B] border-y border-white/[0.08] text-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Experience Secure Printing?
          </h2>
          <p className="text-xl text-white/80">
            Join 50,000+ users who trust XeroxQ for their document printing needs. 
            Start printing securely in under 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold px-8 py-4"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Printing Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/25 text-white hover:bg-white hover:text-[#171717]"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Support: +91 9849497911
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>100% secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
