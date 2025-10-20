// Category-specific field mapping for product creation
export interface CategoryFieldConfig {
  categoryName: string;
  fields: {
    [key: string]: {
      label: string;
      type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
      placeholder?: string;
      options?: { value: string; label: string }[];
      required?: boolean;
      group?: string;
    };
  };
}

export const CATEGORY_FIELD_CONFIGS: CategoryFieldConfig[] = [
  {
    categoryName: 'Loa',
    fields: {
      // Speaker specific fields
      driverConfiguration: {
        label: 'Cấu hình driver',
        type: 'select',
        options: [
          { value: '1-way', label: '1-way' },
          { value: '2-way', label: '2-way' },
          { value: '3-way', label: '3-way' },
          { value: '4-way', label: '4-way' }
        ],
        group: 'Thông số kỹ thuật'
      },
      driverSize: {
        label: 'Kích thước driver',
        type: 'text',
        placeholder: 'VD: 6.5 inch woofer + 1 inch tweeter',
        group: 'Thông số kỹ thuật'
      },
      enclosureType: {
        label: 'Loại thùng loa',
        type: 'select',
        options: [
          { value: 'Bass Reflex', label: 'Bass Reflex' },
          { value: 'Sealed', label: 'Sealed' },
          { value: 'Port', label: 'Port' },
          { value: 'Passive Radiator', label: 'Passive Radiator' }
        ],
        group: 'Thông số kỹ thuật'
      },
      coveragePattern: {
        label: 'Góc phủ âm',
        type: 'text',
        placeholder: 'VD: 180° x 180°',
        group: 'Thông số kỹ thuật'
      },
      crossoverFrequency: {
        label: 'Tần cắt loa',
        type: 'text',
        placeholder: 'VD: 2.5kHz',
        group: 'Thông số kỹ thuật'
      },
      placementType: {
        label: 'Vị trí đặt',
        type: 'select',
        options: [
          { value: 'Bookshelf', label: 'Bookshelf' },
          { value: 'Floorstanding', label: 'Floorstanding' },
          { value: 'Desktop', label: 'Desktop' },
          { value: 'Wall Mount', label: 'Wall Mount' }
        ],
        group: 'Thông số kỹ thuật'
      },
      amplifierType: {
        label: 'Loại ampli',
        type: 'select',
        options: [
          { value: 'Class A', label: 'Class A' },
          { value: 'Class AB', label: 'Class AB' },
          { value: 'Class D', label: 'Class D' },
          { value: 'Tube', label: 'Tube' }
        ],
        group: 'Ampli tích hợp'
      },
      totalPowerOutput: {
        label: 'Tổng công suất',
        type: 'text',
        placeholder: 'VD: 2x50W (8Ω)',
        group: 'Ampli tích hợp'
      },
      thd: {
        label: 'THD (méo tiếng)',
        type: 'text',
        placeholder: 'VD: <0.01%',
        group: 'Ampli tích hợp'
      },
      snr: {
        label: 'SNR (tỷ lệ tín hiệu)',
        type: 'text',
        placeholder: 'VD: 100dB',
        group: 'Ampli tích hợp'
      },
      inputChannels: {
        label: 'Kênh input',
        type: 'number',
        placeholder: 'VD: 4',
        group: 'Ampli tích hợp'
      },
      outputChannels: {
        label: 'Kênh output',
        type: 'number',
        placeholder: 'VD: 2',
        group: 'Ampli tích hợp'
      },
      supportBluetooth: {
        label: 'Hỗ trợ Bluetooth',
        type: 'boolean',
        group: 'Kết nối'
      },
      supportWifi: {
        label: 'Hỗ trợ WiFi',
        type: 'boolean',
        group: 'Kết nối'
      },
      supportAirplay: {
        label: 'Hỗ trợ AirPlay',
        type: 'boolean',
        group: 'Kết nối'
      }
    }
  },
  {
    categoryName: 'Tai Nghe',
    fields: {
      // Headphone specific fields
      headphoneType: {
        label: 'Loại tai nghe',
        type: 'select',
        options: [
          { value: 'Over-ear', label: 'Over-ear' },
          { value: 'On-ear', label: 'On-ear' },
          { value: 'In-ear', label: 'In-ear' },
          { value: 'True Wireless', label: 'True Wireless' }
        ],
        required: true,
        group: 'Thông số cơ bản'
      },
      compatibleDevices: {
        label: 'Thiết bị tương thích',
        type: 'text',
        placeholder: 'VD: iPhone, Android, PC, PS5',
        group: 'Thông số cơ bản'
      },
      isSportsModel: {
        label: 'Dành cho thể thao',
        type: 'boolean',
        group: 'Thông số cơ bản'
      },
      headphoneFeatures: {
        label: 'Tính năng',
        type: 'text',
        placeholder: 'VD: ANC, Touch Control, EQ App',
        group: 'Thông số cơ bản'
      },
      batteryCapacity: {
        label: 'Dung lượng pin',
        type: 'text',
        placeholder: 'VD: 1000mAh',
        group: 'Pin & Năng lượng'
      },
      hasBuiltInBattery: {
        label: 'Có pin tích hợp',
        type: 'boolean',
        group: 'Pin & Năng lượng'
      },
      isGamingHeadset: {
        label: 'Tai nghe gaming',
        type: 'boolean',
        group: 'Thông số cơ bản'
      },
      headphoneAccessoryType: {
        label: 'Phụ kiện',
        type: 'text',
        placeholder: 'VD: Carrying Case, Cable',
        group: 'Phụ kiện'
      },
      headphoneConnectionType: {
        label: 'Kết nối',
        type: 'text',
        placeholder: 'VD: Wireless + 3.5mm',
        group: 'Kết nối'
      },
      plugType: {
        label: 'Loại jack',
        type: 'text',
        placeholder: 'VD: 3.5mm L-shaped',
        group: 'Kết nối'
      },
      sirimApproved: {
        label: 'Chứng nhận SIRIM',
        type: 'boolean',
        group: 'Chứng nhận'
      },
      sirimCertified: {
        label: 'Chứng nhận SIRIM đầy đủ',
        type: 'boolean',
        group: 'Chứng nhận'
      },
      mcmcApproved: {
        label: 'Chứng nhận MCMC',
        type: 'boolean',
        group: 'Chứng nhận'
      }
    }
  },
  {
    categoryName: 'Micro',
    fields: {
      // Microphone specific fields
      micType: {
        label: 'Loại micro',
        type: 'select',
        options: [
          { value: 'Condenser', label: 'Condenser' },
          { value: 'Dynamic', label: 'Dynamic' },
          { value: 'Ribbon', label: 'Ribbon' },
          { value: 'USB', label: 'USB' }
        ],
        required: true,
        group: 'Thông số cơ bản'
      },
      polarPattern: {
        label: 'Họng nhận âm',
        type: 'select',
        options: [
          { value: 'Cardioid', label: 'Cardioid' },
          { value: 'Omni', label: 'Omni' },
          { value: 'Figure-8', label: 'Figure-8' },
          { value: 'Supercardioid', label: 'Supercardioid' }
        ],
        group: 'Thông số kỹ thuật'
      },
      maxSPL: {
        label: 'Âm lượng tối đa',
        type: 'text',
        placeholder: 'VD: 130dB',
        group: 'Thông số kỹ thuật'
      },
      micOutputImpedance: {
        label: 'Trở kháng output',
        type: 'text',
        placeholder: 'VD: 150Ω',
        group: 'Thông số kỹ thuật'
      },
      micSensitivity: {
        label: 'Độ nhạy micro',
        type: 'text',
        placeholder: 'VD: -40dB',
        group: 'Thông số kỹ thuật'
      }
    }
  },
  {
    categoryName: 'Amp',
    fields: {
      // Amplifier specific fields
      amplifierType: {
        label: 'Loại ampli',
        type: 'select',
        options: [
          { value: 'Class A', label: 'Class A' },
          { value: 'Class AB', label: 'Class AB' },
          { value: 'Class D', label: 'Class D' },
          { value: 'Tube', label: 'Tube' },
          { value: 'Hybrid', label: 'Hybrid' }
        ],
        required: true,
        group: 'Thông số cơ bản'
      },
      totalPowerOutput: {
        label: 'Tổng công suất',
        type: 'text',
        placeholder: 'VD: 500W (8Ω)',
        required: true,
        group: 'Thông số kỹ thuật'
      },
      thd: {
        label: 'THD (méo tiếng)',
        type: 'text',
        placeholder: 'VD: 0.05%',
        group: 'Thông số kỹ thuật'
      },
      snr: {
        label: 'SNR (tỷ lệ tín hiệu)',
        type: 'text',
        placeholder: 'VD: 100dB',
        group: 'Thông số kỹ thuật'
      },
      inputChannels: {
        label: 'Kênh input',
        type: 'number',
        placeholder: 'VD: 5',
        group: 'Kết nối'
      },
      outputChannels: {
        label: 'Kênh output',
        type: 'number',
        placeholder: 'VD: 7.2',
        group: 'Kết nối'
      },
      supportBluetooth: {
        label: 'Hỗ trợ Bluetooth',
        type: 'boolean',
        group: 'Kết nối'
      },
      supportWifi: {
        label: 'Hỗ trợ WiFi',
        type: 'boolean',
        group: 'Kết nối'
      },
      supportAirplay: {
        label: 'Hỗ trợ AirPlay',
        type: 'boolean',
        group: 'Kết nối'
      }
    }
  },
  {
    categoryName: 'DAC',
    fields: {
      // DAC specific fields
      dacChipset: {
        label: 'Chip DAC',
        type: 'text',
        placeholder: 'VD: ESS Sabre ES9038',
        required: true,
        group: 'Thông số cơ bản'
      },
      sampleRate: {
        label: 'Tần mẫu',
        type: 'text',
        placeholder: 'VD: Up to 192kHz/24bit',
        group: 'Thông số kỹ thuật'
      },
      bitDepth: {
        label: 'Độ sâu bit',
        type: 'text',
        placeholder: 'VD: 32-bit',
        group: 'Thông số kỹ thuật'
      },
      balancedOutput: {
        label: 'Output cân bằng',
        type: 'boolean',
        group: 'Kết nối'
      },
      inputInterface: {
        label: 'Cổng input',
        type: 'text',
        placeholder: 'VD: XLR, TRS, USB',
        group: 'Kết nối'
      },
      outputInterface: {
        label: 'Cổng output',
        type: 'text',
        placeholder: 'VD: XLR, RCA, Headphone',
        group: 'Kết nối'
      }
    }
  },
  {
    categoryName: 'Mixer',
    fields: {
      // Mixer specific fields
      channelCount: {
        label: 'Số kênh',
        type: 'number',
        placeholder: 'VD: 8',
        required: true,
        group: 'Thông số cơ bản'
      },
      hasPhantomPower: {
        label: 'Điện ma (+48V)',
        type: 'boolean',
        group: 'Tính năng'
      },
      eqBands: {
        label: 'Băng tần EQ',
        type: 'text',
        placeholder: 'VD: 31-band',
        group: 'Tính năng'
      },
      faderType: {
        label: 'Loại fader',
        type: 'select',
        options: [
          { value: 'Linear', label: 'Linear' },
          { value: 'Motorized', label: 'Motorized' },
          { value: 'Digital', label: 'Digital' }
        ],
        group: 'Tính năng'
      },
      builtInEffects: {
        label: 'Hiệu ứng tích hợp',
        type: 'boolean',
        group: 'Tính năng'
      },
      usbAudioInterface: {
        label: 'Giao tiếp USB Audio',
        type: 'boolean',
        group: 'Kết nối'
      },
      midiSupport: {
        label: 'Hỗ trợ MIDI',
        type: 'boolean',
        group: 'Kết nối'
      }
    }
  },
  {
    categoryName: 'Turntable',
    fields: {
      // Turntable specific fields
      platterMaterial: {
        label: 'Chất liệu đĩa',
        type: 'select',
        options: [
          { value: 'Aluminum', label: 'Aluminum' },
          { value: 'Acrylic', label: 'Acrylic' },
          { value: 'Glass', label: 'Glass' },
          { value: 'Metal', label: 'Metal' }
        ],
        group: 'Thông số cơ bản'
      },
      motorType: {
        label: 'Loại động cơ',
        type: 'select',
        options: [
          { value: 'Direct Drive', label: 'Direct Drive' },
          { value: 'Belt Drive', label: 'Belt Drive' },
          { value: 'Idler Drive', label: 'Idler Drive' }
        ],
        group: 'Thông số cơ bản'
      },
      tonearmType: {
        label: 'Loại cần đĩa',
        type: 'select',
        options: [
          { value: 'S-shaped', label: 'S-shaped' },
          { value: 'Straight', label: 'Straight' },
          { value: 'J-shaped', label: 'J-shaped' }
        ],
        group: 'Thông số cơ bản'
      },
      autoReturn: {
        label: 'Tự động quay về',
        type: 'boolean',
        group: 'Tính năng'
      }
    }
  }
];

/**
 * Lấy cấu hình fields cho một category cụ thể
 */
export function getCategoryFields(categoryName: string): CategoryFieldConfig['fields'] {
  const config = CATEGORY_FIELD_CONFIGS.find(c => c.categoryName === categoryName);
  return config?.fields || {};
}

/**
 * Lấy danh sách tất cả groups trong một category
 */
export function getCategoryGroups(categoryName: string): string[] {
  const fields = getCategoryFields(categoryName);
  const groups = new Set<string>();
  
  Object.values(fields).forEach(field => {
    if (field.group) {
      groups.add(field.group);
    }
  });
  
  return Array.from(groups);
}

/**
 * Lấy fields theo group trong một category
 */
export function getFieldsByGroup(categoryName: string, groupName: string): { [key: string]: any } {
  const fields = getCategoryFields(categoryName);
  const groupFields: { [key: string]: any } = {};
  
  Object.entries(fields).forEach(([key, field]) => {
    if (field.group === groupName) {
      groupFields[key] = field;
    }
  });
  
  return groupFields;
}
