const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      default: 'Indore Office',
      trim: true,
      maxlength: [100, 'Office name cannot exceed 100 characters'],
    },
    geofenceEnabled: {
      type: Boolean,
      default: true,
    },
    latitude: {
      type: Number,
      default: 22.7196,
      required: true,
    },
    longitude: {
      type: Number,
      default: 75.8577,
      required: true,
    },
    radiusMeters: {
      type: Number,
      default: 200,
      min: [10, 'Minimum allowed radius is 10 meters'],
      max: [50000, 'Maximum allowed radius is 50,000 meters'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Singleton helper — returns the company settings document, creating one with defaults if none exists.
 */
companySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({
      officeName: 'Indore Office',
      geofenceEnabled: true,
      latitude: 22.7196,
      longitude: 75.8577,
      radiusMeters: 200,
    });
  }
  return settings;
};

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = CompanySettings;
