
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 10000,
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  maxWidth: 400,
  width: "100%",
  padding: 24,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  position: "relative",
};

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          setName(data.user.user_metadata?.name || "");
          setEmail(data.user.email || "");
        }
      };
      fetchUser();
      setInfoMessage("");
      setErrorMessage("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  const handleSaveProfile = async () => {
    setLoading(true);
    setInfoMessage("");
    setErrorMessage("");
    try {
      if (name !== user?.user_metadata?.name) {
        const { error } = await supabase.auth.updateUser({ data: { name } });
        if (error) throw error;
      }
      if (email !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }
      setInfoMessage("Profile updated successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage("");
    setErrorMessage("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });
      if (signInError) {
        setErrorMessage("Old password is incorrect.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message || "Failed to update password.");
      } else {
        setInfoMessage("Password updated successfully.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setErrorMessage("Failed to update password.");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Account Settings</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <Button className="w-full mt-2" onClick={handleSaveProfile} disabled={loading}>
            Save Profile
          </Button>
        </div>
        <form className="space-y-3 mt-6" onSubmit={handleChangePassword}>
          <div>
            <label className="block text-sm font-medium mb-1">Old Password</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            Change Password
          </Button>
        </form>
        {(infoMessage || errorMessage) && (
          <div className={`mt-4 text-sm ${infoMessage ? "text-green-600" : "text-red-600"}`}>
            {infoMessage || errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;

