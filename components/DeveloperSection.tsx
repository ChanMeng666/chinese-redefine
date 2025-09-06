'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Github, ExternalLink, Code2, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';

const DeveloperSection = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: { duration: 0.3 }
    }
  };

  const handleContact = (method: string) => {
    switch (method) {
      case 'email':
        window.open('mailto:chanmeng.dev@gmail.com?subject=网站定制开发咨询', '_blank');
        break;
      case 'github':
        window.open('https://github.com/ChanMeng666', '_blank');
        break;
      case 'repository':
        window.open('https://github.com/ChanMeng666/chinese-redefine', '_blank');
        break;
    }
  };

  return (
    <motion.div
      className="mt-12 mb-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo部分 */}
            <motion.div
              className="flex-shrink-0"
              variants={logoVariants}
              whileHover="hover"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-30"></div>
                <div className="relative bg-white rounded-full p-4 shadow-lg">
                  <Image
                    src="/chan_logo.svg"
                    alt="Chan Meng Logo"
                    width={64}
                    height={64}
                    className="w-16 h-16"
                  />
                </div>
              </div>
            </motion.div>

            {/* 内容部分 */}
            <div className="flex-1 text-center md:text-left">
              <motion.div variants={itemVariants} className="mb-3">
                <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Chan Meng
                  <span className="text-sm font-normal text-slate-500">AI Agent & 全栈开发工程师</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  专注于AI驱动的现代化网站开发，融合前沿技术与用户体验，让智能创意成为现实
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Code2 className="w-3 h-3" />
                  React/Next.js
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <ExternalLink className="w-3 h-3" />
                  全栈开发
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  AI系统集成
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3" />
                  UI/UX设计
                </span>
              </motion.div>

              {/* 联系按钮组 */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap justify-center md:justify-start gap-3"
              >
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => handleContact('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  邮件咨询
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-700 text-gray-700 hover:bg-gray-50 hover:border-gray-800 transition-all duration-300"
                  onClick={() => handleContact('github')}
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub主页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 transition-all duration-300"
                  onClick={() => handleContact('repository')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  项目仓库
                </Button>
              </motion.div>
            </div>

            {/* 右侧装饰 */}
            <motion.div
              className="hidden md:block flex-shrink-0"
              variants={itemVariants}
            >
              <div className="text-right text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">在线服务中</span>
                </div>
                <div className="text-slate-400 space-y-1">
                  <div>专业 · 高效 · 贴心</div>
                  <div className="text-blue-500 font-mono text-xs">
                    chanmeng.dev@gmail.com
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeveloperSection;
