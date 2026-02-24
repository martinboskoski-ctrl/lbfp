import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  { value: 'top_management',    label: 'Топ менаџмент' },
  { value: 'sales',             label: 'Продажба' },
  { value: 'finance',           label: 'Финансии' },
  { value: 'administration',    label: 'Администрација' },
  { value: 'hr',                label: 'Човечки ресурси' },
  { value: 'quality_assurance', label: 'Обезбедување квалитет' },
  { value: 'facility',          label: 'Објект' },
  { value: 'machines',          label: 'Машини' },
  { value: 'r_and_d',           label: 'Истражување и развој' },
  { value: 'production',        label: 'Производство' },
  { value: 'carina',            label: 'Царина' },
  { value: 'nabavki',           label: 'Набавки (суровини и амбалажа)' },
];

const DEPT_VALUES = DEPARTMENTS.map((d) => d.value);

const registerSchema = z
  .object({
    name:            z.string().min(2, 'Името мора да содржи најмалку 2 знаци').max(80),
    email:           z.string().min(1, 'Е-поштата е задолжителна').email('Невалидна е-пошта адреса'),
    password:        z
      .string()
      .min(8, 'Најмалку 8 знаци')
      .refine((v) => /[a-zA-Z]/.test(v), 'Мора да содржи барем една буква')
      .refine((v) => /[0-9]/.test(v),    'Мора да содржи барем една цифра'),
    confirmPassword: z.string().min(1, 'Потврдете ја лозинката'),
    department:      z.string().refine((v) => DEPT_VALUES.includes(v), 'Изберете одделение'),
    isManager:       z.boolean().default(false),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path:    ['confirmPassword'],
    message: 'Лозинките не се совпаѓаат',
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
  { label: 'Слаба',    bars: 1, color: 'bg-red-500' },
  { label: 'Слаба',    bars: 2, color: 'bg-orange-400' },
  { label: 'Добра',    bars: 3, color: 'bg-yellow-400' },
  { label: 'Силна',    bars: 4, color: 'bg-green-500' },
];

const StrengthBar = ({ password }) => {
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
          {cfg.label}
        </p>
      )}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────

const Register = () => {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm,  setShowConfirm]      = useState(false);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
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
      await registerUser(payload);
      navigate('/dashboard');
    } catch (err) {
      const res = err?.response;
      if (res?.status === 409) {
        setError('email', { message: res.data.message });
      } else if (res?.status === 422 && res.data?.errors) {
        Object.entries(res.data.errors).forEach(([field, msg]) => setError(field, { message: msg }));
      } else if (res?.status === 429) {
        toast.error(res.data.message);
      } else {
        toast.error(res?.data?.message || 'Регистрацијата не успеа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="card w-full max-w-sm p-8">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">ЛБФП ДОО Битола</h1>
          <p className="text-gray-400 mt-1 text-sm">Креирај нов профил</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Name */}
          <div>
            <label className="label">Целосно ime</label>
            <input
              className={`input ${errors.name ? 'border-red-400' : ''}`}
              autoComplete="name"
              autoFocus
              placeholder="Јане Јанески"
              {...register('name')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label">Е-пошта</label>
            <input
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'border-red-400' : ''}`}
              placeholder="vие@primer.com"
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label">Лозинка</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                placeholder="Мин. 8 знаци, буква и цифра"
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
            <label className="label">Потврди лозинка</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                placeholder="Повторете ја лозинката"
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
            <label className="label">Одделение</label>
            <select
              className={`input ${errors.department ? 'border-red-400' : ''}`}
              defaultValue=""
              {...register('department')}
            >
              <option value="" disabled>Изберете одделение…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
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
              Јас сум менаџер
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Креирање профил…' : 'Креирај профил'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Веќе имате профил?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Најави се
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
