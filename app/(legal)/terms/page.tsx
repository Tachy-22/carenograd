import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Carenograd
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing and using Carenograd, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Description of Service</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Carenograd is an AI-powered assistant designed to help users with graduate school 
                  applications, research, and academic guidance. Our service includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI-powered conversational assistance</li>
                  <li>Document analysis and feedback</li>
                  <li>Research guidance and recommendations</li>
                  <li>Application management tools</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">User Responsibilities</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>As a user of Carenograd, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and truthful information</li>
                  <li>Use the service for lawful purposes only</li>
                  <li>Respect intellectual property rights</li>
                  <li>Not attempt to harm or exploit our systems</li>
                  <li>Keep your account credentials secure</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">AI-Generated Content</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Carenograd uses artificial intelligence to generate responses and recommendations. 
                  You acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI responses may not always be accurate or complete</li>
                  <li>You should verify information independently</li>
                  <li>AI guidance supplements but does not replace professional advice</li>
                  <li>We are not responsible for decisions made based on AI recommendations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Privacy and Data</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand 
                  how we collect, use, and protect your information. By using our service, 
                  you consent to our data practices as outlined in our Privacy Policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The Carenograd platform, including its design, features, and AI models, 
                  is owned by us and protected by intellectual property laws. You may not:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Copy, modify, or distribute our platform</li>
                  <li>Reverse engineer our AI systems</li>
                  <li>Use our branding without permission</li>
                  <li>Create derivative works based on our service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Carenograd provides educational and informational services. We are not liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Academic admission decisions</li>
                  <li>Career or educational outcomes</li>
                  <li>Damages resulting from use of our service</li>
                  <li>Loss of data or content</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Service Availability</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We strive to provide reliable service but cannot guarantee 100% uptime. 
                  We reserve the right to modify, suspend, or discontinue our service 
                  at any time with or without notice.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Account Termination</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may terminate your account if you violate these terms or engage in 
                  prohibited activities. You may also delete your account at any time 
                  through your account settings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update these terms from time to time. Continued use of our service 
                  after changes constitutes acceptance of the new terms. We will notify 
                  users of significant changes via email or platform notification.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions about these terms, please contact us at:
                </p>
                <p>Email: legal@carenograd.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}