export class CreateVisitorDto {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  visitDate: Date;
  residentId: number;
  purpose?: string;
}