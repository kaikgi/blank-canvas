import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountTypeError, setAccountTypeError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const stateFrom = (location.state as any)?.from;
  const from = typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname || '/client';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
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

      if (profile?.account_type === 'establishment_owner') {
        setIsLoading(false);
        await supabase.auth.signOut();
        setAccountTypeError('Esta é a área de clientes. Para acessar como estabelecimento, use o Painel do Estabelecimento.');
        return;
      }
    }

    setIsLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block"><Logo /></Link>
          <h1 className="mt-6 text-2xl font-bold">Área do Cliente</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre para gerenciar seus agendamentos</p>
        </div>

        {accountTypeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accountTypeError}{' '}
              <Link to="/login" className="font-medium underline">
                Ir para Painel do Estabelecimento
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/cliente/esqueci-senha" className="text-xs text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput id="password" placeholder="Sua senha" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/cliente/cadastro" state={{ from }} className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          É estabelecimento?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Painel do Estabelecimento
          </Link>
        </p>
      </div>
    </div>
  );
}
