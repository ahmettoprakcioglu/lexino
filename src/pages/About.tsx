import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  BookOpen,
  Brain,
  Trophy,
  Sparkles,
  Users,
  Target,
  Zap,
  Clock,
  LineChart
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Custom Word Lists",
    description: "Create personalized vocabulary lists for different topics, languages, or difficulty levels."
  },
  {
    icon: Brain,
    title: "Smart Learning",
    description: "Our spaced repetition system helps you learn words at the optimal time for maximum retention."
  },
  {
    icon: Trophy,
    title: "Progress Tracking",
    description: "Monitor your learning progress with detailed statistics and achievements."
  },
  {
    icon: Sparkles,
    title: "Multiple Languages",
    description: "Learn vocabulary in any language with our flexible platform that supports all languages."
  },
  {
    icon: Clock,
    title: "Study Reminders",
    description: "Set reminders to maintain a consistent learning schedule and never miss a study session."
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description: "Get insights into your learning patterns and optimize your study routine."
  }
];

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

const Section = ({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="py-16">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-lg text-muted-foreground"
        >
          {description}
        </motion.p>
      </div>
      {children}
    </div>
  </section>
);

export function About() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="relative">
      {/* Hero Section */}
      <Section
        title="Why Choose Lexino?"
        description="Lexino is designed to make vocabulary learning efficient, engaging, and personalized to your needs."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      {/* How It Works */}
      <Section
        title="How It Works"
        description="Our scientifically-backed approach to vocabulary learning"
      >
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">1. Create Your Lists</h3>
                <p className="mt-2 text-muted-foreground">
                  Start by creating custom word lists for the topics you want to learn.
                  Add words, translations, example sentences, and more.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">2. Practice Regularly</h3>
                <p className="mt-2 text-muted-foreground">
                  Use our smart review system to practice your words. The system adapts
                  to your learning pace and shows words at the optimal time for retention.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">3. Track Your Progress</h3>
                <p className="mt-2 text-muted-foreground">
                  Monitor your learning journey with detailed statistics and progress tracking.
                  See how your vocabulary grows over time.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Team Section */}
      <Section
        title="Built by Language Learners"
        description="We're a team of language enthusiasts who understand the challenges of vocabulary learning."
      >
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground"
          >
            Our mission is to make vocabulary learning more efficient and enjoyable.
            We combine proven learning techniques with modern technology to create
            the best possible learning experience.
          </motion.p>
        </div>
      </Section>

      {/* CTA Section */}
      <Section
        title="Ready to Start Learning?"
        description="Join thousands of learners who are expanding their vocabulary with Lexino."
      >
        <div className="mx-auto max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center gap-4"
          >
            <Button size="lg" onClick={() => navigate("/signup")}>
              Get Started
            </Button>
            {!user && (
              <Button size="lg" variant="outline" onClick={() => navigate("/signin")}>
                Sign In
              </Button>
            )}
          </motion.div>
        </div>
      </Section>
    </div>
  );
} 