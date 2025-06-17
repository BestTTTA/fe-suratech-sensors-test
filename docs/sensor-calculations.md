# การคำนวณและการประมวลผลข้อมูลเซ็นเซอร์

## 1. การแปลงค่าจากเซ็นเซอร์

### 1.1 การแปลงค่า ADC เป็น Acceleration (G)
```typescript
function adcToAccelerationG(adcValue: number, range = 2): number {
  const offset = 512 // ค่า offset ของเซ็นเซอร์
  let sensitivity: number

  // กำหนดค่า sensitivity ตามช่วงการวัด
  switch (range) {
    case 2:  sensitivity = 17367 // ±2G
    case 4:  sensitivity = 8684  // ±4G
    case 8:  sensitivity = 4342  // ±8G
    case 16: sensitivity = 2171  // ±16G
    default: sensitivity = 17367 // ค่าเริ่มต้น ±2G
  }

  return (adcValue - offset) / sensitivity
}
```

**ที่มาของค่า:**
- `offset`: ค่ากลางของเซ็นเซอร์ (512 สำหรับ ADC 10-bit)
- `sensitivity`: ค่าความไวของเซ็นเซอร์ (counts/G)
  - ±2G: 17367 counts/G
  - ±4G: 8684 counts/G
  - ±8G: 4342 counts/G
  - ±16G: 2171 counts/G

### 1.2 การแปลงค่า Acceleration (G) เป็น mm/s²
```typescript
function accelerationGToMmPerSecSquared(accelerationG: number): number {
  return accelerationG * 9806.65 // 1G = 9806.65 mm/s²
}
```

### 1.3 การแปลงค่า Acceleration เป็น Velocity
```typescript
function accelerationToVelocity(accelerations: number[], timeInterval: number): number[] {
  const velocities: number[] = [0] // ค่าเริ่มต้นความเร็วเป็น 0

  for (let i = 0; i < accelerations.length - 1; i++) {
    // ความเร็ว = ½(ti+1-ti) * (acceleration1 + acceleration2)
    const velocity = 0.5 * timeInterval * (accelerations[i] + accelerations[i + 1])
    velocities.push(velocities[velocities.length - 1] + velocity)
  }

  return velocities
}
```

**สูตรการคำนวณ:**
- ความเร็ว (mm/s) = ½(ti+1-ti) * (Acceleration1 + Acceleration2)
- ti+1-ti = ช่วงเวลาระหว่างการวัด (1/50 วินาที)
- Acceleration = ค่าความเร่งในหน่วย mm/s²

## 2. การคำนวณค่า RMS และ Peak

```typescript
function calculateVibrationStats(x: number[], y: number[], z: number[]) {
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

  return {
    rms: rmsTotal.toFixed(3),
    peak: peakTotal.toFixed(3),
    status: rmsTotal > 0.8 ? "Critical" : rmsTotal > 0.5 ? "Warning" : "Normal"
  }
}
```

**สูตรการคำนวณ:**
1. **RMS (Root Mean Square)**
   - RMS = √(1/n * Σ(x²))
   - n = จำนวนข้อมูล
   - x = ค่าความเร่งในแต่ละจุด
   - RMS Total = √((RMSx² + RMSy² + RMSz²) / 3)

2. **Peak**
   - Peak = max(|x|)
   - |x| = ค่าสัมบูรณ์ของความเร่ง
   - Peak Total = max(Peakx, Peaky, Peakz)

3. **สถานะการแจ้งเตือน**
   - Critical: RMS > 0.8 G
   - Warning: 0.5 G < RMS ≤ 0.8 G
   - Normal: RMS ≤ 0.5 G

## 3. การคำนวณ FFT (Fast Fourier Transform)

