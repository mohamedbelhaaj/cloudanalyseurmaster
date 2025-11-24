// ============================================
// aws-configuration.service.ts - COMPLETE UPDATED VERSION
// ============================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// ==================== INTERFACES ====================

export interface AWSConfiguration {
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
  last_updated?: string;
}

export interface TestCredentialsResponse {
  success: boolean;
  message?: string;
  regions?: string[];
  error?: string;
}

export interface ResourcesResponse {
  success: boolean;
  resources?: {
    vpcs?: any[];
    security_groups?: any[];
    subnets?: any[];
    nacls?: any[];
    waf_web_acls?: any[];
    waf_ip_sets?: any[];
    network_firewalls?: any[];
    log_groups?: any[];
  };
  error?: string;
}

export interface SetActiveResponse {
  success: boolean;
  message: string;
  configuration?: AWSConfiguration;
}

export interface AWSStatusConfig {
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

export interface VPCInfo {
  vpc_id: string;
  cidr_block: string;
  state: string;
  subnets_count: number;
  tags?: { [key: string]: string };
}

export interface SecurityGroupInfo {
  group_id: string;
  group_name: string;
  description: string;
  ingress_rules_count: number;
  egress_rules_count: number;
  vpc_id: string;
}

export interface AWSStatusResponse {
  configured: boolean;
  connected?: boolean;
  message?: string;
  error?: string;
  config?: AWSStatusConfig;
  regions_available?: string[];
  vpc_info?: VPCInfo;
  security_group?: SecurityGroupInfo;
  last_check?: string;
  credentials_valid?: boolean;
}

export interface AWSStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  last_request: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
}

export interface ConnectionCheckResponse {
  connected: boolean;
  message: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class AWSConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly apiUrl = `${environment.apiUrl}/admin/aws-config`;
  private readonly statusUrl = `${environment.apiUrl}/admin/aws-status`;

  // ==================== CONFIGURATION CRUD ====================

  /**
   * Récupère toutes les configurations AWS
   * Note: Le token est automatiquement ajouté par l'intercepteur
   */
  getConfigurations(): Observable<AWSConfiguration[]> {
    console.log('🔍 Récupération des configurations AWS');
    return this.http.get<AWSConfiguration[]>(this.apiUrl).pipe(
      tap(configs => console.log(`✅ ${configs.length} configuration(s) récupérée(s)`)),
      catchError(this.handleError('getConfigurations'))
    );
  }

  /**
   * Récupère une configuration AWS spécifique
   */
  getConfiguration(id: number): Observable<AWSConfiguration> {
    console.log(`🔍 Récupération de la configuration AWS #${id}`);
    return this.http.get<AWSConfiguration>(`${this.apiUrl}/${id}/`).pipe(
      tap(config => console.log(`✅ Configuration #${id} récupérée:`, config.name)),
      catchError(this.handleError('getConfiguration'))
    );
  }

  /**
   * Récupère la configuration AWS active
   */
  getActiveConfiguration(): Observable<AWSConfiguration> {
    console.log('🔍 Récupération de la configuration AWS active');
    return this.http.get<AWSConfiguration>(`${this.apiUrl}/active/`).pipe(
      tap(config => console.log(`✅ Configuration active:`, config.name)),
      catchError(this.handleError('getActiveConfiguration'))
    );
  }

  /**
   * Crée une nouvelle configuration AWS
   */
  createConfiguration(config: AWSConfiguration): Observable<AWSConfiguration> {
    console.log('➕ Création d\'une nouvelle configuration AWS:', config.name);
    return this.http.post<AWSConfiguration>(`${this.apiUrl}/`, config).pipe(
      tap(newConfig => console.log(`✅ Configuration créée avec succès:`, newConfig.id)),
      catchError(this.handleError('createConfiguration'))
    );
  }

  /**
   * Met à jour une configuration AWS existante
   */
  updateConfiguration(id: number, config: Partial<AWSConfiguration>): Observable<AWSConfiguration> {
    console.log(`📝 Mise à jour de la configuration AWS #${id}`);
    return this.http.patch<AWSConfiguration>(`${this.apiUrl}/${id}/`, config).pipe(
      tap(updated => console.log(`✅ Configuration #${id} mise à jour`)),
      catchError(this.handleError('updateConfiguration'))
    );
  }

  /**
   * Supprime une configuration AWS
   */
  deleteConfiguration(id: number): Observable<void> {
    console.log(`🗑️ Suppression de la configuration AWS #${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe(
      tap(() => console.log(`✅ Configuration #${id} supprimée`)),
      catchError(this.handleError('deleteConfiguration'))
    );
  }

  // ==================== CONFIGURATION ACTIONS ====================

