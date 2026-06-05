const Setting = require('../models/Setting');

let config = {
  PLATFORM_COMMISSION: parseFloat(process.env.PLATFORM_COMMISSION || '10'),
};

const loadConfig = async () => {
  try {
    const settings = await Setting.find();
    settings.forEach(s => {
      config[s.key] = s.value;
    });
    console.log('✅ Configuration loaded from Database');
  } catch (error) {
    console.error('❌ Failed to load configuration from DB:', error.message);
  }
};

const getConfig = (key) => config[key];

const setConfig = (key, value) => {
  config[key] = value;
};

module.exports = { loadConfig, getConfig, setConfig };
