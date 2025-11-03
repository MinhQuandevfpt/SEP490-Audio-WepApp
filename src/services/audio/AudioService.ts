/**
 * AudioService - Quản lý phát nhạc và xử lý EQ với Web Audio API
 */

export interface EQPreset {
  name: string;
  bass: number;      // -12 to 12 dB
  mid: number;       // -12 to 12 dB
  treble: number;    // -12 to 12 dB
  gain: number;      // Overall gain
}

export interface SpeakerModel {
  id: string;
  name: string;
  brand: string;
  type: 'floor_single' | 'floor_pair' | 'desk_single' | 'desk_pair' | 'wall_single' | 'wall_pair' | 'amplifier';
  description: string;
  price?: number;
  imageUrl?: string;
  eqPreset: EQPreset;
  specs?: {
    frequencyResponse: string;
    power: string;
    impedance: string;
    sensitivity: string;
  };
}

// EQ Presets mô phỏng các loại loa khác nhau
export const SPEAKER_EQ_PRESETS: Record<string, EQPreset> = {
  // Loa Bass mạnh (Subwoofer)
  bass_heavy: {
    name: 'Bass Mạnh',
    bass: 8,
    mid: -2,
    treble: -1,
    gain: 0
  },
  // Loa trung tính (Studio Monitor)
  neutral: {
    name: 'Trung Tính',
    bass: 0,
    mid: 0,
    treble: 0,
    gain: 0
  },
  // Loa vocal rõ (Tweeter mạnh)
  vocal_clear: {
    name: 'Vocal Rõ',
    bass: -1,
    mid: 6,
    treble: 4,
    gain: 1
  },
  // Loa premium (Balanced)
  premium: {
    name: 'Cao Cấp',
    bass: 3,
    mid: 2,
    treble: 3,
    gain: 1
  },
  // Loa basic (Limited range)
  basic: {
    name: 'Cơ Bản',
    bass: -3,
    mid: -2,
    treble: -4,
    gain: -2
  },
  // Loa professional (Flat response)
  professional: {
    name: 'Chuyên Nghiệp',
    bass: 1,
    mid: 0,
    treble: 1,
    gain: 0
  }
};

// Danh sách model loa mẫu
export const SPEAKER_MODELS: SpeakerModel[] = [
  {
    id: 'klipsch_rp-600m',
    name: 'Klipsch RP-600M',
    brand: 'Klipsch',
    type: 'desk_pair',
    description: 'Loa bookshelf cao cấp với horn tweeter',
    price: 8990000,
    eqPreset: SPEAKER_EQ_PRESETS.premium,
    specs: {
      frequencyResponse: '45Hz - 25kHz',
      power: '100W',
      impedance: '8Ω',
      sensitivity: '96dB'
    }
  },
  {
    id: 'audioengine_a2',
    name: 'Audioengine A2+',
    brand: 'Audioengine',
    type: 'desk_pair',
    description: 'Loa để bàn nhỏ gọn, âm thanh sạch',
    price: 5990000,
    eqPreset: SPEAKER_EQ_PRESETS.vocal_clear,
    specs: {
      frequencyResponse: '65Hz - 22kHz',
      power: '60W',
      impedance: '4Ω',
      sensitivity: '88dB'
    }
  },
  {
    id: 'yamaha_ns-f51',
    name: 'Yamaha NS-F51',
    brand: 'Yamaha',
    type: 'floor_pair',
    description: 'Loa đứng tower với bass mạnh',
    price: 12900000,
    eqPreset: SPEAKER_EQ_PRESETS.bass_heavy,
    specs: {
      frequencyResponse: '38Hz - 35kHz',
      power: '130W',
      impedance: '6Ω',
      sensitivity: '89dB'
    }
  },
  {
    id: 'bose_301',
    name: 'Bose 301 Series V',
    brand: 'Bose',
    type: 'wall_pair',
    description: 'Loa treo tường với Direct/Reflecting technology',
    price: 8990000,
    eqPreset: SPEAKER_EQ_PRESETS.neutral,
    specs: {
      frequencyResponse: '55Hz - 16kHz',
      power: '150W',
      impedance: '4-8Ω',
      sensitivity: '90dB'
    }
  },
  {
    id: 'jbl_professional_305p',
    name: 'JBL Professional 305P',
    brand: 'JBL',
    type: 'desk_single',
    description: 'Studio monitor chuyên nghiệp',
    price: 5490000,
    eqPreset: SPEAKER_EQ_PRESETS.professional,
    specs: {
      frequencyResponse: '49Hz - 20kHz',
      power: '82W',
      impedance: 'N/A',
      sensitivity: '112dB'
    }
  },
  {
    id: 'edifier_r1280t',
    name: 'Edifier R1280T',
    brand: 'Edifier',
    type: 'desk_pair',
    description: 'Loa để bàn giá rẻ, chất lượng tốt',
    price: 2490000,
    eqPreset: SPEAKER_EQ_PRESETS.basic,
    specs: {
      frequencyResponse: '75Hz - 20kHz',
      power: '42W',
      impedance: '4Ω',
      sensitivity: '85dB'
    }
  },
  {
    id: 'sony_ss-cs3',
    name: 'Sony SS-CS3',
    brand: 'Sony',
    type: 'floor_single',
    description: 'Loa đứng 3 đường tiếng',
    price: 6990000,
    eqPreset: SPEAKER_EQ_PRESETS.premium,
    specs: {
      frequencyResponse: '53Hz - 50kHz',
      power: '145W',
      impedance: '6Ω',
      sensitivity: '87dB'
    }
  },
  {
    id: 'pioneer_andrew_jones',
    name: 'Pioneer SP-BS22-LR',
    brand: 'Pioneer',
    type: 'desk_pair',
    description: 'Bookshelf speakers được thiết kế bởi Andrew Jones',
    price: 3990000,
    eqPreset: SPEAKER_EQ_PRESETS.neutral,
    specs: {
      frequencyResponse: '55Hz - 20kHz',
      power: '80W',
      impedance: '6Ω',
      sensitivity: '85dB'
    }
  }
];

