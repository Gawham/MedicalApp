export interface LeadData {
    id: string;
    fullName: string;
    rawName: string;
    geoRegion: string;
    title: string;
    companyName: string;
    websites: string;
    linkedin_profile: string;
    heartBeat?: string;
    pulse?: string;
    temperature?: string;
    gasSensorValue?: string;
    irSensorValue?: string;
    parsedContacts?: ParsedContact[];
  }
  
  export interface ParsedContact {
    email: string;
    name: string;
    title: string;
    date: string;
  }
  
  export interface EmailResponse {
    email: string | null;
    status: string;
    validation?: string;
    confidence?: number;
    catch_all?: boolean;
  }
  
  export interface CSVRow {
    fullName: string;
    rawName: string;
    geoRegion: string;
    profileId: string;
    title: string;
    companyName: string;
    websites: string;
    emails: string;
    linkedin_profile: string;
    description: string;
    thumbnail: string;
    S3: string;
    s3_vid: string;
    status?: string;
  } 