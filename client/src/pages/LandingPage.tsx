import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FileText, Database, Clock, Cpu, Radio, Zap, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-circuit-pattern bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/80 to-gray-900/90 dark:from-gray-900/90 dark:to-primary-900/80"></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Your AI Study Partner for Electronics & Telecommunication
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl">
                Get instant help with exam preparation, viva questions, and course material understanding using our AI-powered chatbot.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link 
                  to={isAuthenticated ? "/chat" : "/auth"} 
                  className="btn bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3 rounded-lg text-center"
                >
                  Start Chatting
                </Link>
                <button 
                  onClick={scrollToFeatures}
                  className="btn btn-outline text-white border-white hover:bg-white/10 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg"
                >
                  <span>Learn More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary-500/20 rounded-full backdrop-blur-xl"></div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent-500/20 rounded-full backdrop-blur-xl"></div>
                
                <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-xl">
                  <div className="bg-white/10 rounded-xl p-6">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-primary-800" />
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-xl rounded-tl-none max-w-sm">
                        <p className="text-gray-800 dark:text-gray-200">
                          Can you explain the differences between amplitude modulation and frequency modulation?
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-9 h-9 flex-shrink-0 rounded-full bg-primary-600 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-primary-50 dark:bg-primary-900/60 p-3 rounded-xl rounded-tl-none max-w-sm">
                        <p className="text-gray-800 dark:text-gray-200">
                          <strong>Amplitude Modulation (AM)</strong> and <strong>Frequency Modulation (FM)</strong> differ in how they encode information:
                        </p>
                        <ul className="list-disc pl-5 mt-2 text-gray-800 dark:text-gray-200">
                          <li>AM varies the amplitude of the carrier wave</li>
                          <li>FM varies the frequency of the carrier wave</li>
                        </ul>
                        <p className="mt-2 text-gray-800 dark:text-gray-200">
                          FM offers better noise immunity and audio quality, while AM provides longer range and simpler circuitry.
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="h-10 border-l-2 border-dashed border-gray-300 absolute left-4"></div>
                      <div className="pt-10 pl-10">
                        <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg text-xs text-gray-500">
                          Typing...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-100 dark:from-gray-900 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Designed for Electronics & Telecom Students
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our AI assistant is specifically trained on Electronics and Telecommunication curriculum to provide accurate and helpful responses.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6 text-primary-600" />,
                title: "Multimodal Support",
                description: "Upload PDFs, images, and diagrams to get comprehensive assistance with complex electronics concepts."
              },
              {
                icon: <Database className="w-6 h-6 text-primary-600" />,
                title: "Curriculum-aligned",
                description: "Trained on your department's syllabus, textbooks, and reference material for accurate subject knowledge."
              },
              {
                icon: <Clock className="w-6 h-6 text-primary-600" />,
                title: "Session Memory",
                description: "The AI remembers your conversation context, allowing for natural follow-up questions."
              },
              {
                icon: <Zap className="w-6 h-6 text-primary-600" />,
                title: "Instant Answers",
                description: "Get immediate responses to complex questions about electronics, circuits, signals, and systems."
              },
              {
                icon: <Cpu className="w-6 h-6 text-primary-600" />,
                title: "Exam Preparation",
                description: "Practice with previous year questions and get detailed explanations for better understanding."
              },
              {
                icon: <Radio className="w-6 h-6 text-primary-600" />,
                title: "Visualized Learning",
                description: "Receive explanations with diagrams and visual aids for better comprehension of complex concepts."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="mb-4 p-3 rounded-full bg-primary-100 dark:bg-primary-900/50 w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                What Students Say
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Hear from fellow students about how EchoLearn has helped them excel in their studies.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "This AI assistant helped me understand complex topics like Digital Signal Processing that I was struggling with for weeks.",
                name: "Priya Sharma",
                role: "Final Year B.Tech"
              },
              {
                quote: "The ability to upload circuit diagrams and get instant feedback on my designs has been invaluable for my projects.",
                name: "Rahul Kumar",
                role: "Third Year Student"
              },
              {
                quote: "I aced my viva thanks to the practice sessions with EchoLearn. It asked me the exact questions my professors did!",
                name: "Ananya Patel",
                role: "Second Year Student"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-wave-pattern bg-cover bg-center"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Elevate Your Electronics & Telecom Studies?
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Join thousands of students who are already improving their grades and understanding concepts better with EchoLearn.
              </p>
              <Link 
                to={isAuthenticated ? "/chat" : "/auth"} 
                className="btn bg-white text-primary-800 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg inline-block"
              >
                Start Learning Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;