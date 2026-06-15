import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../schemas/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with loginSchema
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const newErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          newErrors[field] = messages[0];
        }
      }
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await authLogin({
        username: result.data.username,
        password: result.data.password,
      });
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrors({ submit: 'Invalid username or password' });
      } else {
        setErrors({ submit: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="editorial-card w-full max-w-md">
        <div className="border-b border-[var(--color-mist)] pb-6 mb-6">
          <h1
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
            className="text-3xl font-bold"
          >
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-stone)' }} className="text-sm mt-2">
            Sign in to Ezra to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
              className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            >
              Username <span style={{ color: 'var(--color-ruby)' }}>*</span>
            </label>
            <input
              type="text"
              id="username"
              autoFocus
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isSubmitting}
              className={`w-full border ${
                errors.username ? 'border-[var(--color-ruby)]' : 'border-[var(--color-mist)]'
              } rounded-sm px-4 py-3 focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-opacity-20 transition-all`}
              style={{ fontFamily: 'var(--font-sans)' }}
              placeholder="Enter your username..."
            />
            {errors.username && (
              <p style={{ color: 'var(--color-ruby)' }} className="text-xs mt-2 font-semibold">
                ⚠ {errors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
              className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            >
              Password <span style={{ color: 'var(--color-ruby)' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
              className={`w-full border ${
                errors.password ? 'border-[var(--color-ruby)]' : 'border-[var(--color-mist)]'
              } rounded-sm px-4 py-3 focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-opacity-20 transition-all`}
              style={{ fontFamily: 'var(--font-sans)' }}
              placeholder="Enter your password..."
            />
            {errors.password && (
              <p style={{ color: 'var(--color-ruby)' }} className="text-xs mt-2 font-semibold">
                ⚠ {errors.password}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div
              className="editorial-card p-4"
              style={{ background: 'rgba(220, 38, 38, 0.05)', borderColor: 'var(--color-ruby)' }}
            >
              <p style={{ color: 'var(--color-ruby)' }} className="text-sm font-semibold">
                ⚠ {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
