export const metadata = {
  title: 'Privacy Policy — Alpha Pegasi Q',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <h1 className="text-4xl font-bold mb-2 text-white">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10"><em>Last updated: [LAUNCH_DATE]</em></p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">What We Collect</h2>
        <p className="text-gray-300 leading-relaxed">
          When you use Alpha Pegasi Q, we collect: your email address (via Clerk authentication),
          chat messages you send to agents, world state data (agent events, relationships, beliefs),
          and basic usage analytics (page views, feature usage).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">How We Use Your Data</h2>
        <p className="text-gray-300 leading-relaxed">
          Your data is used to: provide the service (running your personal world, enabling agent
          conversations), process payments (via Dodo Payments), improve the product (via anonymized
          analytics), and communicate with you about your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Third-Party Processors</h2>
        <ul className="space-y-2 text-gray-300">
          <li><strong className="text-white">Supabase</strong> — Database hosting (PostgreSQL)</li>
          <li><strong className="text-white">Clerk</strong> — Authentication</li>
          <li><strong className="text-white">Groq</strong> — AI model processing. Chat messages are sent to Groq for response generation. Groq does not train on API inputs.</li>
          <li><strong className="text-white">Dodo Payments</strong> — Payment processing (Merchant of Record)</li>
          <li><strong className="text-white">PostHog</strong> — Product analytics</li>
          <li><strong className="text-white">Sentry</strong> — Error monitoring</li>
          <li><strong className="text-white">Vercel</strong> — Application hosting</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">AI Processing Disclosure</h2>
        <p className="text-gray-300 leading-relaxed">
          Your chat messages are sent to AI model providers (currently Groq) for processing.
          These providers process your messages to generate agent responses. Per Groq&apos;s API
          policy, they do not use API inputs for model training.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Data Retention</h2>
        <p className="text-gray-300 leading-relaxed">
          Chat sessions are archived after 30 days (message content is cleared). Account data
          is retained until you request deletion. World state data (agent events, relationships)
          is retained as long as your account exists.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Your Rights</h2>
        <p className="text-gray-300 leading-relaxed">
          You have the right to request deletion of your data. Email{' '}
          <a href="mailto:omarkagzi@gmail.com" className="underline text-gray-100 hover:text-white">
            omarkagzi@gmail.com
          </a>{' '}
          and we will process your request within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Cookies</h2>
        <p className="text-gray-300 leading-relaxed">
          We use cookies for authentication (required for the service to function) and analytics
          (PostHog). You can manage cookie preferences in your browser settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          For privacy questions, email{' '}
          <a href="mailto:omarkagzi@gmail.com" className="underline text-gray-100 hover:text-white">
            omarkagzi@gmail.com
          </a>.
        </p>
      </section>
    </main>
  );
}