class AudioService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;
  private currentSpeakerModel: SpeakerModel | null = null;
  private audioUrl: string;

  constructor(audioUrl: string) {
    this.audioUrl = audioUrl;
  }

  /**
   * Khởi tạo Web Audio API
   */
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tạo analyser cho waveform visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      // Tạo gain node
      this.gainNode = this.audioContext.createGain();

      // Tạo EQ filters
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 250;

      this.midFilter = this.audioContext.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1;

      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 4000;

      // Kết nối: source -> bass -> mid -> treble -> gain -> analyser -> destination
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // Load audio file
      await this.loadAudio();
    } catch (error) {
      console.error('Error initializing AudioService:', error);
      throw error;
    }
  }

  /**
   * Load audio file từ URL
   */
  private async loadAudio(): Promise<void> {
    try {
      const response = await fetch(this.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error loading audio:', error);
      // Fallback: tạo silence buffer nếu không load được
      this.audioBuffer = this.audioContext!.createBuffer(2, this.audioContext!.sampleRate * 2, this.audioContext!.sampleRate);
    }
  }

  /**
   * Áp dụng EQ preset cho loa
   */
  applyEQPreset(preset: EQPreset): void {
    if (!this.bassFilter || !this.midFilter || !this.trebleFilter || !this.gainNode) {
      return;
    }

    // Bass (lowshelf)
    this.bassFilter.gain.value = preset.bass;
    
    // Mid (peaking)
    this.midFilter.gain.value = preset.mid;
    
    // Treble (highshelf)
    this.trebleFilter.gain.value = preset.treble;
    
    // Overall gain
    this.gainNode.gain.value = Math.pow(10, preset.gain / 20); // Convert dB to linear
  }

  /**
   * Chọn model loa và áp dụng EQ
   */
  selectSpeakerModel(model: SpeakerModel): void {
    this.currentSpeakerModel = model;
    this.applyEQPreset(model.eqPreset);
  }

  /**
   * Phát nhạc
   */
  async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      await this.initialize();
    }

    if (this.isPlaying || !this.audioBuffer) {
      return;
    }

    try {
      // Resume context nếu đã bị suspend
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }

      // Tạo source node mới
      this.sourceNode = this.audioContext!.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.loop = true;

      // Kết nối: source -> EQ chain
      this.sourceNode.connect(this.bassFilter!);
      this.sourceNode.start(0);

      this.isPlaying = true;
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Dừng phát nhạc
   */
  stop(): void {
    if (this.sourceNode && this.isPlaying) {
      try {
        this.sourceNode.stop();
        this.sourceNode = null;
        this.isPlaying = false;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  /**
   * Pause (stop và giữ lại context)
   */
  pause(): void {
    this.stop();
  }

  /**
   * Lấy waveform data cho visualization
   */
  getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Lấy frequency data cho spectrum visualization
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current playback state
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current speaker model
   */
  getCurrentSpeakerModel(): SpeakerModel | null {
    return this.currentSpeakerModel;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
    }
  }
}

export default AudioService;

