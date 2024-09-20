const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Track title is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  waveformData: {
    type: Object,
    default: null
  },
  metadata: {
    duration: Number,
    bitrate: Number,
    format: String,
    sampleRate: Number,
    channels: Number
  },
  settings: {
    volume: {
      type: Number,
      default: 0 // 0 dB, no change
    },
    pan: {
      type: Number,
      default: 0 // Center
    },
    eq: {
      low: { type: Number, default: 0 },
      mid: { type: Number, default: 0 },
      high: { type: Number, default: 0 }
    },
    reverb: {
      type: Number,
      default: 0
    },
    delay: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically update the updatedAt field
});

// Static methods
trackSchema.statics.findAll = function() {
  return this.find({});
};

// Instance methods
trackSchema.methods.updateTrack = function(data) {
  Object.assign(this, data);
  return this.save();
};

// Create the model
const Track = mongoose.model('Track', trackSchema);

module.exports = Track;