'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Download,
  Globe,
  LayoutGrid,
  LayoutList,
  Loader2,
  Mail,
  RefreshCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import BASE_URL from '@/app/config/api/api';

type Language = 'English' | 'Spanish' | 'French' | 'German';
type TicketView = 'list' | 'kanban';
type ToastType = 'success' | 'error' | 'info';

type SettingsForm = {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  ticketEscalationAlerts: boolean;
  language: Language;
  defaultTicketView: TicketView;
  signature: string;
  refreshIntervalSeconds: number;
  compactTicketCards: boolean;
};

const SETTINGS_STORAGE_KEY = 'joinai_agent_settings_v2';

const DEFAULT_SETTINGS: SettingsForm = {
  emailNotifications: true,
  inAppNotifications: true,
  ticketEscalationAlerts: true,
  language: 'English',
  defaultTicketView: 'list',
  signature: 'Best regards,\nJoinAI Support Team',
  refreshIntervalSeconds: 60,
  compactTicketCards: false,
};

const languageOptions: Language[] = ['English', 'Spanish', 'French', 'German'];

const isLanguage = (value: string): value is Language =>
  languageOptions.includes(value as Language);

const normalizeSettings = (raw: Partial<SettingsForm> | null | undefined): SettingsForm => {
  const refreshRaw = Number(raw?.refreshIntervalSeconds);
  const refreshIntervalSeconds = Number.isFinite(refreshRaw)
    ? Math.max(15, Math.min(300, Math.trunc(refreshRaw)))
    : DEFAULT_SETTINGS.refreshIntervalSeconds;

  const language = raw?.language && isLanguage(raw.language)
    ? raw.language
    : DEFAULT_SETTINGS.language;

  const defaultTicketView =
    raw?.defaultTicketView === 'kanban' ? 'kanban' : DEFAULT_SETTINGS.defaultTicketView;

  const signature = typeof raw?.signature === 'string'
    ? raw.signature.slice(0, 500)
    : DEFAULT_SETTINGS.signature;

  return {
    emailNotifications:
      typeof raw?.emailNotifications === 'boolean'
        ? raw.emailNotifications
        : DEFAULT_SETTINGS.emailNotifications,
    inAppNotifications:
      typeof raw?.inAppNotifications === 'boolean'
        ? raw.inAppNotifications
        : DEFAULT_SETTINGS.inAppNotifications,
    ticketEscalationAlerts:
      typeof raw?.ticketEscalationAlerts === 'boolean'
        ? raw.ticketEscalationAlerts
        : DEFAULT_SETTINGS.ticketEscalationAlerts,
    language,
    defaultTicketView,
    signature,
    refreshIntervalSeconds,
    compactTicketCards:
      typeof raw?.compactTicketCards === 'boolean'
        ? raw.compactTicketCards
        : DEFAULT_SETTINGS.compactTicketCards,
  };
};

const loadLocalSettings = (): SettingsForm => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(stored) as Partial<SettingsForm>;
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

interface ToastState {
  type: ToastType;
  message: string;
}

