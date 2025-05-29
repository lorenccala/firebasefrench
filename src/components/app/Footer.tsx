
import type { FC } from 'react';

const Footer: FC = () => {
  return (
    <footer className="pt-8 border-t border-border text-center">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} LinguaLeap. All rights reserved.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Crafted with AI for language learners.
      </p>
    </footer>
  );
};

export default Footer;
