'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Shield, Globe } from 'lucide-react'
import { Button } from '@/components/button'
import JobazThemeToggle from '@/components/JobazThemeToggle'
import Link from 'next/link'

const features = [
  { icon: <Sparkles className="w-6 h-6" />, text: 'Advanced AI Writing' },
  { icon: <Zap className="w-6 h-6" />, text: 'Lightning Fast Generation' },
  { icon: <Shield className="w-6 h-6" />, text: 'ATS Optimization' },
  { icon: <Globe className="w-6 h-6" />, text: 'Multiple Export Formats' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: ['Limited AI generations', 'Basic layouts', 'PDF export'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Unlimited AI generations',
      'All premium layouts',
      'PDF & DOCX export',
      'AI Compare feature',
      'Priority support',
      'Cover letter generation',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Brand customization',
      'API access',
      'Dedicated support',
    ],
    highlight: false,
  },
]

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-platinum dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-accent" />
            <span className="text-2xl font-heading font-bold">AI CV Generator Pro</span>
          </Link>
          <JobazThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-violet-accent to-purple-600 bg-clip-text text-transparent">
            Upgrade to Pro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock the full power of AI-driven CV generation with premium features and unlimited access.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-violet-accent/10 rounded-xl flex items-center justify-center text-violet-accent">
                {feature.icon}
              </div>
              <span className="font-medium">{feature.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-soft ${
                plan.highlight ? 'ring-2 ring-violet-accent shadow-large' : ''
              }`}
            >
              {plan.highlight && (
                <div className="bg-violet-accent text-white text-center py-2 rounded-full text-sm font-semibold mb-6">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'primary' : 'outline'}
                className="w-full"
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade Now'}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 bg-gradient-to-r from-violet-accent to-purple-600 rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-heading font-bold mb-4">
            Ready to transform your career?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join professionals worldwide who trust AI CV Generator Pro.
          </p>
          <Button size="lg" className="bg-white text-violet-accent hover:bg-gray-100">
            Start Free Trial
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
