
import type { FC } from 'react';
import { translations, type Language } from '@/lib/translations';

interface FooterProps {
  language: Language;
}

const Footer: FC<FooterProps> = ({ language }) => {
  const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
    let text = translations[key] ? translations[key][language] : String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };
  return (
    <footer className="pt-8 border-t border-border text-center">
      <p className="text-sm text-muted-foreground">
        {t('footerCopyright')}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {t('footerCraftedWithAi')}
      </p>
    </footer>
  );
};

export default Footer;
