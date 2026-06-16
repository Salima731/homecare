import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Components
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('../pages/HomePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ServicesPage = lazy(() => import('../pages/ServicesPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));

// Dashboards
const UserDashboard = lazy(() => import('../pages/dashboard/user/UserDashboard'));
const CaregiverSearch = lazy(() => import('../pages/dashboard/user/CaregiverSearch'));
const CaregiverDetail = lazy(() => import('../pages/dashboard/user/CaregiverDetail'));
const UserFavorites = lazy(() => import('../pages/dashboard/user/UserFavorites'));
const UserBookings = lazy(() => import('../pages/dashboard/user/UserBookings'));
const BookingDetail = lazy(() => import('../pages/dashboard/user/BookingDetail'));
const UserPayments = lazy(() => import('../pages/dashboard/user/UserPayments'));
const Messages = lazy(() => import('../pages/dashboard/common/Messages'));
const UserSettings = lazy(() => import('../pages/dashboard/user/UserSettings'));
const UserComplaints = lazy(() => import('../pages/dashboard/user/UserComplaints'));
const FindDoctors = lazy(() => import('../pages/dashboard/user/doctors/FindDoctors'));
const DoctorPublicProfile = lazy(() => import('../pages/dashboard/user/doctors/DoctorPublicProfile'));
const UserAppointments = lazy(() => import('../pages/dashboard/user/appointments/UserAppointments'));
const UserPrescriptions = lazy(() => import('../pages/dashboard/user/prescriptions/UserPrescriptions'));
const UserHealthTracking = lazy(() => import('../pages/dashboard/user/LogVitals'));

