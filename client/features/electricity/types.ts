export interface ElecSubscriber {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  buildingId: string;
  unitNumber: string;
  meterId: string;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  balance: number;
}

export interface ElecBuilding {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  totalUnits: number;
  subscriberCount: number;
  totalConsumption: number;
}

export interface ElecMeter {
  id: string;
  subscriberId: string;
  meterNumber: string;
  type: "digital" | "analog";
  status: "active" | "inactive" | "faulty";
  installDate: string;
  lastReadingDate: string;
}

export interface ElecReading {
  id: string;
  meterId: string;
  subscriberId: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  month: string;
  readBy: string;
  billGenerated: boolean;
}

export interface ElecBill {
  id: string;
  subscriberId: string;
  meterId: string;
  readingId: string | null;
  month: string;
  consumption: number;
  pricePerKwh: number;
  baseAmount: number;
  additionalFees: number;
  totalAmount: number;
  status: "paid" | "unpaid";
  dueDate: string;
  createdAt: string;
}

export interface ElecPayment {
  id: string;
  billId: string;
  subscriberId: string;
  amount: number;
  date: string;
  collectedBy: string | null;
  receiptNumber: string;
}

export interface ElecPricing {
  id: string;
  pricePerKwh: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string;
  notesAr: string;
  createdAt: string;
}

export interface ElecEmployee {
  id: string;
  name: string;
  nameAr: string;
  role: "meter_reader" | "collector" | "admin";
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinDate: string;
}

export interface ElecAlert {
  id: string;
  type: "unpaid_bill" | "unread_meter" | "late_bill" | "high_consumption" | "faulty_meter";
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
}

export interface ElecSettings {
  currency: string;
  currencySymbol: string;
  generatorName: string;
  generatorNameAr: string;
  generatorCapacity: string;
  operatingHours: string;
  billDueDays: number;
  lateFeePercentage: number;
  additionalFees: number;
  additionalFeesLabel: string;
  additionalFeesLabelAr: string;
  pdfShowLogo: boolean;
  pdfShowQr: boolean;
  pdfFooterText: string;
  pdfFooterTextAr: string;
}

export interface ElectricityData {
  subscribers: ElecSubscriber[];
  buildings: ElecBuilding[];
  meters: ElecMeter[];
  readings: ElecReading[];
  bills: ElecBill[];
  payments: ElecPayment[];
  pricing: ElecPricing[];
  employees: ElecEmployee[];
  alerts: ElecAlert[];
  settings: ElecSettings;
}
