// Import fft.js for FFT calculations
import FFT from "fft.js"

// ฟังก์ชันสำหรับแปลงค่า ADC เป็นค่า Acceleration (G)
// ADC คือค่าที่ได้จากเซ็นเซอร์แบบดิจิตอล (0-1023)
// range คือช่วงการวัดของเซ็นเซอร์ (±2G, ±4G, ±8G, ±16G)
export function adcToAccelerationG(adcValue: number, range = 16): number {
  const offset = 0 // ค่า offset ของเซ็นเซอร์
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

  return (adcValue - offset) / sensitivity
}

// แปลงค่า Acceleration (G) เป็น mm/s²
// 1G = 9806.65 mm/s²
export function accelerationGToMmPerSecSquared(accelerationG: number): number {
  return accelerationG * 9806.65
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
    const n = timeData.length / 2.56
    const magnitude: number[] = []
    const frequency: number[] = []

    // ประมวลผลครึ่งแรกของผลลัพธ์ FFT (ถึงความถี่ Nyquist)
    for (let i = 0; i < n; i++) {
      // ดึงส่วนจริงและส่วนจินตภาพ
      const real = output[i * 2]
      const imag = output[i * 2 + 1]

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

// Function to get top peak values for each axis
export function getAxisTopPeakStats(axisData: number[], timeInterval: number, g_scale: number = 16, maxFreq: number = 400) {
  // Check if we have valid data
  if (!axisData || axisData.length === 0) {
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00"
    };
  }

  try {
    // Convert ADC to acceleration (G) using the provided g_scale
    const processedData = axisData.map(adc => adcToAccelerationG(adc, g_scale));
    
    // Calculate velocity from acceleration
    const accelerations = processedData.map(adc => accelerationGToMmPerSecSquared(adc));
    const velocity = accelerationToVelocity(accelerations, timeInterval);

    // Calculate FFT for both acceleration and velocity
    const { magnitude: accelMagnitude, frequency: accelFrequency } = calculateFFT(processedData, maxFreq);
    const { magnitude: velocityMagnitude, frequency: velocityFrequency } = calculateFFT(velocity, maxFreq);

    // Check if we have valid magnitude data
    if (!accelMagnitude || accelMagnitude.length === 0 || !velocityMagnitude || velocityMagnitude.length === 0) {
      return {
        accelTopPeak: "0.00",
        velocityTopPeak: "0.00",
        dominantFreq: "0.00"
      };
    }

    // Remove DC component (first element) and find top peak for acceleration
    const accelMagnitudeNoDC = accelMagnitude.slice(1);
    const accelTopPeak = Math.max(...accelMagnitudeNoDC);

    // Remove DC component (first element) and find top peak for velocity
    const velocityMagnitudeNoDC = velocityMagnitude.slice(1);
    const velocityTopPeak = Math.max(...velocityMagnitudeNoDC);

    // Find dominant frequency (frequency of the highest velocity peak)
    const velocityIndex = velocityMagnitude.indexOf(velocityTopPeak);
    const dominantFreq = (velocityFrequency && velocityFrequency[velocityIndex] !== undefined) 
      ? velocityFrequency[velocityIndex] 
      : 0;

    return {
      accelTopPeak: (accelTopPeak * 0.707).toFixed(2),
      velocityTopPeak: (velocityTopPeak * 0.707).toFixed(2),
      dominantFreq: dominantFreq.toFixed(2)
    };
  } catch (error) {
    // Error in getAxisTopPeakStats
    return {
      accelTopPeak: "0.00",
      velocityTopPeak: "0.00",
      dominantFreq: "0.00"
    };
  }
}

// ฟังก์ชันคำนวณสถิติการสั่นสะเทือน
export function calculateVibrationStats(x: number[], y: number[], z: number[]) {
  // Check if we have valid data
  if (!x || !y || !z || x.length === 0 || y.length === 0 || z.length === 0) {
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
    };
  }

  try {
    // แปลงค่า ADC เป็น G
    const xG = x.map((adc) => adcToAccelerationG(adc))
    const yG = y.map((adc) => adcToAccelerationG(adc))
    const zG = z.map((adc) => adcToAccelerationG(adc))

    // คำนวณค่า RMS (Root Mean Square)
    const rmsX = Math.sqrt(xG.reduce((sum, val) => sum + val * val, 0) / xG.length)
    const rmsY = Math.sqrt(yG.reduce((sum, val) => sum + val * val, 0) / yG.length)
    const rmsZ = Math.sqrt(zG.reduce((sum, val) => sum + val * val, 0) / zG.length)
    const rmsTotal = Math.sqrt((rmsX * rmsX + rmsY * rmsY + rmsZ * rmsZ) / 3)

    // คำนวณค่า Peak
    const peakX = Math.max(...xG.map(Math.abs))
    const peakY = Math.max(...yG.map(Math.abs))
    const peakZ = Math.max(...zG.map(Math.abs))
    const peakTotal = Math.max(peakX, peakY, peakZ)

    // กำหนดสถานะตามค่า RMS
    const status = rmsTotal > 0.8 ? "Critical" : rmsTotal > 0.5 ? "Warning" : "Normal"

    return {
      rms: rmsTotal.toFixed(3),
      peak: peakTotal.toFixed(3),
      status,
    };
  } catch (error) {
    // Error in calculateVibrationStats
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
    };
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

// Export constants for use in other files
export const SENSOR_CONSTANTS = {
  SAMPLING_RATE: 25600,
  MAX_FREQ: 10000, // 25600/2.56
  G_TO_MM_PER_SEC_SQUARED: 9806.65,
} 