```typescript
function calculateFFT(timeData: number[]): { magnitude: number[]; frequency: number[] } {
  // ปรับความยาวข้อมูลให้เป็นกำลังของ 2
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(timeData.length)))
  const fft = new FFT(nextPow2)

  // เตรียมข้อมูล input
  const input = new Float64Array(nextPow2)
  for (let i = 0; i < timeData.length; i++) {
    input[i] = timeData[i]
  }

  // ทำการแปลง FFT
  const output = new Float64Array(nextPow2 * 2)
  fft.realTransform(output, input)

  // คำนวณขนาดและความถี่
  const n = timeData.length
  const halfLength = n
  const magnitude: number[] = []
  const frequency: number[] = []

  for (let i = 0; i < halfLength; i++) {
    const real = output[i * 2]
    const imag = output[i * 2 + 1]
    const abs = Math.sqrt(real * real + imag * imag)
    
    // คำนวณขนาดโดยใช้สูตร: 2.56 / n * abs(fft_res)
    magnitude.push((2.56 / n) * abs)
    
    // คำนวณความถี่: f = i * fs / n
    frequency.push((i * SAMPLING_RATE) / n)
  }

  return { magnitude, frequency }
}
```

**ที่มาของค่าและสูตร:**
1. **การปรับความยาวข้อมูล**
   - ความยาวต้องเป็นกำลังของ 2 (2^n)
   - ใช้ zero-padding ถ้าจำเป็น

2. **การคำนวณขนาด (Magnitude)**
   - Magnitude = 2.56/n * |FFT(x)|
   - n = จำนวนข้อมูล
   - |FFT(x)| = √(real² + imag²)

3. **การคำนวณความถี่ (Frequency)**
   - f = i * fs / n
   - fs = อัตราการสุ่มตัวอย่าง (50Hz)
   - i = ดัชนีของข้อมูล
   - n = จำนวนข้อมูล

## 4. การเตรียมข้อมูลสำหรับกราฟ

```typescript
function prepareChartData(
  rawAxisData: number[],
  selectedUnit: string,
  timeInterval: number
): {
  timeData: any;
  freqData: any;
  yAxisLabel: string;
} {
  // สร้างป้ายเวลาสำหรับกราฟ
  const n = rawAxisData.length
  const timeLabels = Array.from({ length: n }, (_, i) => (i * timeInterval).toFixed(4))

  // ประมวลผลข้อมูลตามหน่วยที่เลือก
  let processedData: number[]
  let yAxisLabel: string

  if (selectedUnit === "Acceleration (G)") {
    processedData = rawAxisData.map((adc) => adcToAccelerationG(adc))
    yAxisLabel = "Acceleration (G)"
  } else if (selectedUnit === "Acceleration (mm/s²)") {
    processedData = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
    yAxisLabel = "Acceleration (mm/s²)"
  } else {
    const accelerations = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
    processedData = accelerationToVelocity(accelerations, timeInterval)
    yAxisLabel = "Velocity (mm/s)"
  }

  // สร้างข้อมูลสำหรับกราฟ
  const timeChartData = {
    labels: timeLabels,
    datasets: [{
      label: yAxisLabel,
      data: processedData,
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.1)",
      tension: 0.1,
      pointRadius: 0,
    }]
  }

  // คำนวณ FFT สำหรับโดเมนความถี่
  const { magnitude, frequency } = calculateFFT(processedData)

  const freqChartData = {
    labels: frequency,
    datasets: [{
      label: `${yAxisLabel} Magnitude`,
      data: magnitude,
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.1)",
      tension: 0.1,
      pointRadius: 0,
    }]
  }

  return {
    timeData: timeChartData,
    freqData: freqChartData,
    yAxisLabel,
  }
}
```

**หน่วยการวัดที่รองรับ:**
1. **Acceleration (G)**
   - แปลงจาก ADC เป็น G โดยตรง
   - ใช้ฟังก์ชัน `adcToAccelerationG`

2. **Acceleration (mm/s²)**
   - แปลงจาก ADC เป็น G แล้วคูณด้วย 9806.65
   - ใช้ฟังก์ชัน `accelerationGToMmPerSecSquared`

3. **Velocity (mm/s)**
   - แปลงจาก ADC เป็น mm/s² แล้วคำนวณความเร็ว
   - ใช้ฟังก์ชัน `accelerationToVelocity`

## 5. หมายเหตุสำคัญ

1. **การแปลงค่า ADC**
   - ค่า ADC ต้องอยู่ในช่วง 0-1023 (10-bit)
   - ค่า offset 512 คือค่ากลางของเซ็นเซอร์
   - ค่า sensitivity ขึ้นอยู่กับช่วงการวัดของเซ็นเซอร์

2. **การคำนวณ RMS**
   - ใช้สำหรับวัดระดับการสั่นสะเทือนโดยรวม
   - ค่า RMS สูงแสดงถึงการสั่นสะเทือนที่รุนแรง
   - ใช้เป็นเกณฑ์ในการแจ้งเตือน

3. **การคำนวณ FFT**
   - ต้องใช้ความยาวข้อมูลเป็นกำลังของ 2
   - ความถี่สูงสุดที่วัดได้ = fs/2 (Nyquist frequency)
   - ใช้สำหรับวิเคราะห์ความถี่ของการสั่นสะเทือน

4. **การแสดงผลกราฟ**
   - แสดงข้อมูลในโดเมนเวลาและโดเมนความถี่
   - รองรับการแสดงผลในหน่วย G, mm/s² และ mm/s
   - ใช้ Chart.js สำหรับการแสดงผลกราฟ 

## 6. การวิเคราะห์โดเมนเวลา (Time Domain Analysis)

### 6.1 การเตรียมข้อมูลโดเมนเวลา
```typescript
function prepareVibrationData(): {
  hasData: boolean;
  timeData: any | null;
  freqData: any | null;
  yAxisLabel?: string;
} {
  // ตรวจสอบว่ามีข้อมูลการสั่นสะเทือนจริงหรือไม่
  if (
    !sensorLastData?.data ||
    !Array.isArray(sensorLastData.data.x) ||
    !Array.isArray(sensorLastData.data.y) ||
    !Array.isArray(sensorLastData.data.z) ||
    sensorLastData.data.x.length === 0
  ) {
    return {
      hasData: false,
      timeData: null,
      freqData: null,
    }
  }

  // เลือกข้อมูลตามแกนที่เลือก
  const rawAxisData =
    selectedAxis === "H-axis"
      ? sensorLastData.data.x
      : selectedAxis === "V-axis"
        ? sensorLastData.data.y
        : sensorLastData.data.z

  // คำนวณช่วงเวลาตามอัตราการสุ่มตัวอย่าง
  const timeInterval = 1 / SAMPLING_RATE

  // เตรียมข้อมูลสำหรับกราฟ
  const chartData = prepareChartData(rawAxisData, selectedUnit, timeInterval)

  return {
    hasData: true,
    ...chartData,
  }
}
```

### 6.2 การตั้งค่ากราฟโดเมนเวลา
```typescript
const timeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: "Time (s)",
        color: "#888",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "#888",
      },
    },
    y: {
      title: {
        display: true,
        text: vibrationData?.yAxisLabel || "Acceleration (G)",
        color: "#888",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "#888",
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}
```

### 6.3 การประมวลผลข้อมูลโดเมนเวลา

#### 6.3.1 การเลือกแกนข้อมูล
```typescript
// เลือกข้อมูลตามแกนที่เลือก
const rawAxisData =
  selectedAxis === "H-axis"
    ? sensorLastData.data.x
    : selectedAxis === "V-axis"
      ? sensorLastData.data.y
      : sensorLastData.data.z
```

**แกนที่รองรับ:**
- H-axis (แกน X): การสั่นสะเทือนในแนวราบ
- V-axis (แกน Y): การสั่นสะเทือนในแนวตั้ง
- A-axis (แกน Z): การสั่นสะเทือนในแนวแกน

#### 6.3.2 การแปลงหน่วยการวัด
```typescript
// ประมวลผลข้อมูลตามหน่วยที่เลือก
let processedData: number[]
let yAxisLabel: string

if (selectedUnit === "Acceleration (G)") {
  processedData = rawAxisData.map((adc) => adcToAccelerationG(adc))
  yAxisLabel = "Acceleration (G)"
} else if (selectedUnit === "Acceleration (mm/s²)") {
  processedData = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
  yAxisLabel = "Acceleration (mm/s²)"
} else {
  const accelerations = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
  processedData = accelerationToVelocity(accelerations, timeInterval)
  yAxisLabel = "Velocity (mm/s)"
}
```

**หน่วยการวัดที่รองรับ:**
1. **Acceleration (G)**
   - แปลงจาก ADC เป็น G โดยตรง
   - ใช้ฟังก์ชัน `adcToAccelerationG`

