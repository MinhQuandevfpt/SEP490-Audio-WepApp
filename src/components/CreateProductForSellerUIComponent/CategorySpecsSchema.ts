export type CategoryKey = 'Headphone' | 'Earbud' | 'Speaker' | 'DAC/Amp' | 'Microphone' | 'Accessory';

export interface SpecField {
  key: string;            // form key in extraSpecs
  label: string;          // label to show
  placeholder?: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];     // for select
  helpText?: string;
  required?: boolean;
}

export const CATEGORY_SPECS: Record<CategoryKey, SpecField[]> = {
  Headphone: [
    { key: 'driverSize', label: 'Kích thước driver (mm)', placeholder: '50' },
    { key: 'impedance', label: 'Trở kháng (Ω)', placeholder: '32' },
    { key: 'sensitivity', label: 'Độ nhạy (dB)', placeholder: '105dB/mW' },
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'bluetoothVersion', label: 'Bluetooth', placeholder: '5.3' },
    { key: 'codecs', label: 'Codec hỗ trợ', placeholder: 'SBC, AAC, aptX, LDAC' },
    { key: 'anc', label: 'Chống ồn chủ động (ANC)', type: 'select', options: ['Có', 'Không'] },
    { key: 'batteryLife', label: 'Thời lượng pin (giờ)', placeholder: '30' },
    { key: 'chargingPort', label: 'Cổng sạc', placeholder: 'USB-C' },
    { key: 'ipRating', label: 'Kháng nước/bụi (IP)', placeholder: 'IPX4' },
    { key: 'weight', label: 'Khối lượng (g)', placeholder: '250' },
  ],
  Earbud: [
    { key: 'driverSize', label: 'Kích thước driver (mm)', placeholder: '10' },
    { key: 'bluetoothVersion', label: 'Bluetooth', placeholder: '5.3' },
    { key: 'codecs', label: 'Codec hỗ trợ', placeholder: 'SBC, AAC, aptX' },
    { key: 'anc', label: 'Chống ồn chủ động (ANC)', type: 'select', options: ['Có', 'Không'] },
    { key: 'transparency', label: 'Chế độ xuyên âm', type: 'select', options: ['Có', 'Không'] },
    { key: 'batteryLife', label: 'Thời lượng pin tai nghe (giờ)', placeholder: '8' },
    { key: 'batteryCase', label: 'Thời lượng pin hộp sạc (giờ)', placeholder: '24' },
    { key: 'chargingPort', label: 'Cổng sạc', placeholder: 'USB-C' },
    { key: 'ipRating', label: 'Kháng nước/bụi (IP)', placeholder: 'IPX4' },
    { key: 'lowLatency', label: 'Độ trễ thấp (Game Mode)', type: 'select', options: ['Có', 'Không'] },
  ],
  Speaker: [
    { key: 'driverConfig', label: 'Cấu hình driver', placeholder: '2.0 / 2.1 / 3-way' },
    { key: 'rmsPower', label: 'Công suất RMS (W)', placeholder: '60' },
    { key: 'peakPower', label: 'Công suất tối đa (W)', placeholder: '120' },
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '50Hz-20kHz' },
    { key: 'inputs', label: 'Cổng vào', placeholder: '3.5mm, RCA, Optical, Bluetooth' },
    { key: 'enclosure', label: 'Kiểu thùng loa', placeholder: 'Bass reflex / Sealed' },
    { key: 'dimensions', label: 'Kích thước (mm)', placeholder: '200 x 150 x 250' },
    { key: 'weight', label: 'Khối lượng (kg)', placeholder: '4.5' },
  ],
  'DAC/Amp': [
    { key: 'dacChip', label: 'Chip DAC', placeholder: 'ESS ES9038Q2M' },
    { key: 'bitDepth', label: 'Độ phân giải', placeholder: '32-bit' },
    { key: 'sampleRate', label: 'Tần số lấy mẫu', placeholder: '768kHz / DSD512' },
    { key: 'outputPower', label: 'Công suất đầu ra (mW)', placeholder: '1000 @32Ω' },
    { key: 'outputImpedance', label: 'Trở kháng đầu ra (Ω)', placeholder: '1' },
    { key: 'snr', label: 'SNR (dB)', placeholder: '120' },
    { key: 'thd', label: 'THD+N (%)', placeholder: '0.0005' },
    { key: 'inputs', label: 'Ngõ vào', placeholder: 'USB, Optical, Coaxial' },
    { key: 'outputs', label: 'Ngõ ra', placeholder: '3.5mm, 6.35mm, Balanced 4.4mm' },
  ],
  Microphone: [
    { key: 'micType', label: 'Loại mic', type: 'select', options: ['Dynamic', 'Condenser', 'Lavalier'] },
    { key: 'polarPattern', label: 'Hướng thu', type: 'select', options: ['Cardioid', 'Supercardioid', 'Omni', 'Figure-8'] },
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'sensitivity', label: 'Độ nhạy (mV/Pa hoặc dBV/Pa)', placeholder: '-42 dBV/Pa' },
    { key: 'maxSPL', label: 'Max SPL (dB)', placeholder: '140' },
    { key: 'selfNoise', label: 'Self-noise (dB-A)', placeholder: '14' },
    { key: 'connection', label: 'Kết nối', placeholder: 'USB / XLR' },
    { key: 'phantom', label: 'Nguồn 48V (Condenser)', type: 'select', options: ['Cần', 'Không cần'] },
  ],
  Accessory: [
    { key: 'compatibility', label: 'Tương thích', placeholder: 'Tai nghe/Model hỗ trợ' },
    { key: 'material', label: 'Chất liệu', placeholder: 'Nhôm/ABS/Silicone' },
    { key: 'dimensions', label: 'Kích thước (mm)', placeholder: '—' },
    { key: 'weight', label: 'Khối lượng (g)', placeholder: '—' },
  ],
};


