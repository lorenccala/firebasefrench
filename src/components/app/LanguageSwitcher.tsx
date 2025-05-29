
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
    <div className="flex items-center gap-2">
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onLanguageChange('en')}
      >
        <span role="img" aria-label="UK Flag">🇬🇧</span>
        <span>{translations.english[currentLanguage]}</span>
      </Button>
      <Button
        variant={currentLanguage === 'al' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onLanguageChange('al')}
      >
        <span role="img" aria-label="Albanian Flag">🇦🇱</span>
        <span>{translations.albanian[currentLanguage]}</span>
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
