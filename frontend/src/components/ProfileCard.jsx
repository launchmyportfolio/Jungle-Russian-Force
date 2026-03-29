import React from 'react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';

const ValueRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-none">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-800">{value || '-'}</span>
  </div>
);

const ProfileCard = ({ profile, onChangePassword }) => {
  return (
    <Card
      title="Employee Profile"
      subtitle="Account and employment details"
      actions={onChangePassword ? (
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          onClick={onChangePassword}
        >
          Update Password
        </Button>
      ) : null}
    >
      <div className="grid gap-2 md:grid-cols-2 md:gap-6">
        <div>
          <ValueRow label="Name" value={profile?.fullName || profile?.name} />
          <ValueRow label="Employee ID" value={profile?.employeeId} />
          <ValueRow label="Department" value={profile?.department} />
        </div>
        <div>
          <ValueRow label="Designation" value={profile?.designation} />
          <ValueRow
            label="Date of Joining"
            value={profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '-'}
          />
          <ValueRow label="Status" value={profile?.status || 'Active'} />
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;
