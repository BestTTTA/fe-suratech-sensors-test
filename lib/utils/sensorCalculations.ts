// Import fft.js for FFT calculations
import FFT from "fft.js"

// ฟังก์ชันสำหรับแปลงค่า ADC เป็นค่า Acceleration (G)
// ADC คือค่าที่ได้จากเซ็นเซอร์แบบดิจิตอล (0-1023)
// range คือช่วงการวัดของเซ็นเซอร์ (±2G, ±4G, ±8G, ±16G)
export function adcToAccelerationG(adcValue: number, range = 16): number {
  let sensitivity: number

  // กำหนดค่า sensitivity ตามช่วงการวัด
  switch (range) {
    case 2:
      sensitivity = 16384 // ±2G
      break
    case 4:
      sensitivity = 8192  // ±4G
      break
    case 8:
      sensitivity = 4096  // ±8G
      break
    case 16:
      sensitivity = 2048  // ±16G
      break
    default:
      sensitivity = 16384 // ค่าเริ่มต้น ±2G
  }

  return (adcValue) / sensitivity
}

// แปลงค่า Acceleration (G) เป็น mm/s²
// 1G = 9806.65 mm/s²
export function accelerationGToMmPerSecSquared(accelerationG: number): number {
  return accelerationG * 9806.65
}

//handing window function
export function handlingWindowFunction(data: number[]): number[] {
  const window = new Float64Array(data.length)
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (data.length - 1)))
    result.push(window[i] * data[i])
  }
  // console.log(result)
  return result
}

// คำนวณความเร็วจากค่า acceleration
// ใช้สูตร: ความเร็ว = ½(ti+1-ti) * (acceleration1 + acceleration2)
export function accelerationToVelocity(accelerations: number[], timeInterval: number): number[] {
  const velocities: number[] = [0] // ค่าเริ่มต้นความเร็วเป็น 0

  for (let i = 0; i < accelerations.length - 1; i++) {
    const velocity = 0.5 * timeInterval * (accelerations[i] + accelerations[i + 1])
    velocities.push(velocity)
  }

  return velocities
}

export function handlingWithTrashHole(data: number[], ): number[] {
  const trashHole = 0.15
  const trashHoleIndex = data.findIndex(value => value > trashHole)
  if (trashHoleIndex !== -1) {
    return data.slice(trashHoleIndex)
  }
  return data // Return original data if no value exceeds threshold
}

// คำนวณ FFT (Fast Fourier Transform) เพื่อวิเคราะห์ความถี่
// FFT คือการแปลงสัญญาณจากโดเมนเวลาเป็นโดเมนความถี่
export function calculateFFT(timeData: number[], maxFreq: number = 400): { magnitude: number[]; frequency: number[] } {
  // ปรับความยาวข้อมูลให้เป็นกำลังของ 2 (จำเป็นสำหรับ FFT)
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(timeData.length)))

  try {
    // สร้าง instance ของ FFT
    const fft = new FFT(nextPow2)

    // เตรียมข้อมูล input (เติม 0 ถ้าจำเป็น)
    const input = new Float64Array(nextPow2)
    for (let i = 0; i < timeData.length; i++) {
      input[i] = timeData[i]
    }

    // เตรียมข้อมูล output (จำนวนจริงและจำนวนจินตภาพ)
    const output = new Float64Array(nextPow2 * 2)

    // ทำการแปลง FFT
    fft.realTransform(output, input)

    // คำนวณขนาดและความถี่
    const n = timeData.length
    const magnitude: number[] = []
    const frequency: number[] = []

    // ประมวลผลครึ่งแรกของผลลัพธ์ FFT (ถึงความถี่ Nyquist)
    for (let i = 0; i < n; i++) {
      // ดึงส่วนจริงและส่วนจินตภาพ
      const real = output[i * 2]
      const imag = output[i * 2 + 1]
      // console.log(real, imag)

      // คำนวณขนาดโดยใช้สูตร: 2.56 / n * abs(fft_res)
      const abs = Math.sqrt(real * real + imag * imag)
      magnitude.push((2.56 / n) * abs)

      // คำนวณความถี่
      frequency.push((i * (maxFreq / (1600 * 2.56)) ))
    }

    return { magnitude, frequency: frequency.map(f => parseFloat(f.toFixed(2))) }
  } catch (error) {
    // FFT calculation error
    return { magnitude: [], frequency: [] }
  }
}

