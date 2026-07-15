"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D0B0A] text-zinc-900 dark:text-zinc-50 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Theme Toggle Flutuante */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 dark:bg-orange-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="z-10 text-center max-w-2xl mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-orange-600 to-violet-600 bg-clip-text text-transparent">
          Social Suite Manager
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-medium">
          Mantenha suas contas sociais organizadas e seguras. Cruzamento de conexões, limpeza de posts e automação local em segundo plano.
        </p>
      </div>

      {/* Grid de Ferramentas */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        
        {/* Card Instagram */}
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Instagram Suite</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Gerencie quem você segue, identifique não seguidores e detecte sua autenticação ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500 dark:text-zinc-400 pt-0">
            • Detecção de Sessão do Instagram Web<br />
            • Importador de arquivos JSON da Meta<br />
            • Dashboard de Reciprocidade local
          </CardContent>
          <CardFooter>
            <Link href="/instagram" className="w-full">
              <Button className="w-full flex items-center justify-center gap-2 group-hover:bg-orange-600/90">
                Acessar Instagram Suite <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Card Twitter / X */}
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">X (Twitter) Suite</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Apague republicados (retweets) ou tweets autorais e gerencie amizades por reciprocidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500 dark:text-zinc-400 pt-0">
            • Deleção de posts autorais ou reposts<br />
            • Conexões (Follow/Unfollow por reciprocidade)<br />
            • Preservação de Bookmarks e Pinned
          </CardContent>
          <CardFooter>
            <Link href="/twitter" className="w-full">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2">
                Acessar X (Twitter) Suite <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

      </div>

      {/* Footer / Privacy Policy Statement */}
      <div className="z-10 flex flex-col md:flex-row items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 max-w-xl text-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacidade Garantida: Seus cookies e credenciais são processados localmente.</span>
        </div>
        <span className="hidden md:inline">•</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>100% Client-Side e API Proxies locais de segurança.</span>
        </div>
      </div>
    </main>
  );
}
