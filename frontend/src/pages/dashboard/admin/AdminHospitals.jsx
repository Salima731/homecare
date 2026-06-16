import React, { useState } from 'react';
import { Search, Building2, Shield, Ban, UserCheck } from 'lucide-react';
import {
  useGetHospitalsQuery,
  useUpdateHospitalStatusMutation,
} from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminHospitals = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useGetHospitalsQuery();

  const [updateHospitalStatus] = useUpdateHospitalStatusMutation();

  const hospitals = data?.data || [];

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus =
      currentStatus === 'approved'
        ? 'suspended'
        : 'approved';

    const action =
      newStatus === 'suspended'
        ? 'suspend'
        : 'approve';

    if (
      !window.confirm(
        `Are you sure you want to ${action} this hospital?`
      )
    ) {
      return;
    }

    try {
      await updateHospitalStatus({
        id,
        status: newStatus,
      }).unwrap();

      toast.success(
        `Hospital ${newStatus} successfully`
      );
    } catch (error) {
      toast.error('Failed to update hospital status');
    }
  };

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.hospitalName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      hospital.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Hospital Management
        </h1>
        <p className="text-gray-500">
          Manage and verify hospitals
        </p>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-3.5 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="input pl-10 w-full"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">
                  Hospital
                </th>

                <th className="p-4 text-left">
                  Email
                </th>

                <th className="p-4 text-left">
                  Verification
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital) => (
                  <tr
                    key={hospital._id}
                    className="border-b"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Building2 size={20} />
                        </div>

                        <div>
                          <p className="font-semibold">
                            {hospital.hospitalName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {hospital.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {hospital.user?.email}
                    </td>

                    <td className="p-4">
                      {hospital.isVerified ? (
                        <span className="inline-flex items-center gap-2 text-green-600">
                          <Shield size={16} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`capitalize ${
                          hospital.status ===
                          'approved'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {hospital.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {hospital.status === 'approved' ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                hospital._id,
                                hospital.status
                              )
                            }
                            className="btn btn-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm font-bold text-xs py-1.5 px-3 rounded-lg"
                          >
                            <Ban size={14} />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                hospital._id,
                                hospital.status
                              )
                            }
                            className="btn btn-sm border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm font-bold text-xs py-1.5 px-3 rounded-lg"
                          >
                            <UserCheck size={14} />
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center p-10"
                  >
                    No hospitals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHospitals;