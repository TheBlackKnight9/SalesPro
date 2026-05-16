export interface CreateCustomerDto {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  company?: string;
  designation?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}
