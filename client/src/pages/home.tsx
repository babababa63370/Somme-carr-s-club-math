import { useState, useEffect, useRef } from "react";
import { ArrowDown, RefreshCw, Info, History, Trash2, Clock, BarChart3, Download, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateSquareSum } from "@/lib/cycleDetector";
import { getHistory, addToHistory, clearHistory, deleteHistoryEntry } from "@/lib/historyStorage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CalculationResult, HistoryEntry, MultiCalculationResult } from "@shared/schema";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [multiResults, setMultiResults] = useState<MultiCalculationResult[]>([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const multiResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleCalculate = () => {
    if (!inputValue.trim()) {
      setError("Veuillez entrer un ou plusieurs nombres entiers positifs");
      setResult(null);
      setMultiResults([]);
      return;
    }
    
    const numbers = inputValue
      .trim()
      .split(/[,\s]+/)
      .filter(s => s.length > 0);
    
    const invalidNumbers = numbers.filter(n => !/^\d+$/.test(n));
    if (invalidNumbers.length > 0) {
      setError("Veuillez entrer uniquement des nombres entiers positifs (séparés par des virgules ou espaces)");
      setResult(null);
      setMultiResults([]);
      return;
    }
    
    const parsedNumbers = numbers.map(n => parseInt(n, 10));
    const invalidParsed = parsedNumbers.filter(n => isNaN(n) || n < 0);
    if (invalidParsed.length > 0) {
      setError("Veuillez entrer uniquement des nombres entiers positifs");
      setResult(null);
      setMultiResults([]);
      return;
    }
    
    setError("");
    
    if (parsedNumbers.length === 1) {
      const calculationResult = calculateSquareSum(parsedNumbers[0]);
      setResult(calculationResult);
      setMultiResults([]);
      addToHistory(parsedNumbers[0], calculationResult);
    } else {
      const results = parsedNumbers.map(num => ({
        inputNumber: num,
        result: calculateSquareSum(num),
      }));
      setResult(null);
      setMultiResults(results);
      results.forEach(r => addToHistory(r.inputNumber, r.result));
    }
    
    setHistory(getHistory());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCalculate();
    }
  };

  const handleReset = () => {
    setInputValue("");
    setResult(null);
    setMultiResults([]);
    setError("");
  };

  const handleLoadFromHistory = (entry: HistoryEntry) => {
    setInputValue(entry.inputNumber.toString());
    setResult(entry.result);
    setMultiResults([]);
    setError("");
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleDeleteEntry = (id: string) => {
    deleteHistoryEntry(id);
    setHistory(getHistory());
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportImage = async () => {
    const element = result ? resultsRef.current : multiResultsRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `cycle-detector-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Erreur lors de l'export en image:", error);
    }
  };

  const handleExportPDF = async () => {
    const element = result ? resultsRef.current : multiResultsRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`cycle-detector-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export en PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="text-center py-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <h1 className="text-4xl font-bold flex-1">
              Détecteur de Cycles Mathématiques
            </h1>
            <div className="flex-1 flex justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                data-testid="button-toggle-history"
              >
                <History className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entrez un nombre pour découvrir la suite formée par la somme des carrés de ses chiffres, et observez le cycle qui se forme
          </p>
        </header>

        <div className="max-w-md mx-auto mb-16">
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Entrez un ou plusieurs nombres (ex: 15, 42, 89)"
              className="h-16 text-2xl font-mono text-center rounded-xl border-2"
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
              
              {(result || multiResults.length > 0) && (
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

        {showHistory && (
          <Card className="p-6 rounded-xl mb-8" data-testid="history-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Historique des Calculs
              </h2>
              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  data-testid="button-clear-history"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout effacer
                </Button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun calcul dans l'historique
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.map((entry) => (
                    <Card
                      key={entry.id}
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`history-entry-${entry.id}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className="flex-1"
                          onClick={() => handleLoadFromHistory(entry)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-mono font-bold">
                              {entry.inputNumber}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {entry.result.steps.length} étapes
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Cycle: {entry.result.cycleLength}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          data-testid={`button-delete-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        )}

        {!result && multiResults.length === 0 && (
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

        {multiResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleExportImage}
                data-testid="button-export-image"
              >
                <FileImage className="h-4 w-4 mr-2" />
                Exporter en Image
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter en PDF
              </Button>
            </div>

            <div ref={multiResultsRef} data-testid="multi-results-container">
            <Card className="p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Comparaison de {multiResults.length} Nombres
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {multiResults.map((multiResult, idx) => (
                  <Card
                    key={idx}
                    className="p-4 border-2"
                    data-testid={`multi-result-${idx}`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl font-mono font-bold text-primary">
                        {multiResult.inputNumber}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">Étapes totales</span>
                        <span className="font-mono font-bold">
                          {multiResult.result.steps.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">Longueur du cycle</span>
                        <span className="font-mono font-bold">
                          {multiResult.result.cycleLength}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">Avant le cycle</span>
                        <span className="font-mono font-bold">
                          {multiResult.result.cycleStartIndex}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          setInputValue(multiResult.inputNumber.toString());
                          setResult(multiResult.result);
                          setMultiResults([]);
                        }}
                        data-testid={`button-view-details-${idx}`}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card className="p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6 text-center">
                Comparaison Graphique
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="etape"
                    label={{ value: "Étape", position: "insideBottom", offset: -5 }}
                    domain={[1, Math.max(...multiResults.map(r => r.result.steps.length))]}
                  />
                  <YAxis
                    label={{ value: "Valeur", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                            {payload.map((entry, index) => (
                              <div key={index} className="mb-1">
                                <p className="font-semibold" style={{ color: entry.color }}>
                                  Nombre {entry.name}
                                </p>
                                <p className="font-mono">
                                  Étape {entry.payload.etape}: {entry.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {multiResults.map((multiResult, idx) => {
                    const colors = [
                      "hsl(var(--chart-1))",
                      "hsl(var(--chart-2))",
                      "hsl(var(--chart-3))",
                      "hsl(var(--chart-4))",
                      "hsl(var(--chart-5))",
                    ];
                    return (
                      <Line
                        key={idx}
                        type="monotone"
                        data={multiResult.result.steps.map((step) => ({
                          etape: step.stepNumber + 1,
                          valeur: step.originalNumber,
                        }))}
                        dataKey="valeur"
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name={multiResult.inputNumber.toString()}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </Card>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleExportImage}
                data-testid="button-export-image"
              >
                <FileImage className="h-4 w-4 mr-2" />
                Exporter en Image
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter en PDF
              </Button>
            </div>

            <div ref={resultsRef} data-testid="results-container">
            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="steps" data-testid="tab-steps">
                  Étapes Détaillées
                </TabsTrigger>
                <TabsTrigger value="graph" data-testid="tab-graph">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Graphique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-6 mt-6">
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

                <Card className="p-6 rounded-xl" data-testid="card-statistics">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Statistiques du Calcul
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-total-steps">
                    {result.steps.length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Étapes totales
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-cycle-length">
                    {result.cycleLength}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Longueur du cycle
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-steps-before-cycle">
                    {result.cycleStartIndex}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Étapes avant le cycle
                  </div>
                </div>
              </div>
                </Card>
              </TabsContent>

              <TabsContent value="graph" className="mt-6">
                <Card className="p-6 rounded-xl">
                  <h3 className="text-xl font-semibold mb-6 text-center">
                    Visualisation de la Séquence
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={result.steps.map((step) => ({
                        etape: step.stepNumber + 1,
                        valeur: step.originalNumber,
                        estDansCycle: step.isInCycle,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="etape"
                        label={{ value: "Étape", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        label={{ value: "Valeur", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                                <p className="font-semibold">Étape {data.etape}</p>
                                <p className="font-mono text-primary">
                                  Valeur: {data.valeur}
                                </p>
                                {data.estDansCycle && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Dans le cycle
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {result.cycleStartIndex > 0 && (
                        <ReferenceLine
                          x={result.cycleStartIndex + 1}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="5 5"
                          label={{
                            value: "Début du cycle",
                            position: "top",
                            fill: "hsl(var(--primary))",
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="valeur"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={payload.estDansCycle ? 6 : 4}
                              fill={payload.estDansCycle ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          );
                        }}
                        name="Valeur"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Les points plus grands et colorés indiquent les valeurs dans le cycle
                  </p>
                </Card>

                <Card className="p-6 rounded-xl mt-6" data-testid="card-statistics">
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    Statistiques du Calcul
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-total-steps">
                        {result.steps.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Étapes totales
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-cycle-length">
                        {result.cycleLength}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Longueur du cycle
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold font-mono text-primary" data-testid="stat-steps-before-cycle">
                        {result.cycleStartIndex}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Étapes avant le cycle
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
            </div>
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