/**
 * Get top peak values for each axis using structured peak finding
 * @param axisData - ADC data array for one axis
 * @param timeInterval - Time interval between samples
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @param maxFreq - Maximum frequency for FFT (default: 400)
 * @returns Axis top peak statistics
 */
export function getAxisTopPeakStats(axisData: number[], timeInterval: number, g_scale: number = 16, maxFreq: number = 400) {
  // ===== DATA VALIDATION =====
  if (!axisData || axisData.length === 0) {
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00",
      rms: "0.000",
      peak: "0.000",
      peakToPeak: "0.000"
    };
  }

  try {
    // ===== DATA CONVERSION =====
    // Convert ADC to acceleration (G) using the provided g_scale
    const processedData = axisData.map(adc => adcToAccelerationG(adc, g_scale));
    
    // Calculate velocity from acceleration
    const accelerations = processedData.map(adc => accelerationGToMmPerSecSquared(adc));
    const velocity = accelerationToVelocity(accelerations, timeInterval);

    // ===== RMS CALCULATIONS (consistent with prepareChartData) =====
    // Calculate RMS for velocity data (same as prepareChartData for Velocity unit)
    const rms = velocity.length > 0
      ? Math.sqrt(velocity.reduce((sum, val) => sum + val * val, 0) / velocity.length)
      : 0;
    const peak = rms;
    const peakToPeak = peak * 2;

    // ===== FFT CALCULATIONS =====
    // Calculate FFT for both acceleration and velocity
    const { magnitude: accelMagnitude, frequency: accelFrequency } = calculateFFT(processedData, maxFreq);
    const { magnitude: velocityMagnitude, frequency: velocityFrequency } = calculateFFT(velocity, maxFreq);

    // ===== VALIDATION CHECK =====
    // Check if we have valid magnitude data
    if (!accelMagnitude || accelMagnitude.length === 0 || !velocityMagnitude || velocityMagnitude.length === 0) {
      return {
        accelTopPeak: "0.00",
        velocityTopPeak: "0.00",
        dominantFreq: "0.00",
        rms: rms.toFixed(3),
        peak: peak.toFixed(3),
        peakToPeak: peakToPeak.toFixed(3)
      };
    }

    // ===== PEAK FINDING =====
    // Remove DC component (first element) for peak analysis
    const accelMagnitudeNoDC = accelMagnitude.slice(1);
    const velocityMagnitudeNoDC = velocityMagnitude.slice(1);
    const accelFrequencyNoDC = accelFrequency.slice(1);
    const velocityFrequencyNoDC = velocityFrequency.slice(1);

    // Create frequency labels for peak finding
    const accelFreqLabels = accelFrequencyNoDC.map(f => f.toFixed(2));
    const velocityFreqLabels = velocityFrequencyNoDC.map(f => f.toFixed(2));

    // ===== ACCELERATION PEAK ANALYSIS =====
    // Find top acceleration peaks using findTopPeaks function
    const { topPeaks: accelTopPeaks } = findTopPeaks(accelMagnitudeNoDC, accelFreqLabels, 1);
    const accelTopPeak = accelTopPeaks.length > 0 ? accelTopPeaks[0].peak : 0;

    // ===== VELOCITY PEAK ANALYSIS =====
    // Find top velocity peaks using findTopPeaks function
    const { topPeaks: velocityTopPeaks } = findTopPeaks(velocityMagnitudeNoDC, velocityFreqLabels, 1);
    const velocityTopPeak = velocityTopPeaks.length > 0 ? velocityTopPeaks[0].peak : 0;

    // ===== DOMINANT FREQUENCY DETERMINATION =====
    // Find dominant frequency (frequency of the highest velocity peak)
    let dominantFreq = 0;
    if (velocityTopPeaks.length > 0) {
      dominantFreq = parseFloat(velocityTopPeaks[0].frequency);
    }

    // ===== RETURN RESULTS =====
    return {
      accelTopPeak: (accelTopPeak).toFixed(2),
      velocityTopPeak: (velocityTopPeak).toFixed(2),
      dominantFreq: dominantFreq.toFixed(2),
      rms: rms.toFixed(3),
      peak: peak.toFixed(3),
      peakToPeak: peakToPeak.toFixed(3)
    };
  } catch (error) {
    // Error in getAxisTopPeakStats
    console.error("Error in getAxisTopPeakStats:", error);
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00",
      rms: "0.000",
      peak: "0.000",
      peakToPeak: "0.000"
    };
  }
}

