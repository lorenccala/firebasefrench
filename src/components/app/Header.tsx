"use client";

import React from 'react';
import { Languages, BookOpen, Sparkles, User, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { translations, type Language } from '@/lib/translations';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  studyStreak?: number;
  totalSentences?: number;
}

const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  studyStreak = 0,
  totalSentences = 0
}) => {
  const t = (key: keyof typeof translations) => {
    return translations[key]?.[language] ?? String(key);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {t('appTitle')}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI-Powered Learning
                </p>
              </div>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center gap-4">
            {/* Study Stats */}
            {totalSentences > 0 && (
              <div className="hidden md:flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Languages className="h-3 w-3 mr-1" />
                  {totalSentences} Sentences
                </Badge>
                {studyStreak > 0 && (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    🔥 {studyStreak} Day Streak
                  </Badge>
                )}
              </div>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <LanguageSwitcher
                currentLanguage={language}
                onLanguageChange={onLanguageChange}
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Stats */}
        {totalSentences > 0 && (
          <div className="flex md:hidden items-center justify-center gap-2 pb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              <Languages className="h-3 w-3 mr-1" />
              {totalSentences} Sentences
            </Badge>
            {studyStreak > 0 && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                🔥 {studyStreak} Days
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Subtle gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </header>
  );
};

export default Header;

    