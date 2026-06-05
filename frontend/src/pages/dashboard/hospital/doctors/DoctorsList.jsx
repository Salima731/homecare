import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Edit2, Trash2, X, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { 
  useGetHospitalDoctorsQuery,
  useGetHospitalDepartmentsQuery,
  useAddDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation
} from '../../../../features/hospitals/hospitalApiSlice';
import { useInviteDoctorMutation, useSuspendDoctorMutation } from '../../../../features/doctors/doctorApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DoctorsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  
  const { data: response, isLoading } = useGetHospitalDoctorsQuery();
  const { data: deptResponse, isLoading: deptLoading } = useGetHospitalDepartmentsQuery();
  const [addDoctor, { isLoading: isAdding }] = useAddDoctorMutation();
  const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();
  const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();
  const [inviteDoctor, { isLoading: isInviting }] = useInviteDoctorMutation();
  const [suspendDoctor, { isLoading: isSuspending }] = useSuspendDoctorMutation();

  const [formData, setFormData] = useState({ 
    name: '', specialization: '', departmentId: '', licenseNumber: '', experience: 0, phone: '', consultationFee: 0 
  });
  const [inviteData, setInviteData] = useState({ email: '', password: '' });
  const [invitingDoc, setInvitingDoc] = useState(null);

  const doctors = response?.data?.docs || response?.data || [];
  const departments = deptResponse?.data || [];

  const filteredDoctors = doctors.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({ 
        name: doc.name, 
        specialization: doc.specialization, 
        departmentId: doc.department?._id || '', 
        licenseNumber: doc.licenseNumber || '', 
        experience: doc.experience || 0,
        phone: doc.phone || '',
        consultationFee: doc.consultationFee || 0
      });
    } else {
      setEditingDoc(null);
      setFormData({ name: '', specialization: '', departmentId: '', licenseNumber: '', experience: 0, phone: '', consultationFee: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Strip empty strings so sparse unique indexes (licenseNumber) work correctly
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      if (editingDoc) {
        await updateDoctor({ id: editingDoc._id, ...payload }).unwrap();
        toast.success('Doctor updated successfully');
      } else {
        await addDoctor(payload).unwrap();
        toast.success('Doctor added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save doctor');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this doctor?')) {
      try {
        await deleteDoctor(id).unwrap();
        toast.success('Doctor removed');
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to remove');
      }
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invitingDoc) return;
    try {
      await inviteDoctor({ id: invitingDoc._id, ...inviteData }).unwrap();
      toast.success('Doctor invited successfully');
      setInvitingDoc(null);
      setInviteData({ email: '', password: '' });
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to invite doctor');
    }
  };

  const handleSuspend = async (doc) => {
    const action = doc.isSuspended ? 'reactivate' : 'suspend';
    if (window.confirm(`Are you sure you want to ${action} this doctor?`)) {
      try {
        await suspendDoctor(doc._id).unwrap();
        toast.success(`Doctor ${action}d successfully`);
      } catch (error) {
        toast.error(error?.data?.message || `Failed to ${action} doctor`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Doctors Registry</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage hospital doctors and their departments.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center gap-2 shadow-lg">
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 bg-[var(--bg-card)] border-[var(--border-main)]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold">
                            {doc.user?.avatar ? (
                              <img src={doc.user.avatar} alt={doc.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              doc.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--text-main)] text-sm">Dr. {doc.name}</p>
                              {doc.isSuspended && (
                                <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-600 rounded-lg uppercase tracking-wider">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-mono">{doc.licenseNumber || 'No License'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-muted)]">
                        {doc.specialization}
                      </td>
                      <td className="px-6 py-4">
                        {doc.department ? (
                           <span className="bg-[var(--bg-main)] border border-[var(--border-main)] px-2 py-1 rounded text-xs font-bold text-[var(--text-main)]">
                             {doc.department.name}
                           </span>
                        ) : (
                           <span className="text-[var(--text-muted)] italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-main)]">
                        {doc.phone || (doc.user?.email) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!doc.user && (
                            <button onClick={() => setInvitingDoc(doc)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Invite Doctor">
                              <Mail size={16} />
                            </button>
                          )}
                          {doc.user && (
                            <button onClick={() => handleSuspend(doc)} className={`p-2 rounded-lg transition-colors ${doc.isSuspended ? 'text-amber-500 hover:bg-amber-500/10' : 'text-red-500 hover:bg-red-500/10'}`} title={doc.isSuspended ? "Reactivate" : "Suspend"}>
                              {doc.isSuspended ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                            </button>
                          )}
                          <button onClick={() => handleOpenModal(doc)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(doc._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" disabled={isDeleting}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <Users size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="font-bold text-lg">No Doctors Found</p>
                      <p className="text-sm mt-1">Add a new doctor to the registry.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)]">
              <h2 className="text-xl font-black text-[var(--text-main)]">{editingDoc ? 'Edit Doctor' : 'Add Doctor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Doctor Name</label>
                  <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Specialization</label>
                  <input required type="text" className="input" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Cardiologist" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">License Number</label>
                  <input required type="text" className="input font-mono" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} placeholder="LIC-12345" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Department</label>
                  <select required className="input" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                    <option value="" disabled>Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Phone</label>
                  <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Experience (Years)</label>
                  <input type="number" min="0" className="input" value={formData.experience} onChange={e => setFormData({...formData, experience: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Consultation Fee ($)</label>
                  <input type="number" min="0" className="input" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: Number(e.target.value)})} placeholder="0" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] flex-1">Cancel</button>
                <button type="submit" disabled={isAdding || isUpdating} className="btn btn-primary flex-1">
                  {isAdding || isUpdating ? <LoadingSpinner size="sm" /> : 'Save Doctor'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Invite Modal */}
      {invitingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)]">
              <h2 className="text-xl font-black text-[var(--text-main)]">Invite Dr. {invitingDoc.name}</h2>
              <button onClick={() => setInvitingDoc(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Email Address</label>
                <input required type="email" className="input w-full" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} placeholder="doctor@hospital.com" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Temporary Password</label>
                <input required type="password" minLength={6} className="input w-full" value={inviteData.password} onChange={e => setInviteData({...inviteData, password: e.target.value})} placeholder="******" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setInvitingDoc(null)} className="btn bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] flex-1">Cancel</button>
                <button type="submit" disabled={isInviting} className="btn btn-primary flex-1">
                  {isInviting ? <LoadingSpinner size="sm" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
