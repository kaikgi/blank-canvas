import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfessionalPortalAuth } from '@/hooks/useProfessionalPortal';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';

export default function ProfessionalPortalLogin() {
  const { establishmentSlug, professionalSlug } = useParams<{
    establishmentSlug: string;
    professionalSlug: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoggingIn, isAuthenticated, session } = useProfessionalPortalAuth();
  
  const [password, setPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && session) {
      navigate(`/${establishmentSlug}/p/${professionalSlug}/agenda`, { replace: true });
    }
  }, [isAuthenticated, session, establishmentSlug, professionalSlug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({ title: 'Digite sua senha', variant: 'destructive' });
      return;
    }

    if (!establishmentSlug || !professionalSlug) {
      toast({ title: 'URL inválida', variant: 'destructive' });
      return;
    }

    try {
      await login({
        establishmentSlug,
        professionalSlug,
        password,
      });
      toast({ title: 'Login realizado com sucesso!' });
      navigate(`/${establishmentSlug}/p/${professionalSlug}/agenda`, { replace: true });
    } catch (error: any) {
      const msg = error?.message || 'Verifique sua senha e tente novamente';
      const isDisabled = msg.toLowerCase().includes('desativado');
      toast({
        title: isDisabled ? 'Portal desativado' : 'Erro ao fazer login',
        description: isDisabled
          ? 'O portal do profissional está desativado. Solicite ao estabelecimento.'
          : msg,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Portal do Profissional
            </CardTitle>
            <CardDescription>
              Acesse sua agenda individual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha de acesso</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Sua senha foi fornecida pelo administrador do estabelecimento.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate(`/${establishmentSlug}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao site
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
