import { useState } from "react";
import { ArrowDown, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateSquareSum } from "@/lib/cycleDetector";
import type { CalculationResult } from "@shared/schema";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    if (!inputValue.trim()) {
      setError("Veuillez entrer un nombre entier positif");
      setResult(null);
      return;
    }
    
    if (!/^\d+$/.test(inputValue.trim())) {
      setError("Veuillez entrer un nombre entier positif (sans décimales)");
      setResult(null);
      return;
    }
    
    const num = parseInt(inputValue.trim(), 10);
    
    if (isNaN(num) || num < 0) {
      setError("Veuillez entrer un nombre entier positif");
      setResult(null);
      return;
    }
    
    setError("");
    const calculationResult = calculateSquareSum(num);
    setResult(calculationResult);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCalculate();
    }
  };

  const handleReset = () => {
    setInputValue("");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="text-center py-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Détecteur de Cycles Mathématiques
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entrez un nombre pour découvrir la suite formée par la somme des carrés de ses chiffres, et observez le cycle qui se forme
          </p>
        </header>

        <div className="max-w-md mx-auto mb-16">
          <div className="flex flex-col gap-4">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Entrez un nombre (ex: 15)"
              className="h-16 text-2xl font-mono text-center rounded-xl border-2"
              min="0"
              data-testid="input-number"
            />
            
            {error && (
              <p className="text-sm text-destructive text-center" data-testid="text-error">
                {error}
              </p>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={handleCalculate}
                className="flex-1 h-14 text-lg"
                data-testid="button-calculate"
              >
                Calculer
              </Button>
              
              {result && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  data-testid="button-reset"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {!result && (
          <Card className="p-6 rounded-xl max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Comment ça fonctionne ?</h3>
                <div className="text-sm leading-relaxed space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Exemple avec 15 :</strong>
                  </p>
                  <ul className="list-none space-y-1 ml-4">
                    <li>• <span className="font-mono">15</span> → 1² + 5² = 1 + 25 = <span className="font-mono font-semibold">26</span></li>
                    <li>• <span className="font-mono">26</span> → 2² + 6² = 4 + 36 = <span className="font-mono font-semibold">40</span></li>
                    <li>• <span className="font-mono">40</span> → 4² + 0² = 16 + 0 = <span className="font-mono font-semibold">16</span></li>
                    <li>• <span className="font-mono">16</span> → 1² + 6² = 1 + 36 = <span className="font-mono font-semibold">37</span></li>
                    <li className="text-foreground">• ... et ainsi de suite jusqu'à trouver un cycle !</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {result && (
          <div className="space-y-6" data-testid="results-container">
            <div className="space-y-6">
              {result.steps.map((step, index) => (
                <div
                  key={index}
                  className="relative"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <Card
                    className={`p-6 rounded-xl relative ${
                      step.isInCycle
                        ? "border-2 border-primary bg-primary/5"
                        : ""
                    }`}
                    data-testid={`card-step-${index}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <Badge
                        variant="secondary"
                        className="text-sm font-mono"
                        data-testid={`badge-step-${index}`}
                      >
                        Étape {step.stepNumber + 1}
                      </Badge>
                      
                      {step.isCycleStart && (
                        <Badge
                          variant="default"
                          className="text-sm font-semibold flex items-center gap-1"
                          data-testid="badge-cycle-detected"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Cycle Détecté
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-5xl lg:text-6xl font-mono font-bold mb-2" data-testid={`text-number-${index}`}>
                          {step.originalNumber}
                        </div>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {step.digits.map((digit, digitIndex) => (
                            <span
                              key={digitIndex}
                              className="inline-flex items-center gap-1 text-xl font-mono"
                            >
                              <span className="text-muted-foreground">{digit}</span>
                              {digitIndex < step.digits.length - 1 && (
                                <span className="text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xl lg:text-2xl font-mono text-center" data-testid={`text-calculation-${index}`}>
                          {step.calculation}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          Résultat
                        </div>
                        <div className="text-4xl font-mono font-bold text-primary" data-testid={`text-result-${index}`}>
                          {step.result}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {index < result.steps.length - 1 && (
                    <div className="flex justify-center py-3">
                      <ArrowDown
                        className={`h-8 w-8 ${
                          step.isInCycle ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.cycleLength > 0 && (
              <Card className="p-6 rounded-xl bg-primary/10 border-2 border-primary">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">
                    Cycle de longueur {result.cycleLength}
                  </h3>
                  <p className="text-muted-foreground">
                    Le cycle commence à l'étape {result.cycleStartIndex + 1} avec le nombre{" "}
                    <span className="font-mono font-bold text-foreground">
                      {result.steps[result.cycleStartIndex].originalNumber}
                    </span>
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
