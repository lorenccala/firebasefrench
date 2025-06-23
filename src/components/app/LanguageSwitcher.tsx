"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/translations';
import { translations } from '@/lib/translations';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('en')}
        className="h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium"
      >
        <span role="img" aria-label="UK Flag" className="mr-1">🇬🇧</span>
        <span className="hidden xs:inline">EN</span>
      </Button>
      <Button
        variant={currentLanguage === 'al' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLanguageChange('al')}
        className="h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium"
      >
        <span role="img" aria-label="Albanian Flag" className="mr-1">🇦🇱</span>
        <span className="hidden xs:inline">AL</span>
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
