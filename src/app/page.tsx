"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Instagram,
  Mail,
  Youtube,
  Linkedin,
  Package,
  Copy,
  Check,
  Trash2,
  Clock,
  ChevronDown,
  Wand2,
  ArrowRight,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface ContentOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
}

interface ToneOption {
  id: string;
  label: string;
  description: string;
}

interface HistoryItem {
  id: string;
  contentType: string;
  topic: string;
  tone: string;
  content: string;
  createdAt: string;
}

interface GenerateResponse {
  id: string;
  content: string;
  contentType: string;
  topic: string;
  tone: string;
  createdAt: string;
}

// --- Constants ---
const CONTENT_TYPES: ContentOption[] = [
  {
    id: "blog",
    label: "Post para Blog",
    icon: <FileText className="h-5 w-5" />,
    emoji: "📝",
    description: "Artigo completo com títulos e subtítulos",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    emoji: "📸",
    description: "Legenda com hashtags e CTA",
  },
  {
    id: "email",
    label: "E-mail Marketing",
    icon: <Mail className="h-5 w-5" />,
    emoji: "📧",
    description: "E-mail persuasivo com estrutura AIDA",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: <Youtube className="h-5 w-5" />,
    emoji: "🎬",
    description: "Roteiro completo com timestamps",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    emoji: "💼",
    description: "Post profissional com insights",
  },
  {
    id: "produto",
    label: "Descrição de Produto",
    icon: <Package className="h-5 w-5" />,
    emoji: "🛍️",
    description: "Copy persuasiva para vendas",
  },
];

const TONE_OPTIONS: ToneOption[] = [
  { id: "profissional", label: "Profissional", description: "Formal e confiável" },
  { id: "casual", label: "Casual", description: "Descontraído e amigável" },
  { id: "criativo", label: "Criativo", description: "Ousado e inovador" },
  { id: "persuasivo", label: "Persuasivo", description: "Convincente e impactante" },
  { id: "educativo", label: "Educativo", description: "Didático e claro" },
];

// --- Helper ---
function formatContentType(type: string): string {
  return CONTENT_TYPES.find((c) => c.id === type)?.label || type;
}

function formatTone(tone: string): string {
  return TONE_OPTIONS.find((t) => t.id === tone)?.label || tone;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Main Component ---
export default function Home() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      console.error("Erro ao carregar histórico");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Generate content
  const handleGenerate = async () => {
    if (!selectedType || !topic.trim() || !selectedTone) {
      toast({
        title: "Preencha tudo!",
        description: "Selecione o tipo de conteúdo, o tema e o tom para gerar.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: selectedType,
          topic: topic.trim(),
          tone: selectedTone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar conteúdo.");
      }

      setGeneratedContent(data);
      fetchHistory();

      toast({
        title: "Conteúdo gerado!",
        description: "Seu conteúdo foi criado com sucesso.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao gerar conteúdo.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copiado!", description: "Conteúdo copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  // Download as text file
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Baixado!", description: "Arquivo salvo com sucesso." });
  };

  // Delete history item
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      fetchHistory();
      toast({ title: "Removido!", description: "Item removido do histórico." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    }
  };

  // Clear all history
  const handleClearHistory = async () => {
    try {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
      toast({ title: "Limpo!", description: "Histórico removido com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível limpar.", variant: "destructive" });
    }
  };

  // Load from history
  const handleLoadFromHistory = (item: HistoryItem) => {
    setSelectedType(item.contentType);
    setTopic(item.topic);
    setSelectedTone(item.tone);
    setGeneratedContent({
      id: item.id,
      content: item.content,
      contentType: item.contentType,
      topic: item.topic,
      tone: item.tone,
      createdAt: item.createdAt,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                ContentAI
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gerador de Conteúdo com Inteligência Artificial
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {history.length}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3">
            Crie conteúdo incrível
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              {" "}com IA
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Escolha o tipo de conteúdo, defina o tema e o tom. A IA faz o resto em segundos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Step 1: Content Type */}
            <Card className="border-2 hover:border-emerald-500/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Tipo de Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-center group hover:scale-[1.02] ${
                        selectedType === type.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                          : "border-border hover:border-emerald-500/40 bg-card"
                      }`}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                      <span className="text-xs font-medium leading-tight">{type.label}</span>
                      {selectedType === type.id && (
                        <motion.div
                          layoutId="typeIndicator"
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Topic */}
            <Card className="border-2 hover:border-emerald-500/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Sobre o que é o conteúdo?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ex: Como aumentar suas vendas no Instagram usando reels..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Quanto mais detalhes você der, melhor será o resultado.
                </p>
              </CardContent>
            </Card>

            {/* Step 3: Tone */}
            <Card className="border-2 hover:border-emerald-500/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Tom do Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                        selectedTone === tone.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                          : "border-border hover:border-emerald-500/40 bg-card"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedType || !topic.trim() || !selectedTone}
              className="w-full h-14 text-base font-semibold gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Gerando conteúdo...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Gerar Conteúdo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Right: Generated Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 h-full min-h-[400px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Conteúdo Gerado
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(generatedContent.content)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? "Copiado!" : "Copiar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            generatedContent.content,
                            `conteudo-${generatedContent.contentType}-${Date.now()}`
                          )
                        }
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {isGenerating ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto">
                        <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto" />
                        <Sparkles className="h-6 w-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Criando seu conteúdo...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          A IA está trabalhando na mágica
                        </p>
                      </div>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <div className="flex-1 flex flex-col">
                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="gap-1">
                        {CONTENT_TYPES.find((c) => c.id === generatedContent.contentType)?.emoji}{" "}
                        {formatContentType(generatedContent.contentType)}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {formatTone(generatedContent.tone)}
                      </Badge>
                    </div>
                    <Separator className="mb-3" />
                    {/* Content */}
                    <ScrollArea className="flex-1 max-h-[500px]">
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedContent.content}
                      </div>
                    </ScrollArea>
                    {/* Regenerate */}
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="gap-2 w-full"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Gerar novamente com as mesmas configurações
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3 max-w-xs mx-auto">
                      <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                        <Wand2 className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">
                          Seu conteúdo aparecerá aqui
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Preencha os campos ao lado e clique em &quot;Gerar Conteúdo&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 overflow-hidden"
            >
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      Histórico de Conteúdos
                    </CardTitle>
                    <div className="flex gap-2">
                      {history.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleClearHistory}
                          className="gap-1.5 text-xs h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Limpar tudo
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(false)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        Fechar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum conteúdo gerado ainda.</p>
                      <p className="text-xs mt-1">Seus conteúdos aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-xl mt-0.5">
                            {CONTENT_TYPES.find((c) => c.id === item.contentType)?.emoji || "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">
                                {item.topic}
                              </span>
                              <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                                {formatContentType(item.contentType)}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                                {formatTone(item.tone)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                              {item.content.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.content)}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadFromHistory(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Wand2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            ContentAI — Gerador de Conteúdo com IA
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Z.ai
          </p>
        </div>
      </footer>
    </div>
  );
}
