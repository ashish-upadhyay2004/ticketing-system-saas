import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const Profile: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="rounded-lg border p-4">
        <p><span className="font-semibold">Name:</span> {profile?.name || "-"}</p>
        <p><span className="font-semibold">Email:</span> {profile?.email || "-"}</p>
        <p><span className="font-semibold">Role:</span> {profile?.role || "-"}</p>
      </div>
    </div>
  );
};

export default Profile;
