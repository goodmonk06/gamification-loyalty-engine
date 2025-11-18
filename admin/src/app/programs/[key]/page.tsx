'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getProgram,
  getEventDefinitions,
  createEventDefinition,
  getBadges,
  createBadge,
  getUsers,
} from '@/lib/api';
import Link from 'next/link';

export default function ProgramDetail() {
  const params = useParams();
  const programKey = params.key as string;

  const [program, setProgram] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'badges' | 'users'>('events');
  const [loading, setLoading] = useState(true);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    key: '',
    description: '',
    basePoints: 10,
  });

  // Badge form
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [badgeForm, setBadgeForm] = useState({
    key: '',
    name: '',
    description: '',
    criteriaType: 'event_count',
    eventKey: '',
    count: 1,
    threshold: 100,
  });

  useEffect(() => {
    loadData();
  }, [programKey]);

  const loadData = async () => {
    try {
      const [programRes, eventsRes, badgesRes, usersRes] = await Promise.all([
        getProgram(programKey),
        getEventDefinitions(programKey),
        getBadges(programKey),
        getUsers(programKey),
      ]);
      setProgram(programRes.data);
      setEvents(eventsRes.data);
      setBadges(badgesRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEventDefinition(programKey, {
        key: eventForm.key,
        description: eventForm.description,
        rules: {
          basePoints: eventForm.basePoints,
        },
      });
      setShowEventForm(false);
      setEventForm({ key: '', description: '', basePoints: 10 });
      loadData();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const criteria =
        badgeForm.criteriaType === 'event_count'
          ? {
              type: 'event_count',
              eventKey: badgeForm.eventKey,
              count: badgeForm.count,
            }
          : {
              type: 'total_points',
              threshold: badgeForm.threshold,
            };

      await createBadge(programKey, {
        key: badgeForm.key,
        name: badgeForm.name,
        description: badgeForm.description,
        criteria,
      });
      setShowBadgeForm(false);
      setBadgeForm({
        key: '',
        name: '',
        description: '',
        criteriaType: 'event_count',
        eventKey: '',
        count: 1,
        threshold: 100,
      });
      loadData();
    } catch (error) {
      console.error('Failed to create badge:', error);
      alert('Failed to create badge');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!program) {
    return <div className="text-center py-12">Program not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Programs
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">{program.name}</h2>
        <p className="text-gray-500 mt-2">{program.key}</p>
        {program.description && <p className="text-gray-600 mt-2">{program.description}</p>}
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span>👥 {program._count?.userAccounts || 0} users</span>
          <span>🎯 {events.length} events</span>
          <span>🏆 {badges.length} badges</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['events', 'badges', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Event Definitions</h3>
            <button
              onClick={() => setShowEventForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Event
            </button>
          </div>

          {showEventForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h4 className="text-lg font-semibold mb-4">Create Event Definition</h4>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Key
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.key}
                    onChange={(e) => setEventForm({ ...eventForm, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., purchase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., User made a purchase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Points
                  </label>
                  <input
                    type="number"
                    required
                    value={eventForm.basePoints}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, basePoints: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    onClick={() => setShowEventForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{event.key}</h4>
                    {event.description && (
                      <p className="text-gray-600 mt-1">{event.description}</p>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      Points: {event.rulesJson.basePoints || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No events defined yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Badge Definitions</h3>
            <button
              onClick={() => setShowBadgeForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Badge
            </button>
          </div>

          {showBadgeForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h4 className="text-lg font-semibold mb-4">Create Badge Definition</h4>
              <form onSubmit={handleCreateBadge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Key
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeForm.key}
                    onChange={(e) => setBadgeForm({ ...badgeForm, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., first_purchase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Name
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeForm.name}
                    onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., First Purchase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={badgeForm.description}
                    onChange={(e) =>
                      setBadgeForm({ ...badgeForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criteria Type
                  </label>
                  <select
                    value={badgeForm.criteriaType}
                    onChange={(e) =>
                      setBadgeForm({ ...badgeForm, criteriaType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="event_count">Event Count</option>
                    <option value="total_points">Total Points</option>
                  </select>
                </div>
                {badgeForm.criteriaType === 'event_count' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Key
                      </label>
                      <input
                        type="text"
                        required
                        value={badgeForm.eventKey}
                        onChange={(e) =>
                          setBadgeForm({ ...badgeForm, eventKey: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Count
                      </label>
                      <input
                        type="number"
                        required
                        value={badgeForm.count}
                        onChange={(e) =>
                          setBadgeForm({ ...badgeForm, count: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                )}
                {badgeForm.criteriaType === 'total_points' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points Threshold
                    </label>
                    <input
                      type="number"
                      required
                      value={badgeForm.threshold}
                      onChange={(e) =>
                        setBadgeForm({ ...badgeForm, threshold: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBadgeForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-lg font-semibold text-gray-900">{badge.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{badge.key}</p>
                {badge.description && (
                  <p className="text-gray-600 mt-2">{badge.description}</p>
                )}
                <div className="mt-3 text-sm text-gray-500">
                  {badge.criteriaJson.type === 'event_count' && (
                    <p>
                      Trigger {badge.criteriaJson.eventKey} {badge.criteriaJson.count} time(s)
                    </p>
                  )}
                  {badge.criteriaJson.type === 'total_points' && (
                    <p>Reach {badge.criteriaJson.threshold} points</p>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {badge._count?.userBadges || 0} users earned
                </div>
              </div>
            ))}
            {badges.length === 0 && (
              <div className="col-span-2 text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No badges defined yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h3 className="text-xl font-semibold mb-6">User Accounts</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Badges
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.externalUserId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.tier === 'platinum'
                            ? 'bg-purple-100 text-purple-800'
                            : user.tier === 'gold'
                            ? 'bg-yellow-100 text-yellow-800'
                            : user.tier === 'silver'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.badgeCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