2. **Acceleration (mm/s²)**
   - แปลงจาก ADC เป็น G แล้วคูณด้วย 9806.65
   - ใช้ฟังก์ชัน `accelerationGToMmPerSecSquared`

3. **Velocity (mm/s)**
   - แปลงจาก ADC เป็น mm/s² แล้วคำนวณความเร็ว
   - ใช้ฟังก์ชัน `accelerationToVelocity`

### 6.4 การแสดงผลกราฟโดเมนเวลา

#### 6.4.1 การสร้างป้ายเวลา
```typescript
// สร้างป้ายเวลาสำหรับกราฟ
const n = rawAxisData.length
const timeLabels = Array.from(
  { length: n }, 
  (_, i) => (i * timeInterval).toFixed(4)
)
```

**ที่มาของค่า:**
- `n`: จำนวนข้อมูล
- `timeInterval`: ช่วงเวลาระหว่างการวัด (1/50 วินาที)
- `timeLabels`: อาร์เรย์ของป้ายเวลา (0.0000, 0.0200, 0.0400, ...)

#### 6.4.2 การสร้างข้อมูลกราฟ
```typescript
const timeChartData = {
  labels: timeLabels,
  datasets: [{
    label: yAxisLabel,
    data: processedData,
    borderColor: "rgb(75, 192, 192)",
    backgroundColor: "rgba(75, 192, 192, 0.1)",
    tension: 0.1,
    pointRadius: 0,
  }]
}
```

**การตั้งค่ากราฟ:**
1. **เส้นกราฟ**
   - สีเส้น: rgb(75, 192, 192) (สีฟ้า)
   - ความโปร่งใสพื้นหลัง: 0.1
   - ความโค้งของเส้น: 0.1
   - ไม่แสดงจุดข้อมูล (pointRadius: 0)

2. **แกน X (เวลา)**
   - แสดงเวลาเป็นวินาที
   - เริ่มต้นที่ 0
   - เพิ่มขึ้นทีละ 0.02 วินาที

3. **แกน Y (ค่าการวัด)**
   - แสดงค่าตามหน่วยที่เลือก
   - Acceleration (G)
   - Acceleration (mm/s²)
   - Velocity (mm/s)

### 6.5 การวิเคราะห์ข้อมูลโดเมนเวลา

#### 6.5.1 การตรวจสอบข้อมูล
```typescript
// ตรวจสอบว่ามีข้อมูลการสั่นสะเทือนจริงหรือไม่
if (
  !sensorLastData?.data ||
  !Array.isArray(sensorLastData.data.x) ||
  !Array.isArray(sensorLastData.data.y) ||
  !Array.isArray(sensorLastData.data.z) ||
  sensorLastData.data.x.length === 0
) {
  return {
    hasData: false,
    timeData: null,
    freqData: null,
  }
}
```

#### 6.5.2 การคำนวณค่าสถิติ
```typescript
// คำนวณค่า RMS
const rms = Math.sqrt(
  processedData.reduce((sum, val) => sum + val * val, 0) / processedData.length
)

// คำนวณค่า Peak
const peak = Math.max(...processedData.map(Math.abs))

// คำนวณค่า Crest Factor
const crestFactor = peak / rms
```

**ค่าสถิติที่สำคัญ:**
1. **ค่า RMS (Root Mean Square)**
   - แสดงพลังงานของสัญญาณ
   - ใช้ประเมินระดับการสั่นสะเทือน
   - เกณฑ์การแจ้งเตือน:
     - Critical: RMS > 0.8 G
     - Warning: 0.5 G < RMS ≤ 0.8 G
     - Normal: RMS ≤ 0.5 G

2. **ค่า Peak**
   - แสดงค่าสูงสุดของสัญญาณ
   - ใช้ประเมินการกระแทกหรือการสั่นสะเทือนสูงสุด

3. **ค่า Crest Factor**
   - อัตราส่วนระหว่าง Peak ต่อ RMS
   - ใช้ประเมินความแหลมของสัญญาณ
   - ค่าปกติ: 1.414 (สัญญาณไซน์)
   - ค่าสูง: มีการกระแทกหรือการสั่นสะเทือนสูง

// ... existing code ... 