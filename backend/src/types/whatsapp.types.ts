export interface SendTemplateDto {
  toPhone: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  leadId?: string;
  customerId?: string;
}

export interface WebhookQueryPayload {
  "hub.mode"?: string;
  "hub.verify_token"?: string;
  "hub.challenge"?: string;
}

export interface WebhookBodyPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
          };
          document?: {
            id: string;
            mime_type: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}
