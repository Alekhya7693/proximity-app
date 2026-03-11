"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Database, Globe, Save } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform configuration and preferences
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          General
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Platform Name
            </label>
            <input
              type="text"
              defaultValue="Proximity"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Support Email
            </label>
            <input
              type="email"
              defaultValue="support@proximity.app"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Discovery Radius (meters)
            </label>
            <input
              type="number"
              defaultValue={50000}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Safety Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Safety & Moderation
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-flag suspicious accounts</p>
              <p className="text-xs text-muted-foreground">
                Automatically flag new accounts with suspicious behavior
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-purple-600"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Content moderation</p>
              <p className="text-xs text-muted-foreground">
                Enable AI-powered content screening for messages
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-purple-600"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Require email verification</p>
              <p className="text-xs text-muted-foreground">
                Users must verify email before using the platform
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-purple-600"
            />
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email alerts for critical reports</p>
              <p className="text-xs text-muted-foreground">
                Get notified when high-priority reports are submitted
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-purple-600"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily summary emails</p>
              <p className="text-xs text-muted-foreground">
                Receive daily platform health summaries
              </p>
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 accent-purple-600"
            />
          </label>
        </div>
      </div>

      {/* Data Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data & Privacy
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Chat message retention (days)
            </label>
            <input
              type="number"
              defaultValue={3}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Inactive account cleanup (days)
            </label>
            <input
              type="number"
              defaultValue={90}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
