import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLock, FiTrash2, FiUpload, FiUser } from "react-icons/fi";
import { API_URL, legacyAuthHeader } from "../config";
import { useToast } from "../components/Toast";
import { IconInput, PasswordInput } from "../components/inputs";
import { Breadcrumbs, ConfirmDialog, Field, PageHeader, PageLoader, PasswordStrength, Spinner } from "../components/ui";

export default function Profile() {
  const toast = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [newProfileImage, setNewProfileImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const initials = useMemo(() => {
    const name = newUsername || user?.username || "";
    return name
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [newUsername, user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/profile`, { headers: legacyAuthHeader() });
        setUser(res.data);
        setNewUsername(res.data.username);
      } catch (err) {
        console.error(err.response?.data || err.message);
        toast.error("Couldn't load your profile.");
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) setNewProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatedProfile = {};
      if (newUsername && newUsername !== user.username) updatedProfile.username = newUsername;
      if (newProfileImage) updatedProfile.profileImage = newProfileImage;
      const res = await axios.put(`${API_URL}/api/users/profile`, updatedProfile, { headers: legacyAuthHeader() });
      setUser(res.data);
      setNewProfileImage("");
      // keep the header in sync
      localStorage.setItem(
        "user",
        JSON.stringify({ username: res.data.username, profileImage: res.data.profileImage })
      );
      toast.success("Profile updated successfully.");
      setTimeout(() => navigate("/dashboard"), 650);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.msg || "Error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/users/change-password`,
        { currentPassword, newPassword },
        { headers: legacyAuthHeader() }
      );
      toast.success(res.data.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error changing password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API_URL}/api/users/profile`, { headers: legacyAuthHeader() });
      toast.success("Account deleted successfully.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting account.");
    }
  };

  if (!user) return <PageLoader label="Loading profile…" />;

  const avatar = newProfileImage || user.profileImage;

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Profile" }]} />
      <PageHeader eyebrow="Account" title="Profile" description="Manage your account details and security." />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile card */}
        <form onSubmit={onSubmitProfile} className="card p-6 lg:col-span-2">
          <div className="flex flex-col items-center text-center">
            {avatar ? (
              <img src={avatar} alt="Profile" className="h-28 w-28 rounded-full object-cover ring-4 ring-zinc-100" />
            ) : (
              <span className="grid h-28 w-28 place-items-center rounded-full bg-zinc-900 text-3xl font-semibold text-white ring-4 ring-zinc-100">
                {initials}
              </span>
            )}
            <p className="mt-4 text-lg font-semibold">{user.username}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>

            <div className="mt-5 flex w-full gap-2">
              <label className="btn btn-secondary btn-sm flex-1 cursor-pointer">
                <FiUpload /> Upload photo
                <input hidden type="file" onChange={onFileChange} accept="image/*" />
              </label>
              {newProfileImage && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewProfileImage("")}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6">
            <Field label="Username" htmlFor="username">
              <IconInput id="username" icon={FiUser} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </Field>
            <button type="submit" disabled={savingProfile} className="btn btn-primary w-full">
              {savingProfile && <Spinner className="h-4 w-4" />} {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Security */}
        <div className="space-y-6 lg:col-span-3">
          <form onSubmit={handleChangePassword} className="card space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">Change password</h2>
              <p className="text-sm text-zinc-500">Use a strong password you don't use elsewhere.</p>
            </div>
            <Field label="Current password" htmlFor="current">
              <PasswordInput
                id="current"
                icon={FiLock}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password" htmlFor="new">
              <PasswordInput
                id="new"
                icon={FiLock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <PasswordStrength password={newPassword} />
            <Field
              label="Confirm new password"
              htmlFor="confirm"
              error={confirmNewPassword && newPassword !== confirmNewPassword ? "Passwords do not match" : ""}
            >
              <PasswordInput
                id="confirm"
                icon={FiLock}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <button type="submit" disabled={savingPassword} className="btn btn-primary">
              {savingPassword && <Spinner className="h-4 w-4" />} {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>

          <div className="rounded-2xl bg-red-50/50 p-6 ring-1 ring-red-200">
            <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
            <p className="mt-1 text-sm text-zinc-600">Deleting your account is permanent and cannot be undone.</p>
            <button onClick={() => setShowDelete(true)} className="btn btn-secondary mt-4 !text-red-600 hover:!bg-red-50">
              <FiTrash2 /> Delete account
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteInput("");
        }}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This permanently removes your account. Type confirm to continue."
        confirmLabel="Delete account"
        danger
        confirmDisabled={deleteInput !== "confirm"}
      >
        <input
          autoFocus
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder="confirm"
          className="input"
        />
      </ConfirmDialog>
    </div>
  );
}