/**
 * Enhanced axis top peak statistics with detailed peak analysis
 * @param axisData - ADC data array for one axis
 * @param timeInterval - Time interval between samples
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @param maxFreq - Maximum frequency for FFT (default: 400)
 * @param maxPeaks - Maximum number of peaks to analyze (default: 5)
 * @returns Enhanced axis statistics with detailed peak information
 */
export function getAxisTopPeakStatsEnhanced(
  axisData: number[], 
  timeInterval: number, 
  g_scale: number = 16, 
  maxFreq: number = 400,
  maxPeaks: number = 5
) {
  // ===== DATA VALIDATION =====
  if (!axisData || axisData.length === 0) {
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00",
      accelPeaks: [],
      velocityPeaks: [],
      totalAccelPeaks: 0,
      totalVelocityPeaks: 0
    };
  }

  try {
    // ===== DATA CONVERSION =====
    // Convert ADC to acceleration (G) using the provided g_scale
    const processedData = axisData.map(adc => adcToAccelerationG(adc, g_scale));
    
    // Calculate velocity from acceleration
    const accelerations = processedData.map(adc => accelerationGToMmPerSecSquared(adc));
    const velocity = accelerationToVelocity(accelerations, timeInterval);

    // ===== FFT CALCULATIONS =====
    // Calculate FFT for both acceleration and velocity
    const { magnitude: accelMagnitude, frequency: accelFrequency } = calculateFFT(processedData, maxFreq);
    const { magnitude: velocityMagnitude, frequency: velocityFrequency } = calculateFFT(velocity, maxFreq);

    // ===== VALIDATION CHECK =====
    // Check if we have valid magnitude data
    if (!accelMagnitude || accelMagnitude.length === 0 || !velocityMagnitude || velocityMagnitude.length === 0) {
      return {
        accelTopPeak: "0.00",
        velocityTopPeak: "0.00",
        dominantFreq: "0.00",
        accelPeaks: [],
        velocityPeaks: [],
        totalAccelPeaks: 0,
        totalVelocityPeaks: 0
      };
    }

    // ===== PEAK FINDING =====
    // Remove DC component (first element) for peak analysis
    const accelMagnitudeNoDC = accelMagnitude.slice(1);
    const velocityMagnitudeNoDC = velocityMagnitude.slice(1);
    const accelFrequencyNoDC = accelFrequency.slice(1);
    const velocityFrequencyNoDC = velocityFrequency.slice(1);

    // Create frequency labels for peak finding
    const accelFreqLabels = accelFrequencyNoDC.map(f => f.toFixed(2));
    const velocityFreqLabels = velocityFrequencyNoDC.map(f => f.toFixed(2));

    // ===== ACCELERATION PEAK ANALYSIS =====
    // Find top acceleration peaks using enhanced function
    const accelPeakResult = findTopPeaksEnhanced(accelMagnitudeNoDC, accelFreqLabels, maxPeaks);
    const accelTopPeak = accelPeakResult.topPeaks.length > 0 ? accelPeakResult.topPeaks[0].peak : 0;

    // ===== VELOCITY PEAK ANALYSIS =====
    // Find top velocity peaks using enhanced function
    const velocityPeakResult = findTopPeaksEnhanced(velocityMagnitudeNoDC, velocityFreqLabels, maxPeaks);
    const velocityTopPeak = velocityPeakResult.topPeaks.length > 0 ? velocityPeakResult.topPeaks[0].peak : 0;

    // ===== DOMINANT FREQUENCY DETERMINATION =====
    // Find dominant frequency (frequency of the highest velocity peak)
    let dominantFreq = 0;
    if (velocityPeakResult.dominantPeak) {
      dominantFreq = parseFloat(velocityPeakResult.dominantPeak.frequency);
    }

    // ===== RETURN RESULTS =====
    return {
      accelTopPeak: (accelTopPeak * 0.707).toFixed(2),
      velocityTopPeak: (velocityTopPeak * 0.707).toFixed(2),
      dominantFreq: dominantFreq.toFixed(2),
      accelPeaks: accelPeakResult.topPeaks.map(peak => ({
        peak: (peak.peak * 0.707).toFixed(2),
        frequency: peak.frequency,
        index: peak.index
      })),
      velocityPeaks: velocityPeakResult.topPeaks.map(peak => ({
        peak: (peak.peak * 0.707).toFixed(2),
        frequency: peak.frequency,
        index: peak.index
      })),
      totalAccelPeaks: accelPeakResult.totalPeaksFound,
      totalVelocityPeaks: velocityPeakResult.totalPeaksFound,
      dominantPeak: velocityPeakResult.dominantPeak ? {
        peak: (velocityPeakResult.dominantPeak.peak * 0.707).toFixed(2),
        frequency: velocityPeakResult.dominantPeak.frequency,
        index: velocityPeakResult.dominantPeak.index
      } : null
    };
  } catch (error) {
    // Error in getAxisTopPeakStatsEnhanced
    console.error("Error in getAxisTopPeakStatsEnhanced:", error);
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00",
      accelPeaks: [],
      velocityPeaks: [],
      totalAccelPeaks: 0,
      totalVelocityPeaks: 0
    };
  }
}

