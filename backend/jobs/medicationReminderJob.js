const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const MedicationLog = require('../models/MedicationLog');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const { getIO } = require('../sockets/socketServer');
const { createNotification } = require('../services/notificationService');

const startMedicationReminderJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('⏰ Running Medication Reminder Job...');
      
      const now = new Date();
      // Look for medications scheduled in the next 15 minutes
      const windowStart = new Date(now.getTime() - 1 * 60000); // 1 min ago
      const windowEnd = new Date(now.getTime() + 15 * 60000); // 15 mins from now

      // 1. Get all active prescriptions
      const activePrescriptions = await Prescription.find({ status: 'active' })
        .populate('patient');

      for (const pres of activePrescriptions) {
        if (!pres.patient) continue;

        for (const med of pres.medications) {
          if (!med.isActive || !med.timings || med.timings.length === 0) continue;

          for (const timeStr of med.timings) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduledTime = new Date(now);
            scheduledTime.setHours(hours, minutes, 0, 0);

            // Is it within our reminder window?
            if (scheduledTime >= windowStart && scheduledTime <= windowEnd) {
              
              // Check if already logged or reminded
              const existingLog = await MedicationLog.findOne({
                prescription: pres._id,
                medicationName: med.name,
                scheduledTime
              });

              if (!existingLog || existingLog.status === 'pending') {
                // Send reminder if not already taken
                try {
                  const io = getIO();
                  const patientId = pres.patient._id;
                  
                  const payload = {
                    patientId,
                    medicationName: med.name,
                    scheduledTime,
                    dosage: med.dosage
                  };

                  // Notify Patient
                  io.to(`user_${pres.patient._id}`).emit('medication_reminder', payload);
                  await createNotification(io, {
                    recipient: pres.patient._id,
                    type: 'medication_alert',
                    title: '💊 Medication Reminder',
                    message: `It is time to take ${med.name} (${med.dosage})`,
                    data: payload
                  });

                  // Notify Caregiver if assigned
                  if (pres.patient.assignedCaregiver) {
                    const Caregiver = require('../models/Caregiver');
                    const cg = await Caregiver.findById(pres.patient.assignedCaregiver).select('user');
                    if (cg?.user) {
                      io.to(`user_${cg.user}`).emit('medication_reminder', payload);
                      await createNotification(io, {
                        recipient: cg.user,
                        type: 'medication_alert',
                        title: '💊 Caregiver Reminder',
                        message: `Time for ${pres.patient.name}'s medication: ${med.name}`,
                        data: payload
                      });
                    }
                  }

                } catch (ioErr) {
                  console.error('Socket error in medication reminder job:', ioErr.message);
                }
              }
            }
          }
        }
      }

      // 2. Check for missed medications
      const oneHourAgo = new Date(now.getTime() - 60 * 60000);
      const missedLogs = await MedicationLog.find({
        status: 'pending',
        scheduledTime: { $lt: oneHourAgo }
      }).populate('patient').populate('prescription');

      for (const log of missedLogs) {
        log.status = 'missed';
        await log.save();

        if (log.patient) {
          try {
            const io = getIO();
            
            // Notify Family Members
            const familyMembers = await FamilyMember.find({
              patient: log.patient._id,
              canReceiveHealthReports: true
            });

            for (const fm of familyMembers) {
              io.to(`user_${fm.user}`).emit('medication_missed', {
                medicationName: log.medicationName,
                patientName: log.patient.name
              });
              await createNotification(io, {
                recipient: fm.user,
                type: 'medication_alert',
                title: '⚠️ Missed Medication',
                message: `${log.patient.name} missed taking ${log.medicationName}.`,
                data: { logId: log._id }
              });
            }
          } catch (ioErr) {
            console.error('Socket error in missed medication alert:', ioErr.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in Medication Reminder Job:', error.message);
    }
  });
};

module.exports = { startMedicationReminderJob };
