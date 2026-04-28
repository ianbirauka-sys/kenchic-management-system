import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerUser(form);
      login(res.data.data.user, res.data.data.token);
      if (form.role === 'farmer') navigate('/farmer/chicks');
      else navigate('/customer/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">Create account</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full border rounded-lg px-4 py-2" placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input className="w-full border rounded-lg px-4 py-2" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="w-full border rounded-lg px-4 py-2" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <select className="w-full border rounded-lg px-4 py-2" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="customer">Customer</option>
            <option value="farmer">Farmer</option>
          </select>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">Register</button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-500">Have an account? <Link to="/login" className="text-green-600">Sign in</Link></p>
      </div>
    </div>
  );
}