// ===== VIBRATION STATISTICS CALCULATIONS =====

/**
 * Calculate comprehensive vibration statistics for all axes
 * @param x - X-axis (Horizontal) ADC data array
 * @param y - Y-axis (Vertical) ADC data array  
 * @param z - Z-axis (Axial) ADC data array
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @returns Vibration statistics object
 */
export function calculateVibrationStats(x: number[], y: number[], z: number[], g_scale: number = 16) {
  // ===== DATA VALIDATION =====
  if (!x || !y || !z || x.length === 0 || y.length === 0 || z.length === 0) {
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
    };
  }

  try {
    // ===== DATA CONVERSION =====
    // แปลงค่า ADC เป็น G
    const xG = x.map((adc) => adcToAccelerationG(adc, g_scale))
    const yG = y.map((adc) => adcToAccelerationG(adc, g_scale))
    const zG = z.map((adc) => adcToAccelerationG(adc, g_scale))

    // ===== RMS CALCULATIONS =====
    // คำนวณค่า RMS (Root Mean Square) สำหรับแต่ละแกน
    const rmsX = Math.sqrt(xG.reduce((sum, val) => sum + val * val, 0) / xG.length)
    const rmsY = Math.sqrt(yG.reduce((sum, val) => sum + val * val, 0) / yG.length)
    const rmsZ = Math.sqrt(zG.reduce((sum, val) => sum + val * val, 0) / zG.length)
    
    // คำนวณค่า RMS รวม (Root Mean Square of all axes)
    const rmsTotal = Math.sqrt((rmsX * rmsX + rmsY * rmsY + rmsZ * rmsZ) / 3)

    // ===== PEAK CALCULATIONS =====
    // คำนวณค่า Peak สำหรับแต่ละแกน
    const peakX = Math.max(...xG.map(Math.abs))
    const peakY = Math.max(...yG.map(Math.abs))
    const peakZ = Math.max(...zG.map(Math.abs))
    
    // คำนวณค่า Peak รวม (สูงสุดของทุกแกน)
    const peakTotal = Math.max(peakX, peakY, peakZ)

    // ===== STATUS DETERMINATION =====
    // กำหนดสถานะตามค่า RMS
    let status: "Normal" | "Warning" | "Critical" = "Normal"
    if (rmsTotal > 0.8) {
      status = "Critical"
    } else if (rmsTotal > 0.5) {
      status = "Warning"
    }

    // ===== RETURN RESULTS =====
    return {
      rms: rmsTotal.toFixed(3),
      peak: peakTotal.toFixed(3),
      status,
      // Additional detailed stats for debugging/advanced use
      details: {
        rmsX: rmsX.toFixed(3),
        rmsY: rmsY.toFixed(3),
        rmsZ: rmsZ.toFixed(3),
        peakX: peakX.toFixed(3),
        peakY: peakY.toFixed(3),
        peakZ: peakZ.toFixed(3),
      }
    };
  } catch (error) {
    // Error in calculateVibrationStats
    console.error("Error calculating vibration stats:", error)
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
      details: {
        rmsX: "0.000",
        rmsY: "0.000",
        rmsZ: "0.000",
        peakX: "0.000",
        peakY: "0.000",
        peakZ: "0.000",
      }
    };
  }
}

