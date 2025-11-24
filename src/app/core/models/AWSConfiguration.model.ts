interface AWSConfiguration {
  id?: number;
  owner?: number;
  name: string;
  aws_access_key: string;
  aws_secret_key?: string;
  aws_session_token?: string;
  aws_region: string;
  vpc_id?: string;
  security_group_id?: string;
  isolation_sg_id?: string;
  nacl_id?: string;
  waf_web_acl_name?: string;
  waf_web_acl_id?: string;
  waf_ip_set_name?: string;
  waf_ip_set_id?: string;
  network_firewall_arn?: string;
  log_group_name?: string;
  auto_block_enabled: boolean;
  auto_block_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TestCredentialsResponse {
  success: boolean;
  message?: string;
  regions?: string[];
  error?: string;
}
interface ResourcesResponse {
  success: boolean;
  resources?: any;
  error?: string;
}

interface SetActiveResponse {
  success: boolean;
  message: string;
}
interface AWSStatusResponse {
  configured: boolean;
  connected?: boolean;
  message?: string;
  error?: string;
  config?: AWSStatusConfig;
  regions_available?: string[];
  vpc_info?: VPCInfo;
  security_group?: SecurityGroupInfo;
}
interface VPCInfo {
  cidr_block: string;
  subnets_count: number;
}

interface SecurityGroupInfo {
  ingress_rules_count: number;
  egress_rules_count: number;
}
interface AWSStatusConfig {
  name: string;
  region: string;
  vpc_id?: string;
  security_group_id?: string;
  waf_configured: boolean;
  nacl_configured: boolean;
  firewall_configured: boolean;
  last_updated: string;
  auto_block_enabled: boolean;
  auto_block_threshold: number;
}