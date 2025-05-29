import type { FC } from 'react';
import { GraduationCap } from 'lucide-react';

const Header: FC = () => {
  return (
    <header className="flex flex-col items-center mb-8 text-center">
      <div className="flex items-center space-x-3 mb-2">
        <GraduationCap className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">
          LinguaLeap
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Your AI-Powered Companion for Language Mastery
      </p>
    </header>
  );
};

export default Header;