/**
 * Calculate RMS (Root Mean Square) for a single axis
 * @param axisData - ADC data array for one axis
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @returns RMS value as string
 */
export function calculateAxisRMS(axisData: number[], g_scale: number = 16): string {
  if (!axisData || axisData.length === 0) return "0.000"
  
  try {
    const gData = axisData.map(adc => adcToAccelerationG(adc, g_scale))
    const rms = Math.sqrt(gData.reduce((sum, val) => sum + val * val, 0) / gData.length)
    return rms.toFixed(3)
  } catch (error) {
    console.error("Error calculating axis RMS:", error)
    return "0.000"
  }
}

/**
 * Calculate Peak value for a single axis
 * @param axisData - ADC data array for one axis
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @returns Peak value as string
 */
export function calculateAxisPeak(axisData: number[], g_scale: number = 16): string {
  if (!axisData || axisData.length === 0) return "0.000"
  
  try {
    const gData = axisData.map(adc => adcToAccelerationG(adc, g_scale))
    const peak = Math.max(...gData.map(Math.abs))
    return peak.toFixed(3)
  } catch (error) {
    console.error("Error calculating axis peak:", error)
    return "0.000"
  }
}

/**
 * Calculate Peak-to-Peak value for a single axis
 * @param axisData - ADC data array for one axis
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @returns Peak-to-Peak value as string
 */
export function calculateAxisPeakToPeak(axisData: number[], g_scale: number = 16): string {
  if (!axisData || axisData.length === 0) return "0.000"
  
  try {
    const gData = axisData.map(adc => adcToAccelerationG(adc, g_scale))
    const max = Math.max(...gData)
    const min = Math.min(...gData)
    const peakToPeak = max - min
    return peakToPeak.toFixed(3)
  } catch (error) {
    console.error("Error calculating axis peak-to-peak:", error)
    return "0.000"
  }
}

/**
 * Determine vibration status based on RMS value
 * @param rmsValue - RMS value in G
 * @param thresholds - Optional custom thresholds
 * @returns Status string
 */
export function determineVibrationStatus(
  rmsValue: number, 
  thresholds: { warning?: number; critical?: number } = {}
): "Normal" | "Warning" | "Critical" {
  const warningThreshold = thresholds.warning ?? 0.5
  const criticalThreshold = thresholds.critical ?? 0.8
  
  if (rmsValue > criticalThreshold) {
    return "Critical"
  } else if (rmsValue > warningThreshold) {
    return "Warning"
  } else {
    return "Normal"
  }
}

/**
 * Calculate comprehensive statistics for a single axis
 * @param axisData - ADC data array for one axis
 * @param g_scale - G-scale for ADC conversion (default: 16)
 * @param thresholds - Optional custom thresholds for status
 * @returns Complete axis statistics
 */
export function calculateSingleAxisStats(
  axisData: number[], 
  g_scale: number = 16,
  thresholds?: { warning?: number; critical?: number }
) {
  if (!axisData || axisData.length === 0) {
    return {
      rms: "0.000",
      peak: "0.000",
      peakToPeak: "0.000",
      status: "Normal" as const,
      g_scale
    }
  }

  try {
    const rms = calculateAxisRMS(axisData, g_scale)
    const peak = calculateAxisPeak(axisData, g_scale)
    const peakToPeak = calculateAxisPeakToPeak(axisData, g_scale)
    const status = determineVibrationStatus(parseFloat(rms), thresholds)

    return {
      rms,
      peak,
      peakToPeak,
      status,
      g_scale
    }
  } catch (error) {
    console.error("Error calculating single axis stats:", error)
    return {
      rms: "0.000",
      peak: "0.000",
      peakToPeak: "0.000",
      status: "Normal" as const,
      g_scale
    }
  }
}

