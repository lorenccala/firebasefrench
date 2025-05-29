
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Brain, Zap, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from './LoadingSpinner';
import type { Sentence } from '@/types';
import { explainGrammar, type ExplainGrammarOutput } from '@/ai/flows/grammar-explainer';
import { useToast } from '@/hooks/use-toast';
import { translations, type Language } from '@/lib/translations';

interface GrammarExplainerProps {
  language: Language;
  sentence: Sentence | null;
  disabled?: boolean;
}

const GrammarExplainer: FC<GrammarExplainerProps> = ({ language, sentence, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainGrammarOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
    let text = translations[key] ? translations[key][language] : String(key);
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };
  
  const showTranslatedToast = (messageKey: keyof typeof translations, variant: "default" | "destructive" = "default", params?: Record<string, string|number>) => {
    let message = translations[messageKey] ? translations[messageKey][language] : String(messageKey);
     if (params) {
      Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, String(value));
      });
    }
    toast({
      title: variant === "destructive" ? t('errorTitle') : t('notificationTitle'),
      description: message,
      variant: variant,
    });
  };


  const handleExplain = async () => {
    if (!sentence) {
      showTranslatedToast("noSentenceToExplain", "destructive");
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setExplanation(null);

    try {
      // The AI flow is currently designed for French sentences.
      // If this needs to be language-aware, the flow itself would need modification.
      const result = await explainGrammar({ sentence: sentence.french });
      setExplanation(result);
    } catch (err) {
      console.error("Error explaining grammar:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      showTranslatedToast("failedGrammarExplanation", "destructive");
    } finally {
      setIsLoading(false);
    }
  };
  
  const dialogDescriptionText = sentence ? t('grammarExplanationDescription', { sentence: sentence.french }) : "";


  return (
    <>
      <Button
        onClick={handleExplain}
        disabled={disabled || !sentence}
        variant="outline"
        className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      >
        <Lightbulb className="mr-2 h-4 w-4" />
        {t('explainGrammarButton')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              {t('grammarExplanationTitle')}
            </DialogTitle>
            {sentence && (
                 <DialogDescription dangerouslySetInnerHTML={{ __html: dialogDescriptionText }} />
            )}
          </DialogHeader>
          
          <ScrollArea className="flex-grow pr-6 -mr-6 my-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-40">
                <LoadingSpinner size={32}/>
                <p className="mt-2 text-sm text-muted-foreground">{t('generatingExplanation')}</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <Zap className="h-4 w-4" />
                <AlertTitle>{t('errorTitle')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {explanation && (
              <div className="space-y-3 text-sm whitespace-pre-wrap p-1 rounded-md bg-muted/50">
                <p>{explanation.explanation}</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">{t('closeButton')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GrammarExplainer;
