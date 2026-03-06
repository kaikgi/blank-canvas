import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { PhoneInput } from '@/components/ui/phone-input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');

  const onSubmit = async (data: SignupFormData) => {
    setAuthError(null);
    setIsLoading(true);

    const { error } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      companyName: data.companyName,
    });

    if (error) {
      setIsLoading(false);
      setAuthError(error.message);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message,
      });
      return;
    }

    // Save phone to profile
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) {
      await supabase.from('profiles').upsert({
        id: userData.user.id,
        full_name: data.fullName,
        phone: data.phone,
      });
    }

    setIsLoading(false);
    toast({
      title: 'Conta criada com sucesso!',
      description: 'Seu estabelecimento está pronto. Bem-vindo ao Agendali!',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            Criar conta de Estabelecimento
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse o Agendali com seu email autorizado
          </p>
        </div>

        <Alert variant="default" className="border-primary/20 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Para criar sua conta, você precisa ter um plano ativo.{' '}
            <Link to="/precos" className="font-medium underline">
              Veja os planos disponíveis
            </Link>
          </AlertDescription>
        </Alert>

        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" type="text" placeholder="Seu nome" autoComplete="name" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da empresa</Label>
            <Input id="companyName" type="text" placeholder="Nome do seu estabelecimento" autoComplete="organization" {...register('companyName')} />
            {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(mesmo usado na compra)</span></Label>
            <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Controller
              name="phone"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <PhoneInput id="phone" placeholder="(11) 99999-9999" value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput id="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...register('password')} />
            <PasswordStrength password={password} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput id="confirmPassword" placeholder="Repita a senha" autoComplete="new-password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">Entrar</Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          É cliente e quer agendar?{' '}
          <Link to="/cliente/login" className="font-medium text-primary hover:underline">Área do Cliente</Link>
        </p>
      </div>
    </div>
  );
}
