
import type { FC } from 'react';
import { GraduationCap } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  // Removed app title/subtitle props as they are handled in page.tsx or SidebarHeader
}

// This component might become very simple or even be removed if all its 
// functionality is integrated elsewhere (like LanguageSwitcher in SidebarFooter)
// For now, let's assume it might still be used for specific page headers if needed,
// or can be removed.
// For this refactor, its main responsibility (title, subtitle, language switcher)
// has been moved to page.tsx's sidebar layout.

const Header: FC<HeaderProps> = ({ language, onLanguageChange }) => {
  // If this component is no longer rendering the main app title and language switcher,
  // its content needs to be re-evaluated. For now, it's effectively unused in the new layout.
  // It could be repurposed for section-specific headers if desired.
  return null; 
  // Example of what it might have been if kept for a general title area:
  /*
    <header className="flex flex-col items-center mb-8 text-center">
      <div className="flex items-center space-x-3 mb-2">
        <GraduationCap className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">
          {translations.appTitle[language]}
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        {translations.appSubtitle[language]}
      </p>
      <div className="mt-4">
         <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>
    </header>
  */
};

export default Header;

    