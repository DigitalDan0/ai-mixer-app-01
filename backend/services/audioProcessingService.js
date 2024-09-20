const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const Track = require('../models/Track');

class AudioProcessingService {
  constructor() {
    // Set FFmpeg path if it's not in your system PATH
    // ffmpeg.setFfmpegPath('/path/to/ffmpeg');
  }

  async generateWaveform(trackId, audioFilePath) {
    try {
      const outputPath = path.join('public', 'waveforms', `${trackId}.json`);
      
      return new Promise((resolve, reject) => {
        ffmpeg(audioFilePath)
          .audioFilters('aformat=channel_layouts=mono')
          .audioFilters('astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level')
          .outputOptions('-f null')
          .on('error', (err) => {
            logger.error('Error generating waveform:', err);
            reject(err);
          })
          .on('end', async (stdout, stderr) => {
            const regex = /lavfi\.astats\.Overall\.RMS_level=(-?\d+(\.\d+)?)/g;
            const matches = stderr.match(regex);
            
            if (matches) {
              const waveformData = matches.map(match => parseFloat(match.split('=')[1]));
              await fs.writeFile(outputPath, JSON.stringify(waveformData));
              
              // Update track with waveform data path
              await Track.findByIdAndUpdate(trackId, { waveformPath: outputPath });
              
              resolve(outputPath);
            } else {
              reject(new Error('No waveform data generated'));
            }
          })
          .run();
      });
    } catch (error) {
      logger.error('Error in generateWaveform:', error);
      throw error;
    }
  }

  async convertAudioFormat(audioFilePath, targetFormat) {
    const outputPath = audioFilePath.replace(path.extname(audioFilePath), `.${targetFormat}`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(audioFilePath)
        .toFormat(targetFormat)
        .on('error', (err) => {
          logger.error('Error converting audio format:', err);
          reject(err);
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }

  async processRealTimeAdjustments(trackId, adjustments) {
    try {
      const track = await Track.findById(trackId);
      if (!track) {
        throw new Error('Track not found');
      }

      const inputPath = track.filePath;
      const outputPath = path.join('public', 'processed', `${trackId}_processed.mp3`);

      let command = ffmpeg(inputPath);

      // Apply volume adjustment
      if (adjustments.volume !== undefined) {
        command = command.audioFilters(`volume=${adjustments.volume}dB`);
      }

      // Apply pan
      if (adjustments.pan !== undefined) {
        command = command.audioFilters(`pan=stereo|c0<${1-adjustments.pan}*c0+${adjustments.pan}*c1|c1<${adjustments.pan}*c0+${1-adjustments.pan}*c1`);
      }

      // Apply EQ (example with 3-band EQ)
      if (adjustments.eq) {
        const { low, mid, high } = adjustments.eq;
        command = command.audioFilters([
          `equalizer=f=100:width_type=o:width=2:g=${low}`,
          `equalizer=f=1000:width_type=o:width=2:g=${mid}`,
          `equalizer=f=10000:width_type=o:width=2:g=${high}`
        ]);
      }

      // Apply reverb (simplified example)
      if (adjustments.reverb) {
        command = command.audioFilters(`aecho=0.8:0.9:1000|1800:0.3|0.25`);
      }

      return new Promise((resolve, reject) => {
        command
          .on('error', (err) => {
            logger.error('Error processing real-time adjustments:', err);
            reject(err);
          })
          .on('end', async () => {
            // Update track with processed audio path
            await Track.findByIdAndUpdate(trackId, { processedFilePath: outputPath });
            resolve(outputPath);
          })
          .save(outputPath);
      });
    } catch (error) {
      logger.error('Error in processRealTimeAdjustments:', error);
      throw error;
    }
  }
}

module.exports = new AudioProcessingService();