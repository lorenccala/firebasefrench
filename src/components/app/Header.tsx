
import type { FC } from 'react';
import { GraduationCap } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const Header: FC<HeaderProps> = ({ language, onLanguageChange }) => {
  return (
    <header className="flex flex-col items-center mb-8 text-center relative">
      <div className="absolute top-0 right-0">
        <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>
      <div className="flex items-center space-x-3 mb-2 mt-10 sm:mt-0">
        <GraduationCap className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">
          {translations.appTitle[language]}
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        {translations.appSubtitle[language]}
      </p>
    </header>
  );
};

export default Header;
