// Browser-IDE backend on Azure Container Apps Dynamic Sessions.
//
//   Static Web App ──> Orchestrator (EasyAuth/Entra, the only trusted server)
//                         │ managed identity + Session Executor role
//                         ▼
//                      Session Pool (Custom Container, Hyper-V isolated,
//                         one sandbox per user via identifier=Entra-OID)
//                         │ egress locked by VNet/NSG
//                         ▼
//                      internal LLM gateway + package mirror only
//
// Sized for ~300 concurrent internal users; sandbox = 0.5 vCPU / 1 GiB.

@description('Location. Germany West Central recommended for LHIND data residency.')
param location string = resourceGroup().location

@description('Short prefix for resource names (lowercase letters/numbers).')
@minLength(5)
@maxLength(20)
param namePrefix string = 'lhindide'

@description('Container image tag for the sandbox runner (in the ACR below).')
param runnerImageTag string = 'latest'

@description('Container image tag for the orchestrator (in the ACR below).')
param orchestratorImageTag string = 'latest'

@description('Internal OpenAI-compatible LLM gateway base URL (orchestrator->gateway).')
param llmGatewayUrl string

@description('Egress allowlist: IP/CIDR of the internal LLM gateway.')
param llmGatewayCidr string

@description('Egress allowlist: IP/CIDR of the package mirror.')
param packageMirrorCidr string

@description('Entra tenant id for EasyAuth on the orchestrator.')
param entraTenantId string

@description('Entra app (client) id registered for the orchestrator EasyAuth.')
param entraClientId string

// ── Scale / size knobs (300 concurrent users; light API/RAG workload) ──
@description('Max concurrent sandbox sessions.')
param maxConcurrentSessions int = 320

@description('Warm pool: ready session instances kept idle for fast allocation.')
param readySessionInstances int = 20

@description('Session idle cooldown (seconds) before a sandbox is reclaimed.')
param sessionCooldownSeconds int = 600

// ── Container Registry ──
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: '${namePrefix}acr'
  location: location
  sku: { name: 'Standard' }
  properties: { adminUserEnabled: false }
}

// ── User-assigned identity used by orchestrator + pool (ACR pull, session exec) ──
resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-uami'
  location: location
}

// AcrPull so the identity can pull both images.
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, uami.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Network ──
module net 'network.bicep' = {
  name: 'network'
  params: {
    location: location
    namePrefix: namePrefix
    llmGatewayCidr: llmGatewayCidr
    packageMirrorCidr: packageMirrorCidr
  }
}

// ── Log Analytics (required by the ACA environment) ──
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
}

// ── ACA managed environment, VNet-integrated into the sessions subnet ──
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: net.outputs.sessionsSubnetId
      internal: false
    }
  }
}

// ── Dynamic Session Pool: Custom Container, one sandbox per user ──
resource pool 'Microsoft.App/sessionPools@2026-01-01' = {
  name: '${namePrefix}-sessions'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${uami.id}': {} }
  }
  properties: {
    environmentId: env.id
    poolManagementType: 'Dynamic'
    containerType: 'CustomContainer'
    scaleConfiguration: {
      maxConcurrentSessions: maxConcurrentSessions
      readySessionInstances: readySessionInstances
    }
    dynamicPoolConfiguration: {
      lifecycleConfiguration: {
        lifecycleType: 'Timed'
        cooldownPeriodInSeconds: sessionCooldownSeconds
      }
    }
    // Egress ON at the pool level; the NSG narrows it to gateway+mirror only.
    sessionNetworkConfiguration: { status: 'EgressEnabled' }
    // Do NOT expose a managed identity inside untrusted sessions.
    managedIdentitySettings: []
    customContainerTemplate: {
      ingress: { targetPort: 8000 }
      registryCredentials: {
        server: acr.properties.loginServer
        identity: uami.id
      }
      containers: [
        {
          name: 'runner'
          image: '${acr.properties.loginServer}/lesson-runner:${runnerImageTag}'
          resources: {
            // Schema lists cpu as int but accepts fractional cores; force via json().
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'RUN_TIMEOUT_S', value: '120' }
          ]
        }
      ]
    }
  }
  dependsOn: [acrPull]
}

// ── Orchestrator app (EasyAuth/Entra in front; sole token holder) ──
resource orchestrator 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-orchestrator'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${uami.id}': {} }
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
      }
      registries: [
        { server: acr.properties.loginServer, identity: uami.id }
      ]
    }
    template: {
      containers: [
        {
          name: 'orchestrator'
          image: '${acr.properties.loginServer}/lesson-orchestrator:${orchestratorImageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'SESSION_POOL_ENDPOINT', value: pool.properties.poolManagementEndpoint }
            { name: 'LLM_GATEWAY_URL', value: llmGatewayUrl }
            { name: 'RATE_LIMIT_MAX', value: '60' }
            { name: 'RATE_LIMIT_WINDOW_S', value: '60' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
  dependsOn: [acrPull]
}

// EasyAuth: require Entra sign-in in front of the orchestrator.
resource orchestratorAuth 'Microsoft.App/containerApps/authConfigs@2024-03-01' = {
  parent: orchestrator
  name: 'current'
  properties: {
    platform: { enabled: true }
    globalValidation: {
      unauthenticatedClientAction: 'Return401'
      redirectToProvider: 'azureactivedirectory'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          // Azure Public Cloud OIDC issuer for the tenant.
          #disable-next-line no-hardcoded-env-urls
          openIdIssuer: 'https://login.microsoftonline.com/${entraTenantId}/v2.0'
          clientId: entraClientId
        }
        validation: {
          allowedAudiences: ['api://${entraClientId}']
        }
      }
    }
  }
}

// ── Session Executor role on the pool for the orchestrator's identity ──
// 'Azure ContainerApps Session Executor' built-in role.
var sessionExecutorRoleId = '0fb8eba5-a2bb-4abe-b1c1-49dfad359bb0'
resource sessionExec 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(pool.id, uami.id, sessionExecutorRoleId)
  scope: pool
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', sessionExecutorRoleId)
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output orchestratorFqdn string = orchestrator.properties.configuration.ingress.fqdn
output acrLoginServer string = acr.properties.loginServer
output poolManagementEndpoint string = pool.properties.poolManagementEndpoint
