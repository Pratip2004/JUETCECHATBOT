import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Brain, Zap, Target, Users, Lightbulb, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Smart Learning",
      description: "Access comprehensive study materials and get instant answers to your questions using advanced AI technology."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "RAG Technology",
      description: "Our Retrieval-Augmented Generation (RAG) system ensures accurate and context-aware responses based on your course materials."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Quick Responses",
      description: "Get detailed explanations, examples, and solutions in a structured format that's easy to understand."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Subject Focus",
      description: "Specialized in Electronics and Telecommunication subjects with comprehensive coverage of all topics."
    }
  ];

  const futurePlans = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Collaborative Learning",
      description: "Future plans include group study features and peer-to-peer learning capabilities."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Advanced AI Features",
      description: "Integration of more advanced AI capabilities including visual learning and interactive problem-solving."
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Expanded Subjects",
      description: "Plans to expand coverage to more subjects and specialized fields of study."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back to Home Button */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          to="/"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About AI Study Buddy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your intelligent companion for mastering Electronics and Telecommunication subjects through advanced AI technology.
          </p>
        </motion.div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-primary-600 dark:text-primary-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">
              Our RAG (Retrieval-Augmented Generation) system combines the power of advanced language models with your course materials to provide accurate and context-aware responses. When you ask a question:
            </p>
            <ol className="list-decimal list-inside space-y-4 text-gray-600 dark:text-gray-300">
              <li>The system searches through your course materials to find relevant information</li>
              <li>It combines this information with its understanding to generate a comprehensive response</li>
              <li>Responses are structured with clear sections including descriptions, examples, and key points</li>
              <li>You get instant, accurate answers that help you understand the concepts better</li>
            </ol>
          </div>
        </motion.div>

        {/* Future Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Future Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {futurePlans.map((plan, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="text-primary-600 dark:text-primary-400 mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {plan.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage; 