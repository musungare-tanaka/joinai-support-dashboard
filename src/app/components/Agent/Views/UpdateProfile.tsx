"use client"
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import BASE_URL from '@/app/config/api/api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  password: string;
}

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
    type === 'success' 
      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
      : 'bg-red-50/90 border-red-200 text-red-800'
  }`}>
    {type === 'success' ? 
      <CheckCircle className="w-5 h-5 text-emerald-600" /> : 
      <AlertCircle className="w-5 h-5 text-red-600" />
    }
    <span className="font-medium">{message}</span>
    <button 
      onClick={onClose}
      className="ml-2 hover:opacity-70 transition-opacity"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

const UpdateProfile = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    password: '',  
  });

  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData>({} as FormData);

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const storedEmail = (localStorage.getItem('email') ?? '').trim();
      if (!storedEmail) {
        showToast('error', 'No email found. Please log in again.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/admin/getProfileData`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: storedEmail }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
        }

        const data = await response.json();
        const profileData = {
          name: data.name || '',
          email: data.email || storedEmail,
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || '',
          password: '',
        };
        
        setFormData(profileData);
        setOriginalData(profileData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        showToast('error', 'Failed to load profile data. Please try again.');
        const fallback = {
          name: '',
          email: storedEmail,
          phone: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          password: '',
        };
        setFormData(fallback);
        setOriginalData(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(formData).some(key => {
      if (key === 'password') return formData[key] !== '';
      return formData[key as keyof FormData] !== originalData[key as keyof FormData];
    });
    setHasChanges(changed);
  }, [formData, originalData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleCancel = () => {
    setFormData(originalData);
    setHasChanges(false);
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      showToast('error', 'No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/updateProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile updated successfully:', data);
      
      // Update original data to reflect saved changes
      const updatedData = { ...formData, password: '' };
      setOriginalData(updatedData);
      setFormData(updatedData);
      setHasChanges(false);
      
      showToast('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User, description: 'Basic information about you' },
    { id: 'contact', label: 'Contact', icon: Phone, description: 'Phone and communication details' },
    { id: 'address', label: 'Address', icon: MapPin, description: 'Your location and address' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Password and security settings' },
  ];

  const InputField = ({ 
    id, 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = 'text', 
    icon: Icon, 
    readOnly = false,
    required = false 
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    icon?: React.ElementType;
    readOnly?: boolean;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 border-2 rounded-xl transition-all duration-200 text-slate-700 placeholder-slate-400 ${
            readOnly 
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-500' 
              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
          }`}
        />
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <InputField
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              icon={User}
              required
            />
            <InputField
              id="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={Mail}
              readOnly
            />
            <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong>Note:</strong> Email address cannot be changed. Contact support if you need to update your email.
            </p>
          </div>
        );
      
      case 'contact':
        return (
          <div className="space-y-6">
            <InputField
              id="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              icon={Phone}
            />
          </div>
        );
      
      case 'address':
        return (
          <div className="space-y-6">
            <InputField
              id="address"
              label="Street Address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street, Apt 4B"
              icon={MapPin}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                id="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
              />
              <InputField
                id="state"
                label="State / Province"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                id="zip"
                label="ZIP / Postal Code"
                value={formData.zip}
                onChange={handleChange}
                placeholder="10001"
              />
              <InputField
                id="country"
                label="Country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <InputField
              id="password"
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              icon={Lock}
            />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Password Requirements:</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Leave blank to keep your current password</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-700 font-medium">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-8 px-4">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Professional Header */}
          <div className="bg-slate-100 px-8 py-8 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">Profile Settings</h1>
                <p className="text-slate-500 text-lg">Manage your personal information and account preferences</p>
              </div>
              {hasChanges && (
                <div className="bg-slate-200/60 px-4 py-2 rounded-full">
                  <span className="text-slate-700 text-sm font-medium">Unsaved Changes</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row min-h-[600px]">
            {/* Sidebar Navigation */}
            <div className="xl:w-1/3 bg-slate-50/80 backdrop-blur-sm border-r border-slate-200">
              <nav className="p-6 space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full group flex items-start space-x-4 px-5 py-4 rounded-xl text-left transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-slate-200 text-slate-900 shadow-lg scale-[1.02]'
                          : 'text-slate-700 hover:bg-slate-100 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mt-1 flex-shrink-0 ${
                        activeSection === section.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                      }`} />
                      <div>
                        <span className="font-semibold text-lg block">{section.label}</span>
                        <span className={`text-sm ${
                          activeSection === section.id ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {section.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="xl:w-2/3 p-8">
              <div className="max-w-2xl">
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    {sections.find(s => s.id === activeSection)?.icon && 
                      React.createElement(sections.find(s => s.id === activeSection)!.icon, {
                        className: "w-8 h-8 text-slate-700"
                      })
                    }
                    <h2 className="text-3xl font-bold text-slate-800">
                      {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                  </div>
                  {renderSection()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-8 border-t-2 border-slate-100">
                  <div className="text-sm text-slate-500">
                    {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={!hasChanges}
                      className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!hasChanges || isSaving}
                      className="px-8 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
