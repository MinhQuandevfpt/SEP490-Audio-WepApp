export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  logo: string;
  bin?: string;
}

export const vietnamBanks: Bank[] = [
  // Ngân hàng thương mại nhà nước (4 ngân hàng)
  {
    id: '1',
    code: 'VCB',
    name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    shortName: 'Vietcombank',
    logo: 'https://api.vietqr.io/img/VCB.png',
    bin: '970436'
  },
  {
    id: '2',
    code: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
    logo: 'https://api.vietqr.io/img/BIDV.png',
    bin: '970418'
  },
  {
    id: '3',
    code: 'CTG',
    name: 'Ngân hàng TMCP Công Thương Việt Nam',
    shortName: 'VietinBank',
    logo: 'https://api.vietqr.io/img/ICB.png',
    bin: '970415'
  },
  {
    id: '4',
    code: 'AGRIBANK',
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    shortName: 'Agribank',
    logo: 'https://api.vietqr.io/img/VBA.png',
    bin: '970405'
  },

  // Ngân hàng TMCP (35 ngân hàng)
  {
    id: '5',
    code: 'TCB',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    shortName: 'Techcombank',
    logo: 'https://api.vietqr.io/img/TCB.png',
    bin: '970407'
  },
  {
    id: '6',
    code: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    logo: 'https://api.vietqr.io/img/ACB.png',
    bin: '970416'
  },
  {
    id: '7',
    code: 'MB',
    name: 'Ngân hàng TMCP Quân Đội',
    shortName: 'MBBank',
    logo: 'https://api.vietqr.io/img/MB.png',
    bin: '970422'
  },
  {
    id: '8',
    code: 'VPB',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    logo: 'https://api.vietqr.io/img/VPB.png',
    bin: '970432'
  },
  {
    id: '9',
    code: 'TPB',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    logo: 'https://api.vietqr.io/img/TPB.png',
    bin: '970423'
  },
  {
    id: '10',
    code: 'STB',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    logo: 'https://api.vietqr.io/img/STB.png',
    bin: '970403'
  },
  {
    id: '11',
    code: 'HDB',
    name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
    shortName: 'HDBank',
    logo: 'https://api.vietqr.io/img/HDB.png',
    bin: '970437'
  },
  {
    id: '12',
    code: 'VIB',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    shortName: 'VIB',
    logo: 'https://api.vietqr.io/img/VIB.png',
    bin: '970441'
  },
  {
    id: '13',
    code: 'SHB',
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    shortName: 'SHB',
    logo: 'https://api.vietqr.io/img/SHB.png',
    bin: '970443'
  },
  {
    id: '14',
    code: 'EIB',
    name: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam',
    shortName: 'Eximbank',
    logo: 'https://api.vietqr.io/img/EIB.png',
    bin: '970431'
  },
  {
    id: '15',
    code: 'MSB',
    name: 'Ngân hàng TMCP Hàng Hải Việt Nam',
    shortName: 'MSB',
    logo: 'https://api.vietqr.io/img/MSB.png',
    bin: '970426'
  },
  {
    id: '16',
    code: 'OCB',
    name: 'Ngân hàng TMCP Phương Đông',
    shortName: 'OCB',
    logo: 'https://api.vietqr.io/img/OCB.png',
    bin: '970448'
  },
  {
    id: '17',
    code: 'LPB',
    name: 'Ngân hàng TMCP Bưu Điện Liên Việt',
    shortName: 'LienVietPostBank',
    logo: 'https://api.vietqr.io/img/LPB.png',
    bin: '970449'
  },
  {
    id: '18',
    code: 'SEAB',
    name: 'Ngân hàng TMCP Đông Nam Á',
    shortName: 'SeABank',
    logo: 'https://api.vietqr.io/img/SEAB.png',
    bin: '970440'
  },
  {
    id: '19',
    code: 'VAB',
    name: 'Ngân hàng TMCP Việt Á',
    shortName: 'VietABank',
    logo: 'https://api.vietqr.io/img/VAB.png',
    bin: '970427'
  },
  {
    id: '20',
    code: 'NAB',
    name: 'Ngân hàng TMCP Nam Á',
    shortName: 'NamABank',
    logo: 'https://api.vietqr.io/img/NAB.png',
    bin: '970428'
  },
  {
    id: '21',
    code: 'NCB',
    name: 'Ngân hàng TMCP Quốc Dân',
    shortName: 'NCB',
    logo: 'https://api.vietqr.io/img/NCB.png',
    bin: '970419'
  },
  {
    id: '22',
    code: 'SCB',
    name: 'Ngân hàng TMCP Sài Gòn',
    shortName: 'SCB',
    logo: 'https://api.vietqr.io/img/SCB.png',
    bin: '970429'
  },
  {
    id: '23',
    code: 'BAB',
    name: 'Ngân hàng TMCP Bắc Á',
    shortName: 'BacABank',
    logo: 'https://api.vietqr.io/img/BAB.png',
    bin: '970409'
  },
  {
    id: '24',
    code: 'PGB',
    name: 'Ngân hàng TMCP Xăng dầu Petrolimex',
    shortName: 'PGBank',
    logo: 'https://api.vietqr.io/img/PGB.png',
    bin: '970430'
  },
  {
    id: '25',
    code: 'ABB',
    name: 'Ngân hàng TMCP An Bình',
    shortName: 'ABBANK',
    logo: 'https://api.vietqr.io/img/ABB.png',
    bin: '970425'
  },
  {
    id: '26',
    code: 'SGB',
    name: 'Ngân hàng TMCP Sài Gòn Công Thương',
    shortName: 'SaigonBank',
    logo: 'https://api.vietqr.io/img/SGICB.png',
    bin: '970400'
  },
  {
    id: '27',
    code: 'VIETBANK',
    name: 'Ngân hàng TMCP Việt Nam Thương Tín',
    shortName: 'VietBank',
    logo: 'https://api.vietqr.io/img/VIETBANK.png',
    bin: '970433'
  },
  {
    id: '28',
    code: 'PVCB',
    name: 'Ngân hàng TMCP Đại Chúng Việt Nam',
    shortName: 'PVcomBank',
    logo: 'https://api.vietqr.io/img/PVCB.png',
    bin: '970412'
  },
  {
    id: '29',
    code: 'KLB',
    name: 'Ngân hàng TMCP Kiên Long',
    shortName: 'KienLongBank',
    logo: 'https://api.vietqr.io/img/KLB.png',
    bin: '970452'
  },
  {
    id: '30',
    code: 'VCCB',
    name: 'Ngân hàng TMCP Bản Việt',
    shortName: 'VietCapitalBank',
    logo: 'https://api.vietqr.io/img/VCCB.png',
    bin: '970454'
  },
  {
    id: '31',
    code: 'OJB',
    name: 'Ngân hàng TMCP Đại Dương',
    shortName: 'OceanBank',
    logo: 'https://api.vietqr.io/img/OCB.png',
    bin: '970414'
  },
  {
    id: '32',
    code: 'GPB',
    name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu',
    shortName: 'GPBank',
    logo: 'https://api.vietqr.io/img/GPB.png',
    bin: '970408'
  },
  {
    id: '33',
    code: 'CAKE',
    name: 'Ngân hàng số CAKE by VPBank',
    shortName: 'CAKE',
    logo: 'https://api.vietqr.io/img/CAKE.png',
    bin: '546034'
  },
  {
    id: '34',
    code: 'UBANK',
    name: 'Ngân hàng số Ubank by VPBank',
    shortName: 'Ubank',
    logo: 'https://api.vietqr.io/img/UBANK.png',
    bin: '546035'
  },
  {
    id: '35',
    code: 'TIMO',
    name: 'Ngân hàng số Timo by Ban Viet Bank',
    shortName: 'Timo',
    logo: 'https://api.vietqr.io/img/TIMO.png',
    bin: '963388'
  },
  {
    id: '36',
    code: 'VBSP',
    name: 'Ngân hàng Chính sách Xã hội',
    shortName: 'VBSP',
    logo: 'https://api.vietqr.io/img/VBSP.png',
    bin: '999888'
  },
  {
    id: '37',
    code: 'COOPBANK',
    name: 'Ngân hàng Hợp tác xã Việt Nam',
    shortName: 'Co-opBank',
    logo: 'https://api.vietqr.io/img/COOPBANK.png',
    bin: '970446'
  },
  {
    id: '38',
    code: 'BVB',
    name: 'Ngân hàng TMCP Bảo Việt',
    shortName: 'BaoVietBank',
    logo: 'https://api.vietqr.io/img/BVB.png',
    bin: '970438'
  },
  {
    id: '39',
    code: 'DOB',
    name: 'Ngân hàng TMCP Đông Á',
    shortName: 'DongABank',
    logo: 'https://api.vietqr.io/img/DOB.png',
    bin: '970406'
  },

  // Ngân hàng liên doanh, 100% vốn nước ngoài (10 ngân hàng)
  {
    id: '40',
    code: 'VRB',
    name: 'Ngân hàng Liên doanh Việt - Nga',
    shortName: 'VRB',
    logo: 'https://api.vietqr.io/img/VRB.png',
    bin: '970421'
  },
  {
    id: '41',
    code: 'IVB',
    name: 'Ngân hàng TNHH Indovina',
    shortName: 'IndovinaBank',
    logo: 'https://api.vietqr.io/img/IVB.png',
    bin: '970434'
  },
  {
    id: '42',
    code: 'SHBVN',
    name: 'Ngân hàng TNHH MTV Shinhan Việt Nam',
    shortName: 'Shinhan Bank',
    logo: 'https://api.vietqr.io/img/SHBVN.png',
    bin: '970424'
  },
  {
    id: '43',
    code: 'HSBC',
    name: 'Ngân hàng TNHH MTV HSBC Việt Nam',
    shortName: 'HSBC',
    logo: 'https://api.vietqr.io/img/HSBC.png',
    bin: '458761'
  },
  {
    id: '44',
    code: 'SCVN',
    name: 'Ngân hàng TNHH MTV Standard Chartered Việt Nam',
    shortName: 'Standard Chartered',
    logo: 'https://api.vietqr.io/img/SCVN.png',
    bin: '970410'
  },
  {
    id: '45',
    code: 'CIMB',
    name: 'Ngân hàng TNHH MTV CIMB Việt Nam',
    shortName: 'CIMB',
    logo: 'https://api.vietqr.io/img/CIMB.png',
    bin: '422589'
  },
  {
    id: '46',
    code: 'WVN',
    name: 'Ngân hàng TNHH MTV Woori Việt Nam',
    shortName: 'Woori Bank',
    logo: 'https://api.vietqr.io/img/WVN.png',
    bin: '970457'
  },
  {
    id: '47',
    code: 'UOB',
    name: 'Ngân hàng United Overseas Bank Việt Nam',
    shortName: 'UOB',
    logo: 'https://api.vietqr.io/img/UOB.png',
    bin: '970458'
  },
  {
    id: '48',
    code: 'KBHN',
    name: 'Ngân hàng Kookmin - Chi nhánh Hà Nội',
    shortName: 'KookminBank',
    logo: 'https://api.vietqr.io/img/KBHN.png',
    bin: '970462'
  },
  {
    id: '49',
    code: 'PBVN',
    name: 'Ngân hàng TNHH MTV Public Việt Nam',
    shortName: 'PublicBank',
    logo: 'https://api.vietqr.io/img/PBVN.png',
    bin: '970439'
  }
];

export default vietnamBanks;