const AgencyDashboard = lazy(() => import('../pages/dashboard/agency/AgencyDashboard'));
const AgencyCaregivers = lazy(() => import('../pages/dashboard/agency/AgencyCaregivers'));
const CaregiverAdd = lazy(() => import('../pages/dashboard/agency/CaregiverAdd'));
const AgencyReferrals = lazy(() => import('../pages/dashboard/agency/AgencyReferrals'));
const AgencySetup = lazy(() => import('../pages/dashboard/agency/AgencySetup'));
const AgencyBookings = lazy(() => import('../pages/dashboard/agency/AgencyBookings'));
const AgencySettings = lazy(() => import('../pages/dashboard/agency/AgencySettings'));
const AgencyEarnings = lazy(() => import('../pages/dashboard/agency/AgencyEarnings'));
const CaregiverDashboard = lazy(() => import('../pages/dashboard/caregiver/CaregiverDashboard'));
const CaregiverJobs = lazy(() => import('../pages/dashboard/caregiver/CaregiverJobs'));
const CaregiverEarnings = lazy(() => import('../pages/dashboard/caregiver/CaregiverEarnings'));
const CaregiverReviews = lazy(() => import('../pages/dashboard/caregiver/CaregiverReviews'));
const CaregiverSettings = lazy(() => import('../pages/dashboard/caregiver/CaregiverSettings'));
const CaregiverSetup = lazy(() => import('../pages/dashboard/caregiver/CaregiverSetup'));
const CaregiverHealthDashboard = lazy(() => import('../pages/dashboard/caregiver/CaregiverHealthDashboard'));
const CaregiverPrescriptions = lazy(() => import('../pages/dashboard/caregiver/CaregiverPrescriptions'));
const CaregiverDailyReport = lazy(() => import('../pages/dashboard/caregiver/CaregiverDailyReport'));
const CaregiverMedications = lazy(() => import('../pages/dashboard/caregiver/CaregiverMedications'));
const AdminDashboard = lazy(() => import('../pages/dashboard/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/dashboard/admin/AdminUsers'));
const AdminAgencies = lazy(() => import('../pages/dashboard/admin/AdminAgencies'));
const AdminHospitals = lazy(() => import('../pages/dashboard/admin/AdminHospitals'));
const AdminDoctors = lazy(() => import('../pages/dashboard/admin/AdminDoctors'));
const AdminAppointments = lazy(() => import('../pages/dashboard/admin/AdminAppointments'));
const AdminVerifications = lazy(() => import('../pages/dashboard/admin/AdminVerifications'));
const AdminComplaints = lazy(() => import('../pages/dashboard/admin/AdminComplaints'));
const AdminCaregivers = lazy(()=> import('../pages/dashboard/admin/AdminCaregivers'))
const AdminBookings = lazy(() => import('../pages/dashboard/admin/AdminBookings'));
const AdminPayments = lazy(() => import('../pages/dashboard/admin/AdminPayments'));
const AdminSettings = lazy(() => import('../pages/dashboard/admin/AdminSettings'));
const ProfilePage = lazy(() => import('../pages/dashboard/common/ProfilePage'));
const NotificationPage = lazy(() => import('../pages/dashboard/common/NotificationPage'));
const PlaceholderPage = lazy(() => import('../pages/dashboard/common/PlaceholderPage'));
const PatientDashboard = lazy(() => import('../pages/dashboard/patient/PatientDashboard'));
const DoctorDashboard = lazy(() => import('../pages/dashboard/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('../pages/dashboard/doctor/appointments/DoctorAppointments'));
const DoctorPatients = lazy(() => import('../pages/dashboard/doctor/patients/DoctorPatients'));
const DoctorPrescriptions = lazy(() => import('../pages/dashboard/doctor/prescriptions/DoctorPrescriptions'));
const DoctorSettings = lazy(() => import('../pages/dashboard/doctor/settings/DoctorSettings'));
const DoctorSchedules = lazy(() => import('../pages/dashboard/doctor/schedules/DoctorSchedules'));
const DoctorPatientDetail = lazy(() => import('../pages/dashboard/hospital/patients/PatientDetail'));
const HospitalDashboard = lazy(() => import('../pages/dashboard/hospital/HospitalDashboard'));
const HospitalDepartments = lazy(() => import('../pages/dashboard/hospital/departments/DepartmentsList'));
const HospitalDoctors = lazy(() => import('../pages/dashboard/hospital/doctors/DoctorsList'));
const HospitalAppointments = lazy(() => import('../pages/dashboard/hospital/appointments/HospitalAppointments'));
const HospitalPrescriptions = lazy(() => import('../pages/dashboard/hospital/prescriptions/HospitalPrescriptions'));
const HospitalPatients = lazy(() => import('../pages/dashboard/hospital/patients/PatientsList'));
const HospitalPatientDetail = lazy(() => import('../pages/dashboard/hospital/patients/PatientDetail'));
const HospitalReferrals = lazy(() => import('../pages/dashboard/hospital/referrals/ReferralsList'));
const HospitalEmergencies = lazy(() => import('../pages/dashboard/hospital/emergencies/EmergencyList'));
const HospitalProfile = lazy(() => import('../pages/dashboard/hospital/profile/HospitalProfile'));
const HospitalAgencies = lazy(() => import('../pages/dashboard/hospital/agencies/HospitalAgencies'));
const HospitalSettings = lazy(() => import('../pages/dashboard/hospital/settings/HospitalSettings'));
const FamilyDashboard = lazy(() => import('../pages/dashboard/family/FamilyDashboard'));
const FamilyPatient = lazy(() => import('../pages/dashboard/family/FamilyPatient'));
const FamilyHealth = lazy(() => import('../pages/dashboard/family/FamilyHealth'));
const FamilyMedications = lazy(() => import('../pages/dashboard/family/FamilyMedications'));
const FamilyAttendance = lazy(() => import('../pages/dashboard/family/FamilyAttendance'));
const FamilyBookings = lazy(() => import('../pages/dashboard/family/FamilyBookings'));
const FamilyEmergencies = lazy(() => import('../pages/dashboard/family/FamilyEmergencies'));
const FamilyReports = lazy(() => import('../pages/dashboard/family/FamilyReports'));
const FamilySettings = lazy(() => import('../pages/dashboard/family/FamilySettings'));

// Common Shared Pages
const MedicalRecordsDashboard = lazy(() => import('../pages/dashboard/common/MedicalRecordsDashboard'));
const UploadMedicalRecord = lazy(() => import('../pages/dashboard/common/UploadMedicalRecord'));
const MedicalRecordDetail = lazy(() => import('../pages/dashboard/common/MedicalRecordDetail'));
const EmergencyAlertsDashboard = lazy(() => import('../pages/dashboard/common/EmergencyAlertsDashboard'));
const EmergencyAlertDetail = lazy(() => import('../pages/dashboard/common/EmergencyAlertDetail'));

// Common Pages
const NotFound = lazy(() => import('../pages/NotFound'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* User Dashboard Routes */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute allowedRoles={['user', 'agency', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="caregivers" element={<CaregiverSearch />} />
          <Route path="caregivers/:id" element={<CaregiverDetail />} />
          <Route path="favorites" element={<UserFavorites />} />
          <Route path="bookings" element={<UserBookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="payments" element={<UserPayments />} />
          <Route path="complaints" element={<UserComplaints />} />
          <Route path="messages" element={<Messages />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="doctors" element={<FindDoctors />} />
          <Route path="doctors/:id" element={<DoctorPublicProfile />} />
          <Route path="appointments" element={<UserAppointments />} />
          <Route path="prescriptions" element={<UserPrescriptions />} />
          <Route path="health" element={<UserHealthTracking />} />
        </Route>

        {/* Agency Dashboard Routes */}
        <Route
          path="/dashboard/agency"
          element={
            <ProtectedRoute allowedRoles={['agency']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgencyDashboard />} />
          <Route path="setup" element={<AgencySetup />} />
          <Route path="caregivers" element={<AgencyCaregivers />} />
          <Route path="caregivers/add" element={<CaregiverAdd />} />
          <Route path="bookings" element={<AgencyBookings />} />
          <Route path="earnings" element={<AgencyEarnings />} />
          <Route path="referrals" element={<AgencyReferrals />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<AgencySettings />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
        </Route>

        {/* Caregiver Dashboard Routes */}
        <Route
          path="/dashboard/caregiver"
          element={
            <ProtectedRoute allowedRoles={['caregiver']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CaregiverDashboard />} />
          <Route path="setup" element={<CaregiverSetup />} />
          <Route path="jobs" element={<CaregiverJobs />} />
          <Route path="health" element={<CaregiverHealthDashboard />} />
          <Route path="prescriptions" element={<CaregiverPrescriptions />} />
          <Route path="earnings" element={<CaregiverEarnings />} />
          <Route path="reviews" element={<CaregiverReviews />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<CaregiverSettings />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="care-reports" element={<CaregiverDailyReport />} />
          <Route path="medications" element={<CaregiverMedications />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="agencies" element={<AdminAgencies />} />
          <Route path="hospitals" element={<AdminHospitals />} />
          <Route path="doctors" element={<AdminDoctors />} />
           <Route path="caregivers" element={<AdminCaregivers/>}/>
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
        </Route>



        {/* Doctor Dashboard Routes */}
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<DoctorPatientDetail />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="schedules" element={<DoctorSchedules />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
        </Route>

        {/* Hospital Dashboard Routes */}
        <Route
          path="/dashboard/hospital"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HospitalDashboard />} />
          <Route path="departments" element={<HospitalDepartments />} />
          <Route path="doctors" element={<HospitalDoctors />} />
          <Route path="appointments" element={<HospitalAppointments />} />
          <Route path="prescriptions" element={<HospitalPrescriptions />} />
          <Route path="patients" element={<HospitalPatients />} />
          <Route path="patients/:id" element={<HospitalPatientDetail />} />
          <Route path="agencies" element={<HospitalAgencies />} />
          <Route path="referrals" element={<HospitalReferrals />} />
          <Route path="emergencies" element={<HospitalEmergencies />} />
          <Route path="profile" element={<HospitalProfile />} />
          <Route path="settings" element={<HospitalSettings />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
        </Route>

        <Route
          path="/dashboard/family"
          element={
            <ProtectedRoute allowedRoles={['family']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FamilyDashboard />} />
          <Route path="patient" element={<FamilyPatient />} />
          <Route path="health" element={<FamilyHealth />} />
          <Route path="medications" element={<FamilyMedications />} />
          <Route path="attendance" element={<FamilyAttendance />} />
          <Route path="bookings" element={<FamilyBookings />} />
          <Route path="emergencies" element={<FamilyEmergencies />} />
          <Route path="care-reports" element={<FamilyReports />} />
          <Route path="medical-records" element={<MedicalRecordsDashboard />} />
          <Route path="medical-records/upload" element={<UploadMedicalRecord />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
          <Route path="emergency-alerts" element={<EmergencyAlertsDashboard />} />
          <Route path="emergency-alerts/:id" element={<EmergencyAlertDetail />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<FamilySettings />} />
        </Route>

        {/* Redirect /dashboard to the correct sub-dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const DashboardRedirect = () => {
  const user = useSelector(selectCurrentUser);
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

export default AppRoutes;