// Helper function to get stats for each axis (legacy function)
export function getAxisStats(axisData: number[], timeInterval: number) {
  // Check if we have valid data
  if (!axisData || axisData.length === 0) {
    return {
      accelRMS: "0.00",
      velocityRMS: "0.00",
      dominantFreq: "0.00"
    };
  }

  try {
    const processedData = axisData.map(adc => adcToAccelerationG(adc));
    const accelG = processedData.map(adc => adcToAccelerationG(adc));
    const velocity = accelerationToVelocity(accelG, timeInterval)

    const { magnitude, frequency } = calculateFFT(processedData)
    const { magnitude: velocityMagnitude, frequency: velocityFrequency } = calculateFFT(velocity)

    // Check if we have valid magnitude data
    if (!magnitude || magnitude.length === 0 || !velocityMagnitude || velocityMagnitude.length === 0) {
      return {
        accelRMS: "0.00",
        velocityRMS: "0.00",
        dominantFreq: "0.00"
      };
    }

    //find max of magnitude and index
    const cutMagnitude = magnitude.slice(1)
    const maxMagnitude = Math.max(...cutMagnitude)
    const indexMagnitude = magnitude.indexOf(maxMagnitude)

    //find max of velocity and index
    const cutVelocityMagnitude = velocityMagnitude.slice(1)
    const maxVelocity = Math.max(...cutVelocityMagnitude)
    const velocityIndex = velocityMagnitude.indexOf(maxVelocity)

    // Check if velocityIndex is valid and velocityFrequency exists
    const dominantFreq = (velocityFrequency && velocityFrequency[velocityIndex] !== undefined) 
      ? velocityFrequency[velocityIndex] 
      : 0;

    return {
      accelRMS: maxMagnitude.toFixed(2),
      velocityRMS: maxVelocity.toFixed(3),
      dominantFreq: dominantFreq.toFixed(2)
    };
  } catch (error) {
    // Error in getAxisStats
    return {
      accelRMS: "0.00",
      velocityRMS: "0.00",
      dominantFreq: "0.00"
    };
  }
}

/**
 * Find top peaks in frequency magnitude data
 * @param freqMagnitude - Frequency magnitude array
 * @param freqLabels - Frequency labels array
 * @param maxPeaks - Maximum number of peaks to return (default: 5)
 * @returns Object with top peaks and point colors
 */
export function findTopPeaks(
  freqMagnitude: number[], 
  freqLabels: string[], 
  lor: number,
  maxPeaks: number = 5
): { 
  topPeaks: { peak: number; rms: string; frequency: string }[];
  pointBackgroundColor: string[];
} {
  // ===== INITIALIZATION =====
  let pointBackgroundColor = new Array(freqMagnitude.length).fill('rgba(75, 192, 192, 0.5)')
  let topPeaks: { peak: number; rms: string; frequency: string }[] = []

  // ===== PEAK DETECTION =====
  //not over freqMax
  if (freqMagnitude.length > 0) {
    let topIndices = []
    for (let i = 1; i < lor - 1 ; i++) {
      if (freqMagnitude[i] > freqMagnitude[i - 1] && freqMagnitude[i] > freqMagnitude[i + 1]) {
        topIndices.push(i)
      }
    }

    // ===== SORTING =====
    // sort by bubble sort then push to topPeak array
    let temp: number
    for (let i = 0; i < topIndices.length - 1; i++) {
      for (let j = 0; j < topIndices.length - i - 1; j++) {
        if (freqMagnitude[topIndices[j]] < freqMagnitude[topIndices[j + 1]]) {
          temp = topIndices[j]
          topIndices[j] = topIndices[j + 1]
          topIndices[j + 1] = temp
        }
      }
    }

    // ===== LIMIT RESULTS =====
    // use top N peaks
    topIndices = topIndices.slice(0, maxPeaks)

    // ===== COLOR ASSIGNMENT =====
    // create red dot for top peaks
    topIndices.forEach(idx => {
      pointBackgroundColor[idx] = 'red'
    })

    // ===== PREPARE RESULTS =====
    // Prepare topPeaks array for the table
    topPeaks = topIndices.map(idx => ({
      peak: freqMagnitude[idx],
      rms: (freqMagnitude[idx]).toFixed(2),
      frequency: String(freqLabels[idx])
    }))
  }

  return {
    topPeaks,
    pointBackgroundColor
  }
}

