# หน้าจอแสดงรายละเอียดเซ็นเซอร์

## ภาพรวม
หน้าจอแสดงรายละเอียดเซ็นเซอร์เป็นส่วนที่แสดงข้อมูลและวิเคราะห์การสั่นสะเทือนของเครื่องจักรแบบเรียลไทม์ โดยมีการแสดงผลทั้งในรูปแบบกราฟและค่าสถิติต่างๆ

## คุณสมบัติหลัก

### 1. การแสดงข้อมูลพื้นฐาน
- แสดงชื่อและหมายเลขซีเรียลของเซ็นเซอร์
- แสดงตำแหน่งที่ติดตั้งและเครื่องจักรที่ติดตาม
- แสดงสถานะการทำงานของเซ็นเซอร์
- แสดงอุณหภูมิและระดับแบตเตอรี่

### 2. การวิเคราะห์การสั่นสะเทือน
#### 2.1 การวัดค่าการสั่นสะเทือน
- วัดการสั่นสะเทือนใน 3 แกน (X, Y, Z)
- แปลงค่าจาก ADC เป็นค่า Acceleration (G)
- คำนวณค่า RMS (Root Mean Square)
- คำนวณค่า Peak และ Peak-to-Peak

#### 2.2 การแสดงผลกราฟ
- แสดงกราฟในโดเมนเวลา (Time Domain)
- แสดงกราฟในโดเมนความถี่ (Frequency Domain) โดยใช้ FFT
- สามารถเลือกแสดงผลในหน่วยต่างๆ:
  - Acceleration (G)
  - Acceleration (mm/s²)
  - Velocity (mm/s)

### 3. การประมวลผลข้อมูล
#### 3.1 การแปลงค่า
- แปลงค่า ADC เป็นค่า Acceleration
- แปลงค่า Acceleration เป็น Velocity
- คำนวณ FFT สำหรับการวิเคราะห์ความถี่

#### 3.2 การคำนวณสถิติ
- คำนวณค่า RMS สำหรับแต่ละแกน
- คำนวณค่า Peak สำหรับแต่ละแกน
- กำหนดสถานะการทำงานตามค่า RMS:
  - Normal: RMS < 0.5G
  - Warning: 0.5G ≤ RMS < 0.8G
  - Critical: RMS ≥ 0.8G

### 4. การแสดงผลแบบเรียลไทม์
- อัพเดทข้อมูลทุก 1 วินาที
- แสดงเวลาอัพเดทล่าสุด
- แสดงสถานะการเชื่อมต่อกับเซ็นเซอร์

## การใช้งาน

### 1. การเลือกแกน
- H-axis (X): แกนแนวนอน
- V-axis (Y): แกนแนวตั้ง
- A-axis (Z): แกนแนวราบ

### 2. การเลือกหน่วย
- Acceleration (G): แสดงค่าเป็นหน่วย G
- Acceleration (mm/s²): แสดงค่าเป็นหน่วย mm/s²
- Velocity (mm/s): แสดงค่าเป็นหน่วยความเร็ว

### 3. การดูประวัติ
- สามารถดูข้อมูลย้อนหลังได้
- แสดงกราฟแนวโน้มการเปลี่ยนแปลง
- สามารถเลือกช่วงเวลาที่ต้องการดู

## ข้อควรระวัง
1. ควรตรวจสอบสถานะการเชื่อมต่อกับเซ็นเซอร์ก่อนใช้งาน
2. ค่า RMS ที่เกิน 0.8G อาจบ่งชี้ถึงปัญหาที่ต้องแก้ไข
3. ควรตรวจสอบระดับแบตเตอรี่เป็นประจำ

## การแก้ไขปัญหาเบื้องต้น
1. ถ้าไม่พบข้อมูลเซ็นเซอร์:
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบสถานะการทำงานของเซ็นเซอร์
   - ลองรีเฟรชหน้าเว็บ

2. ถ้าข้อมูลไม่อัพเดท:
   - ตรวจสอบการเชื่อมต่อกับเซ็นเซอร์
   - ตรวจสอบสถานะการทำงานของเซ็นเซอร์
   - ลองรีเฟรชหน้าเว็บ

## หมายเหตุ
- อัตราการสุ่มตัวอย่างข้อมูล: 50Hz
- ค่า Sensitivity เริ่มต้น: ±2G
- การคำนวณ FFT ใช้ความยาวข้อมูลเป็นกำลังของ 2 

## รายละเอียดทางเทคนิคและการคำนวณ

### 1. การแปลงค่าจากเซ็นเซอร์

#### 1.1 การแปลงค่า ADC เป็น Acceleration (G)
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

#### 1.2 การแปลงค่า Acceleration เป็น Velocity
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

### 2. การคำนวณค่า RMS และ Peak

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

2. **Peak**
   - Peak = max(|x|)
   - |x| = ค่าสัมบูรณ์ของความเร่ง

### 3. การคำนวณ FFT (Fast Fourier Transform)

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
  const magnitude: number[] = []
  const frequency: number[] = []

  for (let i = 0; i < timeData.length; i++) {
    const real = output[i * 2]
    const imag = output[i * 2 + 1]
    const abs = Math.sqrt(real * real + imag * imag)
    
    // คำนวณขนาดโดยใช้สูตร: 2.56 / n * abs(fft_res)
    magnitude.push((2.56 / timeData.length) * abs)
    
    // คำนวณความถี่: f = i * fs / n
    frequency.push((i * SAMPLING_RATE) / timeData.length)
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
   - |FFT(x)| = ขนาดของผลลัพธ์ FFT

3. **การคำนวณความถี่ (Frequency)**
   - f = i * fs / n
   - fs = อัตราการสุ่มตัวอย่าง (50Hz)
   - i = ดัชนีของข้อมูล
   - n = จำนวนข้อมูล

### 4. ตัวอย่างข้อมูลที่ได้จากเซ็นเซอร์

```typescript
interface SensorLastData {
  id: string
  name: string
  sensor_type: string | null
  unit: string | null
  data: {
    datetime: string    // เวลาที่วัด
    x: number[]        // ค่าการสั่นสะเทือนแกน X
    y: number[]        // ค่าการสั่นสะเทือนแกน Y
    z: number[]        // ค่าการสั่นสะเทือนแกน Z
    temperature: number // อุณหภูมิ
    battery: number    // ระดับแบตเตอรี่
  }
}
```

**รูปแบบข้อมูล:**
- ข้อมูลการสั่นสะเทือนเป็นอาร์เรย์ของค่า ADC (0-1023)
- อุณหภูมิเป็นค่าในหน่วยองศาเซลเซียส
- ระดับแบตเตอรี่เป็นเปอร์เซ็นต์ (0-100)
- เวลาที่วัดเป็นรูปแบบ ISO string

### 5. การแสดงผลกราฟ

```typescript
const timeChartData = {
  labels: timeLabels,  // เวลา (วินาที)
  datasets: [{
    label: yAxisLabel, // หน่วยที่แสดง
    data: processedData, // ข้อมูลที่ประมวลผลแล้ว
    borderColor: "rgb(75, 192, 192)",
    backgroundColor: "rgba(75, 192, 192, 0.1)",
    tension: 0.1,
    pointRadius: 0
  }]
}
```

**การแสดงผล:**
1. **กราฟโดเมนเวลา**
   - แกน X: เวลา (วินาที)
   - แกน Y: ค่าการสั่นสะเทือนตามหน่วยที่เลือก

2. **กราฟโดเมนความถี่**
   - แกน X: ความถี่ (Hz)
   - แกน Y: ขนาดของความถี่ (Magnitude) 