import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import toast from 'react-hot-toast';

const ta = (key) => i18next.t(key, { ns: 'auth' });

const loginSchema = z.object({
  email:    z.string().min(1, ta('emailRequired')).email(ta('emailInvalid')),
  password: z.string().min(1, ta('passwordRequired')),
});

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
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
      const msg = err?.response?.data?.message || t('loginFailed');
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

  const toggleLanguage = () => {
    const newLang = i18next.language === 'mk' ? 'en' : 'mk';
    i18next.changeLanguage(newLang);
    localStorage.setItem('packflow_lang', newLang);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
      <div className="card w-full max-w-sm p-8 relative">

        {/* Language toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-4 right-4 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {i18next.language === 'mk' ? 'EN' : 'MK'}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">ЛБФП ДОО Битола</h1>
          <p className="text-gray-400 mt-1 text-sm">{t('loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label className="label">{t('emailLabel')}</label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              className={`input ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
              placeholder={t('emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('passwordLabel')}</label>
              {/* Placeholder for future Resend-powered reset */}
              <span className="text-xs text-blue-500 cursor-default opacity-50 select-none">
                {t('forgotPassword')}
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
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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
            {loading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('noAccount')}{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            {t('registerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
