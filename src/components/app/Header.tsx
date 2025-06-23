"use client";

import React from 'react';
import { Languages, BookOpen, Sparkles, User, Settings, Moon, Sun, Menu } from 'lucide-react';
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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-12 xs:h-14 sm:h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-none">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-accent rounded-full flex items-center justify-center">
                  <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="text-sm xs:text-base sm:text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent truncate">
                  <span className="hidden xs:inline">{t('appTitle')}</span>
                  <span className="xs:hidden">ProntoLingo</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI-Powered Learning
                </p>
              </div>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            {/* Study Stats - Desktop Only */}
            {totalSentences > 0 && (
              <div className="hidden lg:flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                  <Languages className="h-3 w-3 mr-1" />
                  {totalSentences} Sentences
                </Badge>
                {studyStreak > 0 && (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                    🔥 {studyStreak} Day Streak
                  </Badge>
                )}
              </div>
            )}

            {/* Compact Stats - Tablet Only */}
            {totalSentences > 0 && (
              <div className="hidden md:flex lg:hidden items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                  {totalSentences}
                </Badge>
                {studyStreak > 0 && (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                    🔥 {studyStreak}
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
              size="sm"
              onClick={toggleTheme}
              className="hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Stats Row */}
        {totalSentences > 0 && (
          <div className="flex sm:hidden items-center justify-center gap-2 pb-2 pt-1 px-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              <Languages className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">{totalSentences} Sentences</span>
              <span className="xs:hidden">{totalSentences}</span>
            </Badge>
            {studyStreak > 0 && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                🔥 <span className="hidden xs:inline">{studyStreak} Days</span>
                <span className="xs:hidden">{studyStreak}</span>
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

    