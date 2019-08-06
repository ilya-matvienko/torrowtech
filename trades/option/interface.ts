export interface OptionDeal extends DraftDeal {
  created_at: string;
  iconUrl?: string;
}

export interface DraftDeal {
  amount: number;
  asset_id: number;
  asset_name: string;
  asset_ric: string;
  close_quote_created_at: string;
  close_rate: number;
  deal_type: string;
  id: number;
  name: string;
  open_quote_created_at: string;
  open_rate: number;
  option_type: string;
  payment: number;
  payment_rate: number;
  ric: string;
  status: string;
  trend: string;
  win: number;
}

export interface DealConfig {
  asset: string;
  asset_id: string;
  asset_name: string;
  amount: number;
  source: string;
  trend: string;
  expire_at: number;
  created_at: number;
  option_type: string;
  deal_type: string;
  tournament_id: string;
}

export interface LoadedDeals {
  batch_key: string;
  binary_option_deals: OptionDeal[];
}
