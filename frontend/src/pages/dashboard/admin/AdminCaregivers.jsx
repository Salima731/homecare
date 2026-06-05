import React, { useState } from 'react';
import { Search, UserCheck, Ban, Users } from 'lucide-react';
import {
  useGetCaregiversQuery,
  useUpdateCaregiverStatusMutation
} from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminCaregivers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useGetCaregiversQuery();

  const [updateStatus] = useUpdateCaregiverStatusMutation();

  const caregivers = data?.data || [];

  const handleStatusUpdate = async (id, currentStatus) => {
    try {
      await updateStatus({
        id,
        isActive: !currentStatus
      }).unwrap();

      toast.success('Caregiver status updated');
    } catch {
      toast.error('Failed to update caregiver');
    }
  };

  const filteredCaregivers = caregivers.filter(
    caregiver =>
      caregiver.user?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      caregiver.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Caregiver Management
        </h1>

        <p className="text-gray-500">
          View and manage caregivers.
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search caregivers..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="input w-full"
        />
      </div>

      <div className="card overflow-x-auto">

        <table className="w-full">

          <thead>
            <tr>
              <th>Name</th>
              <th>Agency</th>
              <th>Service</th>
          
              <th>Verified</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredCaregivers.map(caregiver => (

              <tr key={caregiver._id}>

                <td>
                  {caregiver.user?.name}
                </td>

                <td>
                  {caregiver.agency?.agencyName}
                </td>

                <td>
                  {caregiver.serviceType}
                </td>

                

              <td>
  {caregiver.isVerified ? (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold">
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
      Pending
    </span>
  )}
</td>
             <td className="pb-2">
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
      caregiver.isActive
        ? 'bg-green-500/10 text-green-500'
        : 'bg-red-500/10 text-red-500'
    }`}
  >
    {caregiver.isActive ? 'Active' : 'Suspended'}
  </span>
</td >
<button
  onClick={() =>
    handleStatusUpdate(
      caregiver._id,
      caregiver.isActive
    )
  }
  className={`px-4 py-2 mb-2  rounded-xl text-xs font-bold transition-all ${
    caregiver.isActive
      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
  }`}
>
  {caregiver.isActive ? 'Suspend' : 'Activate'}
</button>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default AdminCaregivers;