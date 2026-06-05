import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetPatientByIdQuery 
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { User, Activity, MapPin, Phone, Mail, Calendar, HeartPulse, Droplet } from 'lucide-react';

const FamilyPatient = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: patientData, isLoading: patientLoading, error } = useGetPatientByIdQuery(patientId, {
    skip: !patientId,
  });

  if (statsLoading || patientLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient using their unique ID.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 mt-20">
        <h2 className="text-xl font-bold mb-2">Error Loading Patient</h2>
        <p>{error.data?.message || 'Failed to fetch patient data'}</p>
      </div>
    );
  }

  const patient = patientData?.data;
  if (!patient) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Overview</h1>
        <p className="text-gray-500">Demographics, medical profile, and assigned care team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary-50 shadow-lg">
              {patient.profileImage ? (
                <img src={patient.profileImage} alt={patient.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User size={64} />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-black text-gray-900">{patient.name}</h2>
            <p className="text-primary-600 font-semibold mb-6">Linked Patient</p>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                <Phone size={18} className="text-gray-400" />
                <span className="text-sm font-medium">{patient.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl overflow-hidden">
                <Mail size={18} className="text-gray-400" />
                <span className="text-sm font-medium truncate">{patient.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                <MapPin size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-left">
                  {patient.address && (patient.address.street || patient.address.city)
                    ? `${patient.address.street || ''}${patient.address.street && patient.address.city ? ', ' : ''}${patient.address.city || ''}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Care Team */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Vitals Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
              <HeartPulse size={24} className="text-red-500" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase">Blood</p>
                <p className="text-lg font-black text-gray-900">{patient.bloodGroup || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
              <Activity size={24} className="text-blue-500" />
              <div>
                <p className="text-xs font-bold text-blue-500 uppercase">Weight</p>
                <p className="text-lg font-black text-gray-900">{patient.weight ? `${patient.weight} kg` : 'N/A'}</p>
              </div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-3 border border-orange-100">
              <User size={24} className="text-orange-500" />
              <div>
                <p className="text-xs font-bold text-orange-500 uppercase">Gender</p>
                <p className="text-lg font-black text-gray-900 capitalize">{patient.gender || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-100">
              <Calendar size={24} className="text-green-500" />
              <div>
                <p className="text-xs font-bold text-green-500 uppercase">DOB</p>
                <p className="text-sm font-black text-gray-900 mt-1">
                  {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          {patient.emergencyContact && patient.emergencyContact.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Emergency Contacts</h3>
              <div className="space-y-4">
                {patient.emergencyContact.map((contact, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{contact.relationship}</p>
                    </div>
                    <a href={`tel:${contact.phone}`} className="px-4 py-2 bg-primary-100 text-primary-700 font-bold rounded-lg text-sm">
                      Call {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Care Team */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Assigned Care Team</h3>
            <div className="space-y-4">
              {patient.assignedCaregiver ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                      CG
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Caregiver Assigned</p>
                      <p className="text-sm text-gray-500">Managing daily care</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-xl text-yellow-700 text-sm font-medium">
                  No caregiver currently assigned.
                </div>
              )}

              {patient.assignedDoctor ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      DR
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Doctor Assigned</p>
                      <p className="text-sm text-gray-500">Medical supervision</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-xl text-yellow-700 text-sm font-medium">
                  No doctor currently assigned.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default FamilyPatient;
