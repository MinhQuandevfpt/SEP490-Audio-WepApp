export type CategoryKey = 'Loa' | 'Tai Nghe' | 'Micro' | 'DAC' | 'Mixer' | 'Amp' | 'Turntable' | 'Sound Card' | 'DJ Controller' | 'Combo';

export interface SpecField {
  key: string;            // form key in extraSpecs
  label: string;          // label to show
  placeholder?: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];     // for select
  helpText?: string;
  required?: boolean;
}

// Helper function to translate placementType from English to Vietnamese
export const translatePlacementType = (value: string | null | undefined): string => {
  if (!value) return value || '';
  const translationMap: Record<string, string> = {
    'Bookshelf': 'Để kệ',
    'Floorstanding': 'Để sàn',
    'Wall-mounted': 'Treo tường',
    'Portable': 'Di động',
  };
  return translationMap[value] || value;
};

export const CATEGORY_SPECS: Record<CategoryKey, SpecField[]> = {
  'Loa': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'sensitivity', label: 'Độ nhạy (dB)', placeholder: '88dB' },
    { key: 'impedance', label: 'Trở kháng (Ω)', placeholder: '8Ω' },
    { key: 'powerHandling', label: 'Công suất chịu đựng', placeholder: '100W RMS' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'Bluetooth 5.0, AUX, USB-C' },
    { key: 'voltageInput', label: 'Điện áp', placeholder: '5V/2A' },
    
    // Speaker specific
    { key: 'driverConfiguration', label: 'Cấu hình driver', placeholder: '2-way, 3-way' },
    { key: 'driverSize', label: 'Kích thước driver', placeholder: '6.5 inch woofer + 1 inch tweeter' },
    { key: 'enclosureType', label: 'Loại thùng loa', placeholder: 'Bass Reflex, Sealed' },
    { key: 'coveragePattern', label: 'Góc phủ âm', placeholder: '180° x 180°' },
    { key: 'crossoverFrequency', label: 'Tần cắt loa', placeholder: '2.5kHz' },
    { key: 'placementType', label: 'Vị trí đặt', type: 'select', options: ['Bookshelf', 'Floorstanding', 'Wall-mounted', 'Portable'] },
  ],
  
  'Tai Nghe': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'sensitivity', label: 'Độ nhạy (dB)', placeholder: '105dB/mW' },
    { key: 'impedance', label: 'Trở kháng (Ω)', placeholder: '32Ω' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'Wireless + 3.5mm' },
    
    // Headphone specific
    { key: 'headphoneType', label: 'Loại tai nghe', type: 'select', options: ['Over-ear', 'On-ear', 'In-ear'] },
    { key: 'compatibleDevices', label: 'Thiết bị tương thích', placeholder: 'iPhone, Android, PC, PS5' },
    { key: 'isSportsModel', label: 'Dành cho thể thao', type: 'select', options: ['Có', 'Không'] },
    { key: 'headphoneFeatures', label: 'Tính năng', placeholder: 'ANC, Touch Control, EQ App' },
    { key: 'batteryCapacity', label: 'Dung lượng pin', placeholder: '1000mAh' },
    { key: 'hasBuiltInBattery', label: 'Có pin tích hợp', type: 'select', options: ['Có', 'Không'] },
    { key: 'isGamingHeadset', label: 'Tai nghe gaming', type: 'select', options: ['Có', 'Không'] },
    { key: 'headphoneAccessoryType', label: 'Phụ kiện', placeholder: 'Carrying Case, Cable' },
    { key: 'headphoneConnectionType', label: 'Kết nối', placeholder: 'Wireless + 3.5mm' },
    { key: 'plugType', label: 'Loại jack', placeholder: '3.5mm L-shaped' },
    { key: 'sirimApproved', label: 'Chứng nhận SIRIM (MY)', type: 'select', options: ['Có', 'Không'] },
    { key: 'sirimCertified', label: 'Chứng nhận SIRIM đầy đủ', type: 'select', options: ['Có', 'Không'] },
    { key: 'mcmcApproved', label: 'Chứng nhận MCMC (MY)', type: 'select', options: ['Có', 'Không'] },
  ],
  
  'Micro': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'sensitivity', label: 'Độ nhạy (dB)', placeholder: '-40dB' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'XLR, USB' },
    
    // Microphone specific
    { key: 'micType', label: 'Loại micro', type: 'select', options: ['Dynamic', 'Condenser', 'Lavalier', 'Shotgun'] },
    { key: 'polarPattern', label: 'Họng nhận âm', type: 'select', options: ['Cardioid', 'Supercardioid', 'Omni', 'Figure-8'] },
    { key: 'maxSPL', label: 'Âm lượng max', placeholder: '130dB' },
    { key: 'micOutputImpedance', label: 'Trở kháng output', placeholder: '150Ω' },
    { key: 'micSensitivity', label: 'Độ nhạy micro', placeholder: '-40dB' },
    { key: 'hasPhantomPower', label: 'Cần nguồn 48V', type: 'select', options: ['Có', 'Không'] },
  ],
  
  'DAC': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'USB, Optical, Coaxial' },
    
    // DAC specific
    { key: 'dacChipset', label: 'Chip DAC', placeholder: 'ESS Sabre ES9038' },
    { key: 'sampleRate', label: 'Tần mẫu', placeholder: 'Up to 192kHz/24bit' },
    { key: 'bitDepth', label: 'Độ sâu bit', placeholder: '32-bit' },
    { key: 'balancedOutput', label: 'Output cân bằng', type: 'select', options: ['Có', 'Không'] },
    { key: 'inputInterface', label: 'Cổng input', placeholder: 'XLR, TRS, USB' },
    { key: 'outputInterface', label: 'Cổng output', placeholder: 'XLR, RCA, Headphone' },
    { key: 'thd', label: 'THD (méo tiếng)', placeholder: '0.05%' },
    { key: 'snr', label: 'SNR (tỷ lệ tín hiệu)', placeholder: '100dB' },
  ],
  
  'Mixer': [
    // Common audio specs
    { key: 'connectionType', label: 'Kết nối', placeholder: 'XLR, TRS, USB' },
    
    // Mixer specific
    { key: 'channelCount', label: 'Số kênh', placeholder: '8' },
    { key: 'hasPhantomPower', label: 'Điện ma (+48V)', type: 'select', options: ['Có', 'Không'] },
    { key: 'eqBands', label: 'Băng tần EQ', placeholder: '31-band' },
    { key: 'faderType', label: 'Loại fader', type: 'select', options: ['Linear', 'Motorized', 'Touch'] },
    { key: 'builtInEffects', label: 'Hiệu ứng tích hợp', type: 'select', options: ['Có', 'Không'] },
    { key: 'usbAudioInterface', label: 'Giao tiếp USB Audio', type: 'select', options: ['Có', 'Không'] },
    { key: 'midiSupport', label: 'Hỗ trợ MIDI', type: 'select', options: ['Có', 'Không'] },
    { key: 'inputChannels', label: 'Kênh input', placeholder: '5' },
    { key: 'outputChannels', label: 'Kênh output', placeholder: '7.2' },
  ],
  
  'Amp': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'XLR, RCA, Bluetooth' },
    
    // Amplifier specific
    { key: 'amplifierType', label: 'Loại ampli', type: 'select', options: ['Class D', 'Class A', 'Class AB', 'AV Receiver'] },
    { key: 'totalPowerOutput', label: 'Tổng công suất', placeholder: '500W (8Ω)' },
    { key: 'thd', label: 'THD (méo tiếng)', placeholder: '0.05%' },
    { key: 'snr', label: 'SNR (tỷ lệ tín hiệu)', placeholder: '100dB' },
    { key: 'inputChannels', label: 'Kênh input', placeholder: '5' },
    { key: 'outputChannels', label: 'Kênh output', placeholder: '7.2' },
    { key: 'supportBluetooth', label: 'Hỗ trợ Bluetooth', type: 'select', options: ['Có', 'Không'] },
    { key: 'supportWifi', label: 'Hỗ trợ WiFi', type: 'select', options: ['Có', 'Không'] },
    { key: 'supportAirplay', label: 'Hỗ trợ AirPlay', type: 'select', options: ['Có', 'Không'] },
  ],
  
  'Turntable': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    
    // Turntable specific
    { key: 'platterMaterial', label: 'Chất liệu đĩa', type: 'select', options: ['Aluminum', 'Acrylic', 'Glass', 'Steel'] },
    { key: 'motorType', label: 'Loại động cơ', type: 'select', options: ['Direct Drive', 'Belt Drive', 'Idler Drive'] },
    { key: 'tonearmType', label: 'Loại cần đĩa', type: 'select', options: ['S-shaped', 'Straight', 'J-shaped'] },
    { key: 'autoReturn', label: 'Tự động quay về', type: 'select', options: ['Có', 'Không'] },
  ],
  
  'Sound Card': [
    // Common audio specs
    { key: 'connectionType', label: 'Kết nối', placeholder: 'USB, PCIe, Thunderbolt' },
    
    // Sound Card specific
    { key: 'dacChipset', label: 'Chip DAC', placeholder: 'ESS Sabre ES9038' },
    { key: 'sampleRate', label: 'Tần mẫu', placeholder: 'Up to 192kHz/24bit' },
    { key: 'bitDepth', label: 'Độ sâu bit', placeholder: '32-bit' },
    { key: 'balancedOutput', label: 'Output cân bằng', type: 'select', options: ['Có', 'Không'] },
    { key: 'inputInterface', label: 'Cổng input', placeholder: 'XLR, TRS, USB' },
    { key: 'outputInterface', label: 'Cổng output', placeholder: 'XLR, RCA, Headphone' },
    { key: 'channelCount', label: 'Số kênh', placeholder: '8' },
    { key: 'hasPhantomPower', label: 'Điện ma (+48V)', type: 'select', options: ['Có', 'Không'] },
    { key: 'usbAudioInterface', label: 'Giao tiếp USB Audio', type: 'select', options: ['Có', 'Không'] },
  ],
  
  'DJ Controller': [
    // Common audio specs
    { key: 'connectionType', label: 'Kết nối', placeholder: 'USB, XLR, RCA' },
    
    // DJ Controller specific
    { key: 'channelCount', label: 'Số kênh', placeholder: '4' },
    { key: 'hasPhantomPower', label: 'Điện ma (+48V)', type: 'select', options: ['Có', 'Không'] },
    { key: 'builtInEffects', label: 'Hiệu ứng tích hợp', type: 'select', options: ['Có', 'Không'] },
    { key: 'usbAudioInterface', label: 'Giao tiếp USB Audio', type: 'select', options: ['Có', 'Không'] },
    { key: 'midiSupport', label: 'Hỗ trợ MIDI', type: 'select', options: ['Có', 'Không'] },
    { key: 'faderType', label: 'Loại fader', type: 'select', options: ['Linear', 'Motorized', 'Touch'] },
    { key: 'eqBands', label: 'Băng tần EQ', placeholder: '3-band' },
  ],
  
  'Combo': [
    // Common audio specs
    { key: 'frequencyResponse', label: 'Dải tần (Hz)', placeholder: '20Hz-20kHz' },
    { key: 'sensitivity', label: 'Độ nhạy (dB)', placeholder: '88dB' },
    { key: 'impedance', label: 'Trở kháng (Ω)', placeholder: '8Ω' },
    { key: 'connectionType', label: 'Kết nối', placeholder: 'Bluetooth, AUX, USB' },
    
    // Combo specific (mix of different categories)
    { key: 'comboType', label: 'Loại combo', type: 'select', options: ['Amp + Speaker', 'DAC + Amp', 'Mixer + Interface', 'Other'] },
    { key: 'totalPowerOutput', label: 'Tổng công suất', placeholder: '100W' },
    { key: 'inputChannels', label: 'Số kênh input', placeholder: '4' },
    { key: 'outputChannels', label: 'Số kênh output', placeholder: '2' },
  ],
};


