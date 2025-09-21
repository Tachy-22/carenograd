import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or communicate with us.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (email, name)</li>
                  <li>Messages and conversations with our AI assistant</li>
                  <li>Files and documents you upload</li>
                  <li>Usage data and analytics</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve our AI assistant services</li>
                  <li>Personalize your experience</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Information Sharing</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>With service providers who assist us in operating our platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Data Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement appropriate technical and organizational measures to protect your 
                  personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Object to processing of your information</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies and Tracking</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies and similar technologies to enhance your experience, 
                  analyze usage patterns, and provide personalized content.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this privacy policy from time to time. We will notify you of 
                  any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions about this privacy policy, please contact us at:
                </p>
                <p>Email: privacy@carenograd.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}