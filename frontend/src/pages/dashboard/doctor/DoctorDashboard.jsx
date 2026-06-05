import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { useGetMyDoctorProfileQuery, useGetMyPatientsQuery } from '../../../features/doctors/doctorApiSlice';
import { useGetMyAppointmentsQuery } from '../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-main)] shadow-sm flex items-center gap-4"
  >
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 flex-shrink-0`}>
      <Icon className={color.replace('bg-', 'text-').replace('/10', '')} size={24} />
    </div>
    <div>
      <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-[var(--text-main)] mt-1">{value}</h3>
    </div>
  </motion.div>
);

const DoctorDashboard = () => {
  const { data: profileData, isLoading: profileLoading } = useGetMyDoctorProfileQuery();
  const { data: patientsData, isLoading: patientsLoading } = useGetMyPatientsQuery();
  const { data: appointmentsData, isLoading: appointmentsLoading } = useGetMyAppointmentsQuery({ status: 'pending' }, { pollingInterval: 5000 });

  if (profileLoading || patientsLoading || appointmentsLoading) {
    return <LoadingSpinner fullPage />;
  }

  const profile = profileData?.data;
  const patientsCount = patientsData?.data?.length || 0;
  const pendingAppointments = appointmentsData?.data?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            Welcome, Dr. {profile?.name?.split(' ')[0] || ''}
          </h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">Here's your schedule and patient overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={patientsCount} icon={Users} color="bg-primary-500/10 text-primary-500" delay={0.1} />
        <StatCard title="Pending Appointments" value={pendingAppointments} icon={Calendar} color="bg-amber-500/10 text-amber-500" delay={0.2} />
        <StatCard title="Consultations" value="-" icon={Activity} color="bg-emerald-500/10 text-emerald-500" delay={0.3} />
        <StatCard title="Revenue" value="-" icon={TrendingUp} color="bg-blue-500/10 text-blue-500" delay={0.4} />
      </div>

      <div className="mt-8 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <p className="text-[var(--text-muted)]">Use the sidebar to navigate to Appointments, Patients, and Prescriptions.</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
