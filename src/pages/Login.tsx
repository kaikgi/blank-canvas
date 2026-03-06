import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountTypeError, setAccountTypeError] = useState<string | null>(null);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setAccountTypeError(null);
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
      });
      return;
    }

    // Check account type after successful login
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', userData.user.id)
        .single();

      if (profile?.account_type === 'customer') {
        setIsLoading(false);
        await supabase.auth.signOut();
        setAccountTypeError('Esta é a área de estabelecimentos. Para acessar como cliente, use a Área do Cliente.');
        return;
      }
    }

    setIsLoading(false);
    toast({
      title: 'Bem-vindo de volta!',
      description: 'Login realizado com sucesso.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            Área do Estabelecimento
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse o painel de gerenciamento
          </p>
        </div>

        {accountTypeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accountTypeError}{' '}
              <Link to="/cliente/login" className="font-medium underline">
                Ir para Área do Cliente
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link 
                to="/esqueci-senha" 
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-medium text-foreground hover:underline">
            Criar conta de estabelecimento
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          É cliente e quer agendar?{' '}
          <Link to="/cliente/login" className="font-medium text-primary hover:underline">
            Área do Cliente
          </Link>
        </p>
      </div>
    </div>
  );
}
