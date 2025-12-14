import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, UserCog, ChefHat, ShieldCheck, Shield } from 'lucide-react';

interface Member {
  id: number;
  username: string;
  email: string;
  role: 'head_chef' | 'sous_chef' | 'line_cook';
  joined_at: string;
}

export default function UserManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/api/v1/admin/users');
      setMembers(response.data.data);
    } catch (err) {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: number, newRole: string) => {
    try {
      const response = await api.put(`/api/v1/admin/users/${userId}`, {
        household_member: { role: newRole }
      });
      setMembers(members.map(m => m.id === userId ? { ...m, role: response.data.data.role } : m));
      setEditingId(null);
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member from the household?')) return;

    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      setMembers(members.filter(m => m.id !== userId));
    } catch (err) {
      alert('Failed to remove member. You cannot remove yourself.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'head_chef':
        return <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium"><ShieldCheck className="w-3 h-3" /> Head Chef</span>;
      case 'sous_chef':
        return <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium"><ChefHat className="w-3 h-3" /> Sous Chef</span>;
      default:
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium"><Shield className="w-3 h-3" /> Line Cook</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading members...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UserCog className="w-8 h-8 text-purple-400" />
        Manage Household Members
      </h1>

      {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-lg">{error}</div>}

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-left text-gray-400 text-sm">
                <th className="p-4 font-medium">Member</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <div className="text-white font-medium">{member.username || '—'}</div>
                    <div className="text-gray-400 text-xs">{member.email}</div>
                  </td>
                  <td className="p-4">
                    {editingId === member.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                        className="bg-slate-800 text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                      >
                        <option value="line_cook">Line Cook</option>
                        <option value="sous_chef">Sous Chef</option>
                        <option value="head_chef">Head Chef</option>
                      </select>
                    ) : (
                      getRoleBadge(member.role)
                    )}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingId(editingId === member.id ? null : member.id)}
                      className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Edit Role"
                    >
                      <UserCog className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
