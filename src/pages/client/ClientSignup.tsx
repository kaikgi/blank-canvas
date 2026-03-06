import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { getOAuthRedirectUrl } from '@/lib/publicUrl';
import { clientSignupSchema, type ClientSignupFormData } from '@/lib/validations/auth';

export default function ClientSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const stateFrom = (location.state as any)?.from;
  const from = typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname || '/client';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ClientSignupFormData>({
    resolver: zodResolver(clientSignupSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: ClientSignupFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getOAuthRedirectUrl(from),
          data: {
            full_name: data.full_name,
            phone: data.phone,
          },
        },
      });

      if (error) throw error;

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          phone: data.phone,
        });
      }

      if (authData.session) {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você foi autenticado automaticamente.',
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar o cadastro.',
        });
      }
    } catch (error) {
      let errorMessage = 'Não foi possível criar a conta.';
      
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Criar Conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre-se para gerenciar seus agendamentos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Seu nome completo"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Controller
              name="phone"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              placeholder="Crie uma senha forte"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {passwordValue && <PasswordStrength password={passwordValue} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirme sua senha"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/cliente/login" state={{ from }} className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
