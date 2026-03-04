import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { registerApi } from '../api/auth.api.js';
import toast from 'react-hot-toast';

const DEPT_VALUES = [
  'top_management', 'sales', 'finance', 'administration', 'hr',
  'quality_assurance', 'facility', 'machines', 'r_and_d',
  'production', 'carina', 'nabavki',
];

const ta = (key) => i18next.t(key, { ns: 'auth' });

const registerSchema = z
  .object({
    name:            z.string().min(2, ta('nameMin')).max(80),
    email:           z.string().min(1, ta('emailRequired')).email(ta('emailInvalid')),
    password:        z
      .string()
      .min(8, ta('passwordMin'))
      .refine((v) => /[a-zA-Z]/.test(v), ta('passwordLetter'))
      .refine((v) => /[0-9]/.test(v),    ta('passwordDigit')),
    confirmPassword: z.string().min(1, ta('confirmPasswordRequired')),
    department:      z.string().refine((v) => DEPT_VALUES.includes(v), ta('departmentRequired')),
    isManager:       z.boolean().default(false),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path:    ['confirmPassword'],
    message: ta('passwordMismatch'),
  });

// ── Password strength ─────────────────────────────────────────────────────

const calcStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)                              score++;
  if (pw.length >= 12)                             score++;
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw))   score++;
  if (/[^a-zA-Z0-9]/.test(pw))                    score++;
  return score; // 0 – 4
};

const STRENGTH = [
  null,
  { label: 'strengthWeak',   bars: 1, color: 'bg-red-500' },
  { label: 'strengthWeak',   bars: 2, color: 'bg-orange-400' },
  { label: 'strengthFair',   bars: 3, color: 'bg-yellow-400' },
  { label: 'strengthStrong', bars: 4, color: 'bg-green-500' },
];

const StrengthBar = ({ password }) => {
  const { t } = useTranslation('auth');
  const score = calcStrength(password);
  if (!password) return null;
  const cfg = STRENGTH[score];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= (cfg?.bars ?? 0) ? cfg.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {cfg && (
        <p className={`text-xs mt-0.5 ${cfg.color.replace('bg-', 'text-')}`}>
          {t(cfg.label)}
        </p>
      )}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm,  setShowConfirm]      = useState(false);
  const [loading, setLoading]               = useState(false);

  // Only top management can access this page
  if (!isTopManagement(user)) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { isManager: false },
    mode: 'onTouched',
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      payload.email = payload.email.trim().toLowerCase();
      payload.name  = payload.name.trim();
      await registerApi(payload);
      toast.success(t('userCreated'));
      reset();
    } catch (err) {
      const res = err?.response;
      if (res?.status === 409) {
        setError('email', { message: res.data.message });
      } else if (res?.status === 422 && res.data?.errors) {
        Object.entries(res.data.errors).forEach(([field, msg]) => setError(field, { message: msg }));
      } else {
        toast.error(res?.data?.message || t('registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} />
        {tc('back')}
      </button>

      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('createUserTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('createUserSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Name */}
          <div>
            <label className="label">{t('nameLabel')}</label>
            <input
              className={`input ${errors.name ? 'border-red-400' : ''}`}
              autoComplete="off"
              autoFocus
              placeholder={t('namePlaceholder')}
              {...register('name')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label">{t('emailLabel')}</label>
            <input
              type="email"
              autoComplete="off"
              className={`input ${errors.email ? 'border-red-400' : ''}`}
              placeholder={t('emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label">{t('passwordLabel')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                placeholder={t('passwordPlaceholder')}
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <StrengthBar password={passwordValue} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="label">{t('confirmPasswordLabel')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                placeholder={t('confirmPasswordPlaceholder')}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="label">{t('departmentLabel')}</label>
            <select
              className={`input ${errors.department ? 'border-red-400' : ''}`}
              defaultValue=""
              {...register('department')}
            >
              <option value="" disabled>{t('departmentPlaceholder')}</option>
              {DEPT_VALUES.map((val) => (
                <option key={val} value={val}>{tc(`dept.${val}`)}</option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
          </div>

          {/* Manager checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="isManager"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              {...register('isManager')}
            />
            <label htmlFor="isManager" className="text-sm text-gray-700 cursor-pointer select-none">
              {t('isManagerLabel')}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? t('registerLoading') : t('createUserButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
