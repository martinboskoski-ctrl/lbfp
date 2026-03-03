import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email:    z.string().min(1, 'Е-поштата е задолжителна').email('Невалидна е-пошта адреса'),
  password: z.string().min(1, 'Лозинката е задолжителна'),
});

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors, isValid }, setError } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email.trim().toLowerCase(), data.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Најавувањето не успеа';
      // Surface server errors on the relevant field when possible
      if (err?.response?.status === 401) {
        setError('password', { message: msg });
      } else if (err?.response?.status === 429) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
      <div className="card w-full max-w-sm p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">ЛБФП ДОО Битола</h1>
          <p className="text-gray-400 mt-1 text-sm">Најавете се на вашиот профил</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label className="label">Е-пошта</label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              className={`input ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
              placeholder="vие@primer.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Лозинка</label>
              {/* Placeholder for future Resend-powered reset */}
              <span className="text-xs text-blue-500 cursor-default opacity-50 select-none">
                Заборавена лозинка?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="••••••••"
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Сокриј лозинка' : 'Прикажи лозинка'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Најавување…' : 'Најави се'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Немате профил?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Регистрирај се
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
