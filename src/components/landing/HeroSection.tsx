import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Languages, ListTodo, Brain } from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative overflow-hidden rounded-xl border bg-background p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const features = [
  {
    icon: Languages,
    title: "Multiple Languages",
    description: "Learn any language with our flexible platform"
  },
  {
    icon: ListTodo,
    title: "Smart Lists",
    description: "Organize your vocabulary with custom word lists"
  },
  {
    icon: Brain,
    title: "Spaced Repetition",
    description: "Learn efficiently with our smart review system"
  }
];

const FeaturesGrid = () => {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
        >
          <FeatureCard {...feature} />
        </motion.div>
      ))}
    </div>
  );
};

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container relative space-y-24 py-24">
        {/* Hero content */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Master New Languages with{" "}
            <span className="text-primary">Lexino</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-muted-foreground"
          >
            Your personal vocabulary builder that adapts to your learning style.
            Create custom word lists, track your progress, and learn efficiently.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Button size="lg" className="rounded-full" onClick={() => navigate("/login")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/about")}>
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Features grid */}
        <FeaturesGrid />

        {/* Floating elements */}
        <div className="absolute left-1/2 top-1/2 -z-10">
          <div className="relative left-[-50%] top-[-50%] h-[500px] w-[500px]">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute h-full w-full rounded-full bg-primary/20 blur-3xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 