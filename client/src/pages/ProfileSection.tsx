import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Sun, Moon, User, Settings, Bell, LogOut, MessageCircle, Edit, Phone, MapPin, Github, Linkedin, Globe, Mail, Volume2, VolumeX, Eye, EyeOff, Shield, Lock, Trash2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, addNotification, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Editable fields
  const [name, setName] = useState(user?.username || '');
  const [email] = useState(user?.email || '');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Settings
  const [language, setLanguage] = useState('Eng');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const API_BASE = "http://127.0.0.1:8000";

  // Get live location
  const getLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const locationString = `${data.address.city || data.address.town || data.address.village || ''}, ${data.address.country || ''}`;
            setLocation(locationString);
            addNotification({
              type: 'success',
              message: 'Location updated successfully!'
            });
          } catch (error) {
            addNotification({
              type: 'error',
              message: 'Failed to get location details'
            });
          }
        },
        (error) => {
          addNotification({
            type: 'error',
            message: 'Failed to get location: ' + error.message
          });
        }
      );
    } else {
      addNotification({
        type: 'error',
        message: 'Geolocation is not supported by your browser'
      });
    }
  };

  const handleclick = () => {
    setShowEditModal(true);
  };

  // Save profile to backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await api.put(
        '/update_profile',
        {
          username: name,
          mobile,
          location,
          github,
          linkedin,
          portfolio,
        }
      );

      const updatedUser = {
        ...user,
        mobile,
        location,
        github,
        linkedin,
        portfolio,
      };

      setUser({
        id: user?.id || '',
        username: name,
        email: user?.email || '',
        mobile,
        location,
        github,
        linkedin,
        portfolio,
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowEditModal(false);
      setSaveMsg('Profile updated!');
      addNotification({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (err) {
      setSaveMsg('Failed to update profile.');
      addNotification({
        type: 'error',
        message: 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };
  // const modalRef = useRef(null);

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
  //       setShowSettings(false);
  //     }
  //   };

  //   if (showSettings) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [showSettings]);

  // if (!showSettings) return null;

  const generateAvatarUrl = (username: string) => {
    const parts = username.split(/[^a-zA-Z]/).filter(Boolean);
    const initials = parts.map(part => part[0].toUpperCase()).slice(0, 2).join('');
    const fallbackInitial = username[0]?.toUpperCase() || 'U';
    const finalInitials = initials || fallbackInitial;
    return `https://ui-avatars.com/api/?name=${finalInitials}&background=0D8ABC&color=fff&rounded=true`;
  };

  // Add notification when user logs in
  useEffect(() => {
    if (user) {
      addNotification({
        type: 'info',
        message: `Welcome back, ${user.username}!`
      });
    }
  }, [user]);

  return (
    <div className={`min-h-screen flex items-center justify-center bg-cyan-800 dark:bg-gray-900 p-4`}>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {/* Profile Menu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full md:w-80 flex flex-col items-center">
          <img
            src={generateAvatarUrl(name)}
            alt="avatar"
            className="w-20 h-20 rounded-full mb-3 border-4 border-cyan-200"
          />
          <div className="text-center mb-4">
            <div className="font-semibold text-lg text-gray-900 dark:text-white">{user?.username || 'Your name'}</div>
            <div className="text-gray-500 text-sm">{user?.email || 'yourname@gmail.com'}</div>
          </div>
          <div className="w-full">
            <button
              className="flex items-center w-full py-2 px-4 rounded-lg hover:bg-cyan-50 dark:hover:bg-gray-700 mb-1"
              onClick={() => navigate('/profile')}
            >
              <User className="w-5 h-5 mr-2" /> My Profile
            </button>
            <button
              className="flex items-center w-full py-2 px-4 rounded-lg hover:bg-cyan-50 dark:hover:bg-gray-700 mb-1"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5 mr-2" /> Settings
            </button>
            <button
              className="flex items-center w-full py-2 px-4 rounded-lg hover:bg-cyan-50 dark:hover:bg-gray-700 mb-1 relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-5 h-5 mr-2" /> Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              className="flex items-center w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 mb-1"
              onClick={() => navigate('/chat')}
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Create Chat
            </button>
            <button
              className="flex items-center w-full py-2 px-4 rounded-lg hover:bg-cyan-50 dark:hover:bg-gray-700"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-2" /> Log Out
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-xl relative">
          <div className="flex items-center mb-8">
            <img
              src={generateAvatarUrl(name)}
              alt="avatar"
              className="w-20 h-20 rounded-full mr-6 border-4 border-cyan-200 shadow-lg"
            />
            <div>
              <div className="font-semibold text-2xl text-gray-900 dark:text-white mb-1">{name}</div>
              <div className="text-gray-500 text-sm flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {email}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-4" />
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Mobile number</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {user?.mobile || <span className="text-gray-400 italic">Add number</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-4" />
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {user?.location || <span className="text-gray-400 italic">Add location</span>}
                </div>
              </div>
              <button
                onClick={getLiveLocation}
                className="ml-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Get current location"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Github className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-4" />
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">GitHub</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {user?.github ? (
                    <a href={github} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {user?.github}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Add GitHub</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-4" />
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">LinkedIn</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {user?.linkedin ? (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {user?.linkedin}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Add LinkedIn</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-4" />
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Portfolio</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {user?.portfolio ? (
                    <a href={portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {user?.portfolio}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Add Portfolio</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center w-full transition-colors"
            onClick={() => handleclick()}
          >
            <Edit className="w-5 h-5 mr-2" /> Edit Profile
          </button>
          {saveMsg && (
            <div className="mt-4 text-sm text-green-600 dark:text-green-400 text-center">{saveMsg}</div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md relative transform transition-all">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
              <div className="mb-6 font-semibold text-xl text-gray-900 dark:text-white">Edit Profile</div>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="Mobile number"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Your location"
                    />
                    <button
                      type="button"
                      onClick={getLiveLocation}
                      className="absolute right-3 top-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Get current location"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Github className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      placeholder="GitHub profile URL"
                    />
                  </div>

                  <div className="relative">
                    <Linkedin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      placeholder="LinkedIn profile URL"
                    />
                  </div>

                  <div className="relative">
                    <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={portfolio}
                      onChange={e => setPortfolio(e.target.value)}
                      placeholder="Portfolio website URL"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-96 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
              <div className="mb-6 font-semibold text-xl text-gray-900 dark:text-white">Settings</div>
              
              {/* Theme Settings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Appearance</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-600"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Moon className="w-4 h-4 mr-2" /> Dark
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4 mr-2" /> Light
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Language Settings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Language</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Interface Language</span>
                  <select
                    className="bg-gray-100 dark:bg-gray-600 rounded px-3 py-1.5 text-gray-700 dark:text-gray-300"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="Eng">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Bengali">Bengali</option>
                  </select>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Enable Notifications</span>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Sound Effects</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Privacy Mode</span>
                    <button
                      onClick={() => setPrivacyMode(!privacyMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacyMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacyMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Show Online Status</span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showPassword ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showPassword ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
        
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-96 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowNotifications(false)}
              >
                ×
              </button>
              <div className="mb-4 flex items-center justify-between">
                <div className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</div>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all as read
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-gray-700'
                          : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className={`text-sm ${
                            notification.read
                              ? 'text-gray-600 dark:text-gray-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="mt-4 w-full text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear all notifications
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 