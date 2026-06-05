import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Check, Trash2, Clock, 
  AlertCircle, CheckCircle2, MessageSquare, 
  CreditCard, Calendar, ShieldCheck 
} from 'lucide-react';
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation, 
  useDeleteNotificationMutation 
} from '../../../features/notifications/notificationApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const NotificationPage = () => {
  const { data: response, isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = response?.data || [];

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking_new': return <Calendar className="text-blue-500" size={20} />;
      case 'booking_accepted':
      case 'booking_assigned':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'payment_success': return <CreditCard className="text-primary-600" size={20} />;
      case 'complaint_raised': return <AlertCircle className="text-red-500" size={20} />;
      case 'complaint_resolved': return <ShieldCheck className="text-green-600" size={20} />;
      case 'new_message': return <MessageSquare className="text-purple-500" size={20} />;
      default: return <Bell className="text-gray-400" size={20} />;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-gray-500 font-medium">Stay updated with your latest activities</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="btn btn-outline flex items-center gap-2 px-6"
          >
            <Check size={18} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-6 flex items-start gap-4 transition-all hover:bg-gray-50/80 group ${!notif.read ? 'bg-primary-50/20 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className={`p-3 rounded-2xl ${!notif.read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-gray-900 truncate ${!notif.read ? 'text-primary-900' : ''}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock size={10} /> {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.read && (
                      <button 
                        onClick={() => handleMarkRead(notif._id)}
                        className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notif._id)}
                      className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-gray-200">
              <Bell size={40} className="text-gray-200" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">All caught up!</h2>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                No new notifications at the moment. We'll let you know when something important happens.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