const Toast = ({ type, message, onClose }: { type: ToastType; message: string; onClose: () => void }) => {
  const palette =
    type === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : type === 'error'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-blue-50 text-blue-800 border-blue-200';

  return (
    <div className={`fixed right-6 top-6 z-50 rounded-xl border px-4 py-3 shadow-lg ${palette}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-white/50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [agentEmail, setAgentEmail] = useState('');
  const [settings, setSettings] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      const localSettings = loadLocalSettings();
      setSettings(localSettings);
      setInitialSettings(localSettings);

      const email = localStorage.getItem('email') ?? '';
      setAgentEmail(email);

      if (!email) {
        setToast({
          type: 'info',
          message: 'No login email found. Settings will be stored locally in this browser.',
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/admin/getSettings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const serverPayload = (await response.json()) as Partial<SettingsForm>;
          const normalized = normalizeSettings(serverPayload);
          setSettings(normalized);
          setInitialSettings(normalized);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        setToast({
          type: 'info',
          message: 'Using locally saved settings. Backend sync is currently unavailable.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const updateSetting = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const persistLocally = (payload: SettingsForm) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const normalized = normalizeSettings(settings);
    persistLocally(normalized);

    if (!agentEmail) {
      setSettings(normalized);
      setInitialSettings(normalized);
      setToast({ type: 'success', message: 'Settings saved locally.' });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/updateSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: agentEmail, ...normalized }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      const serverPayload = (await response.json()) as Partial<SettingsForm>;
      const serverSettings = normalizeSettings(serverPayload);
      setSettings(serverSettings);
      setInitialSettings(serverSettings);
      persistLocally(serverSettings);
      setToast({ type: 'success', message: 'Settings saved and synced successfully.' });
    } catch (error) {
      console.error('Failed to sync settings to backend:', error);
      setSettings(normalized);
      setInitialSettings(normalized);
      setToast({
        type: 'info',
        message: 'Saved locally. Backend sync failed, but your preferences were not lost.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setToast({ type: 'info', message: 'Default settings restored. Click Save to apply.' });
  };

  const handleExportSettings = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'joinai-agent-settings.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Settings exported successfully.' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid payload');
      }
      const payload = parsed as Record<string, unknown>;
      const rawCandidate =
        payload.settings && typeof payload.settings === 'object'
          ? (payload.settings as Partial<SettingsForm>)
          : (payload as Partial<SettingsForm>);
      const normalized = normalizeSettings(rawCandidate);
      setSettings(normalized);
      setToast({ type: 'success', message: 'Settings imported. Click Save to apply.' });
    } catch (error) {
      console.error('Failed to import settings:', error);
      setToast({ type: 'error', message: 'Invalid settings file. Please import a valid JSON export.' });
    } finally {
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#3F5C79]" />
          <span className="text-sm font-medium text-slate-700">Loading settings...</span>
        </div>
      </div>
    );
  }

  const actionButtonClass =
    'w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors';

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Agent Settings</h1>
              <p className="text-sm text-slate-600">
                Manage notification, workflow, and response preferences for your support workspace.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF1F8] px-3 py-1 text-xs font-semibold text-[#375573]">
              <ShieldCheck className="h-4 w-4" />
              {agentEmail ? `Synced as ${agentEmail}` : 'Local Mode'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#3F5C79]" />
                Notifications
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Choose which alerts should reach you while managing tickets.
              </p>

              <div className="mt-5 space-y-3">
                <ToggleRow
                  label="Email Notifications"
                  description="Receive updates for ticket assignments and status changes."
                  checked={settings.emailNotifications}
                  onChange={(checked) => updateSetting('emailNotifications', checked)}
                />
                <ToggleRow
                  label="In-app Notifications"
                  description="Show activity alerts directly in your dashboard."
                  checked={settings.inAppNotifications}
                  onChange={(checked) => updateSetting('inAppNotifications', checked)}
                />
                <ToggleRow
                  label="Escalation Alerts"
                  description="Notify you when high-priority tickets remain unresolved."
                  checked={settings.ticketEscalationAlerts}
                  onChange={(checked) => updateSetting('ticketEscalationAlerts', checked)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#3F5C79]" />
                Workspace Preferences
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Control the way your ticket workspace behaves and appears.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Language</label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as Language)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:border-[#3F5C79] focus:outline-none focus:ring-2 focus:ring-[#3F5C79]/15"
                    >
                      {languageOptions.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Refresh Interval (seconds)</label>
                  <div className="relative">
                    <RefreshCcw className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={15}
                      max={300}
                      value={settings.refreshIntervalSeconds}
                      onChange={(e) =>
                        updateSetting(
                          'refreshIntervalSeconds',
                          Math.max(15, Math.min(300, Number(e.target.value) || 15)),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:border-[#3F5C79] focus:outline-none focus:ring-2 focus:ring-[#3F5C79]/15"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Default Ticket View</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => updateSetting('defaultTicketView', 'list')}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      settings.defaultTicketView === 'list'
                        ? 'border-[#3F5C79] bg-[#EAF1F8] text-[#2F4A64]'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <LayoutList className="h-4 w-4" />
                      List View
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">Best for detailed triage and searching.</span>
                  </button>
                  <button
                    onClick={() => updateSetting('defaultTicketView', 'kanban')}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      settings.defaultTicketView === 'kanban'
                        ? 'border-[#3F5C79] bg-[#EAF1F8] text-[#2F4A64]'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <LayoutGrid className="h-4 w-4" />
                      Kanban View
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">Best for pipeline-based workflow tracking.</span>
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <ToggleRow
                  label="Compact Ticket Cards"
                  description="Use denser cards to fit more tickets on screen."
                  checked={settings.compactTicketCards}
                  onChange={(checked) => updateSetting('compactTicketCards', checked)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#3F5C79]" />
                Response Signature
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                This signature can be reused when posting ticket updates.
              </p>
              <textarea
                value={settings.signature}
                onChange={(e) => updateSetting('signature', e.target.value.slice(0, 500))}
                rows={5}
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[#3F5C79] focus:outline-none focus:ring-2 focus:ring-[#3F5C79]/15"
                placeholder="Best regards,&#10;JoinAI Support Team"
              />
              <p className="mt-2 text-xs text-slate-500">{settings.signature.length}/500 characters</p>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Actions</h3>
              <p className="mt-1 text-sm text-slate-600">Apply, export, or restore your preferences.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportSettings}
                className="hidden"
              />

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className={`${actionButtonClass} border-[#3F5C79] bg-[#3F5C79] text-white hover:bg-[#344F69] disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Settings
                </button>

                <button
                  onClick={handleExportSettings}
                  className={`${actionButtonClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>

                <button
                  onClick={handleImportClick}
                  className={`${actionButtonClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <Upload className="h-4 w-4" />
                  Import JSON
                </button>

                <button
                  onClick={handleResetDefaults}
                  className={`${actionButtonClass} border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100`}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Defaults
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Current Summary</h3>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Language" value={settings.language} />
                <SummaryRow label="Ticket View" value={settings.defaultTicketView === 'list' ? 'List' : 'Kanban'} />
                <SummaryRow label="Refresh Interval" value={`${settings.refreshIntervalSeconds}s`} />
                <SummaryRow label="Compact Cards" value={settings.compactTicketCards ? 'Enabled' : 'Disabled'} />
              </div>
              <div className="mt-4 rounded-xl bg-[#EAF1F8] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#375573]">Sync status</p>
                <p className="mt-1 text-sm text-[#2F4A64]">{agentEmail ? 'Connected to backend profile settings' : 'Local browser storage only'}</p>
              </div>
              {isDirty ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Unsaved changes
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All changes saved
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-[#3F5C79]' : 'bg-slate-300'
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

export default Settings;
