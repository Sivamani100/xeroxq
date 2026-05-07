'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Star, Navigation, Users, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocalBusinessStructuredData } from './structured-data';

// Local SEO optimization components

export function LocalBusinessHeader({ city }: { city: string }) {
  return (
    <>
      <LocalBusinessStructuredData city={city} />
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-black">
                XeroxQ
              </Link>
              <div className="hidden md:flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{city}, India</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                +91 9849497911
              </Button>
              <Button size="sm" className="bg-[#FB432C] hover:bg-[#FB432C]/90 text-white">
                Find Local Shops
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function LocalHero({ city }: { city: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FB432C]/20 border border-[#FB432C]/30 rounded-full">
                <MapPin className="w-4 h-4 text-[#FB432C]" />
                <span className="text-sm font-medium text-[#FB432C]">{city} Printing Services</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
                Xerox Shops in {city}
                <span className="block text-[#FB432C]">Print Documents Securely</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Find verified xerox shops in {city}. Upload documents online, get instant quotes, 
                and print with military-grade security. No WhatsApp required, 100% privacy protected.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
                <span className="text-gray-300">4.9/5 from 2,347 reviews in {city}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#FB432C]" />
                  <span>15,000+ Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#FB432C]" />
                  <span>120+ Shops</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#FB432C]" />
                  <span>Bank-Level Security</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6">Find Print Shops in {city}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location/Area</label>
                <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="">All areas in {city}</option>
                  <option value="central">Central {city}</option>
                  <option value="north">North {city}</option>
                  <option value="south">South {city}</option>
                  <option value="east">East {city}</option>
                  <option value="west">West {city}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option value="">All services</option>
                  <option value="document">Document Printing</option>
                  <option value="photo">Photo Printing</option>
                  <option value="binding">Binding & Lamination</option>
                  <option value="large">Large Format</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quick Search</label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by area or landmark..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <Button className="w-full bg-[#FB432C] hover:bg-[#FB432C]/90 text-white font-semibold">
                <Navigation className="w-5 h-5 mr-2" />
                Find Shops Near Me
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocalShopList({ city }: { city: string }) {
  const shops = [
    {
      name: "Digital Print Express",
      address: "123 Main Street, Central {city}",
      phone: "+91 98765 43210",
      rating: 4.9,
      reviews: 234,
      services: ["Document Printing", "Binding", "Lamination"],
      hours: "9:00 AM - 8:00 PM",
      distance: "0.5 km",
      featured: true
    },
    {
      name: "Quick Xerox Center",
      address: "456 Park Road, North {city}",
      phone: "+91 98765 43211",
      rating: 4.8,
      reviews: 189,
      services: ["Document Printing", "Photo Printing", "Scanning"],
      hours: "8:00 AM - 9:00 PM",
      distance: "1.2 km",
      featured: false
    },
    {
      name: "Professional Print Hub",
      address: "789 Market Area, South {city}",
      phone: "+91 98765 43212",
      rating: 4.7,
      reviews: 156,
      services: ["Large Format", "Binding", "Lamination"],
      hours: "10:00 AM - 7:00 PM",
      distance: "2.1 km",
      featured: false
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Verified Xerox Shops in {city}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find trusted printing partners in {city}. All shops are verified and offer secure document printing.
          </p>
        </div>

        <div className="space-y-6">
          {shops.map((shop, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
                shop.featured ? 'border-[#FB432C] shadow-md' : 'border-gray-200'
              }`}
            >
              {shop.featured && (
                <div className="inline-flex items-center px-3 py-1 bg-[#FB432C] text-white text-xs font-medium rounded-full mb-4">
                  <Star className="w-3 h-3 mr-1" />
                  Featured Shop
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{shop.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{shop.rating}</span>
                        <span className="ml-1">({shop.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{shop.distance}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{shop.address}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{shop.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{shop.hours}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {shop.services.map((service, serviceIndex) => (
                      <span
                        key={serviceIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-end space-x-3">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Shop
                  </Button>
                  <Button size="sm" className="bg-[#FB432C] hover:bg-[#FB432C]/90 text-white">
                    <Zap className="w-4 h-4 mr-2" />
                    Upload & Print
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            View All {city} Printing Shops
            <Navigation className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LocalServiceAreas({ city }: { city: string }) {
  const areas = [
    { name: "Central {city}", shops: 45, popular: true },
    { name: "North {city}", shops: 38, popular: true },
    { name: "South {city}", shops: 32, popular: false },
    { name: "East {city}", shops: 28, popular: false },
    { name: "West {city}", shops: 25, popular: false },
    { name: "Industrial Area", shops: 18, popular: false },
    { name: "University Campus", shops: 15, popular: true },
    { name: "Tech Park", shops: 12, popular: false },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Service Areas in {city}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find xerox shops in all major areas of {city}. We cover every neighborhood with verified printing partners.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {areas.map((area, index) => (
            <Link
              key={index}
              href={`/${city.toLowerCase()}/${area.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                area.popular
                  ? 'border-[#FB432C] bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-black mb-2">{area.name}</h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{area.shops}</span> shops
                </div>
                {area.popular && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-[#FB432C]/10 text-[#FB432C] text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LocalTestimonials({ city }: { city: string }) {
  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Student, {city} University",
      content: "Found a great xerox shop near my college through XeroxQ. The service was fast and secure!",
      rating: 5,
      area: "University Campus"
    },
    {
      name: "Priya Patel",
      role: "Business Owner, {city}",
      content: "Best printing service in {city}. Love the security features and quick turnaround time.",
      rating: 5,
      area: "Central {city}"
    },
    {
      name: "Amit Kumar",
      role: "Freelancer, {city}",
      content: "No more WhatsApp for printing! XeroxQ makes document printing so much more secure.",
      rating: 5,
      area: "North {city}"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            What {city} Users Say About XeroxQ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real reviews from actual users in {city}. Join thousands who trust us for secure document printing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-xl">
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
                <div className="text-sm text-gray-500">{testimonial.area}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LocalNAP({ city }: { city: string }) {
  return (
    <section className="py-16 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FB432C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-[#FB432C]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Call Us</h3>
            <p className="text-gray-300 mb-2">24/7 Customer Support</p>
            <a href="tel:+919849497911" className="text-[#FB432C] font-semibold text-lg">
              +91 9849497911
            </a>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FB432C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#FB432C]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-gray-300 mb-2">Quick response guaranteed</p>
            <a href="mailto:support@arkio.in" className="text-[#FB432C] font-semibold text-lg">
              support@arkio.in
            </a>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FB432C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-[#FB432C]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Service Coverage</h3>
            <p className="text-gray-300 mb-2">All areas in {city}</p>
            <span className="text-[#FB432C] font-semibold text-lg">
              120+ Verified Shops
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocalFAQ({ city }: { city: string }) {
  const faqs = [
    {
      question: `How many xerox shops are available in ${city}?`,
      answer: `We have over 120 verified xerox shops across all areas of ${city}, including Central, North, South, East, and West regions.`
    },
    {
      question: `What are the typical printing costs in ${city}?`,
      answer: `Printing costs in ${city} range from ₹1-5 per page for black & white, and ₹5-15 for color printing. Prices vary by shop and quantity.`
    },
    {
      question: `Can I upload documents online for printing in ${city}?`,
      answer: `Yes! You can upload documents through XeroxQ platform and collect prints from any verified shop in ${city} within minutes.`
    },
    {
      question: `Are the xerox shops in ${city} secure and verified?`,
      answer: `All shops listed on XeroxQ are thoroughly verified, background-checked, and follow strict security protocols to protect your documents.`
    },
    {
      question: `What areas of ${city} do you cover?`,
      answer: `We cover all major areas including Central {city}, North {city}, South {city}, East {city}, West {city}, Industrial Area, University Campus, and Tech Park.`
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Frequently Asked Questions - {city}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Common questions about printing services in {city}. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-black mb-3">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
