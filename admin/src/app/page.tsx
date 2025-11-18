'use client';

import { useEffect, useState } from 'react';
import { getPrograms, createProgram } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const response = await getPrograms();
      setPrograms(response.data);
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProgram(formData);
      setShowCreateForm(false);
      setFormData({ key: '', name: '', description: '' });
      loadPrograms();
    } catch (error) {
      console.error('Failed to create program:', error);
      alert('Failed to create program');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Programs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Program
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">Create New Program</h3>
          <form onSubmit={handleCreateProgram} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Key
              </label>
              <input
                type="text"
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., marketplace-rewards"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Marketplace Rewards"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Program description"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Link
            key={program.id}
            href={`/programs/${program.key}`}
            className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {program.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{program.key}</p>
            {program.description && (
              <p className="text-gray-600 text-sm">{program.description}</p>
            )}
          </Link>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No programs yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first program
          </button>
        </div>
      )}
    </div>
  );
}
