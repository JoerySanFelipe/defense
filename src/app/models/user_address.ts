export interface Address {
  region: string;
  province: string;
  city: string;
  barangay: string;
  postalCode: string;
  landmark: string;
  addressType: AddressType;
  contact: Contact;
  isDefault: boolean;
}
enum AddressType {
  Home,
  Work,
}

interface Contact {
  name: string;
  phone: string;
}
