enum AddressType {
  Home = 'work',
  Work = 'home',
}

export interface Contact {
  phone: string;
  name: string;
}

export interface CustomerAddress {
  region: string;
  province: string;
  city: string;
  barangay: string;
  postalCode: string;
  landmark: string;
  addressType: string;
  contact: Contact;
  isDefault: boolean;
}