  /**
   * Teste les identifiants AWS d'une configuration
   */
  testCredentials(id: number): Observable<TestCredentialsResponse> {
    console.log(`🧪 Test des identifiants AWS pour la configuration #${id}`);
    return this.http.post<TestCredentialsResponse>(
      `${this.apiUrl}/${id}/test_credentials/`,
      {}
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log(`✅ Identifiants valides. Régions disponibles:`, response.regions?.length);
        } else {
          console.error(`❌ Identifiants invalides:`, response.error);
        }
      }),
      catchError(this.handleError('testCredentials'))
    );
  }

  /**
   * Récupère les ressources AWS disponibles pour une configuration
   */
  getResources(id: number): Observable<ResourcesResponse> {
    console.log(`📦 Récupération des ressources AWS pour la configuration #${id}`);
    return this.http.get<ResourcesResponse>(
      `${this.apiUrl}/${id}/get_resources/`
    ).pipe(
      tap(response => {
        if (response.success && response.resources) {
          const resourceCount = Object.keys(response.resources).length;
          console.log(`✅ ${resourceCount} type(s) de ressources récupéré(s)`);
        }
      }),
      catchError(this.handleError('getResources'))
    );
  }

  /**
   * Définit une configuration comme active
   */
  setActiveConfiguration(id: number): Observable<SetActiveResponse> {
    console.log(`🎯 Activation de la configuration AWS #${id}`);
    return this.http.post<SetActiveResponse>(
      `${this.apiUrl}/${id}/set_active/`,
      {}
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log(`✅ Configuration #${id} activée avec succès`);
        }
      }),
      catchError(this.handleError('setActiveConfiguration'))
    );
  }

  // ==================== AWS STATUS ====================

  /**
   * Récupère le statut complet de la connexion AWS
   */
  getAWSStatus(): Observable<AWSStatusResponse> {
    console.log('🔍 Vérification du statut AWS');
    return this.http.get<AWSStatusResponse>(`${this.statusUrl}/`).pipe(
      map(response => ({
        ...response,
        last_check: new Date().toISOString()
      })),
      tap(status => {
        if (status.configured && status.connected) {
          console.log('✅ AWS configuré et connecté');
        } else if (status.configured) {
          console.warn('⚠️ AWS configuré mais non connecté');
        } else {
          console.warn('⚠️ AWS non configuré');
        }
      }),
      catchError(this.handleError('getAWSStatus'))
    );
  }

  /**
   * Force une vérification du statut AWS
   */
  refreshAWSStatus(): Observable<AWSStatusResponse> {
    console.log('🔄 Rafraîchissement du statut AWS');
    return this.http.post<AWSStatusResponse>(
      `${this.statusUrl}/refresh/`,
      {}
    ).pipe(
      map(response => ({
        ...response,
        last_check: new Date().toISOString()
      })),
      tap(() => console.log('✅ Statut AWS rafraîchi')),
      catchError(this.handleError('refreshAWSStatus'))
    );
  }

  /**
   * Vérifie la connectivité AWS
   */
  checkConnection(): Observable<ConnectionCheckResponse> {
    console.log('🔌 Vérification de la connexion AWS');
    return this.http.get<ConnectionCheckResponse>(
      `${this.statusUrl}/check-connection/`
    ).pipe(
      tap(response => {
        if (response.connected) {
          console.log('✅ Connexion AWS établie');
        } else {
          console.warn('⚠️ Connexion AWS échouée:', response.message);
        }
      }),
      catchError(this.handleError('checkConnection'))
    );
  }

  // ==================== VALIDATION ====================

  /**
   * Valide une configuration AWS avant sauvegarde
   */
  validateConfiguration(config: Partial<AWSConfiguration>): Observable<ValidationResponse> {
    console.log('✔️ Validation de la configuration AWS');
    return this.http.post<ValidationResponse>(
      `${this.apiUrl}/validate/`,
      config
    ).pipe(
      tap(response => {
        if (response.valid) {
          console.log('✅ Configuration valide');
        } else {
          console.warn('⚠️ Configuration invalide:', response.errors);
        }
      }),
      catchError(this.handleError('validateConfiguration'))
    );
  }

  // ==================== UTILITIES ====================

  /**
   * Récupère la liste des régions AWS disponibles
   */
  getAvailableRegions(): Observable<string[]> {
    console.log('🌍 Récupération des régions AWS disponibles');
    return this.http.get<{ regions: string[] }>(
      `${this.apiUrl}/regions/`
    ).pipe(
      map(response => response.regions),
      tap(regions => console.log(`✅ ${regions.length} régions disponibles`)),
      catchError(() => {
        console.warn('⚠️ Échec de récupération des régions, utilisation des valeurs par défaut');
        // Fallback vers des régions par défaut si l'endpoint échoue
        const defaultRegions = [
          'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
          'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
          'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
          'ap-southeast-1', 'ap-southeast-2',
          'ca-central-1', 'sa-east-1'
        ];
        return of(defaultRegions);
      })
    );
  }

  /**
   * Récupère les statistiques d'utilisation AWS
   */
  getAWSStats(): Observable<AWSStats> {
    console.log('📊 Récupération des statistiques AWS');
    return this.http.get<AWSStats>(
      `${this.statusUrl}/stats/`
    ).pipe(
      tap(stats => console.log(`✅ Stats: ${stats.total_requests} requêtes totales`)),
      catchError(this.handleError('getAWSStats'))
    );
  }

  // ==================== ERROR HANDLING ====================

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = 'Une erreur est survenue';
      
      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur: ${error.error.message}`;
        console.error(`❌ [${operation}] Erreur client:`, error.error.message);
      } else {
        // Erreur côté serveur
        console.error(`❌ [${operation}] Erreur serveur:`, {
          status: error.status,
          message: error.message,
          error: error.error
        });

        switch (error.status) {
          case 0:
            errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            break;
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            // L'intercepteur gère déjà la déconnexion
            break;
          case 403:
            errorMessage = 'Accès non autorisé. Vous n\'avez pas les permissions nécessaires.';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          case 503:
            errorMessage = 'Service temporairement indisponible.';
            break;
          default:
            // Essayer d'extraire le message du backend
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.error?.detail) {
              errorMessage = error.error.detail;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else {
              errorMessage = `Erreur ${error.status}: ${error.statusText}`;
            }
        }
      }

      console.error(`📋 [${operation}] Message d'erreur final:`, errorMessage);
      return throwError(() => new Error(errorMessage));
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Vérifie si une configuration est complète
   */
  isConfigurationComplete(config: AWSConfiguration): boolean {
    const isComplete = !!(
      config.name &&
      config.aws_access_key &&
      config.aws_region &&
      (config.vpc_id || config.security_group_id)
    );
    
    if (!isComplete) {
      console.warn('⚠️ Configuration incomplète:', {
        hasName: !!config.name,
        hasAccessKey: !!config.aws_access_key,
        hasRegion: !!config.aws_region,
        hasVpcOrSG: !!(config.vpc_id || config.security_group_id)
      });
    }
    
    return isComplete;
  }

  /**
   * Récupère le nom de la région formaté
   */
  getRegionLabel(regionCode: string): string {
    const regionMap: { [key: string]: string } = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'EU (Ireland)',
      'eu-west-2': 'EU (London)',
      'eu-west-3': 'EU (Paris)',
      'eu-central-1': 'EU (Frankfurt)',
      'eu-north-1': 'EU (Stockholm)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ap-northeast-3': 'Asia Pacific (Osaka)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ca-central-1': 'Canada (Central)',
      'sa-east-1': 'South America (São Paulo)',
      'me-south-1': 'Middle East (Bahrain)',
      'af-south-1': 'Africa (Cape Town)'
    };
    return regionMap[regionCode] || regionCode;
  }

  /**
   * Masque partiellement une clé d'accès pour l'affichage
   */
  maskAccessKey(accessKey: string): string {
    if (!accessKey || accessKey.length < 8) {
      return '****';
    }
    const start = accessKey.substring(0, 4);
    const end = accessKey.substring(accessKey.length - 4);
    return `${start}****${end}`;
  }

  /**
   * Masque une clé secrète pour l'affichage
   */
  maskSecretKey(secretKey: string): string {
    if (!secretKey) {
      return '****';
    }
    return '****************************************';
  }

  /**
   * Vérifie si les identifiants sont temporaires (AWS Academy)
   */
  hasTemporaryCredentials(config: AWSConfiguration): boolean {
    return !!(config.aws_session_token && config.aws_session_token.length > 0);
  }

  /**
   * Formate une date ISO en format lisible
   */
  formatDate(isoDate: string): string {
    if (!isoDate) return 'N/A';
    
    const date = new Date(isoDate);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcule le temps écoulé depuis une date
   */
  getTimeAgo(isoDate: string): string {
    if (!isoDate) return 'Jamais';
    
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return this.formatDate(isoDate);
  }

  /**
   * Récupère le statut de connexion sous forme de texte
   */
  getConnectionStatusText(status: AWSStatusResponse): string {
    if (!status.configured) {
      return 'Non configuré';
    }
    if (!status.connected) {
      return 'Configuré mais non connecté';
    }
    if (!status.credentials_valid) {
      return 'Identifiants invalides';
    }
    return 'Connecté';
  }

  /**
   * Récupère la classe CSS pour le statut
   */
  getConnectionStatusClass(status: AWSStatusResponse): string {
    if (!status.configured) {
      return 'status-warning';
    }
    if (!status.connected || !status.credentials_valid) {
      return 'status-danger';
    }
    return 'status-success';
  }

  /**
   * Valide un format de clé d'accès AWS
   */
  isValidAccessKeyFormat(accessKey: string): boolean {
    // Format typique: AKIA suivi de 16 caractères alphanumériques
    const accessKeyPattern = /^AKIA[0-9A-Z]{16}$/;
    return accessKeyPattern.test(accessKey);
  }

  /**
   * Valide un format de région AWS
   */
  isValidRegionFormat(region: string): boolean {
    const regionPattern = /^[a-z]{2}-[a-z]+-\d{1}$/;
    return regionPattern.test(region);
  }

  /**
   * Nettoie les données sensibles d'une configuration pour l'affichage
   */
  sanitizeConfigForDisplay(config: AWSConfiguration): AWSConfiguration {
    return {
      ...config,
      aws_access_key: this.maskAccessKey(config.aws_access_key),
      aws_secret_key: config.aws_secret_key ? this.maskSecretKey(config.aws_secret_key) : undefined,
      aws_session_token: config.aws_session_token ? '****' : undefined
    };
  }
}