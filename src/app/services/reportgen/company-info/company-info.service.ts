// company-info.service.ts
import { Injectable } from '@angular/core';

// Interface for company information
interface CompanyInfo {
  logo: string;
  name: string;
  address: string;
  email: string;
  telephone: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyInfoService {
  // Private member variable to hold company information
  private companyInfo: CompanyInfo = {
    logo: 'src/assets/images/logo.png',
    name: 'S&P Enterprises Inc.',
    address: 'Brgy. Nancayasan, Urdaneta City, Pangasinan',
    email: 'sales@spei.com.ph',
    telephone: '075 568 2705',
  };

  // Getter methods for accessing company information
  getCompanyLogo(): string {
    return this.companyInfo.logo;
  }

  getCompanyName(): string {
    return this.companyInfo.name;
  }

  getCompanyAddress(): string {
    return this.companyInfo.address;
  }

  getCompanyEmail(): string {
    return this.companyInfo.email;
  }

  getCompanyTelephone(): string {
    return this.companyInfo.telephone;
  }
}