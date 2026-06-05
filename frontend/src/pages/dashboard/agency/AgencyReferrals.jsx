import React from 'react';
import { useGetAgencyReferralsQuery , useAssignReferralCaregiverMutation, useGetAgencyCaregiversQuery,} from '../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useCreateBookingMutation } from '../../../features/bookings/bookingApiSlice';
const AgencyReferrals = () => {
  const { data, isLoading } = useGetAgencyReferralsQuery();

const [createBooking] = useCreateBookingMutation();
const { data: caregiversData } =
  useGetAgencyCaregiversQuery();

const [assignReferralCaregiver] =
  useAssignReferralCaregiverMutation();
  const referrals = data?.data || [];

  if (isLoading) return <LoadingSpinner />;
const handleAssign = async (referral) => {
  const caregivers = caregiversData?.data || [];

  if (!caregivers.length) {
    toast.error('No caregivers available');
    return;
  }

  const caregiverList = caregivers
    .map(
      (c, index) =>
        `${index + 1}. ${c.name}`
    )
    .join('\n');

  const selected = prompt(
    `Assign caregiver:\n${caregiverList}\n\nEnter number:`
  );

  if (!selected) return;

  const caregiver =
    caregivers[Number(selected) - 1];

  if (!caregiver) {
    toast.error('Invalid caregiver selection');
    return;
  }

  try {
    await assignReferralCaregiver({
      referralId: referral._id,
      caregiverId: caregiver._id,
    }).unwrap();

    toast.success(
      `${caregiver.name} assigned successfully`
    );
  } catch (err) {
    toast.error(
      err?.data?.message || 'Assignment failed'
    );
  }
};
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Referrals
        </h1>
        <p className="text-gray-500">
          Referrals assigned to your agency
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Service</th>
              <th className="p-4 text-left">Urgency</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">
  Actions
</th>
            </tr>
          </thead>

          <tbody>
            {referrals.length > 0 ? (
              referrals.map((referral) => (
                <tr key={referral._id}>
                  <td className="p-4">
                    {referral.patient?.name || 'Unknown'}
                  </td>

                  <td className="p-4">
                    {referral.serviceType}
                  </td>

                  <td className="p-4">
                    {referral.urgency}
                  </td>

                  <td className="p-4">
                    {referral.status}
                  </td>
                  <td className="p-4">
  {referral.status === 'pending' ? (
    <button
      onClick={() => handleAssign(referral)}
      className="px-4 py-2 rounded-lg bg-blue-600 text-white"
    >
      Assign Caregiver
    </button>
  ) : (
    <span>
      Assigned
    </span>
  )}
</td>
<button
  onClick={() => setSelectedReferral(referral)}
  className="btn btn-success"
>
  Create Booking
</button>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="p-6 text-center"
                >
                  No referrals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgencyReferrals;