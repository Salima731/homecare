import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetFamilyEmergenciesQuery
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { AlertTriangle, MapPin, Clock, ShieldCheck } from 'lucide-react';

const FamilyEmergencies = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: emergenciesData, isLoading: emergenciesLoading } = useGetFamilyEmergenciesQuery(patientId, { skip: !patientId });

  if (statsLoading || emergenciesLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient.</p>
      </div>
    );
  }

  const incidents = emergenciesData?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency History</h1>
        <p className="text-gray-500">Monitor past and active SOS alerts triggered for your loved one.</p>
      </div>

      <div className="space-y-4">
        {incidents.length > 0 ? incidents.map((incident) => (
          <div key={incident._id} className={`bg-white rounded-3xl p-6 shadow-sm border ${
            incident.status === 'active' ? 'border-red-500 shadow-red-100 ring-2 ring-red-100' : 'border-gray-100'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  incident.status === 'active' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    SOS Alert <span className="text-sm font-medium text-gray-500 capitalize">({incident.type})</span>
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock size={14} /> 
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${
                incident.status === 'active' ? 'bg-red-100 text-red-700' :
                incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                incident.status === 'false_alarm' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {incident.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium flex items-start gap-2">
                <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                {incident.location?.address || `${incident.location?.lat}, ${incident.location?.lng}`}
              </p>
              {incident.description && (
                <p className="text-sm text-gray-600 mt-2 italic border-l-2 border-gray-300 pl-3">
                  "{incident.description}"
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-bold text-gray-900">Triggered by:</span> 
                {incident.triggeredBy?.name || 'Unknown'} <span className="text-xs uppercase text-gray-400">({incident.triggeredBy?.role})</span>
              </div>
              
              {incident.respondedBy && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                  <ShieldCheck size={16} />
                  <span className="font-bold">Responded by:</span> 
                  {incident.respondedBy?.name}
                </div>
              )}
            </div>
            
            {incident.resolutionNote && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Resolution Note</span>
                <p className="text-sm font-medium text-gray-900 mt-1">{incident.resolutionNote}</p>
              </div>
            )}
          </div>
        )) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 text-gray-500 font-medium">
            No emergency incidents recorded.
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyEmergencies;
