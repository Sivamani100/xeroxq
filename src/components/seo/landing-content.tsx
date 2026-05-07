'use client';

import { useState } from 'react';
import { CheckCircle, Star, Users, Shield, Zap, MapPin, Phone, Mail, Clock, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContextualLinks } from './internal-linking';

// SEO-optimized hero section with conversion focus
export function SEOHero() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
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
              <p className="text-xl text-gray-300 leading-relaxed">
                India's #1 privacy-first document printing platform. Upload files online, 
                find local xerox shops, and print without WhatsApp. Zero-knowledge encryption, 
                military-grade security, 100% free.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-[#FB432C] hover:bg-[#FB432C]/90 text-white font-semibold px-8 py-4"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Printing Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-black"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Find Shops Near Me
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6">Quick Print Estimate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Type</label>
                <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400">
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <Button className="w-full bg-[#FB432C] hover:bg-[#FB432C]/90 text-white font-semibold">
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Trusted by 50,000+ Users Across India
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
              <div className="text-3xl font-bold text-black mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-black">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
                <div className="text-sm text-gray-500">{testimonial.location}</div>
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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Why Choose XeroxQ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                  <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            XeroxQ vs Traditional Printing Methods
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See why XeroxQ is the superior choice for secure document printing in India.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="font-semibold text-black">Feature</div>
            <div className="font-semibold text-[#FB432C] text-center">XeroxQ</div>
            <div className="font-semibold text-gray-600 text-center">WhatsApp</div>
            <div className="font-semibold text-gray-600 text-center">Traditional</div>
          </div>
          
          {comparisonData.map((row, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 last:border-b-0">
              <div className="font-medium text-black">{row.feature}</div>
              <div className="text-center text-green-600">{row.xeroxq}</div>
              <div className="text-center text-red-600">{row.whatsapp}</div>
              <div className="text-center text-yellow-600">{row.traditional}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="bg-[#FB432C] hover:bg-[#FB432C]/90 text-white font-semibold px-8">
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
    <section className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Experience Secure Printing?
          </h2>
          <p className="text-xl text-gray-300">
            Join 50,000+ users who trust XeroxQ for their document printing needs. 
            Start printing securely in under 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#FB432C] hover:bg-[#FB432C]/90 text-white font-semibold px-8 py-4"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Printing Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-black"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Support: +91 9849497911
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
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
