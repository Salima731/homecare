import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Shield, Edit2, Trash2, X } from 'lucide-react';
import { 
  useGetHospitalDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation
} from '../../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DepartmentsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const { data: response, isLoading } = useGetHospitalDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const [formData, setFormData] = useState({ name: '', code: '', floor: '', phone: '', description: '' });

  const departments = response?.data || [];
  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, code: dept.code, floor: dept.floor, phone: dept.phone || '', description: dept.description || '' });
    } else {
      setEditingDept(null);
      setFormData({ name: '', code: '', floor: '', phone: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDept({ id: editingDept._id, ...formData }).unwrap();
        toast.success('Department updated successfully');
      } else {
        await createDept(formData).unwrap();
        toast.success('Department created successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDept(id).unwrap();
        toast.success('Department deleted');
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Departments</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage hospital departments and wards.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center justify-center gap-2 shadow-lg">
          <Plus size={18} /> Add Department
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
              placeholder="Search departments..."
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
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Floor / Ward</th>
                  <th className="px-6 py-4">Head Doctor</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center">
                            <Shield size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)] text-sm">{dept.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{dept.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[var(--bg-main)] border border-[var(--border-main)] px-2 py-1 rounded text-xs font-bold font-mono text-[var(--text-main)]">
                          {dept.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-muted)]">
                        {dept.floor || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-main)]">
                        {dept.headDoctor ? dept.headDoctor.name : <span className="text-[var(--text-muted)] italic text-xs">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenModal(dept)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(dept._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" disabled={isDeleting}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <Shield size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="font-bold text-lg">No Departments</p>
                      <p className="text-sm mt-1">Add a new department to get started.</p>
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
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)]">
              <h2 className="text-xl font-black text-[var(--text-main)]">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Department Name</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cardiology" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Code</label>
                  <input required type="text" className="input font-mono uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="CARD-01" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Floor/Ward</label>
                  <input type="text" className="input" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} placeholder="3rd Floor, Wing B" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Phone Extension</label>
                <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Description</label>
                <textarea className="input min-h-[80px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description..."></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] flex-1">Cancel</button>
                <button type="submit" disabled={isCreating || isUpdating} className="btn btn-primary flex-1">
                  {isCreating || isUpdating ? <LoadingSpinner size="sm" /> : 'Save Department'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsList;
