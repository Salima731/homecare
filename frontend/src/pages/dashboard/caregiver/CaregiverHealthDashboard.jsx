import React, { useState } from "react";
import {
  useGetCaregiverPatientsQuery,
  useGetLatestHealthSummaryQuery,
  useGetPatientLogsQuery,
  useGetVitalTrendsQuery,
} from "../../../features/health/healthLogApiSlice";
import HealthLogForm from "../../../components/health/HealthLogForm";
import { Users, AlertCircle, Activity, Heart, Thermometer, Droplet } from "lucide-react";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { format } from "date-fns";

const CaregiverHealthDashboard = () => {
  const {
    data: patientsResponse,
    isLoading: loadingPatients,
    error: patientsError,
  } = useGetCaregiverPatientsQuery();
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const patients = patientsResponse?.data || patientsResponse || [];
  const selectedPatient = patients.find((p) => p._id === selectedPatientId);

  const { data: summaryData } = useGetLatestHealthSummaryQuery(
    selectedPatientId,
    {
      skip: !selectedPatientId,
    },
  );
  const { data: logsData } = useGetPatientLogsQuery(
    { patientId: selectedPatientId, limit: 8 },
    { skip: !selectedPatientId },
  );
  const { data: trendsData } = useGetVitalTrendsQuery(
    { patientId: selectedPatientId, days: 30 },
    { skip: !selectedPatientId },
  );

  const recentLogs = logsData?.data?.docs || logsData?.data || [];
  const trends = trendsData?.data?.trends || {};
  const avg = (items) => {
    if (!items?.length) return "--";
    return Math.round(items.reduce((sum, item) => sum + Number(item.value || 0), 0) / items.length);
  };

  if (loadingPatients) return <LoadingSpinner />;

  if (patientsError) {
    return (
      <div className="card p-12 text-center space-y-4 bg-red-50 border border-red-200">
        <AlertCircle size={48} className="mx-auto text-red-500" />
        <h2 className="text-xl font-bold text-red-900">
          Error Loading Patients
        </h2>
        <p className="text-red-700">
          {patientsError?.data?.message || "Failed to load assigned patients"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Health Monitoring
        </h1>
        <p className="text-gray-500 font-medium">
          Record and monitor patient vital signs
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Users size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500">
            No patients currently assigned. You'll see them once a booking is
            active.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="card p-6 space-y-4 shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-primary-600" />
              Assigned Patients ({patients.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient._id}
                  onClick={() => {
                    setSelectedPatientId(patient._id);
                    setShowForm(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedPatientId === patient._id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="font-bold text-gray-900">{patient.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    DOB:{" "}
                    {patient.dateOfBirth
                      ? format(new Date(patient.dateOfBirth), "MMM dd, yyyy")
                      : "Not set"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Blood Group:{" "}
                    <span className="font-semibold">
                      {patient.bloodGroup || "Unknown"}
                    </span>
                  </div>
                  {patient.allergies?.length > 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      ⚠️ Allergies: {patient.allergies.join(", ")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details & Form */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Info Card */}
                <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedPatient.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                     
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPatient.dateOfBirth
                          ? new Date().getFullYear() -
                            new Date(selectedPatient.dateOfBirth).getFullYear()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">
                        Blood Group
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPatient.bloodGroup || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">
                        Booking Period
                      </p>
                      <p className="text-xs text-gray-700">
                        {selectedPatient.booking
                          ? `${format(new Date(selectedPatient.booking.startDate), "MMM dd")} - ${format(new Date(selectedPatient.booking.endDate), "MMM dd")}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedPatient.chronicConditions?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-gray-500 font-bold mb-2">
                        Chronic Conditions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.chronicConditions.map(
                          (condition, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                            >
                              {condition}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Latest Health Summary */}
                {summaryData?.data?.latestLog && (
                  <div className="card p-6 space-y-4">
                    <h4 className="text-lg font-bold text-gray-900">
                      Latest Health Reading
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {summaryData.data.latestLog.vitals?.bloodPressure
                        ?.systolic && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs text-red-600 font-bold">
                            Blood Pressure
                          </p>
                          <p className="text-xl font-bold text-red-900">
                            {
                              summaryData.data.latestLog.vitals.bloodPressure
                                .systolic
                            }
                            /
                            {
                              summaryData.data.latestLog.vitals.bloodPressure
                                .diastolic
                            }
                          </p>
                          <p className="text-xs text-red-700">
                            {
                              summaryData.data.latestLog.vitals.bloodPressure
                                .status
                            }
                          </p>
                        </div>
                      )}
                      {summaryData.data.latestLog.vitals?.heartRate?.value && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-600 font-bold">
                            Heart Rate
                          </p>
                          <p className="text-xl font-bold text-purple-900">
                            {summaryData.data.latestLog.vitals.heartRate.value}{" "}
                            BPM
                          </p>
                          <p className="text-xs text-purple-700">
                            {summaryData.data.latestLog.vitals.heartRate.status}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Updated{" "}
                      {format(
                        new Date(summaryData.data.latestLog.logDate),
                        "MMM dd, HH:mm",
                      )}
                    </p>
                  </div>
                )}

                <div className="card p-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    30-Day Trends
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <Heart size={18} className="text-red-500 mb-2" />
                      <p className="text-xs text-gray-500 font-bold">
                        Avg Heart Rate
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {avg(trends.heartRate)} <span className="text-xs">bpm</span>
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <Droplet size={18} className="text-blue-500 mb-2" />
                      <p className="text-xs text-gray-500 font-bold">
                        Avg Blood Sugar
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {avg(trends.bloodSugar)} <span className="text-xs">mg/dL</span>
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <Thermometer size={18} className="text-orange-500 mb-2" />
                      <p className="text-xs text-gray-500 font-bold">
                        Avg Temperature
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {avg(trends.temperature)} <span className="text-xs">C</span>
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <Activity size={18} className="text-purple-500 mb-2" />
                      <p className="text-xs text-gray-500 font-bold">
                        Abnormal Days
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {trends.abnormalDays || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    Recent Health History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">BP</th>
                          <th className="py-2 pr-4">Heart</th>
                          <th className="py-2 pr-4">Sugar</th>
                          <th className="py-2 pr-4">Temp</th>
                          <th className="py-2 pr-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLogs.length > 0 ? (
                          recentLogs.map((log) => (
                            <tr key={log._id} className="border-b last:border-b-0">
                              <td className="py-3 pr-4 whitespace-nowrap">
                                {format(new Date(log.logDate), "MMM dd, HH:mm")}
                              </td>
                              <td className="py-3 pr-4">
                                {log.vitals?.bloodPressure?.systolic
                                  ? `${log.vitals.bloodPressure.systolic}/${log.vitals.bloodPressure.diastolic || "--"}`
                                  : "--"}
                              </td>
                              <td className="py-3 pr-4">
                                {log.vitals?.heartRate?.value
                                  ? `${log.vitals.heartRate.value} bpm`
                                  : "--"}
                              </td>
                              <td className="py-3 pr-4">
                                {log.vitals?.bloodSugar?.value
                                  ? `${log.vitals.bloodSugar.value} mg/dL`
                                  : "--"}
                              </td>
                              <td className="py-3 pr-4">
                                {log.vitals?.temperature?.value
                                  ? `${log.vitals.temperature.value} C`
                                  : "--"}
                              </td>
                              <td className="py-3 pr-4 max-w-[220px] truncate">
                                {log.notes || "--"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-gray-500">
                              No health logs recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Toggle Form Button */}
                <button
                  onClick={() => setShowForm(!showForm)}
                  className={`btn w-full py-3 text-lg font-bold ${
                    showForm ? "btn-outline" : "btn-primary"
                  }`}
                >
                  {showForm ? "✕ Close" : "+ Record New Health Log"}
                </button>

                {/* Health Log Form */}
                {showForm && (
                  <HealthLogForm
                    patientId={selectedPatient._id}
                    patientName={selectedPatient.name}
                    bookingId={selectedPatient.booking?._id}
                    onSuccess={() => {
                      setShowForm(false);
                    }}
                  />
                )}
              </>
            ) : (
              <div className="card p-12 text-center space-y-4 bg-gray-50">
                <Users size={48} className="mx-auto text-gray-300" />
                <p className="text-gray-500">
                  Select a patient to view details and record health logs
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverHealthDashboard;
