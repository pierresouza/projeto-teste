"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Key, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function InstagramPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [cookieData, setCookieData] = useState({
    userId: "",
    sessionId: "",
    csrfToken: ""
  });
  const [session, setSession] = useState({
    active: false,
    userId: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);

    // Detecção Automática se estiver em extensão do Chrome
    if (typeof window !== "undefined" && window.chrome && window.chrome.cookies) {
      const getCookie = (name) => {
        return new Promise((resolve) => {
          window.chrome.cookies.get({ url: "https://www.instagram.com", name }, (cookie) => {
            resolve(cookie ? cookie.value : "");
          });
        });
      };

      Promise.all([
        getCookie("ds_user_id"),
        getCookie("sessionid"),
        getCookie("csrftoken")
      ]).then(([userIdVal, sessionIdVal, csrfVal]) => {
        if (userIdVal && sessionIdVal) {
          setCookieData({
            userId: userIdVal,
            sessionId: sessionIdVal,
            csrfToken: csrfVal
          });
          setSession({
            active: true,
            userId: userIdVal
          });
          localStorage.setItem("ig_saved_userid", userIdVal);
          localStorage.setItem("ig_saved_sessionid", sessionIdVal);
          localStorage.setItem("ig_saved_csrf", csrfVal);
        }
      });
      return;
    }

    // Fallback: Recupera dados salvos localmente
    const savedUserId = localStorage.getItem("ig_saved_userid");
    const savedSessionId = localStorage.getItem("ig_saved_sessionid");
    const savedCsrf = localStorage.getItem("ig_saved_csrf");

    if (savedUserId && savedSessionId) {
      setCookieData({
        userId: savedUserId,
        sessionId: savedSessionId,
        csrfToken: savedCsrf || ""
      });
      setSession({
        active: true,
        userId: savedUserId
      });
    }
  }, []);

  const handleConnect = (e) => {
    e.preventDefault();
    setError(null);

    if (!cookieData.userId || !cookieData.sessionId) {
      setError("Por favor, preencha o ID do Usuário (ds_user_id) e o Cookie Session ID.");
      return;
    }

    // Salva localmente
    localStorage.setItem("ig_saved_userid", cookieData.userId);
    localStorage.setItem("ig_saved_sessionid", cookieData.sessionId);
    localStorage.setItem("ig_saved_csrf", cookieData.csrfToken);

    setSession({
      active: true,
      userId: cookieData.userId
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem("ig_saved_userid");
    localStorage.removeItem("ig_saved_sessionid");
    localStorage.removeItem("ig_saved_csrf");

    setCookieData({ userId: "", sessionId: "", csrfToken: "" });
    setSession({ active: false, userId: null });
    setError(null);
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D0B0A] text-zinc-900 dark:text-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400 font-semibold">Carregando módulo Instagram...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D0B0A] text-zinc-900 dark:text-zinc-50 p-6 md:p-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Header com Voltar e ThemeToggle */}
      <div className="max-w-xl mx-auto mb-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-600 transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md shadow-lg">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Instagram Session Detector</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Verificação e validação de credenciais de login ativo
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {session.active ? (
              /* Conectado */
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm">Conectado ao Instagram!</h3>
                    <p className="text-xs opacity-90">Suas credenciais de sessão estão carregadas e prontas.</p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  <div><strong>ID de Usuário (ds_user_id):</strong> {session.userId}</div>
                  <div><strong>Status do Endpoint:</strong> Autenticado localmente</div>
                </div>

                <Button 
                  variant="destructive" 
                  onClick={handleDisconnect} 
                  className="w-full"
                >
                  Desconectar Sessão
                </Button>
              </div>
            ) : (
              /* Formulário de Autenticação */
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Como este aplicativo roda de forma web e não como extensão, você precisará fornecer seus cookies da sessão logada no **Instagram Web** para autenticação.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      User ID (ds_user_id)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: 5123984102"
                      value={cookieData.userId}
                      onChange={(e) => setCookieData({ ...cookieData, userId: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Session ID (sessionid)
                    </label>
                    <input 
                      type="password" 
                      placeholder="Cole o valor do cookie sessionid"
                      value={cookieData.sessionId}
                      onChange={(e) => setCookieData({ ...cookieData, sessionId: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      CSRF Token (csrftoken) - Opcional
                    </label>
                    <input 
                      type="text" 
                      placeholder="Cole o valor do cookie csrftoken"
                      value={cookieData.csrfToken}
                      onChange={(e) => setCookieData({ ...cookieData, csrfToken: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full flex items-center justify-center gap-1.5">
                  <Key className="w-4 h-4" /> Conectar Sessão
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 text-center border-t border-zinc-100 dark:border-zinc-900 pt-6 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Seus cookies são salvos apenas no seu localStorage e nunca enviados para terceiros.</span>
            </div>
            <a 
              href="https://www.instagram.com" 
              target="_blank" 
              className="text-orange-600 dark:text-orange-500 underline"
            >
              Ir para o Instagram Web
            </a>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