/**
 * Enhanced peak finding with additional analysis
 * @param freqMagnitude - Frequency magnitude array
 * @param freqLabels - Frequency labels array
 * @param maxPeaks - Maximum number of peaks to return (default: 5)
 * @param minPeakHeight - Minimum peak height threshold (optional)
 * @returns Enhanced peak analysis results
 */
export function findTopPeaksEnhanced(
  freqMagnitude: number[], 
  freqLabels: string[], 
  maxPeaks: number = 5,
  minPeakHeight?: number
): { 
  topPeaks: { peak: number; rms: string; frequency: string; index: number }[];
  pointBackgroundColor: string[];
  totalPeaksFound: number;
  dominantPeak: { peak: number; frequency: string; index: number } | null;
} {
  // ===== INITIALIZATION =====
  let pointBackgroundColor = new Array(freqMagnitude.length).fill('rgba(75, 192, 192, 0.5)')
  let topPeaks: { peak: number; rms: string; frequency: string; index: number }[] = []

  // ===== PEAK DETECTION =====
  if (freqMagnitude.length > 0) {
    let topIndices = []
    for (let i = 1; i < freqMagnitude.length - 1; i++) {
      // Check if current point is higher than neighbors
      if (freqMagnitude[i] > freqMagnitude[i - 1] && freqMagnitude[i] > freqMagnitude[i + 1]) {
        // Apply minimum height filter if specified
        if (minPeakHeight === undefined || freqMagnitude[i] >= minPeakHeight) {
          topIndices.push(i)
        }
      }
    }

    // ===== SORTING =====
    // sort by bubble sort then push to topPeak array
    let temp: number
    for (let i = 0; i < topIndices.length - 1; i++) {
      for (let j = 0; j < topIndices.length - i - 1; j++) {
        if (freqMagnitude[topIndices[j]] < freqMagnitude[topIndices[j + 1]]) {
          temp = topIndices[j]
          topIndices[j] = topIndices[j + 1]
          topIndices[j + 1] = temp
        }
      }
    }

    // ===== LIMIT RESULTS =====
    // use top N peaks
    const limitedIndices = topIndices.slice(0, maxPeaks)

    // ===== COLOR ASSIGNMENT =====
    // create red dot for top peaks
    limitedIndices.forEach(idx => {
      pointBackgroundColor[idx] = 'red'
    })

    // ===== PREPARE RESULTS =====
    // Prepare topPeaks array for the table
    topPeaks = limitedIndices.map(idx => ({
      peak: freqMagnitude[idx],
      rms: (freqMagnitude[idx]).toFixed(2),
      frequency: String(freqLabels[idx]),
      index: idx
    }))

    // ===== DOMINANT PEAK ANALYSIS =====
    const dominantPeak = topPeaks.length > 0 ? {
      peak: topPeaks[0].peak,
      frequency: topPeaks[0].frequency,
      index: topPeaks[0].index
    } : null

    return {
      topPeaks,
      pointBackgroundColor,
      totalPeaksFound: topIndices.length,
      dominantPeak
    }
  }

  return {
    topPeaks,
    pointBackgroundColor,
    totalPeaksFound: 0,
    dominantPeak: null
  }
}

// Export constants for use in other files
export const SENSOR_CONSTANTS = {
  SAMPLING_RATE: 25600,
  MAX_FREQ: 10000, // 25600/2.56
  G_TO_MM_PER_SEC_SQUARED: 9806.65,
} 