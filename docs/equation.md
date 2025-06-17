
# Sensor Vibration Analysis System

ระบบนี้ใช้สำหรับแสดงผลข้อมูลการสั่นสะเทือนของเซ็นเซอร์ในรูปแบบกราฟ Time Domain และ Frequency Domain โดยพัฒนาเป็น Web Application ด้วย Next.js และ Chart.js

---

## 🔧 หลักการจากเอกสารที่ใช้อ้างอิง

เอกสารต้นทางอธิบายกระบวนการแปลงข้อมูลจาก ADC → Acceleration → Velocity และวิเคราะห์ FFT โดยมีแนวทางดังนี้:

### ✅ Time Domain
- **Conversion Flow**:  
  `ADC → Acceleration (G) → Acceleration (mm/s²) → Velocity (mm/s)`

- **Resolution**:
  ```text
  resolution = 1 / (Maximum frequency × 2.56)
  ```

- **Plot**:
  ```text
  Time: 0 → LOR / Max Frequency
  Y-Axis: Acceleration (G), Acceleration (mm/s²), Velocity (mm/s)
  ```

### ✅ Frequency Domain
- **FFT Resolution**:
  ```text
  resolution = Max Frequency / LOR
  ```

- **Magnitude**:
  ```text
  Magnitude = 2.56 / LOR × |FFT(n)|
  ```

- **Plot**:
  ```text
  Frequency (x-axis) vs Magnitude (y-axis)
  ```

---

## 🧠 การแมปเอกสารกับโค้ด

### 1. การแปลง ADC เป็น Acceleration (G)
```ts
function adcToAccelerationG(adcValue: number, range = 2) {
  const offset = 512
  const sensitivity = 17367 // สำหรับ ±2G
  return (adcValue - offset) / sensitivity
}
```
🔗 **สอดคล้องกับ**:
> Acceleration(G) = (ADC - Offset) / Sensitivity  
> Offset = 512, Sensitivity สำหรับ ±2G = 17367

---

### 2. การแปลง Acceleration → mm/s² → Velocity
```ts
function accelerationGToMmPerSecSquared(g: number) {
  return g * 9806.65
}

function accelerationToVelocity(a: number[], dt: number) {
  return [...]; // ใช้ 0.5 * dt * (a[i] + a[i+1])
}
```
🔗 **สอดคล้องกับ**:
> Acc(mm/s²) = G × 9806.65  
> Velocity = 0.5 × (ti+1 - ti) × (ai + ai+1)

---

### 3. Time Domain Scale
```ts
const timeInterval = 1 / SAMPLING_RATE * 2.56
const timeLabels = Array.from({ length: n }, (_, i) => (i * timeInterval).toFixed(2))
```
🔗 **สอดคล้องกับเอกสาร**:
> Resolution = 1 / (Max Frequency × 2.56)  
> หาก Max Frequency = 2500 Hz → SAMPLING_RATE = 5000 Hz  
> กำหนด resolution ได้ตามสูตรที่เอกสารให้ไว้

---

### 4. Frequency Domain (FFT) & Scale
```ts
function calculateFFT(timeData: number[]) {
  const n = timeData.length
  const MAX_FREQ = SAMPLING_RATE / 2
  for (let i = 0; i < n; i++) {
    const abs = Math.sqrt(real * real + imag * imag)
    magnitude.push((2.56 / n) * abs)
    frequency.push((i * MAX_FREQ) / n)
  }
}
```
🔗 **สอดคล้องกับเอกสาร**:
- Resolution = Max Frequency / LOR
- Magnitude = 2.56 / LOR × |FFT|
- Frequency = 0 → Max Frequency

---

## 🖥️ แสดงผล

ระบบแสดงผล 2 กราฟหลัก:

### ✅ Time Domain
- แสดงการเปลี่ยนแปลงของการสั่นสะเทือนตามเวลา
- สามารถเลือกแสดงในหน่วย G, mm/s² หรือ mm/s ได้

### ✅ Frequency Domain
- แสดงสเปกตรัมความถี่จาก FFT
- คำนวณ Magnitude และ Frequency ตาม scale ที่เอกสารกำหนด

---

## ✅ ข้อสรุป

ระบบนี้ได้ออกแบบและคำนวณค่าต่าง ๆ ตรงตามแนวทางที่เอกสารอ้างอิงไว้ โดยเฉพาะในเรื่องของ **การแปลงหน่วย**, **การกำหนด resolution ของกราฟ**, และ **การวิเคราะห์ Frequency Domain ด้วย FFT**  
ทั้งหมดนี้ช่วยให้สามารถนำไปวิเคราะห์การสั่นสะเทือนจากเซ็นเซอร์ได้อย่างแม่นยำและสอดคล้องกับหลักการทางวิศวกรรม
